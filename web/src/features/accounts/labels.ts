import { describeBalance, describeExpiry } from "./format";
import type { Account, AccountLabel } from "./types";

const DESCRIPTION_MAX_LENGTH = 30;

export function accountLabelText({ name, detail }: AccountLabel): string {
  return detail ? `${name} (${detail})` : name;
}

type Detail = Omit<AccountLabel, "name">;

type DetailField = {
  value: (account: Account) => string;
  detail: (value: string) => Detail;
};

const DETAIL_FIELDS: DetailField[] = [
  {
    value: (account) => account.description.replace(/\s+/g, " ").trim(),
    detail: (description) =>
      description.length > DESCRIPTION_MAX_LENGTH
        ? {
            detail: `${description.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd()}…`,
            fullDescription: description,
          }
        : { detail: description },
  },
  {
    value: (account) => account.expires_on ?? "",
    detail: (expiresOn) => ({ detail: describeExpiry(expiresOn).label }),
  },
];

const BALANCE_FIELD: DetailField = {
  value: (account) => account.balance,
  detail: (balance) => ({ detail: describeBalance(balance).label }),
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
    const key = account.name.trim().toLowerCase();
    const group = groups.get(key);
    if (group) {
      group.push(account);
    } else {
      groups.set(key, [account]);
    }
  }
  const labels = new Map<string, AccountLabel>();
  for (const twins of groups.values()) {
    if (twins.length === 1) {
      labels.set(twins[0].id, { name: twins[0].name });
      continue;
    }
    const field = distinguishingField(twins);
    for (const account of twins) {
      labels.set(account.id, {
        name: account.name,
        ...fieldDetail(field, account),
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
