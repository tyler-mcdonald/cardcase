import { useDebouncedValue } from "@mantine/hooks";
import {
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useState } from "react";
import { searchBrands } from "./api";
import { hasBrandfetchClientId } from "./brandfetch-url";
import type { Brand } from "./types";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_CACHE_MS = 5 * 60 * 1000;

function brandSearchQuery(term: string) {
  return queryOptions({
    queryKey: ["brands", "search", term],
    queryFn: ({ signal }) => searchBrands(term, signal),
    enabled: term !== "" && hasBrandfetchClientId(),
    staleTime: SEARCH_CACHE_MS,
    gcTime: SEARCH_CACHE_MS,
    placeholderData: (previousData, previousQuery) =>
      oneTermExtendsTheOther(String(previousQuery?.queryKey[2] ?? ""), term)
        ? previousData
        : undefined,
  });
}

export function useBrandSearch(
  query: string,
): Pick<UseQueryResult<Brand[]>, "data" | "isFetching"> {
  const term = query.trim();
  const [debouncedTerm] = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);
  const { data, isFetching, isPlaceholderData } = useQuery(
    brandSearchQuery(debouncedTerm),
  );

  const hasFreshResults =
    term !== "" &&
    debouncedTerm === term &&
    data !== undefined &&
    !isPlaceholderData;
  const hidden =
    useHiddenSinceCleared(term === "", hasFreshResults) ||
    !oneTermExtendsTheOther(debouncedTerm, term);
  return { data: hidden ? undefined : data, isFetching };
}

// Once the input is cleared, keep results hidden until a new search returns
// fresh ones, so the previous search's results don't flash back.
function useHiddenSinceCleared(isCleared: boolean, hasFreshResults: boolean) {
  const [cleared, setCleared] = useState(false);
  if (isCleared && !cleared) {
    setCleared(true);
  }
  if (cleared && hasFreshResults) {
    setCleared(false);
  }
  return cleared && !hasFreshResults;
}

function oneTermExtendsTheOther(firstTerm: string, secondTerm: string) {
  const first = firstTerm.toLowerCase();
  const second = secondTerm.toLowerCase();
  return (
    first !== "" &&
    second !== "" &&
    (second.startsWith(first) || first.startsWith(second))
  );
}
