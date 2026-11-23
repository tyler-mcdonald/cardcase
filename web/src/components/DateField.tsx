import { CloseButton, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { FocusEventHandler, ReactNode } from "react";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";

export type DateFieldProps = {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  clearable?: boolean;
  value?: string | null;
  onChange: (value: string | null) => void;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
};

export function DateField(props: DateFieldProps) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileDateField {...props} />
  ) : (
    <DesktopDateField {...props} />
  );
}

function DesktopDateField({ clearable = true, ...props }: DateFieldProps) {
  return (
    <DateInput clearable={clearable} valueFormat="MMM D, YYYY" {...props} />
  );
}

function MobileDateField({
  clearable = true,
  value,
  onChange,
  ...props
}: DateFieldProps) {
  const clearButton =
    clearable && value ? (
      <CloseButton
        size="xl"
        aria-label="Clear date"
        onClick={() => onChange(null)}
      />
    ) : null;

  return (
    <TextInput
      type="date"
      value={value ?? ""}
      onChange={(event) => onChange(event.currentTarget.value || null)}
      rightSection={clearButton}
      rightSectionPointerEvents="all"
      {...props}
    />
  );
}
