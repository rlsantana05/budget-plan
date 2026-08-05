"use client";

import { Plus } from "lucide-react";
import classes from "./PlanningAddTransactionFab.module.css";

interface PlanningAddTransactionFabProps {
  onClick: () => void;
}

export default function PlanningAddTransactionFab({
  onClick,
}: PlanningAddTransactionFabProps) {
  return (
    <button
      type="button"
      className={classes.fab}
      aria-label="Add transaction"
      onClick={onClick}
    >
      <Plus size={26} />
    </button>
  );
}