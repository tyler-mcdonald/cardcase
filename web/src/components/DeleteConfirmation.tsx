import { Button, Group, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { apiErrorMessage } from "@/lib/api/errors";
import { FormError } from "./FormError";

export function DeleteConfirmation({
  message,
  isPending,
  error,
  onConfirm,
  onCancel,
  confirmEnabled = true,
  children,
}: {
  message: string;
  isPending: boolean;
  error: Error | null;
  onConfirm: () => void;
  onCancel: () => void;
  confirmEnabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <Stack>
      <Text size="sm">{message}</Text>
      {children}
      {error && <FormError message={apiErrorMessage(error)} />}
      <Group justify="flex-end">
        <Button
          variant="default"
          onClick={onCancel}
          disabled={isPending}
          autoFocus
        >
          Cancel
        </Button>
        <Button
          color="red"
          onClick={onConfirm}
          disabled={!confirmEnabled}
          loading={isPending}
        >
          Delete
        </Button>
      </Group>
    </Stack>
  );
}
