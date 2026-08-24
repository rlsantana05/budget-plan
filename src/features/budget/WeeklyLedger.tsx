'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, NotebookText } from 'lucide-react';
import type { MonthBudgetPlanDTO } from '@/types/budget';
import {
  formatWeekRange,
  getMonthWeeks,
  tagLabel,
  withTags,
  type Week,
} from './utils/weeks';
import WeekWorkspace from './WeekWorkspace';
import classes from './WeeklyLedger.module.css';

export interface WeeklyLedgerProps {
  initialData?: MonthBudgetPlanDTO;
  selectedMonth?: string; // "YYYY-MM"
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseSelectedMonth(selected?: string): { year: number; month: number } {
  if (selected && /^\d{4}-\d{2}$/.test(selected)) {
    const [y, m] = selected.split('-').map(Number);
    return { year: y, month: m };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function neighborMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/**
 * Budget weekly ledger shell (spec 2026-08-23-budget-weekly-ledger Phase A).
 * Month container, week rail on the left, workspace on the right.
 */
export default function WeeklyLedger({ initialData, selectedMonth }: WeeklyLedgerProps) {
  const router = useRouter();
  const { year, month } = parseSelectedMonth(selectedMonth);

  const weeks = useMemo(
    () => withTags(getMonthWeeks(year, month)),
    [year, month],
  );

  // Auto-select the current week; fall back to the first.
  const initialWeek = weeks.find((w) => w.tag === 'current') ?? weeks[0];
  const [selectedKey, setSelectedKey] = useState<string>(initialWeek?.key ?? '');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const selected = weeks.find((w) => w.key === selectedKey) ?? initialWeek;

  const goToMonth = (y: number, m: number) => {
    router.push(`/budget?month=${y}-${String(m).padStart(2, '0')}`);
    router.refresh();
  };

  const prev = neighborMonth(year, month, -1);
  const next = neighborMonth(year, month, 1);

  return (
    <div className={classes.sheet}>
      <header className={classes.monthHead}>
        <div>
          <span className={classes.eyebrow}>Weekly check-ins</span>
          <h1 className={classes.title}>{MONTH_NAMES[month - 1]} {year}</h1>
        </div>
      </header>

      <div className={classes.layout}>
        <nav className={classes.weeks} aria-label={`Weeks in ${MONTH_NAMES[month - 1]}`}>
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
              {/* Phase B: status pill reflects planned/unplanned */}
              <span className={`${classes.status} ${classes.unplanned}`}>
                <span className={classes.dot} />
                Unplanned
              </span>
            </button>
          ))}
        </nav>

        <section className={classes.workspace}>
          {selected && (workspaceOpen || selected.tag !== 'future') ? (
            <WeekWorkspace year={year} month={month} week={selected} nextWeekKey={weeks[weeks.findIndex((w) => w.key === selected?.key) + 1]?.key ?? selected?.key ?? ''} />
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
                  <ChevronRightIcon size={14} />
                </button>
              </>
            )
          )}
        </section>
      </div>

      <footer className={classes.foot}>
        <div className={classes.navGroup}>
          <button
            type="button"
            className={classes.navBtn}
            aria-label="Previous month"
            onClick={() => goToMonth(prev.year, prev.month)}
          >
            <ChevronLeftIcon size={15} />
          </button>
          <div className={classes.navText}>
            <span className={classes.navLabel}>Previous</span>
            <span className={classes.navMonth}>{MONTH_NAMES[prev.month - 1]} {prev.year}</span>
          </div>
        </div>

        <div className={classes.archives}>
          <span className={classes.navLabel}>Archives</span>
          <div className={classes.dots}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={i === 1 ? classes.dotActive : ''} />
            ))}
          </div>
        </div>

        <div className={`${classes.navGroup} ${classes.navRight}`}>
          <button
            type="button"
            className={classes.navBtn}
            aria-label="Next month"
            onClick={() => goToMonth(next.year, next.month)}
          >
            <ChevronRightIcon size={15} />
          </button>
          <div className={`${classes.navText} ${classes.navTextRight}`}>
            <span className={classes.navLabel}>Next</span>
            <span className={classes.navMonth}>{MONTH_NAMES[next.month - 1]} {next.year}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
