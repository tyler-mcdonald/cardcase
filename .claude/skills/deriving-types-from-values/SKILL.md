---
name: deriving-types-from-values
description: Keeps TypeScript types and runtime values on a single source. Use when writing a type guard, deriving a type from a runtime value, or modeling per-field flags/metadata in web/.
---

# Deriving Types From Values

A fact like "which fields are editable" lives in one place. Both the runtime values and
the TypeScript types are derived from it, so they stay in step.

## Per-field metadata

When fields carry flags or metadata (editable, label, …), model them as one object keyed
by field, typed with `as const satisfies Partial<Record<keyof Entity, Config>>`, and
derive field-name types from it. Don't keep parallel lists (`FIELDS`, `EDITABLE_FIELDS`)
that must be updated together. The `Config` type lives next to the object it shapes
(see the `organizing-shared-constants` skill). `satisfies` makes every entry declare each
required property and rejects keys that aren't real entity fields — but `Partial` means
it won't flag an entity field that's missing from the object, so add new input fields to
it by hand. See `ACCOUNT_INPUT_FIELDS` in `web/src/features/accounts/constants.ts` and
`EditableAccountField` in `types.ts`.

Flag values must be literals (`editable: true`, not `editable: someFlag`) — a widened
`boolean` silently drops the field from every type derived from that flag.

## Type guards

Don't derive a subset with a type guard whose predicate is hardcoded separately from
the type — e.g. `.filter((f): f is Editable => f !== "type")` next to
`Exclude<Field, "type">`. TypeScript never checks a guard's predicate against its
`is` type, so the two drift. Keep the guard a direct read of the same flag the type is
derived from, with no other logic:

```ts
function isEditableField(
  field: AccountInputField,
): field is EditableAccountField {
  return ACCOUNT_INPUT_FIELDS[field].editable;
}
```
