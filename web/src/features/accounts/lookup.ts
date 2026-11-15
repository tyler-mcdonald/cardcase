import type { Account } from "./types";

export function hasAccount(accounts: Account[], id: string): boolean {
  return accounts.some((account) => account.id === id);
}
