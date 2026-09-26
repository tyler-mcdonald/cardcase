import {
  keepPreviousData,
  queryOptions,
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
import { createAccount, listAccounts, updateAccount } from "./api";
import type { Paginated } from "@/lib/api/types";
import type { Account, AccountInput } from "./types";

const ACCOUNTS_QUERY_KEY = ["accounts"] as const;
const CREATE_ACCOUNT_MUTATION_KEY = [...ACCOUNTS_QUERY_KEY, "create"] as const;
const UPDATE_ACCOUNT_MUTATION_KEY = [...ACCOUNTS_QUERY_KEY, "update"] as const;

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
  return useIsMutating({ mutationKey: CREATE_ACCOUNT_MUTATION_KEY }) > 0;
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: UPDATE_ACCOUNT_MUTATION_KEY,
    mutationFn: ({ id, input }: { id: string; input: AccountInput }) =>
      updateAccount(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

export function useIsUpdatingAccount() {
  return useIsMutating({ mutationKey: UPDATE_ACCOUNT_MUTATION_KEY }) > 0;
}
