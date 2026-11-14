import { useLayoutEffect } from "react";
import {
  type QueryKey,
  type UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import { isPastLastPage } from "@/lib/api/pagination";
import { usePageParam } from "@/lib/hooks/use-page-param";

export function usePaginatedQuery<
  TQueryFnData,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryForPage: (
    page: number,
  ) => UseQueryOptions<TQueryFnData, Error, TData, TQueryKey>,
) {
  const { page, replaceWithFirstPage } = usePageParam();
  const query = useQuery(queryForPage(page));
  const pastLastPage = isPastLastPage(page, query.error);

  // A layout effect so the redirect lands before the error is painted.
  useLayoutEffect(() => {
    if (pastLastPage) {
      replaceWithFirstPage();
    }
  }, [pastLastPage, replaceWithFirstPage]);

  return query;
}
