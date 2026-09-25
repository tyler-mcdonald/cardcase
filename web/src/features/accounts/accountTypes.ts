import type { MantineColor } from "@mantine/core";
import type { Account } from "./types";

type AccountTypeInfo = {
  label: string;
  color?: MantineColor;
};

export const ACCOUNT_TYPES: Record<Account["type"], AccountTypeInfo> = {
  gift_card: { label: "Gift card" },
  flight_credit: { label: "Flight credit", color: "violet" },
};
