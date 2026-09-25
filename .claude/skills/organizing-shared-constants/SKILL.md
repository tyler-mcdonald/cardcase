---
name: organizing-shared-constants
description: Use when deciding where to put a constant value in the web frontend (web/) — a string, number, lookup table, or config object that more than one file in a feature or module needs, or when adding a new module-level constant.
---

# Organizing Shared Constants

## Where it goes

Pick the narrowest home that covers every file using the value:

- **One file uses it** — keep it in that file, unexported, at the top of the module.
- **Several files in one feature use it** — the feature's `constants.ts`
  (`web/src/features/<feature>/constants.ts`). Create it if it doesn't exist yet. Don't
  invent a differently named file (`accountTypes.ts`, `accountConstants.ts`): the folder
  already names the entity, and `constants.ts` is where the next agent will look.
- **Several features use it** — move it to `web/src/lib/<area>/`, next to the code it
  belongs with (e.g. `GENERIC_ERROR` in `lib/api/errors.ts`). A feature doesn't import
  another feature's `constants.ts`.

Some values already have a more specific home — keep them there, not in `constants.ts`:

- Query and mutation keys → the feature's `queries.ts`.
- API paths → the feature's `api.ts` (see the `build-web-api-layer` skill).
- Types → `types.ts`. `constants.ts` may import types from it, never the reverse.
- Tables holding JSX or React components → the component file that renders them (e.g.
  `ACCOUNT_STYLE` in `AccountCard.tsx`). `constants.ts` holds plain data.

## Shape and naming

- `SCREAMING_SNAKE_CASE`, named `<ENTITY>_<FIELD>_<PURPOSE>` (e.g. `ACCOUNT_TYPE_DISPLAY`).
- Lookup tables keyed by a union are `Record<Union, …>`, not arrays, so adding a union
  member fails to compile until every table covers it.
- A value type used only by the constant stays unexported in `constants.ts`.
- Store the source data once; consumers derive their own shape from it (e.g. a form's
  select options mapped from the table) rather than keeping a second copy.

## Example

Bad — a new, oddly named file, with an array that won't catch a missing type:

```ts
// features/accounts/accountTypes.ts
export const ACCOUNT_TYPES = [
  { value: "gift_card", label: "Gift card" },
  { value: "flight_credit", label: "Flight credit" },
];
```

Good — the feature's `constants.ts`, keyed by the union:

```ts
// features/accounts/constants.ts
type AccountTypeDisplay = { label: string; color?: MantineColor };

export const ACCOUNT_TYPE_DISPLAY: Record<Account["type"], AccountTypeDisplay> = {
  gift_card: { label: "Gift card" },
  flight_credit: { label: "Flight credit", color: "violet" },
};
```
