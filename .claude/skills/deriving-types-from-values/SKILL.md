---
name: deriving-types-from-values
description: Keeps TypeScript types and runtime values on a single source. Use when writing a type guard, deriving a type from a runtime value, or modeling per-field flags/metadata in web/.
---

# Deriving Types From Values

A fact like "which fields are editable" lives in one place. Both the runtime values and
the TypeScript types are derived from it, so they can't disagree.

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
The guard must read the same source the type is derived from — see `isEditableField` in
`web/src/features/accounts/EditAccountModal.tsx`.
