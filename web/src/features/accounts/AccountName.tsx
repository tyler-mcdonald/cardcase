import { Text, type TextProps } from "@mantine/core";
import type { AccountLabel } from "./types";

export function AccountName({
  label,
  ...props
}: { label: AccountLabel } & TextProps) {
  return (
    <Text truncate title={label.fullDescription} {...props}>
      {label.name}
      {label.detail && (
        <>
          {" "}
          <Text span inherit c="dimmed">
            ({label.detail})
          </Text>
        </>
      )}
    </Text>
  );
}
