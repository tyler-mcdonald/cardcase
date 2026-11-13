import { useDebouncedValue } from "@mantine/hooks";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { hasBrandfetchClientId, searchBrands } from "./api";

export { brandLogoUrl } from "./api";
export type { Brand } from "./api";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_CACHE_MS = 5 * 60 * 1000;

export function useBrandSearch(query: string) {
  const [debouncedQuery] = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  return useQuery({
    queryKey: ["brands", "search", debouncedQuery],
    queryFn: ({ signal }) => searchBrands(debouncedQuery, signal),
    enabled: debouncedQuery !== "" && hasBrandfetchClientId(),
    staleTime: SEARCH_CACHE_MS,
    gcTime: SEARCH_CACHE_MS,
    placeholderData: keepPreviousData,
  });
}
