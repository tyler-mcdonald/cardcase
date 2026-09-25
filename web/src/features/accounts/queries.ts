import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
import { createAccount, listAccounts } from "./api";
import type { Paginated } from "@/lib/api/types";
import type { Account } from "./types";

const ACCOUNTS_QUERY_KEY = ["accounts"] as const;

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

export function useCreateAccount({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAccount,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      onSuccess();
    },
  });
}
