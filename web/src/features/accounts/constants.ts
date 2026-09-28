import type { MantineColor } from "@mantine/core";
import type { Account, AccountInputField, EditableAccountField } from "./types";

export const ACCOUNT_INPUT_FIELDS = [
  "name",
  "type",
  "expires_on",
  "description",
] as const satisfies readonly AccountInputField[];

export const EDITABLE_ACCOUNT_FIELDS = [
  "name",
  "expires_on",
  "description",
] as const satisfies readonly EditableAccountField[];

type AccountTypeDisplay = {
  label: string;
  color?: MantineColor;
};

export const ACCOUNT_TYPE_DISPLAY: Record<Account["type"], AccountTypeDisplay> =
  {
    gift_card: { label: "Gift card" },
    flight_credit: { label: "Flight credit", color: "violet" },
  };
