import { createContext, useContext } from "react";
import type { User } from "./types";

type AuthContextValue = {
  // undefined while the session is still loading; null once resolved
  // with no authenticated user.
  user: User | null | undefined;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
