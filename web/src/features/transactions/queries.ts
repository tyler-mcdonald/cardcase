import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { totalPages } from "@/lib/api/pagination";
import type { Paginated } from "@/lib/api/types";
import { listTransactions } from "./api";
import type { Transaction } from "./types";

const TRANSACTIONS_QUERY_KEY = ["transactions"] as const;

type TransactionsResult = {
  transactions: Transaction[];
  totalPages: number;
};

function toTransactionsResult(
  response: Paginated<Transaction>,
  page: number,
): TransactionsResult {
  return {
    transactions: response.results,
    totalPages: totalPages(response, page),
  };
}

export function transactionsQuery(page: number) {
  return queryOptions({
    queryKey: [...TRANSACTIONS_QUERY_KEY, page],
    queryFn: async () =>
      toTransactionsResult(await listTransactions(page), page),
    placeholderData: keepPreviousData,
  });
}
