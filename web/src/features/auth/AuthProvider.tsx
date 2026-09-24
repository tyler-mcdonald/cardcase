import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { sessionQuery } from "./queries";
import { AuthContext } from "./use-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useQuery(sessionQuery());
  const value = useMemo(() => ({ user: session.data }), [session.data]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
