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
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import classes from "./AccountForm.module.css";
import { ACCOUNT_TYPE_DISPLAY } from "./constants";
import type { AccountInput } from "./types";

export type AccountFormValues = AccountInput & {
  initial_balance: number | "";
};

function amountValidator(label: string) {
  const requireAmount = isNotEmpty(`${label} is required`);
  return (value: number | "" | undefined) => {
    if (Number.isNaN(Number(value))) {
      return `${label} must be a number`;
    }
    return requireAmount(value);
  };
}

const validateInitialBalance = amountValidator("Initial balance");

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_DISPLAY).map(
  ([value, { label }]) => ({ value, label }),
);

type AccountFormProps = {
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
};

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
}: AccountFormProps) {
  const form = useForm<AccountFormValues>({
    initialValues,
    validate: {
      name: isNotEmpty("Name is required"),
      initial_balance: validateInitialBalance,
    },
    transformValues: (values) => ({ ...values, name: values.name.trim() }),
  });
  const { setErrors } = form;
  const isMobile = useIsMobile();
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

  const submitButton = (
    <Button type="submit" loading={isPending}>
      {submitLabel}
    </Button>
  );
  const cancelButton = (
    <Button variant="default" onClick={onCancel} disabled={isPending}>
      Cancel
    </Button>
  );

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
        {isMobile ? (
          <MobileFormActions
            submitButton={submitButton}
            cancelButton={cancelButton}
            secondaryAction={secondaryAction}
          />
        ) : (
          <DesktopFormActions
            submitButton={submitButton}
            cancelButton={cancelButton}
            secondaryAction={secondaryAction}
          />
        )}
      </Stack>
    </form>
  );
}

type FormActionsProps = {
  submitButton: ReactNode;
  cancelButton: ReactNode;
  secondaryAction?: ReactNode;
};

function MobileFormActions({
  submitButton,
  cancelButton,
  secondaryAction,
}: FormActionsProps) {
  return (
    <Stack gap="xs">
      {submitButton}
      {cancelButton}
      {secondaryAction}
    </Stack>
  );
}

function DesktopFormActions({
  submitButton,
  cancelButton,
  secondaryAction,
}: FormActionsProps) {
  return (
    <Group justify={secondaryAction ? "space-between" : "flex-end"}>
      {secondaryAction}
      <Group>
        {cancelButton}
        {submitButton}
      </Group>
    </Group>
  );
}
