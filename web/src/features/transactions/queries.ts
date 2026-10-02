import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toPage } from "@/lib/api/pagination";
import { createTransaction, listTransactions } from "./api";
import type { TransactionInput } from "./types";

const TRANSACTIONS_QUERY_KEY = ["transactions"] as const;

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
