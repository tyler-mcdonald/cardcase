import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { hasApiStatus } from "@/lib/api/errors";
import { createAccount, listAccounts, updateAccount } from "./api";
import type { Paginated } from "@/lib/api/types";
import type { Account, AccountUpdate } from "./types";

const ACCOUNTS_QUERY_KEY = ["accounts"] as const;
const ACCOUNT_LISTS_QUERY_KEY = [...ACCOUNTS_QUERY_KEY, "list"] as const;

type AccountsResult = {
  accounts: Account[];
  totalPages: number;
};

function toAccountsResult(
  response: Paginated<Account>,
  page: number,
): AccountsResult {
  const totalPages = response.next
    ? Math.ceil(response.count / response.results.length)
    : page;
  return { accounts: response.results, totalPages };
}

function replaceAccount(
  result: AccountsResult | undefined,
  updated: Account,
): AccountsResult | undefined {
  return (
    result && {
      ...result,
      accounts: result.accounts.map((account) =>
        account.id === updated.id ? updated : account,
      ),
    }
  );
}

export function isMissingPage(error: unknown): boolean {
  return hasApiStatus(error, 404);
}

export function accountsQuery(page: number) {
  return queryOptions({
    queryKey: [...ACCOUNT_LISTS_QUERY_KEY, page],
    queryFn: async () => toAccountsResult(await listAccounts(page), page),
    placeholderData: keepPreviousData,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAccount,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: AccountUpdate }) =>
      updateAccount(id, changes),
    onSuccess: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ACCOUNT_LISTS_QUERY_KEY });
      queryClient.setQueriesData<AccountsResult>(
        { queryKey: ACCOUNT_LISTS_QUERY_KEY },
        (result) => replaceAccount(result, updated),
      );
    },
    onError: (error) => {
      if (!hasApiStatus(error, 400)) {
        return queryClient.invalidateQueries({
          queryKey: ACCOUNT_LISTS_QUERY_KEY,
        });
      }
    },
  });
}
