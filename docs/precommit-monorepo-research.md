# Pre-commit hook coexistence in a JS + Python monorepo

## Problem statement

This repo runs two independent git-hook managers: Husky (`web/.husky/pre-commit`, for
`pnpm exec lint-staged`) and the Python `pre-commit` framework (`backend/.pre-commit-config.yaml`,
for `ruff-check` / `ruff-format`). Both ultimately work by pointing git's single
`core.hooksPath` setting at themselves — Husky's installer last set it to `web/.husky/_`
(confirmed in `.git/config`) — so only Husky's hook runs. The real, correctly generated
`pre-commit` framework hook sits unused at `.git/hooks/pre-commit`. In practice this means
every commit lints/formats JS but never runs backend Python checks, which is exactly how a
`ruff-format` violation reached CI instead of being caught at commit time.

## Findings per option

### 1. A single dispatcher/orchestrator script fanning out to both tools

This is the most commonly recommended workaround in community discussion, but it is *not*
something either tool ships or documents as a first-class feature — it's a hand-rolled
convention. The official `pre-commit` maintainers acknowledge the underlying conflict
directly: in [pre-commit/pre-commit#3630, "Docs Improvement: Clarify `core.hooksPath` clash
issue and add docs for workarounds"](https://github.com/pre-commit/pre-commit/issues/3630),
the reporter documents that `pre-commit install` will "Cowardly refuse... to install hooks
with `core.hooksPath` set" and lays out the same three workarounds discussed in the wild:
a one-shot override (`git -c core.hooksPath=.git/hooks pre-commit install`), temporarily
unsetting the config to install, or "chaining hooks" — having the global/other hook runner's
script conditionally invoke `pre-commit run` itself. This last option is the dispatcher
pattern. I could not find a maintainer reply confirming this as the *recommended* approach —
the issue is open as a docs request, not a resolved guideline, so treat "chaining" as a
community-suggested workaround, not an official endorsement.

### 2. Consolidating onto the Python `pre-commit` framework alone (using `language: node`/`language: system`)

Per pre-commit.com's own hook-language docs (fetched from
[pre-commit.com](https://pre-commit.com/#system) and [pre-commit.com](https://pre-commit.com/#node)):

- `language: system` (renamed `language: unsupported` as of pre-commit 4.4.0) hooks: "System
  hooks provide a way to write hooks for system-level executables which don't have a supported
  language above (or have special environment requirements that don't allow them to run in
  isolation such as pylint)." Such hooks get no managed environment/dependencies — "if it needs
  additional dependencies the consumer must install them manually."
- `language: node` hooks: "The hook repository must have a `package.json`. It will be installed
  via `npm install .`... Node hooks work without any system-level dependencies."

So yes — `pre-commit` can technically drive `pnpm exec lint-staged` (as a `system` hook calling
the existing pnpm script, or by wrapping it as a `node`-language local hook), making it capable
of being the sole owner of `core.hooksPath`. pre-commit.com frames itself generally as "A
framework for managing and maintaining multi-language pre-commit hooks" — but its docs stop at
per-hook language declarations; I found no pre-commit.com page that discusses *displacing* a
JS-native tool like Husky/lint-staged, or any explicit guidance/case study for that combination.
This is a plausible, technically supported pattern, not a documented one.

### 3. A dedicated polyglot hook manager (lefthook)

Lefthook is explicitly built for and marketed at this exact problem. Its own README (fetched
from [github.com/evilmartians/lefthook](https://github.com/evilmartians/lefthook)) describes
itself as "A Git hooks manager for Node.js, Ruby, Python and many other types of projects,"
emphasizing it is "Simple. It is single dependency-free binary which can work in any
environment," with parallel execution for speed.

More directly on point, Evil Martians' own engineering blog post introducing the tool
([evilmartians.com/chronicles/lefthook-knock-your-teams-code-back-into-shape](https://evilmartians.com/chronicles/lefthook-knock-your-teams-code-back-into-shape))
names this exact scenario as the motivating problem:

> "In a mixed team of frontend and backend developers—like Evil Martians—you'll often end up
> having two separate setups for Ruby and JavaScript with the frontenders and backenders linting
> their commits in their preferred way."

and pitches consolidation as the fix: "With Lefthook, you don't need to think twice—it's a
single Go binary that has wrappers both for JavaScript and for Ruby." The post also cites
Discourse's real-world migration from Overcommit (a Ruby-only hook manager) to Lefthook
specifically to serve both Ruby and JS contributors from one config, and notes Husky +
lint-staged pull "roughly fifteen hundred dependencies to your node_modules" by comparison.
Lefthook also has a `root`/glob-filtering feature ("a command only runs when files in its
configured directory are staged") well suited to running backend-only and frontend-only checks
from one `lefthook.yml`, per community write-ups (e.g. discussion threads on
[github.com/evilmartians/lefthook/discussions/1078](https://github.com/evilmartians/lefthook/discussions/1078)).
This is a secondary/community source, not lefthook's own reference docs, so treat the
`root`-filtering description as paraphrase rather than a verified quote.

Note also [evilmartians/lefthook#1248, "Unset core.hooksPath in lefthook install"](https://github.com/evilmartians/lefthook/issues/1248)
— lefthook hits the *same* `core.hooksPath`-is-exclusive constraint as everyone else; it isn't
magic, it just expects to be the sole owner too, same as Husky and `pre-commit` each do.

### 4. Husky's own official guidance

Husky's docs site (fetched from
[typicode.github.io/husky/how-to.html](https://typicode.github.io/husky/how-to.html)) has no
monorepo-specific best-practices section and, per my fetch, "makes no mention of coexisting
with other Git hook management systems (such as Python's `pre-commit` framework) or integrating
multiple hook managers in the same repository." The only monorepo-adjacent guidance is
about running `husky install` from a subdirectory or parent directory ("Husky doesn't install
in parent directories (`../`) for security reasons. However, you can change the directory in
the `prepare` script"), which addresses *where* Husky installs, not multi-tool coexistence.
Husky offers no first-party position on this problem.

### 5. pre-commit.com's own docs on coexisting with other hook managers

Beyond the `core.hooksPath`-clash refusal behavior and issue #3630 above, I found no
pre-commit.com documentation page that discusses coexisting with another hook manager, or
positions itself explicitly as "the" polyglot orchestrator for a repo that also has a
JS-native tool already installed. Its multi-language claims (`language: node`, `language: system`,
etc.) are about what a hook *can invoke*, not about integrating with a pre-existing hooks
directory owned by something else.

## Pitfalls of the fan-out/dispatcher approach

**Exit code propagation.** This is a well-documented, recurring failure mode in hand-rolled
multi-tool git hooks generally (not specific to Husky/pre-commit). A concrete example from a
similar PHP dispatcher tool,
[BrainMaestro/composer-git-hooks#108](https://github.com/BrainMaestro/composer-git-hooks/issues/108):
"if, for example, `make cs.fixer.dryrun` exit with an error it does not stop the pre-commit hook
and the commit is validated. In fact the only script which could abort the commit is the last of
the list" — because the generated script lacked `set -e`/explicit exit-code checks between
sequential commands. This is structurally the same risk a hand-written Husky→pre-commit
dispatcher script would carry in this repo: unless every sub-invocation's exit code is checked
and the *last* thing the script does is `exit` with a non-zero code on any failure, a failing
`ruff-format --check` (or any backend step) can be silently swallowed while `lint-staged` still
reports green — the exact bug this research was prompted by.

**Partial-staging fidelity (stash/restore).** Confirmed directly from pre-commit's own source
(`pre_commit/staged_files_only.py`, fetched from
[raw.githubusercontent.com/pre-commit/pre-commit](https://raw.githubusercontent.com/pre-commit/pre-commit/main/pre_commit/staged_files_only.py)):
the `staged_files_only(patch_dir)` context manager's docstring is literally "Clear any unstaged
changes from the git working directory inside this context," implemented by
`_unstaged_changes_cleared`, which saves a patch of unstaged changes, checks out the working
tree clean, runs hooks, then reapplies the patch afterward (with rollback-and-reapply handling
if a hook's auto-fixes conflict with the stashed patch). This stash/restore only happens inside
`pre-commit`'s *generated hook script* — the one at `.git/hooks/pre-commit` in this repo, whose
templated `ARGS` are literally `hook-impl --config=backend/.pre-commit-config.yaml
--hook-type=pre-commit` (confirmed by reading that file directly). Calling `pre-commit run`
directly from a dispatcher script — rather than invoking `hook-impl` (or letting git invoke the
real generated hook) — bypasses this stash entirely, so hooks would lint/format whatever is
currently on disk, including unstaged edits, not just what's staged. I could not find a
pre-commit.com *docs page* stating this explicitly in prose (it's implementation behavior, not
a documented contract), so this finding rests on primary source code rather than official docs
text — flagging it as such per the instruction to distinguish verified-primary from inferred.

**Performance / redundant invocation.** Less concretely documented, but the mechanism is
described in the lefthook material above (parallel execution, single binary) as a selling point
*relative to* sequential per-tool overhead; Evil Martians' blog also quantifies Husky+lint-staged's
dependency footprint ("roughly fifteen hundred dependencies") as a comparison point rather than
directly benchmarking a dispatcher script. For this repo specifically (two tools, few files
typically staged per commit), the redundant-invocation cost of running both `lint-staged` and
`pre-commit run` sequentially is likely to be a minor, not a primary, concern — flagging that
this is my own assessment rather than something sourced.

## Recommendation

For a small, two-language monorepo like this one — no dedicated platform/DX team, two hook
tools, low hook complexity — I'd recommend **against** building a custom dispatcher script, and
suggest choosing between two realistic options, in this order of preference:

**Preferred: consolidate onto the Python `pre-commit` framework as the sole hook owner**, adding
a `system`-language (or `node`-language) local hook entry in `backend/.pre-commit-config.yaml`
that invokes `pnpm --dir web exec lint-staged`, then running `pre-commit install` from the repo
root so it reclaims `core.hooksPath` and `.git/hooks/pre-commit` becomes the real, sole hook
again. Reasoning:
- It directly fixes the bug that motivated this research: the existing `.git/hooks/pre-commit`
  already correctly wires up `hook-impl`, which gives the stash/restore partial-staging
  correctness pre-commit.com's design relies on (confirmed from source above) — for free, with
  zero new dispatcher code to get exit-code propagation wrong in.
- `backend/.pre-commit-config.yaml` already exists and already correctly runs `ruff-check`
  and `ruff-format`; this repo doesn't need to introduce a third tool or config file, just
  reconfigure the one that's already installed and already generates a correct hook.
  `language: system` is officially documented for exactly this "there's already an executable,
  I just need pre-commit to call it" case (per pre-commit.com, quoted above).
  Trade-off to flag explicitly: `pre-commit` will still expect Husky to *not* re-claim
  `core.hooksPath` on the next `pnpm install` (Husky's `prepare` script re-runs `husky` on every
  install and resets `core.hooksPath`) — this repo would need to either remove the Husky
  dependency/`.husky` directory and its `prepare` script entirely, or accept that a bare
  `pnpm install` will silently flip the hook path back to Husky and reintroduce this exact bug.
  Removing Husky outright (not just working around it) is the only way this option is durable.

**Fallback if the team wants to keep Husky's JS-ecosystem integration (npm scripts,
`prepare`-hook auto-install convenience) and is willing to add a dependency: adopt lefthook as
the single owner instead**, replacing both Husky and `pre-commit`'s installed-hook role.
Reasoning:
- Lefthook's own maintainers describe the "two separate setups for [backend] and JavaScript"
  problem as their explicit reason for building the tool (Evil Martians blog, quoted above),
  and it has a real-world precedent for consolidating a Ruby(backend)+JS setup (Discourse). The
  same shape applies here with Python instead of Ruby.
  This still requires a real migration (defining `lefthook.yml`, removing the `.husky` directory
  and `pre-commit`'s installed hook, adding `lefthook install` to setup docs/CI) — more moving
  parts than option 1, and a new dependency + config file the backend team wasn't already
  using pre-commit.com's `system` language for. I'd only pick this over option 1 if the team
  specifically wants matched speed/parallelism across languages or expects to add more
  languages/tools later.

**Not recommended: a hand-rolled dispatcher script fanning out to both `lint-staged` and
`pre-commit run`.** Nothing in Husky's or pre-commit.com's own documentation endorses this as a
supported pattern (see findings above) — it's a community workaround mentioned in an *open,
unresolved* pre-commit issue, not a documented recipe. It would need to reimplement, correctly
and durably, two things the existing tools already get right for free: strict exit-code
propagation across every sub-tool (the composer-git-hooks issue above shows how easy this is to
get wrong, and it is literally the class of bug — a swallowed non-zero exit code — that let a
`ruff-format` failure through in this repo) and partial-staging fidelity (the stash/restore
behavior that only the real `hook-impl`-based generated hook provides, confirmed from
pre-commit's source above; calling `pre-commit run` directly from a hand-rolled script forfeits
it). For a two-tool, small-team repo, that's maintenance burden and correctness risk taken on
in exchange for avoiding a one-time reconfiguration — a bad trade.

This is research only; no hook configs, install scripts, or dependencies were changed as part of
this task. The above is meant as input to a follow-up PR.
