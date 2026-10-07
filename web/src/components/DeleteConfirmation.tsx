import { Button, Group, Stack, Text } from "@mantine/core";
import { FormError } from "./FormError";

export function DeleteConfirmation({
  message,
  isPending,
  errorMessage,
  onConfirm,
  onCancel,
}: {
  message: string;
  isPending: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Stack>
      <Text size="sm">{message}</Text>
      {errorMessage && <FormError message={errorMessage} />}
      <Group justify="flex-end">
        <Button
          variant="default"
          onClick={onCancel}
          disabled={isPending}
          autoFocus
        >
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm} loading={isPending}>
          Delete
        </Button>
      </Group>
    </Stack>
  );
}
