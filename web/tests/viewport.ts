import { MOBILE_MEDIA_QUERY } from "@/lib/hooks/use-is-mobile";

function stubMatchMedia(matchingQueries: string[]) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: matchingQueries.includes(query),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

export function mockDesktopViewport() {
  stubMatchMedia([]);
}

export function mockMobileViewport() {
  stubMatchMedia([MOBILE_MEDIA_QUERY]);
}
