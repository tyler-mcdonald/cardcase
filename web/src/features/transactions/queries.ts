import {
  keepPreviousData,
  queryOptions,
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toPage } from "@/lib/api/pagination";
import { createTransaction, listTransactions, updateTransaction } from "./api";
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
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
      ]),
  });
}

export function useIsSavingTransaction() {
  return useIsMutating({ mutationKey: TRANSACTIONS_QUERY_KEY }) > 0;
}
