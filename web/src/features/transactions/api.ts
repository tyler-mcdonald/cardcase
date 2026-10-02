import { request } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import type { Transaction } from "./types";

const TRANSACTIONS_PATH = "/v1/transactions";

export function listTransactions(page: number) {
  return request<Paginated<Transaction>>(
    "GET",
    `${TRANSACTIONS_PATH}?page=${page}`,
  );
}
