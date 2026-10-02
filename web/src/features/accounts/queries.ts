import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { hasApiStatus } from "@/lib/api/errors";
import { toPage } from "@/lib/api/pagination";
import {
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
} from "./api";
import type { AccountUpdate } from "./types";

const ACCOUNTS_QUERY_KEY = ["accounts"] as const;

function invalidateAccounts(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
}

export function accountsQuery(page: number) {
  return queryOptions({
    queryKey: [...ACCOUNTS_QUERY_KEY, page],
    queryFn: async () => toPage(await listAccounts(page), page),
    placeholderData: keepPreviousData,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => invalidateAccounts(queryClient),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: AccountUpdate }) =>
      updateAccount(id, changes),
    onSettled: () => invalidateAccounts(queryClient),
  });
}

function isAlreadyDeleted(error: unknown): boolean {
  if (!hasApiStatus(error, 404)) {
    return false;
  }
  const body = error.body as { detail?: unknown } | null;
  return typeof body?.detail === "string";
}

async function deleteAccountIfPresent(id: string) {
  try {
    await deleteAccount(id);
  } catch (error) {
    if (!isAlreadyDeleted(error)) {
      throw error;
    }
  }
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAccountIfPresent,
    onSettled: () => {
      void invalidateAccounts(queryClient);
    },
  });
}
