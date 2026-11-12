import {
  Avatar,
  Button,
  createTheme,
  defaultVariantColorsResolver,
  Pagination,
  rgba,
  type CSSVariablesResolver,
  type MantineColor,
  type VariantColorsResolver,
} from "@mantine/core";
import classes from "./theme.module.css";

export const THEME_COLOR: MantineColor = "indigo";

export const THEME_SHADES = {
  strong: `${THEME_COLOR}.8`,
} as const;

const variantColorResolver: VariantColorsResolver = (input) => {
  const colors = defaultVariantColorsResolver(input);
  if (input.variant !== "light") return colors;
  return { ...colors, border: "1px solid var(--light-rim, transparent)" };
};

export const theme = createTheme({
  primaryColor: THEME_COLOR,
  variantColorResolver,
  components: {
    Avatar: Avatar.extend({
      defaultProps: { color: THEME_COLOR },
    }),
    Button: Button.extend({
      defaultProps: { variant: "light" },
    }),
    Pagination: Pagination.extend({
      classNames: { control: classes.paginationControl },
      vars: () => ({
        root: {
          "--pagination-active-bg": "var(--mantine-primary-color-light)",
          "--pagination-active-color":
            "var(--mantine-primary-color-light-color)",
        },
      }),
    }),
  },
});

export const cssVariablesResolver: CSSVariablesResolver = (resolvedTheme) => ({
  variables: {},
  light: {},
  dark: {
    "--light-rim": "color-mix(in srgb, currentColor 35%, transparent)",
    ...Object.fromEntries(
      Object.entries(resolvedTheme.colors).flatMap(([name, shades]) => [
        [`--mantine-color-${name}-light`, rgba(shades[5], 0.15)],
        [`--mantine-color-${name}-light-hover`, rgba(shades[5], 0.22)],
        [`--mantine-color-${name}-light-color`, shades[3]],
      ]),
    ),
  },
});
