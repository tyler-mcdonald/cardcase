import { Container } from "@mantine/core";
import { LoadErrorAlert } from "@/components/LoadErrorAlert";

export function SessionLoadError({
  error,
  retrying,
  onRetry,
}: {
  error: unknown;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <Container size={420} pt="15vh">
      <LoadErrorAlert
        title="Couldn't check your sign-in"
        error={error}
        retrying={retrying}
        onRetry={onRetry}
      />
    </Container>
  );
}
