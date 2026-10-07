import { NumberInput, type NumberInputProps } from "@mantine/core";

export function MoneyInput(props: NumberInputProps) {
  return (
    <NumberInput
      min={0}
      allowNegative={false}
      decimalScale={2}
      hideControls
      {...props}
    />
  );
}
