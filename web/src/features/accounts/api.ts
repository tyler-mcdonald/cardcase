import { request } from "@/lib/api/client";
import { accounts } from "@/lib/api/endpoints";
import type { Paginated } from "@/lib/api/types";
import type { Account, AccountCreateInput, AccountUpdate } from "./types";

const MAX_ACCOUNTS = 250;

export function listAccounts(page: number, signal?: AbortSignal) {
  return request<Paginated<Account>>("GET", accounts({ page }), { signal });
}

export function listAllAccounts(signal?: AbortSignal) {
  return request<Paginated<Account>>(
    "GET",
    accounts({ page_size: MAX_ACCOUNTS }),
    { signal },
  );
}

export function createAccount(input: AccountCreateInput) {
  return request<Account>("POST", accounts(), {
    body: JSON.stringify(input),
  });
}

export function updateAccount(id: string, input: AccountUpdate) {
  return request<Account>("PATCH", accounts.path(id)(), {
    body: JSON.stringify(input),
  });
}

export function deleteAccount(id: string) {
  return request<void>("DELETE", accounts.path(id)());
}
