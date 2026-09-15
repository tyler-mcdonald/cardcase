import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const SESSION_QUERY_KEY = ["session"] as const;

function sessionUser(response: ApiResponse<SessionData>): User | null {
  return response.meta?.is_authenticated ? (response.data?.user ?? null) : null;
}

async function loadSession(): Promise<User | null> {
  try {
    const response = await apiRequest<SessionData>(
      `${AUTH_API_BASE}${SESSION_PATH}`,
    );
    return sessionUser(response);
  } catch {
    return null;
  }
}

function toActionResult(response: ApiResponse): ActionResult {
  const error = response.errors?.[0]?.message;
  return error ? { ok: false, error } : { ok: true };
}

async function runAction(
  mutateAsync: () => Promise<ApiResponse<SessionData>>,
): Promise<ActionResult> {
  try {
    const response = await mutateAsync();
    return toActionResult(response);
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  function applySession(response: ApiResponse<SessionData>) {
    queryClient.setQueryData(SESSION_QUERY_KEY, sessionUser(response));
  }

  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: loadSession,
    // The session is only ever updated in response to an explicit auth
    // action below, never by a background refetch.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const status: AuthStatus = sessionQuery.isPending
    ? "loading"
    : sessionQuery.data
      ? "authenticated"
      : "anonymous";

  const requestLoginCodeMutation = useMutation({
    mutationFn: (email: string) =>
      apiRequest<SessionData>(`${AUTH_API_BASE}/auth/code/request`, {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  });

  const confirmLoginCodeMutation = useMutation({
    mutationFn: (code: string) =>
      apiRequest<SessionData>(`${AUTH_API_BASE}/auth/code/confirm`, {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: applySession,
  });

  const logoutMutation = useMutation({
    mutationFn: () =>
      apiRequest<SessionData>(`${AUTH_API_BASE}${SESSION_PATH}`, {
        method: "DELETE",
      }),
    onSuccess: applySession,
  });

  function requestLoginCode(email: string) {
    return runAction(() => requestLoginCodeMutation.mutateAsync(email));
  }

  function confirmLoginCode(code: string) {
    return runAction(() => confirmLoginCodeMutation.mutateAsync(code));
  }

  function logout() {
    return runAction(() => logoutMutation.mutateAsync());
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        user: sessionQuery.data ?? null,
        requestLoginCode,
        confirmLoginCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
