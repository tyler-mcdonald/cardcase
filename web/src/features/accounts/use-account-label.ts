import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { accountLabels } from "./labels";
import { allAccountsQuery } from "./queries";
import type { Account } from "./types";

export function useAccountLabel() {
  const { data: labels } = useQuery({
    ...allAccountsQuery(),
    select: accountLabels,
  });

  return useCallback(
    (account: Pick<Account, "id" | "name">) =>
      labels?.get(account.id) ?? account.name,
    [labels],
  );
}
