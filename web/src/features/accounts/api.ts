import { request } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import type { Account } from "./types";

const ACCOUNTS_PATH = "/v1/accounts";

export function listAccounts(page: number) {
  return request<Paginated<Account>>("GET", `${ACCOUNTS_PATH}?page=${page}`);
}
