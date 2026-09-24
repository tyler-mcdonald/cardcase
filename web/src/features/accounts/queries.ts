import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { listAccounts, type Account, type Paginated } from "./api";

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

export function accountsQuery(page: number) {
  return queryOptions({
    queryKey: ["accounts", page],
    queryFn: async () => toAccountsResult(await listAccounts(page), page),
    placeholderData: keepPreviousData,
  });
}
