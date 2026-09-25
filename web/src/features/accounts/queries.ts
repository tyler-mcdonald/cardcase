import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
import { listAccounts } from "./api";
import type { Paginated } from "@/lib/api/types";
import type { Account } from "./types";

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
    queryKey: ["accounts", page],
    queryFn: async () => toAccountsResult(await listAccounts(page), page),
    placeholderData: keepPreviousData,
  });
}
