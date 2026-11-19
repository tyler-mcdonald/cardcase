import {
  DEFAULT_THEME,
  em,
  getBreakpointValue,
  mergeMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { theme } from "@/theme";

const { breakpoints } = mergeMantineTheme(DEFAULT_THEME, theme);
const MAX_WIDTH_OFFSET = 0.1;
const maxWidth = getBreakpointValue("sm", breakpoints) - MAX_WIDTH_OFFSET;

export const MOBILE_MEDIA_QUERY = `(max-width: ${
  breakpoints.sm.includes("px") ? `${maxWidth}px` : em(maxWidth)
})`;

export function useIsMobile() {
  return useMediaQuery(MOBILE_MEDIA_QUERY, undefined, {
    getInitialValueInEffect: false,
  });
}
