import { Select, type SelectProps } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { allAccountsQuery } from "./queries";
import type { Account } from "./types";

type AccountOption = { value: string; label: string };

function toOptions(accounts: Account[]): AccountOption[] {
  return accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));
}

function withUnknownValue(
  options: AccountOption[],
  value: string | null | undefined,
): AccountOption[] {
  if (!value || options.some((option) => option.value === value)) {
    return options;
  }
  return [...options, { value, label: "Unknown account" }];
}

export function AccountSelect({
  showUnknownValue = false,
  ...props
}: Omit<SelectProps, "data"> & { showUnknownValue?: boolean }) {
  const { data: options } = useQuery({
    ...allAccountsQuery(),
    select: toOptions,
  });
  const data =
    showUnknownValue && options !== undefined
      ? withUnknownValue(options, props.value)
      : (options ?? []);

  return <Select data={data} {...props} />;
}
