import { createTheme, type MantineColorsTuple } from "@mantine/core";

const surface: MantineColorsTuple = [
  "#262a33", // surface-3: hover/active states, dropdowns (lightest)
  "#1e2128", // surface-2: nested cards
  "#16181d", // surface-1: main dashboard panel
  "#0d0e12", // base: outermost canvas (darkest)
  "#0d0e12",
  "#0d0e12",
  "#0d0e12",
  "#0d0e12",
  "#0d0e12",
  "#0d0e12",
];

export const theme = createTheme({
  fontFamily: "var(--font-sans, system-ui, sans-serif)",
  // Skip enter/exit transitions entirely: modals render immediately (also
  // avoids rAF-dependent mounting that stalls in background tabs).
  respectReducedMotion: true,
  colors: {
    surface,
  },
});
