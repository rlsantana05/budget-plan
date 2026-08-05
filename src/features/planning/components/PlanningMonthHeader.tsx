"use client";

import { Popover } from "@mantine/core";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { shiftMonthValue } from "@/lib/month";
import PlanningMonthPicker from "./PlanningMonthPicker";
import classes from "./PlanningMonthHeader.module.css";

interface PlanningMonthHeaderProps {
  month: string;
  year: number;
  pickerOpened: boolean;
  onPickerToggle: () => void;
  onPickerClose: () => void;
  pickerYear: number;
  onPickerYearChange: (year: number) => void;
  pickerMonths: Array<{ value: string; label: string }>;
  selectedValue: string;
  currentValue: string;
  onGoToMonth: (value: string) => void;
}

export default function PlanningMonthHeader({
  month,
  year,
  pickerOpened,
  onPickerToggle,
  onPickerClose,
  pickerYear,
  onPickerYearChange,
  pickerMonths,
  selectedValue,
  currentValue,
  onGoToMonth,
}: PlanningMonthHeaderProps) {
  return (
    <header className={classes.header}>
      <Popover
        width={300}
        position="bottom-start"
        shadow="md"
        withArrow={false}
        withinPortal
        offset={8}
        opened={pickerOpened}
        onClose={onPickerClose}
      >
        <Popover.Target>
          <div className={classes.monthTitle} onClick={onPickerToggle}>
            <strong>{month}</strong>
            <span className={classes.year}>{year}</span>
            <ChevronDown size={16} className={classes.chev} />
          </div>
        </Popover.Target>
        <Popover.Dropdown className={classes.monthPicker}>
          <PlanningMonthPicker
            year={pickerYear}
            onYearChange={onPickerYearChange}
            months={pickerMonths}
            selectedValue={selectedValue}
            currentValue={currentValue}
            onSelectMonth={(value) => {
              onPickerClose();
              onGoToMonth(value);
            }}
          />
        </Popover.Dropdown>
      </Popover>
      <div className={classes.navArrows}>
        <button
          aria-label="Previous month"
          onClick={() => onGoToMonth(shiftMonthValue(selectedValue, -1))}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          aria-label="Next month"
          onClick={() => onGoToMonth(shiftMonthValue(selectedValue, 1))}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </header>
  );
}