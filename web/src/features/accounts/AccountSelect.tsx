import { Select, type SelectProps } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { accountLabels } from "./labels";
import { allAccountsQuery } from "./queries";
import type { Account } from "./types";

function toOptions(accounts: Account[]) {
  return Array.from(accountLabels(accounts), ([value, label]) => ({
    value,
    label,
  }));
}

export function AccountSelect(props: Omit<SelectProps, "data">) {
  const { data: options = [] } = useQuery({
    ...allAccountsQuery(),
    select: toOptions,
  });

  return <Select data={options} {...props} />;
}
