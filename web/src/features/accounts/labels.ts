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

type Detail = Omit<AccountLabel, "name">;

type DetailField = {
  value: (account: Account) => string;
  detail: (value: string) => Detail;
  missing: string;
};

const DETAIL_FIELDS: DetailField[] = [
  {
    value: (account) => collapseWhitespace(account.description),
    detail: (description) =>
      description.length > DESCRIPTION_MAX_LENGTH
        ? {
            detail: `${description.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd()}…`,
            fullDescription: description,
          }
        : { detail: description },
    missing: "no description",
  },
  {
    value: (account) => account.expires_on ?? "",
    detail: (expiresOn) => ({ detail: describeExpiry(expiresOn).label }),
    missing: "no expiry",
  },
];

const BALANCE_FIELD: DetailField = {
  value: (account) => account.balance,
  detail: (balance) => ({ detail: describeBalance(balance).label }),
  missing: "",
};

function distinguishingField(twins: Account[]): DetailField {
  return (
    DETAIL_FIELDS.find((field) => new Set(twins.map(field.value)).size > 1) ??
    BALANCE_FIELD
  );
}

function fieldDetail(field: DetailField, account: Account): Detail {
  const value = field.value(account);
  return value ? field.detail(value) : {};
}

export function accountLabels(accounts: Account[]): Map<string, AccountLabel> {
  const groups = new Map<string, Account[]>();
  for (const account of accounts) {
    const key = nameKey(account.name);
    groups.set(key, [...(groups.get(key) ?? []), account]);
  }
  const labels = new Map<string, AccountLabel>();
  for (const twins of groups.values()) {
    const field = twins.length > 1 ? distinguishingField(twins) : undefined;
    for (const account of twins) {
      labels.set(account.id, {
        name: account.name,
        ...(field && fieldDetail(field, account)),
      });
    }
  }
  return labels;
}

export function accountLabeler(accounts: Account[] | undefined) {
  const labels = accounts && accountLabels(accounts);
  return (account: Pick<Account, "id" | "name">): AccountLabel =>
    labels?.get(account.id) ?? { name: account.name };
}
