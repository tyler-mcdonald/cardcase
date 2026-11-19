import { Select, type SelectProps } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { AccountName } from "./AccountName";
import { accountLabels, accountLabelText } from "./labels";
import { allAccountsQuery } from "./queries";

export function AccountSelect(props: Omit<SelectProps, "data">) {
  const { data: labels = new Map() } = useQuery({
    ...allAccountsQuery(),
    select: accountLabels,
  });
  const options = Array.from(labels, ([value, label]) => ({
    value,
    label: accountLabelText(label),
  }));

  return (
    <Select
      data={options}
      renderOption={({ option }) => (
        <AccountName label={labels.get(option.value)!} inherit />
      )}
      {...props}
    />
  );
}
