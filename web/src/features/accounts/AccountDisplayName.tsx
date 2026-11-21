import { Text, type TextProps } from "@mantine/core";
import type { AccountLabel } from "./types";

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
          <Text span inherit c="dimmed">
            ({label.detail})
          </Text>
        </>
      )}
    </Text>
  );
}
