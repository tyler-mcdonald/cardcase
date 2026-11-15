import { type ComboboxItem, Select, type SelectProps } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { hasAccount } from "./lookup";
import { allAccountsQuery } from "./queries";
import type { Account } from "./types";

function toOptions(accounts: Account[]): ComboboxItem[] {
  return accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));
}

// Before accounts arrive, an id can only be called unknown if they failed.
function isUnknownAccount(
  accounts: Account[] | undefined,
  isError: boolean,
  id: string,
): boolean {
  return accounts ? !hasAccount(accounts, id) : isError;
}

// The account options, plus a placeholder option for `unknownId` when it
// doesn't match any account.
function selectData(
  accounts: Account[] | undefined,
  isError: boolean,
  unknownId: string | null,
): ComboboxItem[] {
  const options = toOptions(accounts ?? []);
  return unknownId && isUnknownAccount(accounts, isError, unknownId)
    ? [...options, { value: unknownId, label: "Unknown account" }]
    : options;
}

type AccountSelectProps = Omit<SelectProps, "data"> & {
  showUnknownValue?: boolean;
};

export function AccountSelect({
  showUnknownValue = false,
  value,
  ...props
}: AccountSelectProps) {
  const { data: accounts, isError } = useQuery(allAccountsQuery());
  const data = selectData(
    accounts,
    isError,
    showUnknownValue ? (value ?? null) : null,
  );

  return <Select data={data} value={value} {...props} />;
}
