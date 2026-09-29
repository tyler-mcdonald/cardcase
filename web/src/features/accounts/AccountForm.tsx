import {
  Alert,
  Button,
  Group,
  Input,
  SegmentedControl,
  Stack,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { isNotEmpty, useForm } from "@mantine/form";
import { useEffect } from "react";
import { ACCOUNT_INPUT_FIELDS, ACCOUNT_TYPE_DISPLAY } from "./constants";
import type { AccountInput, AccountInputField } from "./types";

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_DISPLAY).map(
  ([value, { label }]) => ({ value, label }),
);

export function AccountForm({
  initialValues,
  mode,
  submitLabel,
  isPending,
  fieldErrors,
  formError,
  onSubmit,
  onCancel,
}: {
  initialValues: AccountInput;
  mode: "create" | "edit";
  submitLabel: string;
  isPending: boolean;
  fieldErrors: Record<string, string>;
  formError: string | null;
  onSubmit: (values: AccountInput) => void;
  onCancel: () => void;
}) {
  const form = useForm<AccountInput>({
    initialValues,
    validate: { name: isNotEmpty("Name is required") },
    transformValues: (values) => ({ ...values, name: values.name.trim() }),
  });
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const { setErrors } = form;
  const { error: typeError, ...typeInputProps } = form.getInputProps("type");
  const isLocked = (field: AccountInputField) =>
    mode === "edit" && !ACCOUNT_INPUT_FIELDS[field].editable;

  useEffect(() => {
    if (hasFieldErrors) {
      setErrors(fieldErrors);
    }
  }, [fieldErrors, hasFieldErrors, setErrors]);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label="Name"
          required
          maxLength={255}
          data-autofocus
          disabled={isLocked("name")}
          {...form.getInputProps("name")}
        />
        <Input.Wrapper
          label="Type"
          required
          error={typeError}
          description={
            isLocked("type")
              ? "Type can't be changed after creation."
              : undefined
          }
        >
          <SegmentedControl
            fullWidth
            disabled={isLocked("type")}
            data={TYPE_OPTIONS}
            color={ACCOUNT_TYPE_DISPLAY[form.values.type].color}
            {...typeInputProps}
          />
        </Input.Wrapper>
        <DateInput
          label="Expiration date"
          description="Optional — leave blank if it doesn't expire."
          clearable
          valueFormat="MMM D, YYYY"
          disabled={isLocked("expires_on")}
          {...form.getInputProps("expires_on")}
        />
        <TextInput
          label="Description"
          maxLength={1000}
          disabled={isLocked("description")}
          {...form.getInputProps("description")}
        />
        {formError && (
          <Alert color="red" role="alert">
            {formError}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
