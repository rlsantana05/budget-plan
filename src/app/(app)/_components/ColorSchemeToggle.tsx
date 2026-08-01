"use client";

import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { MoonIcon, SunIcon } from "lucide-react";
import classes from "./ColorSchemeToggle.module.css";

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");

  return (
    <ActionIcon
      onClick={() => setColorScheme(computedColorScheme === "light" ? "dark" : "light")}
      variant="default"
      size="lg"
      aria-label="Toggle color scheme"
    >
      <SunIcon size={18} className={classes.dark} />
      <MoonIcon size={18} className={classes.light} />
    </ActionIcon>
  );
}
