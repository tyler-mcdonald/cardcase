import type { MantineColor } from "@mantine/core";
import { THEME_SHADES } from "@/theme";
import type { Account } from "./types";

type AccountTypeDisplay = {
  label: string;
  color?: MantineColor;
  selectorColor?: MantineColor;
};

export const ACCOUNT_TYPE_DISPLAY: Record<Account["type"], AccountTypeDisplay> =
  {
    gift_card: { label: "Gift card" },
    flight_credit: {
      label: "Flight credit",
      color: "violet",
      selectorColor: THEME_SHADES.strong,
    },
  };
