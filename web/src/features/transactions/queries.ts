import {
  keepPreviousData,
  queryOptions,
  useIsMutating,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { ignoreNotFound } from "@/lib/api/errors";
import { toPage } from "@/lib/api/pagination";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from "./api";
import type { TransactionInput, TransactionUpdate } from "./types";

const TRANSACTIONS_QUERY_KEY = ["transactions"] as const;
const ACCOUNTS_QUERY_KEY = ["accounts"] as const;
const CREATE_TRANSACTION_MUTATION_KEY = [
  ...TRANSACTIONS_QUERY_KEY,
  "create",
] as const;
const UPDATE_TRANSACTION_MUTATION_KEY = [
  ...TRANSACTIONS_QUERY_KEY,
  "update",
] as const;
const DELETE_TRANSACTION_MUTATION_KEY = [
  ...TRANSACTIONS_QUERY_KEY,
  "delete",
] as const;

function invalidateTransactionsAndAccounts(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  ]);
}

export function transactionsQuery(page: number) {
  return queryOptions({
    queryKey: [...TRANSACTIONS_QUERY_KEY, page],
    queryFn: async () => toPage(await listTransactions(page), page),
    placeholderData: keepPreviousData,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: CREATE_TRANSACTION_MUTATION_KEY,
    mutationFn: ({
      accountId,
      input,
    }: {
      accountId: string;
      input: TransactionInput;
    }) => createTransaction(accountId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY }),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: UPDATE_TRANSACTION_MUTATION_KEY,
    mutationFn: ({
      accountId,
      id,
      changes,
    }: {
      accountId: string;
      id: string;
      changes: TransactionUpdate;
    }) => updateTransaction(accountId, id, changes),
    onSuccess: () => invalidateTransactionsAndAccounts(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: DELETE_TRANSACTION_MUTATION_KEY,
    mutationFn: ({ accountId, id }: { accountId: string; id: string }) =>
      ignoreNotFound(deleteTransaction(accountId, id)),
    onSuccess: () => invalidateTransactionsAndAccounts(queryClient),
  });
}

export function useIsSavingTransaction() {
  return useIsMutating({ mutationKey: TRANSACTIONS_QUERY_KEY }) > 0;
}
