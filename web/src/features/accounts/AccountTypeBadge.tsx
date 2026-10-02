import { Badge } from "@mantine/core";
import { ACCOUNT_TYPE_DISPLAY } from "./constants";
import type { Account } from "./types";

export function AccountTypeBadge({
  type,
  className,
}: {
  type: Account["type"];
  className?: string;
}) {
  const display = ACCOUNT_TYPE_DISPLAY[type];
  return (
    <Badge
      variant="light"
      radius="xl"
      size="sm"
      color={display.color}
      className={className}
    >
      {display.label}
    </Badge>
  );
}
