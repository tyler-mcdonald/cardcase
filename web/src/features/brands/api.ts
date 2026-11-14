import { brandSearchUrl } from "./brandfetch-url";
import type { Brand } from "./types";

export type SearchResult = { name: string | null; domain: string };

export async function searchBrands(
  query: string,
  signal?: AbortSignal,
): Promise<Brand[]> {
  const response = await fetch(brandSearchUrl(query), { signal });
  if (!response.ok) {
    throw new Error(`Brand search failed (${response.status})`);
  }
  const results = (await response.json()) as SearchResult[];
  return results.map(({ name, domain }) => ({ name: name || domain, domain }));
}
