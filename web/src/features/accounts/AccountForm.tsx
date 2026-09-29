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
import { apiErrorMessage, apiFieldErrors } from "@/lib/api/errors";
import { ACCOUNT_TYPE_DISPLAY } from "./constants";
import type { AccountInput } from "./types";

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_DISPLAY).map(
  ([value, { label }]) => ({ value, label }),
);

const FORM_FIELDS = [
  "name",
  "type",
  "expires_on",
  "description",
] as const satisfies readonly (keyof AccountInput)[];

export function AccountForm({
  initialValues,
  mode,
  submitLabel,
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  initialValues: AccountInput;
  mode: "create" | "edit";
  submitLabel: string;
  isPending: boolean;
  error: Error | null;
  onSubmit: (values: AccountInput) => void;
  onCancel: () => void;
}) {
  const form = useForm<AccountInput>({
    initialValues,
    validate: { name: isNotEmpty("Name is required") },
    transformValues: (values) => ({ ...values, name: values.name.trim() }),
  });
  const { setErrors } = form;
  const { error: typeError, ...typeInputProps } = form.getInputProps("type");
  const isTypeLocked = mode === "edit";
  const hasFieldErrors =
    Object.keys(apiFieldErrors(error, FORM_FIELDS)).length > 0;
  const formError = error && !hasFieldErrors ? apiErrorMessage(error) : null;

  useEffect(() => {
    setErrors(apiFieldErrors(error, FORM_FIELDS));
  }, [error, setErrors]);

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
            isTypeLocked ? "Type can't be changed after creation." : undefined
          }
        >
          <SegmentedControl
            fullWidth
            disabled={isTypeLocked}
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
          {...form.getInputProps("expires_on")}
        />
        <TextInput
          label="Description"
          maxLength={1000}
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
