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
import { apiErrorMessage } from "@/lib/api/errors";
import { ACCOUNT_TYPES } from "./accountTypes";
import type { AccountInput } from "./types";

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPES).map(
  ([value, { label }]) => ({ value, label }),
);

export function AccountForm({
  initialValues,
  submitLabel,
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  initialValues: AccountInput;
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
        <Input.Wrapper label="Type" required>
          <SegmentedControl
            fullWidth
            data={TYPE_OPTIONS}
            color={ACCOUNT_TYPES[form.values.type].color}
            {...form.getInputProps("type")}
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
        {error && (
          <Alert color="red" role="alert">
            {apiErrorMessage(error)}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
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
