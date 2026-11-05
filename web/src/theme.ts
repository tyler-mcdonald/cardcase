import {
  ActionIcon,
  Button,
  createTheme,
  SegmentedControl,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";

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

const BUTTON_RADIUS = 6;

export const theme = createTheme({
  colors: { ink },
  primaryColor: "ink",
  primaryShade: { light: 8, dark: 1 },
  autoContrast: true,
  components: {
    Button: Button.extend({
      defaultProps: { variant: "default", radius: BUTTON_RADIUS },
      vars: (_theme, props) => {
        if (props.variant === "default") {
          return {
            root: {
              "--button-bg": "var(--cardcase-button-bg)",
              "--button-hover": "var(--cardcase-button-hover)",
              "--button-color": "var(--cardcase-ink)",
              "--button-bd": "1px solid var(--cardcase-button-border)",
            },
          };
        }
        if (props.variant === "subtle" && !props.color) {
          return {
            root: {
              "--button-color": "var(--cardcase-subtle-color)",
              "--button-hover": "var(--cardcase-subtle-hover)",
            },
          };
        }
        return { root: {} };
      },
      styles: (_theme, props) =>
        props.variant === "default"
          ? { root: { boxShadow: "var(--cardcase-button-shadow)" } }
          : {},
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: { radius: BUTTON_RADIUS },
      vars: (_theme, props) =>
        props.variant === "default"
          ? {
              root: {
                "--ai-bg": "var(--cardcase-button-bg)",
                "--ai-hover": "var(--cardcase-button-hover)",
                "--ai-color": "var(--cardcase-ink)",
                "--ai-bd": "1px solid var(--cardcase-button-border)",
              },
            }
          : { root: {} },
    }),
    SegmentedControl: SegmentedControl.extend({
      vars: (_theme, props) =>
        props.color
          ? { root: {} }
          : {
              root: {
                "--sc-color": "var(--cardcase-button-bg)",
                "--sc-label-color": "var(--cardcase-ink)",
                "--sc-shadow":
                  "inset 0 0 0 1px var(--cardcase-button-border), var(--cardcase-button-shadow)",
              },
            },
    }),
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--cardcase-ink": "#25292e",
    "--cardcase-button-bg": "#f6f8fa",
    "--cardcase-button-hover": "#eff2f5",
    "--cardcase-button-border": "#d1d9e0",
    "--cardcase-button-shadow": "0 1px 0 rgba(31, 35, 40, 0.04)",
    "--cardcase-subtle-color": "#59636e",
    "--cardcase-subtle-hover": "rgba(129, 139, 152, 0.1)",
  },
  dark: {
    "--cardcase-ink": "#f0f2f4",
    "--cardcase-button-bg": "#2f3236",
    "--cardcase-button-hover": "#383b40",
    "--cardcase-button-border": "#45494f",
    "--cardcase-button-shadow": "0 1px 0 rgba(0, 0, 0, 0.2)",
    "--cardcase-subtle-color": "#9aa0a6",
    "--cardcase-subtle-hover": "rgba(101, 108, 118, 0.2)",
  },
});
