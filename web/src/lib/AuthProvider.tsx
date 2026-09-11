import { useCallback, useEffect, useState, type ReactNode } from "react";
import { apiRequest, type ApiResponse } from "./api";
import {
  AuthContext,
  type AuthStatus,
  type ActionResult,
  type User,
} from "./use-auth";

const AUTH_API_BASE = "/_allauth/browser/v1";
const SESSION_PATH = "/auth/session";
export const GENERIC_ERROR = "Something went wrong. Please try again.";

type SessionData = { user?: User };

function toActionResult(response: ApiResponse): ActionResult {
  const error = response.errors?.[0]?.message;
  return error ? { ok: false, error } : { ok: true };
}

async function authAction(
  method: "POST" | "DELETE",
  path: string,
  {
    body,
    onResponse,
  }: {
    body?: unknown;
    onResponse?: (response: ApiResponse<SessionData>) => void;
  } = {},
): Promise<ActionResult> {
  try {
    const response = await apiRequest<SessionData>(`${AUTH_API_BASE}${path}`, {
      method,
      body: JSON.stringify(body),
    });
    onResponse?.(response);
    return toActionResult(response);
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const status: AuthStatus =
    user === undefined ? "loading" : user ? "authenticated" : "anonymous";

  const applySession = useCallback((response: ApiResponse<SessionData>) => {
    setUser(
      response.meta?.is_authenticated ? (response.data?.user ?? null) : null,
    );
  }, []);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await apiRequest<SessionData>(
          `${AUTH_API_BASE}${SESSION_PATH}`,
        );
        applySession(response);
      } catch {
        setUser(null);
      }
    }
    loadSession();
  }, [applySession]);

  function requestLoginCode(email: string) {
    return authAction("POST", "/auth/code/request", { body: { email } });
  }

  function confirmLoginCode(code: string) {
    return authAction("POST", "/auth/code/confirm", {
      body: { code },
      onResponse: applySession,
    });
  }

  function logout() {
    return authAction("DELETE", SESSION_PATH, { onResponse: applySession });
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        user: user ?? null,
        requestLoginCode,
        confirmLoginCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
