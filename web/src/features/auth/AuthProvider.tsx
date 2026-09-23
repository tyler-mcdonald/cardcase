import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { sessionQuery } from "./queries";
import { AuthContext } from "./use-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useQuery(sessionQuery());

  return <AuthContext value={{ user: session.data }}>{children}</AuthContext>;
}
