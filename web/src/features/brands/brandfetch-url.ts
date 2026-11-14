const SEARCH_API_URL = "https://api.brandfetch.io/v2/search";
const LOGO_CDN_URL = "https://cdn.brandfetch.io/domain";
const LOGO_PX = 64;

function clientId(): string {
  return import.meta.env.VITE_BRANDFETCH_CLIENT_ID ?? "";
}

export function hasBrandfetchClientId() {
  return clientId() !== "";
}

function brandfetchUrl(url: string) {
  const withClientId = new URL(url);
  withClientId.searchParams.set("c", clientId());
  return withClientId;
}

export function brandSearchUrl(query: string) {
  return brandfetchUrl(`${SEARCH_API_URL}/${encodeURIComponent(query)}`);
}

export function brandLogoUrl(domain: string) {
  return brandfetchUrl(
    `${LOGO_CDN_URL}/${encodeURIComponent(domain)}/w/${LOGO_PX}/h/${LOGO_PX}/fallback/404`,
  ).toString();
}
