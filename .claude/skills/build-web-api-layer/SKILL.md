---
name: build-web-api-layer
description: Use when adding or changing how the web frontend (web/) talks to the API — new endpoints, feature api.ts / queries.ts files, TanStack Query hooks, or components that fetch or mutate data.
---

# Build Web API Layer

Frontend data fetching is layered, left to right — each layer only calls the one directly to its right:

```
component → feature queries.ts → feature api.ts → lib/api/client.ts (request)
```

Enforced by `pnpm run depcruise` (`web/.dependency-cruiser.cjs`), also run in CI and
lint-staged.

## Layers

- `lib/api/client.ts` — the HTTP client. `request` throws `ApiError` (`status`, `body`) on
  any non-2xx response or network failure — never swallow errors here. Only a feature's
  `api.ts` may import it.
- `lib/api/errors.ts`, `lib/api/types.ts` — `ApiError`, `apiErrorMessage`, and the shared
  response types. Not part of the layering — any layer, including components, may import
  these directly.
- `features/<feature>/api.ts` — one function per endpoint, calling `request` with its
  method/URL. No React or TanStack Query code.
- `features/<feature>/queries.ts` — wraps `api.ts` functions in `queryOptions` or
  `useMutation`. The only file in a feature that imports from its `api.ts`, and only its
  own feature's `api.ts` — never another feature's.
- Components — call only `queries.ts` hooks/options. Never call `request`, a feature's
  `api.ts`, or `fetch` directly.

## Types

Types shared across layers (a feature's own or otherwise) belong in a `types.ts`
(`lib/api/types.ts`, `features/<feature>/types.ts`), not in an `api.ts` — the layering
rules apply to every import, including `import type`.
