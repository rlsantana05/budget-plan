"use client";

import type { ReactNode } from "react";
import { Text } from "@mantine/core";
import classes from "./AccountDialog.module.css";

interface FieldLabelProps {
  htmlFor: string;
  children: ReactNode;
}

export default function FieldLabel({ htmlFor, children }: FieldLabelProps) {
  return (
    <Text className={classes.label} component="label" htmlFor={htmlFor}>
      {children}
    </Text>
  );
}
