import {
  IconCreditCard,
  IconCreditCardFilled,
  IconList,
  IconListFilled,
} from "@tabler/icons-react";

export const NAV_LINKS = [
  {
    to: "/",
    label: "Accounts",
    icon: IconCreditCard,
    activeIcon: IconCreditCardFilled,
  },
  {
    to: "/transactions",
    label: "Transactions",
    icon: IconList,
    activeIcon: IconListFilled,
  },
];
