import type { MantineColor } from "@mantine/core";
import type { Account } from "./types";

type AccountTypeDisplay = {
  label: string;
  color?: MantineColor;
};

export const ACCOUNT_TYPE_DISPLAY: Record<Account["type"], AccountTypeDisplay> =
  {
    gift_card: { label: "Gift card" },
    flight_credit: { label: "Flight credit", color: "violet" },
  };
