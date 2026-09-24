import { request } from "@/lib/api/client";
import type { Account, Paginated } from "./types";

const ACCOUNTS_PATH = "/v1/accounts";

export function listAccounts(page: number) {
  const query = new URLSearchParams({ page: String(page) });
  return request<Paginated<Account>>("GET", `${ACCOUNTS_PATH}?${query}`);
}
