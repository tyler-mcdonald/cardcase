---
name: organizing-shared-constants
description: Use when a constant in web/ is needed by more than one file in a feature or module, to decide which file it lives in.
---

# Organizing Shared Constants

A constant shared by several files lives in the narrowest home that covers all of them:

- **Files within one feature** — the feature's `constants.ts`
  (`web/src/features/<feature>/constants.ts`); create it if missing. Always
  `constants.ts`, never an entity-named variant like `accountTypes.ts` — the folder
  already names the entity.
- **Files across features** — `web/src/lib/<area>/`, next to the code it belongs with. A
  feature never imports another feature's `constants.ts`.

If the value belongs with specific code, it lives with that code instead — a query key
with its queries in `queries.ts`, an API path with its endpoint function in `api.ts` (see
the `build-web-api-layer` skill). `constants.ts` is for plain data with no more specific
owner — no JSX or components.

Keep one copy in the shared home; consumers derive their own shape from it rather than
copying it. For example, `ACCOUNT_TYPE_DISPLAY` in `web/src/features/accounts/constants.ts`
is used by `AccountCard.tsx`, and `CreateAccountForm.tsx` derives its select options from
it.
