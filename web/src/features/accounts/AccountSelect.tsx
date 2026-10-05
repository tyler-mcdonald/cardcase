import { Select, type SelectProps } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { allAccountsQuery } from "./queries";
import type { Account } from "./types";

function toOptions(accounts: Account[]) {
  return accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));
}

export function AccountSelect(props: Omit<SelectProps, "data">) {
  const { data: options = [] } = useQuery({
    ...allAccountsQuery(),
    select: toOptions,
  });

  return <Select data={options} {...props} />;
}
