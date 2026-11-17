import type { Account } from "./types";

export function accountLabels(accounts: Account[]): Map<string, string> {
  return new Map(accounts.map((account) => [account.id, account.name]));
}

export function accountLabeler(accounts: Account[] | undefined) {
  const labels = accounts && accountLabels(accounts);
  return (account: Pick<Account, "id" | "name">) =>
    labels?.get(account.id) ?? account.name;
}
