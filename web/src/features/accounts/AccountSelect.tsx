import { Select, type SelectProps } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { hasAccount } from "./format";
import { allAccountsQuery } from "./queries";
import type { Account } from "./types";

type AccountOption = { value: string; label: string };

function toOptions(accounts: Account[]): AccountOption[] {
  return accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));
}

export function AccountSelect({
  showUnknownValue = false,
  value,
  ...props
}: Omit<SelectProps, "data"> & { showUnknownValue?: boolean }) {
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
