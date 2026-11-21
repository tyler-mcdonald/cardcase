import { Text, type TextProps } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { accountLabels } from "./labels";
import { allAccountsQuery } from "./queries";
import type { Account } from "./types";

function AccountDetail({ detail }: { detail: string }) {
  return (
    <Text span inherit c="dimmed">
      ({detail})
    </Text>
  );
}

export function AccountDisplayName({
  account,
  ...props
}: { account: Pick<Account, "id" | "name"> } & TextProps) {
  // Reads whatever accounts are cached rather than refetching for every
  // mounted name; the list is still fetched if nothing has loaded it yet.
  const { data: labels } = useQuery({
    ...allAccountsQuery(),
    select: accountLabels,
    refetchOnMount: false,
  });
  const label = labels?.get(account.id) ?? { name: account.name };
  return (
    <Text truncate miw={0} title={label.fullDescription} {...props}>
      {label.name}
      {label.detail && (
        <>
          {" "}
          <AccountDetail detail={label.detail} />
        </>
      )}
    </Text>
  );
}
