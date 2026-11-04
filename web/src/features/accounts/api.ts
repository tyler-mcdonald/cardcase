import { request } from "@/lib/api/client";
import { v1 } from "@/lib/api/endpoints";
import type { Paginated } from "@/lib/api/types";
import type { Account, AccountCreateInput, AccountUpdate } from "./types";

const accounts = v1.path("accounts");
const MAX_ACCOUNTS = 250;

export function listAccounts(page: number) {
  return request<Paginated<Account>>("GET", accounts({ page }));
}

export function listAllAccounts() {
  return request<Paginated<Account>>(
    "GET",
    accounts({ page_size: MAX_ACCOUNTS }),
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
