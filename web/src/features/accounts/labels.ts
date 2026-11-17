import type { Account } from "./types";

export function accountLabels(accounts: Account[]): Map<string, string> {
  return new Map(accounts.map((account) => [account.id, account.name]));
}
