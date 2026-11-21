import { Text, type TextProps } from "@mantine/core";
import type { AccountLabel } from "./types";

function AccountDetail({ detail }: { detail: string }) {
  return (
    <Text span inherit c="dimmed">
      ({detail})
    </Text>
  );
}

export function AccountDisplayName({
  label,
  ...props
}: { label: AccountLabel } & TextProps) {
  return (
    <Text truncate miw={0} title={label.fullDescription} {...props}>
      {label.name}
      {label.detail && (
        <>
          {" "}
          <AccountDetail detail={label.detail} />
        </>
      )}
    </Text>
  );
}
