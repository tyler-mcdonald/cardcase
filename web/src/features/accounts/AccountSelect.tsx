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

type AccountSelectProps = Omit<SelectProps, "data"> & {
  showUnknownValue?: boolean;
};

export function AccountSelect({
  showUnknownValue = false,
  value,
  ...props
}: AccountSelectProps) {
  const { data: accounts, isError } = useQuery(allAccountsQuery());
  const options = toOptions(accounts ?? []);
  // Before accounts arrive, the value can only be called unknown if they failed.
  const isUnknown = (id: string) =>
    accounts ? !hasAccount(accounts, id) : isError;
  const data =
    showUnknownValue && value && isUnknown(value)
      ? [...options, { value, label: "Unknown account" }]
      : options;

  return <Select data={data} value={value} {...props} />;
}
