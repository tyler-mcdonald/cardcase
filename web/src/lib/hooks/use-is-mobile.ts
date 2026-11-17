import { DEFAULT_THEME, em, mergeMantineTheme, px } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { theme } from "@/theme";

const { sm } = mergeMantineTheme(DEFAULT_THEME, theme).breakpoints;

export const MOBILE_MEDIA_QUERY = `(max-width: ${em(Number(px(sm)) - 0.1)})`;

export function useIsMobile() {
  return useMediaQuery(MOBILE_MEDIA_QUERY, undefined, {
    getInitialValueInEffect: false,
  });
}
