import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, type ApiResponse } from "@/lib/api";
import {
  getSession,
  requestLoginCode as requestLoginCodeApi,
  confirmLoginCode as confirmLoginCodeApi,
  logout as logoutApi,
  type SessionData,
} from "./api";
import {
  AuthContext,
  type AuthStatus,
  type ActionResult,
  type User,
} from "./use-auth";

export const GENERIC_ERROR = "Something went wrong. Please try again.";

const SESSION_QUERY_KEY = ["session"] as const;

function sessionUser(response: ApiResponse<SessionData>): User | null {
  return response.meta?.is_authenticated ? (response.data?.user ?? null) : null;
}

async function loadSession(): Promise<User | null> {
  try {
    const response = await getSession();
    return sessionUser(response);
  } catch {
    return null;
  }
}

async function runAction(
  mutateAsync: () => Promise<ApiResponse<SessionData>>,
): Promise<ActionResult> {
  try {
    await mutateAsync();
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) {
      const body = err.body as ApiResponse<SessionData> | undefined;
      const message = body?.errors?.[0]?.message;
      if (message) {
        return { ok: false, error: message };
      }
    }
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
    mutationFn: requestLoginCodeApi,
  });

  const confirmLoginCodeMutation = useMutation({
    mutationFn: confirmLoginCodeApi,
    onSuccess: applySession,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
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
