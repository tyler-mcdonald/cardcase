import { Alert, Button, Stack, Text } from "@mantine/core";
import { apiErrorMessage } from "@/lib/api/errors";
import classes from "./LoadErrorAlert.module.css";

export function LoadErrorAlert({
  title,
  error,
  retrying,
  onRetry,
}: {
  title: string;
  error: unknown;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <Alert color="red" title={title}>
      <Stack gap="sm">
        <Text size="sm">{apiErrorMessage(error)}</Text>
        <Button
          variant="light"
          color="red"
          size="xs"
          loading={retrying}
          onClick={onRetry}
          className={classes.retryButton}
        >
          Try again
        </Button>
      </Stack>
    </Alert>
  );
}
