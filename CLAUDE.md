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
