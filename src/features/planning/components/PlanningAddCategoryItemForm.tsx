"use client";

import type { RefObject } from "react";
import { TextInput } from "@mantine/core";
import { Check } from "lucide-react";
import { formatMoney } from "../utils/formatters";
import sharedClasses from "../styles/PlanningShared.module.css";
import classes from "./PlanningAddCategoryItemForm.module.css";

interface PlanningAddCategoryItemFormProps {
  className?: string;
  isIncome: boolean;
  busy: "add" | "row" | null;
  newItemName: string;
  onNewItemNameChange: (value: string) => void;
  amountText: string;
  onAmountChange: (value: string) => void;
  onAddItem: () => void;
  onCancel: () => void;
  nameInputRef: RefObject<HTMLInputElement | null>;
  amountInputRef: RefObject<HTMLInputElement | null>;
}

export default function PlanningAddCategoryItemForm({
  className,
  isIncome,
  busy,
  newItemName,
  onNewItemNameChange,
  amountText,
  onAmountChange,
  onAddItem,
  onCancel,
  nameInputRef,
  amountInputRef,
}: PlanningAddCategoryItemFormProps) {
  return (
    <div className={`${classes.addItemForm} ${className ?? ""}`}>
      <TextInput
        ref={nameInputRef}
        autoFocus
        size="xs"
        placeholder={isIncome ? "e.g. Paycheck" : "Groceries, rent, coffee…"}
        value={newItemName}
        onChange={(e) => onNewItemNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            amountInputRef.current?.focus();
          }
          if (e.key === "Escape") onCancel();
        }}
      />
      <TextInput
        ref={amountInputRef}
        size="xs"
        inputMode="decimal"
        placeholder="0.00"
        value={amountText ? `$${formatMoney(Number(amountText))}` : ""}
        onChange={(e) => onAmountChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAddItem();
          }
          if (e.key === "Escape") onCancel();
        }}
      />
      <button
        type="button"
        className={sharedClasses.addItemSave}
        onClick={onAddItem}
        disabled={busy !== null || !newItemName.trim()}
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        className={sharedClasses.addItemCancel}
        onClick={onCancel}
        aria-label="Cancel add item"
      >
        <span aria-hidden>×</span>
      </button>
    </div>
  );
}