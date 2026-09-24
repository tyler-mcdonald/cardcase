import {
  queryOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api";
import {
  getSession,
  requestLoginCode,
  confirmLoginCode,
  logout,
  type SessionData,
} from "./api";
import type { User } from "./types";

const SESSION_QUERY_KEY = ["session"] as const;

function sessionUser(response: ApiResponse<SessionData>): User | null {
  return response.meta?.is_authenticated ? (response.data?.user ?? null) : null;
}

function applySession(
  queryClient: QueryClient,
  response: ApiResponse<SessionData>,
) {
  queryClient.setQueryData(SESSION_QUERY_KEY, sessionUser(response));
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

export function useRequestLoginCode() {
  return useMutation({ mutationFn: requestLoginCode });
}

export function useConfirmLoginCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmLoginCode,
    onSuccess: (response) => applySession(queryClient, response),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: (response) => applySession(queryClient, response),
  });
}
