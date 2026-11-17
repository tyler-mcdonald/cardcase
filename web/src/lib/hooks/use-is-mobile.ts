import { useMediaQuery } from "@mantine/hooks";

export const MOBILE_MEDIA_QUERY = "(max-width: 47.99375em)";

export function useIsMobile() {
  return useMediaQuery(MOBILE_MEDIA_QUERY, undefined, {
    getInitialValueInEffect: false,
  });
}
