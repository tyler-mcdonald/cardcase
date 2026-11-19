import { Center, Loader } from "@mantine/core";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/AppLayout";
import { SessionErrorAlert } from "./SessionErrorAlert";
import type { User } from "./types";
import { useAuth, type SessionError } from "./use-auth";

export function ProtectedRoute() {
  const { user, sessionError } = useAuth();

  if (!sessionError && user === null) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{pendingContent(user, sessionError)}</AppLayout>;
}

// Content shown in place of the route until a signed-in user is known;
// undefined once they are, so the layout renders the route itself.
function pendingContent(
  user: User | null | undefined,
  sessionError: SessionError | null,
) {
  if (sessionError) {
    return <SessionErrorAlert sessionError={sessionError} />;
  }

  if (user === undefined) {
    return (
      <Center pt="xl">
        <Loader aria-label="Checking your sign-in" />
      </Center>
    );
  }

  return undefined;
}
