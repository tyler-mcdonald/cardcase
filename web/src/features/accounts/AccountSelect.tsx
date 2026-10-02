import { Select, type SelectProps } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { allAccountsQuery } from "./queries";

export function AccountSelect(props: Omit<SelectProps, "data">) {
  const { data: accounts = [] } = useQuery(allAccountsQuery());
  const options = accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));

  return (
    <Select searchable selectFirstOptionOnChange data={options} {...props} />
  );
}
