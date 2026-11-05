import { useEffect, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { sessionQuery } from "./queries";
import { onUserChangeElsewhere } from "./session-channel";
import { AuthContext } from "./use-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useQuery(sessionQuery());
  const value = useMemo(() => ({ user: session.data }), [session.data]);

  useEffect(
    () =>
      onUserChangeElsewhere(() => {
        if (window.location.pathname === "/demo") window.location.replace("/");
        else window.location.reload();
      }),
    [],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
