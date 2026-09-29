import type { MantineColor } from "@mantine/core";
import type { Account } from "./types";

type AccountInputFieldConfig = { editable: boolean };

export const ACCOUNT_INPUT_FIELDS = {
  name: { editable: true },
  type: { editable: false },
  expires_on: { editable: true },
  description: { editable: true },
} as const satisfies Partial<Record<keyof Account, AccountInputFieldConfig>>;

type AccountTypeDisplay = {
  label: string;
  color?: MantineColor;
};

export const ACCOUNT_TYPE_DISPLAY: Record<Account["type"], AccountTypeDisplay> =
  {
    gift_card: { label: "Gift card" },
    flight_credit: { label: "Flight credit", color: "violet" },
  };
