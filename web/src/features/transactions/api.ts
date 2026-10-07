import { request } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import type { Transaction, TransactionInput, TransactionUpdate } from "./types";

const TRANSACTIONS_PATH = "/v1/transactions";

export function listTransactions(page: number) {
  return request<Paginated<Transaction>>(
    "GET",
    `${TRANSACTIONS_PATH}?page=${page}`,
  );
}

export function createTransaction(accountId: string, input: TransactionInput) {
  return request<Transaction>(
    "POST",
    `/v1/accounts/${accountId}/transactions`,
    { body: JSON.stringify(input) },
  );
}

export function updateTransaction(
  accountId: string,
  id: string,
  changes: TransactionUpdate,
) {
  return request<Transaction>(
    "PATCH",
    `/v1/accounts/${accountId}/transactions/${id}`,
    { body: JSON.stringify(changes) },
  );
}
