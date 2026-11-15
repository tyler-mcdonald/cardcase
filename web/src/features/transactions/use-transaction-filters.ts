import { useCallback } from "react";
import { type NavigateOptions, useSearchParams } from "react-router-dom";
import { paramsForPage } from "@/lib/hooks/use-page-param";
import type { TransactionFilters } from "./types";

const FILTER_PARAMS = [
  "account",
] as const satisfies readonly (keyof TransactionFilters)[];

function filtersFrom(params: URLSearchParams): TransactionFilters {
  const filters: TransactionFilters = {};
  for (const key of FILTER_PARAMS) {
    const value = params.get(key);
    if (value) {
      filters[key] = value;
    }
  }
  return filters;
}

function paramsForFilters(
  params: URLSearchParams,
  filters: TransactionFilters,
): URLSearchParams {
  const next = paramsForPage(params, 1);
  for (const key of FILTER_PARAMS) {
    const value = filters[key];
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  }
  return next;
}

export function useTransactionFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = filtersFrom(searchParams);

  const setFilters = useCallback(
    (changes: TransactionFilters, options?: NavigateOptions) => {
      setSearchParams(
        (current) =>
          paramsForFilters(current, { ...filtersFrom(current), ...changes }),
        options,
      );
    },
    [setSearchParams],
  );

  return { filters, setFilters };
}
