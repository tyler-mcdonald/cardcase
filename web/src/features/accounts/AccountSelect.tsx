import { type ComboboxItem, Select, type SelectProps } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { allAccountsQuery } from "./queries";
import type { Account } from "./types";

function toOptions(accounts: Account[]): ComboboxItem[] {
  return accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));
}

type AccountSelectProps = Omit<SelectProps, "data">;

export function AccountSelect(props: AccountSelectProps) {
  const { data: accounts } = useQuery(allAccountsQuery());

  return <Select data={toOptions(accounts ?? [])} {...props} />;
}
