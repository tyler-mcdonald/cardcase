import { brandfetchClientId } from "./client-id";

const SEARCH_API_URL = "https://api.brandfetch.io/v2/search";

export type Brand = { name: string; domain: string };

export type SearchResult = { name: string | null; domain: string };

export async function searchBrands(
  query: string,
  signal?: AbortSignal,
): Promise<Brand[]> {
  const url = new URL(`${SEARCH_API_URL}/${encodeURIComponent(query)}`);
  url.searchParams.set("c", brandfetchClientId());
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Brand search failed (${response.status})`);
  }
  const results = (await response.json()) as SearchResult[];
  return results.map(({ name, domain }) => ({ name: name || domain, domain }));
}
