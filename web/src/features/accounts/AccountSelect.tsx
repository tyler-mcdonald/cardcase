import { CheckIcon, Group, Select, type SelectProps } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { AccountDisplayName } from "./AccountDisplayName";
import { accountLabels, accountLabelText } from "./labels";
import { allAccountsQuery } from "./queries";
import type { Account } from "./types";

function toOptions(accounts: Account[]) {
  return Array.from(accountLabels(accounts), ([value, label]) => ({
    value,
    label: accountLabelText(label),
  }));
}

export function AccountSelect(props: Omit<SelectProps, "data">) {
  const { data: options = [] } = useQuery({
    ...allAccountsQuery(),
    select: toOptions,
  });

  return (
    <Select
      data={options}
      renderOption={({ option, checked }) => (
        <Group gap="xs" wrap="nowrap" miw={0}>
          {checked && <CheckIcon size={12} />}
          <AccountDisplayName
            account={{ id: option.value, name: option.label }}
            inherit
          />
        </Group>
      )}
      {...props}
    />
  );
}
