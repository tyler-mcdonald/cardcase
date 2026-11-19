import { Center, Loader } from "@mantine/core";
import { Navigate } from "react-router-dom";
import { AppLayout, AppShell } from "@/AppLayout";
import { SessionErrorAlert } from "./SessionErrorAlert";
import { useAuth } from "./use-auth";

export function ProtectedRoute() {
  const { user, sessionError } = useAuth();

  if (sessionError) {
    return (
      <AppShell>
        <SessionErrorAlert sessionError={sessionError} />
      </AppShell>
    );
  }

  if (user === undefined) {
    return (
      <AppShell>
        <Center pt="xl">
          <Loader aria-label="Checking your sign-in" />
        </Center>
      </AppShell>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}
