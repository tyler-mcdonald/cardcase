import {
  hashKey,
  queryOptions,
  useMutation,
  useQueryClient,
  type Query,
  type QueryClient,
} from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api/types";
import {
  getSession,
  requestLoginCode,
  confirmLoginCode,
  logout,
  startDemo,
  deleteMe,
  type SessionData,
} from "./api";
import { announceUserChange } from "./session-channel";
import type { User } from "./types";

const SESSION_QUERY_KEY = ["session"] as const;

function sessionUser(response: ApiResponse<SessionData>): User | null {
  return response.meta?.is_authenticated ? (response.data?.user ?? null) : null;
}

function isDifferentUser(
  previousUser: User | null | undefined,
  user: User | null,
) {
  return user?.id !== previousUser?.id;
}

function resetSession(queryClient: QueryClient, user: User | null) {
  const previousUser = queryClient.getQueryData<User | null>(SESSION_QUERY_KEY);
  const sessionHash = hashKey(SESSION_QUERY_KEY);
  const filters = {
    predicate: (query: Query) => query.queryHash !== sessionHash,
  };
  void queryClient.cancelQueries(filters);
  queryClient.removeQueries(filters);
  queryClient.getMutationCache().clear();
  if (isDifferentUser(previousUser, user)) {
    announceUserChange();
  }
  queryClient.setQueryData(SESSION_QUERY_KEY, user);
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
    onSuccess: (response) => resetSession(queryClient, sessionUser(response)),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: (response) => resetSession(queryClient, sessionUser(response)),
  });
}

async function startDemoSession() {
  await startDemo();
  return getSession();
}

export function useDeleteUserAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMe,
    onSuccess: () => resetSession(queryClient, null),
  });
}

export function useStartDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startDemoSession,
    onSuccess: (response) => resetSession(queryClient, sessionUser(response)),
  });
}
