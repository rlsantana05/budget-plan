"use client";

import { Button, Group } from "@mantine/core";
import classes from "./AccountDialog.module.css";

interface DialogFooterProps {
  onBack?: () => void;
  onCancel: () => void;
  submitLabel: string;
  submitDisabled: boolean;
  submitting?: boolean;
  buttonType?: "submit" | "button";
  onButtonClick?: () => void;
}

export default function DialogFooter({
  onBack,
  onCancel,
  submitLabel,
  submitDisabled,
  submitting = false,
  buttonType = "submit",
  onButtonClick,
}: DialogFooterProps) {
  return (
    <Group justify="space-between" className={classes.footer}>
      <Group gap="xs">
        {onBack ? (
          <Button variant="default" onClick={onBack}>
            Back
          </Button>
        ) : null}
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
      </Group>
      <Button
        type={buttonType}
        onClick={onButtonClick}
        disabled={submitDisabled}
        loading={submitting}
        className={submitDisabled ? undefined : classes.primaryButton}
      >
        {submitLabel}
      </Button>
    </Group>
  );
}
