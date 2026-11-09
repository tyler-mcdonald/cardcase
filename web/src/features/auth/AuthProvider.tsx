import { useEffect, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
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

  return <AuthContext value={value}>{children}</AuthContext>;
}
