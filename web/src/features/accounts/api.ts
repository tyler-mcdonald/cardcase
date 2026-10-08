import { request } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import type { Account, AccountCreateInput, AccountUpdate } from "./types";

const ACCOUNTS_PATH = "/v1/accounts";
const MAX_ACCOUNTS = 250;

export function listAccounts(page: number) {
  return request<Paginated<Account>>("GET", `${ACCOUNTS_PATH}?page=${page}`);
}

export function listAllAccounts() {
  return request<Paginated<Account>>(
    "GET",
    `${ACCOUNTS_PATH}?page_size=${MAX_ACCOUNTS}`,
  );
}

export function createAccount(input: AccountCreateInput) {
  return request<Account>("POST", ACCOUNTS_PATH, {
    body: JSON.stringify(input),
  });
}

export function updateAccount(id: string, input: AccountUpdate) {
  return request<Account>("PATCH", `${ACCOUNTS_PATH}/${id}`, {
    body: JSON.stringify(input),
  });
}

export function deleteAccount(id: string) {
  return request<void>("DELETE", `${ACCOUNTS_PATH}/${id}`);
}
