import {
  Avatar,
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

export const theme = createTheme({
  primaryColor: THEME_COLOR,
  components: {
    Avatar: Avatar.extend({
      defaultProps: { color: THEME_COLOR },
      classNames: { placeholder: classes.avatarRim },
    }),
    Button: Button.extend({
      defaultProps: { variant: "light" },
      classNames: (_theme, props) => ({
        root: props.color ? undefined : classes.rim,
      }),
    }),
    Pagination: Pagination.extend({
      classNames: { control: classes.rim },
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

export const cssVariablesResolver: CSSVariablesResolver = (resolvedTheme) => {
  const shades = resolvedTheme.colors[THEME_COLOR];
  return {
    variables: {},
    light: {},
    dark: {
      [`--mantine-color-${THEME_COLOR}-light`]: rgba(shades[5], 0.15),
      [`--mantine-color-${THEME_COLOR}-light-hover`]: rgba(shades[5], 0.22),
      [`--mantine-color-${THEME_COLOR}-light-color`]: shades[3],
    },
  };
};
