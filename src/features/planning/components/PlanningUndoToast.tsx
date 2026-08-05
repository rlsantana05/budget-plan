"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { BudgetGroupUndo } from "../hooks/useBudgetGroups";
import classes from "./PlanningUndoToast.module.css";

interface PlanningUndoToastProps {
  undo: BudgetGroupUndo | null;
  onUndo: () => void;
}

export default function PlanningUndoToast({ undo, onUndo }: PlanningUndoToastProps) {
  const reduceMotion = useReducedMotion();
  const transition = {
    duration: reduceMotion ? 0 : 0.18,
    ease: "easeOut" as const,
  };

  return (
    <AnimatePresence>
      {undo && (
        <motion.div
          className={classes.undoToast}
          initial={{ opacity: 0, y: 24, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 24, x: "-50%" }}
          transition={transition}
          role="status"
        >
          <span>Deleted {undo.item.name}</span>
          <button type="button" onClick={onUndo}>
            Undo
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}