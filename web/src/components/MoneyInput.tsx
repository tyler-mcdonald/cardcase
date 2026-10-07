import { NumberInput, type NumberInputProps } from "@mantine/core";

export function MoneyInput(props: NumberInputProps) {
  return <NumberInput decimalScale={2} hideControls {...props} />;
}
