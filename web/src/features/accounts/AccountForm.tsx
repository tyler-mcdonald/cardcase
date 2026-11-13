import {
  Button,
  Group,
  Input,
  SegmentedControl,
  Stack,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { isNotEmpty, useForm } from "@mantine/form";
import { type ReactNode, useEffect } from "react";
import { FormError } from "@/components/FormError";
import { MoneyInput } from "@/components/MoneyInput";
import { BrandNameInput } from "@/features/brands/BrandNameInput";
import type { Brand } from "@/features/brands/types";
import classes from "./AccountForm.module.css";
import { ACCOUNT_TYPE_DISPLAY } from "./constants";
import type { AccountInput } from "./types";

export type AccountFormValues = AccountInput & {
  initial_balance: number | "";
};

const requireInitialBalance = isNotEmpty("Initial balance is required");

function validateInitialBalance(value: AccountFormValues["initial_balance"]) {
  if (Number.isNaN(Number(value))) {
    return "Initial balance must be a number";
  }
  return requireInitialBalance(value);
}

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_DISPLAY).map(
  ([value, { label }]) => ({ value, label }),
);

export function AccountForm({
  initialValues,
  showInitialBalance = false,
  typeLocked = false,
  autoFocus = true,
  submitLabel,
  isPending,
  fieldErrors,
  formError,
  onSubmit,
  onCancel,
  secondaryAction,
}: {
  initialValues: AccountFormValues;
  showInitialBalance?: boolean;
  typeLocked?: boolean;
  autoFocus?: boolean;
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

  function handleNameChange(name: string) {
    form.setFieldValue("name", name);
    form.setFieldValue("brand_domain", "");
  }

  function handleBrandSelect(brand: Brand) {
    form.setValues({ name: brand.name, brand_domain: brand.domain });
  }

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <BrandNameInput
          label="Name"
          required
          maxLength={255}
          data-autofocus={autoFocus || undefined}
          {...form.getInputProps("name")}
          value={form.values.name}
          onChange={handleNameChange}
          onBrandSelect={handleBrandSelect}
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
            classNames={{ input: classes.typeInput, label: classes.typeLabel }}
            data={TYPE_OPTIONS}
            color={ACCOUNT_TYPE_DISPLAY[form.values.type].selectorColor}
            {...typeInputProps}
          />
        </Input.Wrapper>
        {showInitialBalance && (
          <MoneyInput
            label="Initial balance"
            required
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
