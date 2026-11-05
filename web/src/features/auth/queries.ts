import {
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
  type SessionData,
} from "./api";
import { announceUserChange } from "./session-channel";
import type { User } from "./types";

const SESSION_QUERY_KEY = ["session"] as const;

function sessionUser(response: ApiResponse<SessionData>): User | null {
  return response.meta?.is_authenticated ? (response.data?.user ?? null) : null;
}

function isUserDataQuery(query: Query) {
  return query.queryKey[0] !== SESSION_QUERY_KEY[0];
}

// Every query other than the session holds data for the signed-in user.
function dropUserData(queryClient: QueryClient) {
  const filters = { predicate: isUserDataQuery };
  void queryClient.cancelQueries(filters);
  queryClient.removeQueries(filters);
}

function applySession(
  queryClient: QueryClient,
  response: ApiResponse<SessionData>,
) {
  const user = sessionUser(response);
  const previousUser = queryClient.getQueryData<User | null>(SESSION_QUERY_KEY);
  if (user?.id !== previousUser?.id) {
    // Drop the previous user's data before exposing the new session, rather
    // than show it until a refetch lands.
    dropUserData(queryClient);
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

async function startDemoSession() {
  await startDemo();
  return getSession();
}

export function useStartDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startDemoSession,
    onSuccess: (response) => applySession(queryClient, response),
  });
}
