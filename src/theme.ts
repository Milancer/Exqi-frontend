import { createTheme } from "@mantine/core";

// Custom brand color palette — deep indigo/violet tones
const brand = [
  "#eef2ff", // 0 — lightest
  "#dbe4ff",
  "#bac8ff",
  "#91a7ff",
  "#748ffc",
  "#5c7cfa", // 5 — default shade
  "#4c6ef5",
  "#4263eb",
  "#3b5bdb",
  "#364fc7", // 9 — darkest
] as const;

export const theme = createTheme({
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  headings: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontWeight: "700",
  },
  primaryColor: "brand",
  primaryShade: { light: 6, dark: 5 },
  colors: { brand },
  defaultRadius: "md",
  cursorType: "pointer",
  components: {
    Button: {
      defaultProps: {
        variant: "filled",
      },
    },
    Paper: {
      defaultProps: {
        shadow: "xs",
      },
    },
    Modal: {
      defaultProps: {
        radius: "md",
        overlayProps: { backgroundOpacity: 0.55, blur: 3 },
      },
    },
    Card: {
      defaultProps: {
        shadow: "sm",
        radius: "md",
      },
    },
    Table: {
      defaultProps: {
        striped: "odd",
        highlightOnHover: true,
        verticalSpacing: "md",
      },
    },
    NavLink: {
      defaultProps: {
        variant: "light",
      },
    },
  },
});
