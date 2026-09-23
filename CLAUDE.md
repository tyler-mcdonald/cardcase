# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Pull Requests

PRs into `main` are squashed and merged, landing as a single commit. As such, the PR title should follow
the Conventional Commit style.

- Use Conventional Commits for all PR titles, scoped according to where the changes were made in the repo:
  - Examples:
    - `fix(backend): serve static assets with whitenoise`
    - `feat(backend): add user authentication`
    - `docs: update claude instructions for PR titles`
- Do not add a desciption other than "Closes #x" to reference the issue, unless explicitly requested by the user.
- PR Titles should not exceed 50 characters.

## Frontend data fetching

All backend calls go through `web/src/lib/api.ts`. Its `api.get/post/delete` helpers throw
`ApiError` (`status`, `body`) on any non-2xx response or network failure — never swallow errors
there. Components never call `fetch` or build URLs directly.

```ts
import { api, ApiError } from "@/lib/api";

const account = await api.get<Account>(`/v1/accounts/${id}`);
```
