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
import { ACCOUNT_TYPE_DISPLAY } from "./constants";
import { useCreateAccount } from "./queries";
import type { AccountInput } from "./types";

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_DISPLAY).map(
  ([value, { label }]) => ({ value, label }),
);

const INITIAL_VALUES: AccountInput = {
  name: "",
  type: "gift_card",
  expires_on: null,
  description: "",
};

export function CreateAccountForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const createAccount = useCreateAccount();
  const form = useForm<AccountInput>({
    initialValues: INITIAL_VALUES,
    validate: { name: isNotEmpty("Name is required") },
    transformValues: (values) => ({ ...values, name: values.name.trim() }),
  });

  const handleSubmit = form.onSubmit((values) => {
    createAccount.mutate(values, { onSuccess: onCreated });
  });

  return (
    <form onSubmit={handleSubmit}>
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
            color={ACCOUNT_TYPE_DISPLAY[form.values.type].color}
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
        {createAccount.isError && (
          <Alert color="red" role="alert">
            {apiErrorMessage(createAccount.error)}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={onCancel}
            disabled={createAccount.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" loading={createAccount.isPending}>
            Add account
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
