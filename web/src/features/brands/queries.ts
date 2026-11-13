import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { searchBrands } from "./api";
import { hasBrandfetchClientId } from "./brandfetch-url";

export type { Brand } from "./api";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_CACHE_MS = 5 * 60 * 1000;

export function useBrandSearch(query: string) {
  const term = query.trim();
  const [debouncedTerm] = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);
  const [cleared, setCleared] = useState(false);
  if (term === "" && !cleared) {
    setCleared(true);
  }

  const { data, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["brands", "search", debouncedTerm],
    queryFn: ({ signal }) => searchBrands(debouncedTerm, signal),
    enabled: debouncedTerm !== "" && hasBrandfetchClientId(),
    staleTime: SEARCH_CACHE_MS,
    gcTime: SEARCH_CACHE_MS,
    placeholderData: (previousData, previousQuery) =>
      isRefinement(String(previousQuery?.queryKey[2] ?? ""), debouncedTerm)
        ? previousData
        : undefined,
  });

  const freshResults =
    term !== "" &&
    debouncedTerm === term &&
    data !== undefined &&
    !isPlaceholderData;
  if (cleared && freshResults) {
    setCleared(false);
  }

  const hidden =
    (cleared && !freshResults) || !isRefinement(debouncedTerm, term);
  return { data: hidden ? undefined : data, isFetching };
}

function isRefinement(previousTerm: string, term: string) {
  const previous = previousTerm.toLowerCase();
  const current = term.toLowerCase();
  return (
    previous !== "" &&
    current !== "" &&
    (current.startsWith(previous) || previous.startsWith(current))
  );
}
