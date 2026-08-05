"use client";

import { NumberInput, TextInput } from "@mantine/core";
import { Check } from "lucide-react";
import type { GroupItem } from "../types";
import sharedClasses from "../styles/PlanningShared.module.css";
import classes from "./PlanningBudgetGroupItemEditForm.module.css";

interface PlanningBudgetGroupItemEditFormProps {
  item: GroupItem;
  editName: string;
  onEditNameChange: (value: string) => void;
  editPlanned: number;
  onEditPlannedChange: (value: number) => void;
  busy: "add" | "row" | null;
  onSave: (itemId: string) => void;
  onCancel: () => void;
}

export default function PlanningBudgetGroupItemEditForm({
  item,
  editName,
  onEditNameChange,
  editPlanned,
  onEditPlannedChange,
  busy,
  onSave,
  onCancel,
}: PlanningBudgetGroupItemEditFormProps) {
  return (
    <div className={classes.gRowEditing}>
      <div className={classes.editForm}>
        <TextInput
          autoFocus
          size="xs"
          placeholder="Name"
          value={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave(item.id);
            if (e.key === "Escape") onCancel();
          }}
        />
        <NumberInput
          size="xs"
          placeholder="Planned"
          value={editPlanned}
          onChange={(v) => onEditPlannedChange(typeof v === "number" ? v : 0)}
          min={0}
          decimalScale={2}
        />
        <div className={classes.editActions}>
          <button
            type="button"
            className={sharedClasses.addItemSave}
            onClick={() => onSave(item.id)}
            disabled={busy !== null || !editName.trim()}
            aria-label="Save item"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            className={sharedClasses.addItemCancel}
            onClick={onCancel}
            aria-label="Cancel edit"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
      </div>
    </div>
  );
}