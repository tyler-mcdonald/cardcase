import { createContext } from "react";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type User = {
  id: string;
  email: string;
};

export type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  requestLoginCode: (email: string) => Promise<ActionResult>;
  confirmLoginCode: (code: string) => Promise<ActionResult>;
  logout: () => Promise<ActionResult>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
