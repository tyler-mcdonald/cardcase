import {
  ActionIcon,
  Button,
  colorsTuple,
  createTheme,
  Pagination,
  SegmentedControl,
  Select,
  virtualColor,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";
import classes from "./theme.module.css";

const ink: MantineColorsTuple = [
  "#f6f8fa",
  "#eff2f5",
  "#e6eaef",
  "#d1d9e0",
  "#9ea7b3",
  "#818b98",
  "#59636e",
  "#393f46",
  "#25292e",
  "#1f2328",
];

const inkDark = colorsTuple([...ink].reverse());

const BUTTON_RADIUS = 6;

export const theme = createTheme({
  colors: {
    inkLight: ink,
    inkDark,
    ink: virtualColor({ name: "ink", light: "inkLight", dark: "inkDark" }),
  },
  primaryColor: "ink",
  components: {
    Button: Button.extend({
      defaultProps: { variant: "default", radius: BUTTON_RADIUS },
      classNames: { root: classes.button },
      // Button sets --button-color inline for every variant, so a class can't
      // override it; uncolored subtle buttons get the muted ink here instead.
      vars: (_theme, props) => ({
        root:
          props.variant === "subtle" && !props.color
            ? {
                "--button-color": "var(--cardcase-subtle-color)",
                "--button-hover": "var(--cardcase-subtle-hover)",
              }
            : {},
      }),
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: { radius: BUTTON_RADIUS },
    }),
    Pagination: Pagination.extend({
      classNames: { root: classes.pagination },
    }),
    Select: Select.extend({
      classNames: { option: classes.comboboxOption },
    }),
    SegmentedControl: SegmentedControl.extend({
      classNames: {
        root: classes.segmentedControl,
        indicator: classes.segmentedControlIndicator,
      },
    }),
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-primary-color-contrast": "#ffffff",
    "--mantine-color-default": ink[0],
    "--mantine-color-default-hover": ink[1],
    "--mantine-color-default-color": ink[8],
    "--mantine-color-default-border": ink[3],
    "--cardcase-button-shadow": "0 1px 0 rgba(31, 35, 40, 0.04)",
    "--cardcase-subtle-color": ink[6],
    "--cardcase-subtle-hover": "rgba(129, 139, 152, 0.1)",
  },
  dark: {
    "--mantine-primary-color-contrast": ink[9],
    "--mantine-color-default": "#2f3236",
    "--mantine-color-default-hover": "#383b40",
    "--mantine-color-default-color": "#f0f2f4",
    "--mantine-color-default-border": "#45494f",
    "--mantine-color-ink-light": "var(--mantine-color-default)",
    "--mantine-color-ink-light-hover": "var(--mantine-color-default-hover)",
    "--mantine-color-ink-light-color": "var(--mantine-color-default-color)",
    "--cardcase-button-shadow": "0 1px 0 rgba(0, 0, 0, 0.2)",
    "--cardcase-subtle-color": "#a8aeb4",
    "--cardcase-subtle-hover": "rgba(101, 108, 118, 0.2)",
  },
});
