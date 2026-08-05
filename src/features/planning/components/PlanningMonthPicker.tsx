"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import classes from "./PlanningMonthPicker.module.css";

interface PlanningMonthPickerProps {
  year: number;
  onYearChange: (year: number) => void;
  months: Array<{ value: string; label: string }>;
  selectedValue: string;
  currentValue: string;
  onSelectMonth: (value: string) => void;
}

export default function PlanningMonthPicker({
  year,
  onYearChange,
  months,
  selectedValue,
  currentValue,
  onSelectMonth,
}: PlanningMonthPickerProps) {
  return (
    <>
      <div className={classes.yearNav}>
        <button
          type="button"
          aria-label="Previous year"
          onClick={() => onYearChange(year - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span>{year}</span>
        <button
          type="button"
          aria-label="Next year"
          onClick={() => onYearChange(year + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className={classes.monthGrid}>
        {months.map((m) => {
          const isSelected = m.value === selectedValue;
          const isCurrent = m.value === currentValue;
          return (
            <button
              key={m.value}
              type="button"
              className={`${classes.monthTile} ${
                isSelected ? classes.monthTileActive : ""
              } ${isCurrent && !isSelected ? classes.monthTileCurrent : ""}`}
              onClick={() => onSelectMonth(m.value)}
            >
              <span>{m.label}</span>
              {isCurrent && <span className={classes.currentDot} />}
            </button>
          );
        })}
      </div>
    </>
  );
}