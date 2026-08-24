'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, NotebookText } from 'lucide-react';
import { useDisclosure } from '@mantine/hooks';
import type { MonthBudgetPlanDTO } from '@/types/budget';
import {
  getMonthWeeks,
  withTags,
  formatWeekRange,
  tagLabel,
  type Week,
} from './utils/weeks';
import { useMonthNavigation } from '../planning/hooks/useMonthNavigation';
import MonthHeader from '../planning/components/layout/MonthHeader/MonthHeader';
import WeekWorkspace from './WeekWorkspace';
import classes from './WeeklyLedger.module.css';

export interface WeeklyLedgerProps {
  initialData?: MonthBudgetPlanDTO;
  selectedMonth?: string; // "YYYY-MM"
}

/**
 * Budget weekly check-in shell (spec 2026-08-23-budget-weekly-ledger).
 * Month container (reuses Planning's MonthHeader for nav + picker),
 * week rail on the left, workspace on the right.
 */
export default function WeeklyLedger({ initialData, selectedMonth }: WeeklyLedgerProps) {
  const nav = useMonthNavigation(selectedMonth);
  const year = nav.year;
  const month = Number(nav.selectedValue.split('-')[1]);

  const weeks = useMemo(
    () => withTags(getMonthWeeks(year, month)),
    [year, month],
  );

  // Auto-select the current week; fall back to the first.
  const initialWeek = weeks.find((w) => w.tag === 'current') ?? weeks[0];
  const [selectedKey, setSelectedKey] = useState<string>(initialWeek?.key ?? '');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  // Re-select sensibly when month changes: derive selection instead of
  // syncing state in an effect. If the user picked a week that exists in the
  // new month's rail, keep it; otherwise default to current.
  const selectedIsValid = weeks.some((w) => w.key === selectedKey);
  const effectiveSelectedKey = selectedIsValid
    ? selectedKey
    : initialWeek?.key ?? '';
  const selected = weeks.find((w) => w.key === effectiveSelectedKey) ?? initialWeek;
  const workspaceOpenForMonth = workspaceOpen && selectedIsValid;

  return (
    <div className={classes.sheet}>
      <MonthHeader
        month={nav.month}
        year={year}
        pickerOpened={nav.pickerOpened}
        onPickerToggle={nav.handlePickerToggle}
        onPickerClose={nav.closePicker}
        pickerYear={nav.pickerYear}
        onPickerYearChange={nav.setPickerYear}
        pickerMonths={nav.pickerMonths}
        selectedValue={nav.selectedValue}
        currentValue={nav.currentValue}
        onGoToMonth={nav.goToMonth}
      />

      <div className={classes.layout}>
        <nav className={classes.weeks} aria-label={`Weeks in ${nav.month}`}>
          {weeks.map((week: Week) => (
            <button
              key={week.key}
              type="button"
              className={`${classes.weekRow} ${classes[week.tag]} ${week.key === selected?.key ? classes.selected : ''}`}
              aria-current={week.tag === 'current' ? 'date' : undefined}
              onClick={() => setSelectedKey(week.key)}
            >
              <span className={classes.weekInfo}>
                <span className={classes.dates}>
                  {formatWeekRange(week.start, week.end)}
                </span>
                <span className={classes.tag}>{tagLabel(week.tag)}</span>
              </span>
              {/* Phase C: status pill reflects planned/unplanned via detail data */}
              <span className={`${classes.status} ${classes.unplanned}`}>
                <span className={classes.dot} />
                Unplanned
              </span>
            </button>
          ))}
        </nav>

        <section className={classes.workspace}>
          {selected && (workspaceOpenForMonth || selected.tag !== 'future') ? (
            <WeekWorkspace
              year={year}
              month={month}
              week={selected}
              nextWeekKey={
                weeks[weeks.findIndex((w) => w.key === selected?.key) + 1]?.key ??
                selected?.key ?? ''
              }
            />
          ) : (
            selected && (
              <>
                <div className={classes.icon} aria-hidden="true">
                  <NotebookText size={26} strokeWidth={1.6} color="var(--accent-bright)" />
                </div>
                <span className={classes.kicker}>
                  {formatWeekRange(selected.start, selected.end)} · {tagLabel(selected.tag)} week
                </span>
                <h2 className={classes.wsTitle}>Budget workspace</h2>
                <p className={classes.copy}>
                  {selected.tag === 'past'
                    ? "This week wasn't planned. Log what actually happened to keep the record straight."
                    : selected.tag === 'future'
                      ? 'This week is coming up. Plan it now so there are no surprises when it arrives.'
                      : "This week hasn't been planned yet. Set your income and expenses to see where the money's going."}
                </p>
                <button
                  type="button"
                  className={classes.cta}
                  onClick={() => setWorkspaceOpen(true)}
                >
                  Plan this week
                  <ChevronRight size={14} />
                </button>
              </>
            )
          )}
        </section>
      </div>
    </div>
  );
}
