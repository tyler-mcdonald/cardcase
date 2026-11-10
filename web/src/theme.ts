import { createTheme, type MantineColor } from "@mantine/core";

export const THEME_COLOR: MantineColor = "blue";

export const THEME_SHADES = {
  strong: `${THEME_COLOR}.8`,
} as const;

export const theme = createTheme({
  primaryColor: THEME_COLOR,
});
