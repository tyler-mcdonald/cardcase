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

## Monorepo boundaries

Each part of the stack (`backend/`, `web/`) should not document or assume the internal
implementation details of the others — e.g. naming a specific backend library or
framework in frontend code, comments, or test descriptions. Contracts required to
integrate are fine to reference (a URL path, a request/response shape, a field name);
naming *how* the other side implements that contract is not.

- Bad: a frontend test named `"resolves on allauth's expected 401 response"`.
- Good: a frontend test named `"resolves on the API's expected 401 response"`.
- Fine either way: `const AUTH_API_BASE = "/_allauth/browser/v1"` — this is the
  contract's URL, not a description of backend internals.

## Frontend data fetching

Layered, left to right — each layer only calls the one directly to its right:

```
component → feature queries.ts → feature api.ts → lib/api.ts (request)
```

- `lib/api.ts` — the HTTP client. `request` throws `ApiError` (`status`, `body`) on any
  non-2xx response or network failure — never swallow errors here.
- `features/<feature>/api.ts` — one function per endpoint, calling `request` with its
  method/URL. No React or TanStack Query code.
- `features/<feature>/queries.ts` — wraps `api.ts` functions in `queryOptions` /
  `useMutation`. The only file in a feature that imports from its `api.ts`.
- Components — call only `queries.ts` hooks/options. Never call `request`, a feature's
  `api.ts`, or `fetch` directly.
