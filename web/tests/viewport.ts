import { MOBILE_MEDIA_QUERY } from "@/lib/hooks/use-is-mobile";

type ChangeListener = (event: { matches: boolean; media: string }) => void;

const changeListeners = new Map<string, Set<ChangeListener>>();

function stubMatchMedia(matchingQueries: string[]) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: matchingQueries.includes(query),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_type: string, listener: ChangeListener) => {
        const listeners = changeListeners.get(query) ?? new Set();
        listeners.add(listener);
        changeListeners.set(query, listeners);
      },
      removeEventListener: (_type: string, listener: ChangeListener) => {
        changeListeners.get(query)?.delete(listener);
      },
      dispatchEvent: () => false,
    }),
  });
}

function changeViewport(matchingQueries: string[]) {
  stubMatchMedia(matchingQueries);
  for (const [media, listeners] of changeListeners) {
    const matches = matchingQueries.includes(media);
    for (const listener of listeners) {
      listener({ matches, media });
    }
  }
}

export function mockDesktopViewport() {
  stubMatchMedia([]);
}

export function mockMobileViewport() {
  stubMatchMedia([MOBILE_MEDIA_QUERY]);
}

export function resizeToDesktopViewport() {
  changeViewport([]);
}
