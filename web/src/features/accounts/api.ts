import { request } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import type { Account, AccountInput, AccountUpdate } from "./types";

const ACCOUNTS_PATH = "/v1/accounts";

export function listAccounts(page: number) {
  return request<Paginated<Account>>("GET", `${ACCOUNTS_PATH}?page=${page}`);
}

export function createAccount(input: AccountInput) {
  return request<Account>("POST", ACCOUNTS_PATH, {
    body: JSON.stringify(input),
  });
}

export function updateAccount(id: string, input: AccountUpdate) {
  return request<Account>("PATCH", `${ACCOUNTS_PATH}/${id}`, {
    body: JSON.stringify(input),
  });
}
