import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { toPage } from "@/lib/api/pagination";
import { listTransactions } from "./api";

const TRANSACTIONS_QUERY_KEY = ["transactions"] as const;

export function transactionsQuery(page: number) {
  return queryOptions({
    queryKey: [...TRANSACTIONS_QUERY_KEY, page],
    queryFn: async () => toPage(await listTransactions(page), page),
    placeholderData: keepPreviousData,
  });
}
