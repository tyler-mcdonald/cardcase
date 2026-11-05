import { useEffect, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { sessionQuery } from "./queries";
import { onUserChangeElsewhere } from "./session-channel";
import { AuthContext } from "./use-auth";

function reloadPage() {
  window.location.reload();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useQuery(sessionQuery());
  const value = useMemo(() => ({ user: session.data }), [session.data]);

  useEffect(() => onUserChangeElsewhere(reloadPage), []);

  return <AuthContext value={value}>{children}</AuthContext>;
}
