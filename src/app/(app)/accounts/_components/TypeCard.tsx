"use client";

import type { ReactNode } from "react";
import { Stack, Text } from "@mantine/core";
import { Check } from "lucide-react";
import classes from "./AccountDialog.module.css";

interface TypeCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

export default function TypeCard({
  title,
  description,
  icon,
  selected,
  onSelect,
}: TypeCardProps) {
  return (
    <button
      type="button"
      className={`${classes.card} ${selected ? classes.cardSelected : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {selected ? (
        <div className={classes.checkmark}>
          <Check size={14} strokeWidth={3} />
        </div>
      ) : null}
      <Stack align="center" gap="xs">
        <div className={classes.iconWrapper}>{icon}</div>
        <Text fw={600} size="lg">
          {title}
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          {description}
        </Text>
      </Stack>
    </button>
  );
}
