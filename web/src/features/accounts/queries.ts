import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { ignoreAlreadyDeleted } from "@/lib/api/errors";
import { toPage } from "@/lib/api/pagination";
import {
  createAccount,
  deleteAccount,
  listAccounts,
  listAllAccounts,
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

export function allAccountsQuery() {
  return queryOptions({
    queryKey: [...ACCOUNTS_QUERY_KEY, "all"],
    queryFn: async () => (await listAllAccounts()).results,
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

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ignoreAlreadyDeleted(deleteAccount(id)),
    onSettled: () => {
      void invalidateAccounts(queryClient);
    },
  });
}
