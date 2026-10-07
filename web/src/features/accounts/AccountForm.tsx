import {
  Button,
  Group,
  Input,
  NumberInput,
  SegmentedControl,
  Stack,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { isNotEmpty, useForm } from "@mantine/form";
import { type ReactNode, useEffect } from "react";
import { FormError } from "@/components/FormError";
import { ACCOUNT_TYPE_DISPLAY } from "./constants";
import type { AccountInput } from "./types";

export type AccountFormValues = AccountInput & {
  initial_balance?: string | number;
};

function validateInitialBalance(value: AccountFormValues["initial_balance"]) {
  if (value === undefined) {
    return null;
  }
  if (value === "") {
    return "Initial balance is required";
  }
  return Number(value) < 0 ? "Initial balance can't be negative" : null;
}

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_DISPLAY).map(
  ([value, { label }]) => ({ value, label }),
);

export function AccountForm({
  initialValues,
  typeLocked = false,
  submitLabel,
  isPending,
  fieldErrors,
  formError,
  onSubmit,
  onCancel,
  secondaryAction,
}: {
  initialValues: AccountFormValues;
  typeLocked?: boolean;
  submitLabel: string;
  isPending: boolean;
  fieldErrors: Record<string, string>;
  formError: string | null;
  onSubmit: (values: AccountFormValues) => void;
  onCancel: () => void;
  secondaryAction?: ReactNode;
}) {
  const form = useForm<AccountFormValues>({
    initialValues,
    validate: {
      name: isNotEmpty("Name is required"),
      initial_balance: validateInitialBalance,
    },
    transformValues: (values) => ({ ...values, name: values.name.trim() }),
  });
  const { setErrors } = form;
  const { error: typeError, ...typeInputProps } = form.getInputProps("type");

  useEffect(() => {
    setErrors(fieldErrors);
  }, [fieldErrors, setErrors]);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label="Name"
          required
          maxLength={255}
          data-autofocus
          {...form.getInputProps("name")}
        />
        <Input.Wrapper
          label="Type"
          required
          error={typeError}
          description={
            typeLocked ? "Type can't be changed after creation." : undefined
          }
        >
          <SegmentedControl
            fullWidth
            disabled={typeLocked}
            data={TYPE_OPTIONS}
            color={ACCOUNT_TYPE_DISPLAY[form.values.type].color}
            {...typeInputProps}
          />
        </Input.Wrapper>
        {initialValues.initial_balance !== undefined && (
          <NumberInput
            label="Initial balance"
            required
            prefix="$"
            decimalScale={2}
            thousandSeparator=","
            hideControls
            {...form.getInputProps("initial_balance")}
          />
        )}
        <DateInput
          label="Expiration date"
          description="Optional — leave blank if it doesn't expire."
          clearable
          valueFormat="MMM D, YYYY"
          {...form.getInputProps("expires_on")}
        />
        <TextInput
          label="Description"
          maxLength={1000}
          {...form.getInputProps("description")}
        />
        {formError && <FormError message={formError} />}
        <Group justify={secondaryAction ? "space-between" : "flex-end"}>
          {secondaryAction}
          <Group>
            <Button variant="default" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {submitLabel}
            </Button>
          </Group>
        </Group>
      </Stack>
    </form>
  );
}
