import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, type ApiResponse } from "@/lib/api";
import {
  getSession,
  requestLoginCode,
  confirmLoginCode,
  logout,
  type SessionData,
} from "./api";
import type { User } from "./types";

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

export function sessionQuery() {
  return queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: loadSession,
    // The session is only ever updated in response to an explicit auth
    // action below, never by a background refetch.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

function useApplySession() {
  const queryClient = useQueryClient();
  return (response: ApiResponse<SessionData>) => {
    queryClient.setQueryData(SESSION_QUERY_KEY, sessionUser(response));
  };
}

export function useRequestLoginCode() {
  return useMutation({ mutationFn: requestLoginCode });
}

export function useConfirmLoginCode() {
  return useMutation({
    mutationFn: confirmLoginCode,
    onSuccess: useApplySession(),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: logout,
    onSuccess: useApplySession(),
  });
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body as ApiResponse<SessionData> | undefined;
    const message = body?.errors?.[0]?.message;
    if (message) {
      return message;
    }
  }
  return GENERIC_ERROR;
}
