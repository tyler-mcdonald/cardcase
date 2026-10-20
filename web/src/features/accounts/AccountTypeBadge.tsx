import { Badge } from "@mantine/core";
import { ACCOUNT_TYPE_DISPLAY } from "./constants";
import type { Account } from "./types";

export function AccountTypeBadge({ type }: { type: Account["type"] }) {
  const display = ACCOUNT_TYPE_DISPLAY[type];
  return (
    <Badge variant="light" radius="xl" size="sm" color={display.color}>
      {display.label}
    </Badge>
  );
}
