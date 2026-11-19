import { LoadErrorAlert } from "@/components/LoadErrorAlert";
import type { SessionError } from "./use-auth";

export function SessionErrorAlert({
  sessionError,
}: {
  sessionError: SessionError;
}) {
  return (
    <LoadErrorAlert
      error={sessionError.error}
      retrying={sessionError.retrying}
      onRetry={sessionError.retry}
    />
  );
}
