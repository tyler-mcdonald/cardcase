import { brandfetchUrl } from "./brandfetch-url";
import type { Brand } from "./types";

const SEARCH_API_URL = "https://api.brandfetch.io/v2/search";

export type SearchResult = { name: string | null; domain: string };

function searchUrl(query: string) {
  return brandfetchUrl(`${SEARCH_API_URL}/${encodeURIComponent(query)}`);
}

export async function searchBrands(
  query: string,
  signal?: AbortSignal,
): Promise<Brand[]> {
  const response = await fetch(searchUrl(query), { signal });
  if (!response.ok) {
    throw new Error(`Brand search failed (${response.status})`);
  }
  const results = (await response.json()) as SearchResult[];
  return results.map(({ name, domain }) => ({ name: name || domain, domain }));
}
