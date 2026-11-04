import { request } from "@/lib/api/client";
import { v1 } from "@/lib/api/endpoints";
import type { Paginated } from "@/lib/api/types";
import type { Transaction, TransactionInput, TransactionUpdate } from "./types";

const transactions = v1.path("transactions");
const accountTransactions = (accountId: string) =>
  v1.path("accounts", accountId, "transactions");

export function listTransactions(page: number) {
  return request<Paginated<Transaction>>("GET", transactions({ page }));
}

export function createTransaction(accountId: string, input: TransactionInput) {
  return request<Transaction>("POST", accountTransactions(accountId)(), {
    body: JSON.stringify(input),
  });
}

export function updateTransaction(
  accountId: string,
  id: string,
  changes: TransactionUpdate,
) {
  return request<Transaction>(
    "PATCH",
    accountTransactions(accountId).path(id)(),
    { body: JSON.stringify(changes) },
  );
}

export function deleteTransaction(accountId: string, id: string) {
  return request<void>("DELETE", accountTransactions(accountId).path(id)());
}
