import {
  keepPreviousData,
  queryOptions,
  useIsMutating,
  useMutation,
  useQueryClient,
  type MutationKey,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
import { createAccount, listAccounts, updateAccount } from "./api";
import type { Paginated } from "@/lib/api/types";
import type { Account, AccountUpdate } from "./types";

const ACCOUNTS_QUERY_KEY = ["accounts"] as const;
const CREATE_ACCOUNT_MUTATION_KEY = [...ACCOUNTS_QUERY_KEY, "create"] as const;

function updateAccountMutationKey(id: string | undefined) {
  return [...ACCOUNTS_QUERY_KEY, "update", id] as const;
}

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

function useIsMutatingKey(mutationKey: MutationKey) {
  return useIsMutating({ mutationKey }) > 0;
}

export function isMissingPage(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function accountsQuery(page: number) {
  return queryOptions({
    queryKey: [...ACCOUNTS_QUERY_KEY, page],
    queryFn: async () => toAccountsResult(await listAccounts(page), page),
    placeholderData: keepPreviousData,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: CREATE_ACCOUNT_MUTATION_KEY,
    mutationFn: createAccount,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

export function useIsCreatingAccount() {
  return useIsMutatingKey(CREATE_ACCOUNT_MUTATION_KEY);
}

export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: updateAccountMutationKey(id),
    mutationFn: (input: AccountUpdate) => updateAccount(id, input),
    onSuccess: (updated) =>
      queryClient.setQueriesData<AccountsResult>(
        { queryKey: ACCOUNTS_QUERY_KEY },
        (result) => replaceAccount(result, updated),
      ),
  });
}

export function useIsUpdatingAccount(id: string | undefined) {
  return useIsMutatingKey(updateAccountMutationKey(id));
}
