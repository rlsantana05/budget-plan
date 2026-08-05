"use client";

import classes from "./PlanningViewToggle.module.css";

type View = "summary" | "transactions";

interface PlanningViewToggleProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

export default function PlanningViewToggle({
  activeView,
  onViewChange,
}: PlanningViewToggleProps) {
  return (
    <div className={classes.toggle}>
      <button
        className={activeView === "summary" ? classes.active : ""}
        onClick={() => onViewChange("summary")}
      >
        <span aria-hidden>◐</span> Summary
      </button>
      <button
        className={activeView === "transactions" ? classes.active : ""}
        onClick={() => onViewChange("transactions")}
      >
        <span aria-hidden>$</span> Transactions
      </button>
    </div>
  );
}