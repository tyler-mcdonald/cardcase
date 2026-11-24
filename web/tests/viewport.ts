import {
  DEFAULT_THEME,
  em,
  getBreakpointValue,
  mergeMantineTheme,
} from "@mantine/core";
import { theme } from "@/theme";

const { breakpoints } = mergeMantineTheme(DEFAULT_THEME, theme);
const MAX_WIDTH_OFFSET = 0.1;
const maxWidth = getBreakpointValue("sm", breakpoints) - MAX_WIDTH_OFFSET;
const MOBILE_MEDIA_QUERY = `(max-width: ${
  breakpoints.sm.includes("px") ? `${maxWidth}px` : em(maxWidth)
})`;

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
