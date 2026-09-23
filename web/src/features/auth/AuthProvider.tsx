import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { sessionQuery } from "./queries";
import { AuthContext, type AuthStatus } from "./use-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useQuery(sessionQuery());

  const status: AuthStatus = session.isPending
    ? "loading"
    : session.data
      ? "authenticated"
      : "anonymous";

  return (
    <AuthContext value={{ status, user: session.data ?? null }}>
      {children}
    </AuthContext>
  );
}
