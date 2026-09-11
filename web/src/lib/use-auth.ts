import { createContext, useContext } from "react";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

// Synthesized locally for cases the API doesn't give an error code of its
// own, kept alongside the backend's own codes (e.g. "incorrect_code") so
// callers always branch on `code`, never on message text or HTTP status.
export const PROCESS_EXPIRED = "process_expired";
export const NETWORK_ERROR = "network_error";

export type ActionResult =
  { ok: true } | { ok: false; error: string; code: string };

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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
