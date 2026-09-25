---
name: open-pr
description: Use when opening all pull requests (PRs) yourself or as directed by the user.
---

# Open PR

Follow these conventions for every PR opened in this repo, including when a PR is opened as the final step of
another workflow.

- Always open PRs as drafts (`gh pr create --draft`). Never mark a PR as ready for review — the user does that manually.
- PRs into `main` are squashed and merged, landing as a single commit, so PR titles follow the Conventional Commit style (see below).
- Do not add a description other than "Closes #x" to reference the issue, unless explicitly requested by the user.

## PR title style

Format: `type(scope): summary`, with `!` after the type/scope for breaking changes. Titles should not exceed 50 characters.

Reference: https://www.conventionalcommits.org/

### Scopes

- `backend` — changes under `backend/`
- `web` — changes under `web/`
- `deps` — dependency updates
- Omit the scope for repo-root changes (e.g. root config, `CLAUDE.md`).

If no scope clearly fits — the change spans several scopes, touches an area with no scope
(e.g. `render.yaml`, `docs/`, `.github/`), or omitting the scope would hide what changed — use
the closest option above, open the PR anyway, and flag it in your response: the scope you
chose, what you considered instead, and why. Never invent a new scope.

### Examples

- `fix(backend): serve static assets with whitenoise`
- `feat(backend): add user authentication`
- `feat(web)!: rework auth provider API`
- `chore(deps): update dependencies`
- `docs: update claude instructions for PR titles`

### Types

- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- **`chore`: Changes which don't change source code or tests, e.g. changes to the build process, auxiliary tools, libraries**
- `docs`: Documentation only changes
- **`feat`: A new feature**
- **`fix`: A bug fix**
- `perf`: A code change that improves performance
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `revert`: Revert something
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `test`: Adding missing tests or correcting existing tests
