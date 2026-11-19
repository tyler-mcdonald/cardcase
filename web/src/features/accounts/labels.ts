import { describeBalance, describeExpiry } from "./format";
import type { Account, AccountLabel } from "./types";

const DESCRIPTION_MAX_LENGTH = 30;

export function accountLabelText({ name, detail }: AccountLabel): string {
  return detail ? `${name} (${detail})` : name;
}

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function accountDetail(account: Account): Omit<AccountLabel, "name"> {
  const description = collapseWhitespace(account.description);
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return {
      detail: `${description.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd()}…`,
      fullDescription: description,
    };
  }
  if (description) {
    return { detail: description };
  }
  if (account.expires_on) {
    return { detail: describeExpiry(account.expires_on).label };
  }
  return { detail: describeBalance(account.balance).label };
}

export function accountLabels(accounts: Account[]): Map<string, AccountLabel> {
  const nameCounts = new Map<string, number>();
  for (const account of accounts) {
    const key = nameKey(account.name);
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }
  return new Map(
    accounts.map((account) => {
      const sharesName = nameCounts.get(nameKey(account.name))! > 1;
      const label = sharesName
        ? { name: account.name, ...accountDetail(account) }
        : { name: account.name };
      return [account.id, label];
    }),
  );
}

export function accountLabeler(accounts: Account[] | undefined) {
  const labels = accounts && accountLabels(accounts);
  return (account: Pick<Account, "id" | "name">): AccountLabel =>
    labels?.get(account.id) ?? { name: account.name };
}
