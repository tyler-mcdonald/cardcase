import type { MantineColor } from "@mantine/core";
import type { Account, EditableAccountField } from "./types";

export const ACCOUNT_INPUT_FIELDS = [
  "name",
  "type",
  "expires_on",
  "description",
] as const;

export const EDITABLE_ACCOUNT_FIELDS = ACCOUNT_INPUT_FIELDS.filter(
  (field): field is EditableAccountField => field !== "type",
);

type AccountTypeDisplay = {
  label: string;
  color?: MantineColor;
};

export const ACCOUNT_TYPE_DISPLAY: Record<Account["type"], AccountTypeDisplay> =
  {
    gift_card: { label: "Gift card" },
    flight_credit: { label: "Flight credit", color: "violet" },
  };
