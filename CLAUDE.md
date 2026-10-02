# CLAUDE.md

Guidance for Claude Code when working in this repository.

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

## PR conventions

PR titles in this repo use only these scopes:

- `backend` — changes under `backend/`
- `web` — changes under `web/`
- `deps` — dependency updates
- Omit the scope for changes outside `backend/` and `web/` (e.g. `CLAUDE.md`,
  `render.yaml`, `docs/`, `.github/`).

If a change spans several scopes (e.g. both `backend/` and `web/`), omit the scope —
and treat it as a sign the PR may be too large and should be split. Never invent a
new scope.

Examples:

- `fix(backend): serve static assets with whitenoise`
- `feat(web)!: rework auth provider API`
- `chore(deps): update dependencies`
- `docs: update claude instructions for PR titles`
