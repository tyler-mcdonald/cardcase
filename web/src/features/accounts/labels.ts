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

function normalizedDescription(account: Account): string {
  return account.description.replace(/\s+/g, " ").trim();
}

function descriptionDetail(description: string): Detail {
  if (description.length <= DESCRIPTION_MAX_LENGTH) {
    return { detail: description };
  }
  const truncated = description.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd();
  return { detail: `${truncated}…`, fullDescription: description };
}

const descriptionField: DetailField = {
  value: normalizedDescription,
  detail: descriptionDetail,
};

const expiryField: DetailField = {
  value: (account) => account.expires_on ?? "",
  detail: (expiresOn) => ({ detail: describeExpiry(expiresOn).label }),
};

const balanceField: DetailField = {
  value: (account) => account.balance,
  detail: (balance) => ({ detail: describeBalance(balance).label }),
};

const DETAIL_FIELDS = [descriptionField, expiryField, balanceField];

function distinguishingField(twins: Account[]): DetailField | undefined {
  return DETAIL_FIELDS.find(
    (field) => new Set(twins.map(field.value)).size > 1,
  );
}

function fieldDetail(field: DetailField | undefined, account: Account): Detail {
  const value = field?.value(account);
  return field && value ? field.detail(value) : {};
}

function groupBySameName(accounts: Account[]): Account[][] {
  const groups = new Map<string, Account[]>();
  for (const account of accounts) {
    const key = account.name.trim().toLowerCase();
    const group = groups.get(key) ?? [];
    group.push(account);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function labelGroup(twins: Account[]): [string, AccountLabel][] {
  const field = distinguishingField(twins);
  return twins.map((account) => [
    account.id,
    { name: account.name, ...fieldDetail(field, account) },
  ]);
}

export function accountLabels(accounts: Account[]): Map<string, AccountLabel> {
  return new Map(groupBySameName(accounts).flatMap(labelGroup));
}

export function accountLabeler(accounts: Account[] | undefined) {
  const labels = accounts && accountLabels(accounts);
  return (account: Pick<Account, "id" | "name">): AccountLabel =>
    labels?.get(account.id) ?? { name: account.name };
}
