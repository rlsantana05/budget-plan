'use client';

import { useState } from 'react';
import { Popover } from '@mantine/core';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthValue, parseMonthValue, shiftMonthValue } from '@/lib/month';
import classes from './MonthSelector.module.css';

interface MonthSelectorProps {
  selectedValue: string;
  onGoToMonth: (value: string) => void;
}

function buildMonthsForYear(year: number): Array<{ value: string; label: string }> {
  return Array.from({ length: 12 }, (_, m) => ({
    value: formatMonthValue(year, m + 1),
    label: new Date(year, m, 1).toLocaleString('default', { month: 'short' }),
  }));
}

export default function MonthSelector({
  selectedValue,
  onGoToMonth,
}: MonthSelectorProps) {
  const { year, month } = parseMonthValue(selectedValue);
  const [pickerOpened, setPickerOpened] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  const current = new Date();
  const currentValue = formatMonthValue(current.getFullYear(), current.getMonth() + 1);
  const months = buildMonthsForYear(pickerYear);

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'long',
  });

  const openPicker = () => {
    setPickerYear(year);
    setPickerOpened(true);
  };

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
        onClose={() => setPickerOpened(false)}
      >
        <Popover.Target>
          <button type="button" className={classes.title} onClick={openPicker}>
            <strong>{monthLabel}</strong>
            <span className={classes.year}>{year}</span>
            <ChevronDown size={16} className={classes.chev} />
          </button>
        </Popover.Target>
        <Popover.Dropdown className={classes.picker}>
          <div className={classes.yearNav}>
            <button
              type="button"
              aria-label="Previous year"
              onClick={() => setPickerYear((y) => y - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span>{pickerYear}</span>
            <button
              type="button"
              aria-label="Next year"
              onClick={() => setPickerYear((y) => y + 1)}
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
                  className={`${classes.monthTile} ${isSelected ? classes.tileActive : ''} ${
                    isCurrent && !isSelected ? classes.tileCurrent : ''
                  }`}
                  onClick={() => {
                    setPickerOpened(false);
                    onGoToMonth(m.value);
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </Popover.Dropdown>
      </Popover>

      <div className={classes.nav}>
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => onGoToMonth(shiftMonthValue(selectedValue, -1))}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => onGoToMonth(shiftMonthValue(selectedValue, 1))}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </header>
  );
}