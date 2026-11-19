import { CheckIcon, Group, Select, type SelectProps } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { AccountName } from "./AccountName";
import { accountLabels, accountLabelText } from "./labels";
import { allAccountsQuery } from "./queries";
import type { Account, AccountLabel } from "./types";

const NO_ACCOUNTS = {
  labels: new Map<string, AccountLabel>(),
  options: [],
};

function toOptions(accounts: Account[]) {
  const labels = accountLabels(accounts);
  const options = Array.from(labels, ([value, label]) => ({
    value,
    label: accountLabelText(label),
  }));
  return { labels, options };
}

export function AccountSelect(props: Omit<SelectProps, "data">) {
  const { data: { labels, options } = NO_ACCOUNTS } = useQuery({
    ...allAccountsQuery(),
    select: toOptions,
  });

  return (
    <Select
      data={options}
      renderOption={({ option, checked }) => (
        <Group gap="xs" wrap="nowrap" miw={0}>
          {checked && <CheckIcon size={12} />}
          <AccountName
            label={labels.get(option.value) ?? { name: option.label }}
            inherit
          />
        </Group>
      )}
      {...props}
    />
  );
}
