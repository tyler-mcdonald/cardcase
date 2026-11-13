const LOGO_CDN_URL = "https://cdn.brandfetch.io/domain";
const LOGO_PX = 64;

export function brandLogoUrl(domain: string) {
  const clientId = import.meta.env.VITE_BRANDFETCH_CLIENT_ID ?? "";
  const url = new URL(
    `${LOGO_CDN_URL}/${encodeURIComponent(domain)}/w/${LOGO_PX}/h/${LOGO_PX}/fallback/404`,
  );
  url.searchParams.set("c", clientId);
  return url.toString();
}
