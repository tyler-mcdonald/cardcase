import {
  Button,
  createTheme,
  Pagination,
  rgba,
  type CSSVariablesResolver,
  type MantineColor,
} from "@mantine/core";
import classes from "./theme.module.css";

export const THEME_COLOR: MantineColor = "indigo";

export const THEME_SHADES = {
  strong: `${THEME_COLOR}.8`,
} as const;

const ACCENT_VARS = {
  bg: "--accent-bg",
  hover: "--accent-hover",
  color: "--accent-color",
  rim: "--accent-rim",
} as const;

const accent = (key: keyof typeof ACCENT_VARS) => `var(${ACCENT_VARS[key]})`;

export const theme = createTheme({
  primaryColor: THEME_COLOR,
  components: {
    Button: Button.extend({
      vars: (_theme, props) =>
        props.color || props.variant
          ? { root: {} }
          : {
              root: {
                "--button-bg": accent("bg"),
                "--button-hover": accent("hover"),
                "--button-color": accent("color"),
                "--button-bd": `1px solid ${accent("rim")}`,
              },
            },
    }),
    Pagination: Pagination.extend({
      classNames: { control: classes.paginationControl },
      vars: () => ({
        root: {
          "--pagination-active-bg": accent("bg"),
          "--pagination-active-color": accent("color"),
        },
      }),
    }),
  },
});

export const cssVariablesResolver: CSSVariablesResolver = (resolvedTheme) => {
  const shades = resolvedTheme.colors[THEME_COLOR];
  return {
    variables: {},
    light: {
      [ACCENT_VARS.bg]: `var(--mantine-color-${THEME_COLOR}-light)`,
      [ACCENT_VARS.hover]: `var(--mantine-color-${THEME_COLOR}-light-hover)`,
      [ACCENT_VARS.color]: `var(--mantine-color-${THEME_COLOR}-light-color)`,
      [ACCENT_VARS.rim]: "transparent",
    },
    dark: {
      [ACCENT_VARS.bg]: rgba(shades[5], 0.15),
      [ACCENT_VARS.hover]: rgba(shades[5], 0.22),
      [ACCENT_VARS.color]: shades[3],
      [ACCENT_VARS.rim]: rgba(shades[3], 0.35),
    },
  };
};
