import { createTheme, type MantineColorsTuple } from "@mantine/core";

const cobalt: MantineColorsTuple = [
  "#f3f7fe",
  "#e2ebfe",
  "#c5d8fe",
  "#a4c0fe",
  "#7ea5fd",
  "#4b79ed",
  "#254eca",
  "#183bae",
  "#0e2a90",
  "#061a72",
];

export const theme = createTheme({
  colors: { cobalt },
  primaryColor: "cobalt",
  black: "#14161b",
});
