import { Button, Group, Stack, Text } from "@mantine/core";
import { apiErrorMessage } from "@/lib/api/errors";
import { FormError } from "./FormError";

export function DeleteConfirmation({
  message,
  isPending,
  error,
  onConfirm,
  onCancel,
}: {
  message: string;
  isPending: boolean;
  error: Error | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Stack>
      <Text size="sm">{message}</Text>
      {error && <FormError message={apiErrorMessage(error)} />}
      <Group justify="flex-end">
        <Button
          variant="subtle"
          onClick={onCancel}
          disabled={isPending}
          autoFocus
        >
          Cancel
        </Button>
        <Button variant="filled" color="red" onClick={onConfirm} loading={isPending}>
          Delete
        </Button>
      </Group>
    </Stack>
  );
}
