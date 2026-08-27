# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Installing new dependencies

All dependencies in this project are managed with `uv`.

Before adding a new dependency, always ask the user which version constraint
they want to use, per uv's `--bound` styles:

- **major** — allow any version within the same major version
- **minor** — allow any version within the same minor version
- **exact** — pin to the exact version
- **none** — no upper bound

Do not guess or default this — the user must choose.

Once the user has chosen, add the package with:

```
uv add <package> --bounds <major|minor|exact|none>
```

## Test layout

Tests live under `tests/`, mirroring the app structure (`tests/<app>/test_*.py`) —
not co-located inside each app. Project-level tests not owned by a single app live
directly under `tests/` (e.g. `tests/test_health.py`).

mypy strict mode applies uniformly to everything under `tests/`, including test
cases themselves — there is no relaxation and no per-file opt-out, so every test
function needs full signature annotations (fixture params included) and a `-> None`
return type. This was a deliberate choice over any directory- or comment-based
exemption: those mechanisms depend on placement or a remembered header line, and
either one being missed or gotten wrong silently reduces type coverage. Full
strictness has no such failure mode.

Shared test infrastructure lives under `tests/support/` (mirroring app structure
at any depth, e.g. `tests/support/users/helper.py`) to keep it visually separate
from test cases — purely organizational at this point, not load-bearing for mypy.
