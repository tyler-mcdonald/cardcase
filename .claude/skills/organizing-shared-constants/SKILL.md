---
name: organizing-shared-constants
description: Decides where a frontend constant lives and how derived constants and per-field metadata are shaped. Use when adding, moving, or deriving a constant in web/.
---

# Organizing Shared Constants

A constant shared by several files in one feature lives in the feature's `constants.ts`
(`web/src/features/<feature>/constants.ts`); create it if missing. Always `constants.ts`,
never an entity-named variant like `accountTypes.ts` — the folder already names the
entity.

A value or derivation used by only one file lives in that file, not `constants.ts`. Move
it to `constants.ts` once a second file needs it.

If more than one feature needs the value, don't import it from another feature's
`constants.ts` — stop and ask the user where it belongs; there's no shared home for
cross-feature constants yet.

If the value belongs with specific code, it lives with that code instead — a query key
with its queries in `queries.ts`, an API path with its endpoint function in `api.ts` (see
the `build-web-api-layer` skill). `constants.ts` is for plain data with no more specific
owner — no JSX or components.

Keep one copy in `constants.ts`; consumers derive their own shape from it rather than
copying it. For example, `ACCOUNT_TYPE_DISPLAY` in `web/src/features/accounts/constants.ts`
is used by `AccountCard.tsx`, and `AccountForm.tsx` derives its select options from it.

## Per-field metadata

When fields carry flags or metadata (editable, label, …), model them as one object keyed
by field, typed with `as const satisfies Partial<Record<keyof Entity, Config>>`, and
derive field-name types from it. Don't keep parallel lists (`FIELDS`, `EDITABLE_FIELDS`)
that must be updated together. The `Config` type lives in the feature's `types.ts`, and
`satisfies` makes every entry declare each required property and rejects keys that
aren't real entity fields. See `ACCOUNT_INPUT_FIELDS` in
`web/src/features/accounts/constants.ts` and `EditableAccountField` in `types.ts`.

## No unchecked type guards

Don't derive a subset with a type guard whose predicate is hardcoded separately from
the type — e.g. `.filter((f): f is Editable => f !== "type")` next to
`Exclude<Field, "type">`. TypeScript doesn't check that the two agree, so they drift.
The guard must read the same source the type is derived from (e.g.
`return ACCOUNT_INPUT_FIELDS[field].editable`).
