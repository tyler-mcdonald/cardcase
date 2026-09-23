import { createContext, useContext } from "react";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type User = {
  id: string;
  email: string;
};

export type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
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
