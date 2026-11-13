import { brandfetchClientId } from "./client-id";

const LOGO_CDN_URL = "https://cdn.brandfetch.io/domain";
const LOGO_PX = 64;

export function brandLogoUrl(domain: string) {
  const url = new URL(
    `${LOGO_CDN_URL}/${encodeURIComponent(domain)}/w/${LOGO_PX}/h/${LOGO_PX}/fallback/404`,
  );
  url.searchParams.set("c", brandfetchClientId());
  return url.toString();
}
