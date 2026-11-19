import { useEffect, useMemo, type ReactNode } from "react";
import { Container } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { LoadErrorAlert } from "@/components/LoadErrorAlert";
import { sessionQuery } from "./queries";
import { onUserChangeElsewhere } from "./session-channel";
import { AuthContext } from "./use-auth";

function reloadPage() {
  window.location.reload();
}

/** Reloading /demo could start another demo, so send the tab home instead. */
function leaveDemoPage() {
  window.location.replace("/");
}

function refreshForNewUser() {
  if (window.location.pathname === "/demo") leaveDemoPage();
  else reloadPage();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useQuery(sessionQuery());
  const value = useMemo(() => ({ user: session.data }), [session.data]);

  useEffect(() => onUserChangeElsewhere(refreshForNewUser), []);

  if (session.isError) {
    return (
      <Container size={420} pt="15vh">
        <LoadErrorAlert
          title="Couldn't load your session"
          error={session.error}
          retrying={session.isFetching}
          onRetry={() => session.refetch()}
        />
      </Container>
    );
  }

  return <AuthContext value={value}>{children}</AuthContext>;
}
