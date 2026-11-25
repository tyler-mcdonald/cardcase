import { Input, type MantineSize } from "@mantine/core";
import { AccountDisplayName } from "@/features/accounts/AccountDisplayName";
import type { AccountLabel } from "@/features/accounts/types";

export function LockedAccountInput({
  accountLabel,
  size,
}: {
  accountLabel: AccountLabel;
  size?: MantineSize;
}) {
  return (
    <Input
      component="div"
      role="textbox"
      aria-label="Account"
      aria-disabled
      aria-readonly
      size={size}
      disabled
      withAria={false}
    >
      <AccountDisplayName label={accountLabel} inherit />
    </Input>
  );
}
