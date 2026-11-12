const LOGO_CDN_URL = "https://cdn.brandfetch.io/domain";
const SEARCH_API_URL = "https://api.brandfetch.io/v2/search";
const LOGO_PX = 64;

export type Brand = { name: string; domain: string };

type SearchResult = { name: string | null; domain: string };

function clientId(): string {
  return import.meta.env.VITE_BRANDFETCH_CLIENT_ID ?? "";
}

export function hasBrandfetchClientId() {
  return clientId() !== "";
}

export function brandLogoUrl(domain: string) {
  const url = new URL(
    `${LOGO_CDN_URL}/${encodeURIComponent(domain)}/w/${LOGO_PX}/h/${LOGO_PX}/fallback/404`,
  );
  url.searchParams.set("c", clientId());
  return url.toString();
}

export async function searchBrands(
  query: string,
  signal?: AbortSignal,
): Promise<Brand[]> {
  const url = new URL(`${SEARCH_API_URL}/${encodeURIComponent(query)}`);
  url.searchParams.set("c", clientId());
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Brand search failed (${response.status})`);
  }
  const results = (await response.json()) as SearchResult[];
  return results.map(({ name, domain }) => ({ name: name || domain, domain }));
}
