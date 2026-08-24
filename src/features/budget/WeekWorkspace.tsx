'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  closeWeek,
  getWeekDetail,
  type WeekDetail,
} from '@/actions/budget-week';
import { assignToCategory } from '@/actions/budget-planning';
import { formatCents, parseAmountToCents, sanitizeAmountText } from './utils/formatters';
import { formatWeekRange, type Week } from './utils/weeks';
import classes from './WeekWorkspace.module.css';

interface WeekWorkspaceProps {
  year: number;
  month: number;
  week: Week;
  /** Saturday key of the following week — rollover target when closing. */
  nextWeekKey: string;
}

/**
 * Planned-week workspace (spec 2026-08-23-budget-weekly-ledger Phase B):
 * income expected / planned / left + per-category planned vs spent rows.
 * Inline editing writes week-tagged ASSIGN ledger rows.
 */
export default function WeekWorkspace({ year, month, week, nextWeekKey }: WeekWorkspaceProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<WeekDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [closeState, setCloseState] = useState<'idle' | 'confirm' | 'closing'>('idle');

  const [closedMessage, setClosedMessage] = useState<string | null>(null);

  // Data fetching keyed to the selected week. setLoading inside the async
  // callback (not synchronously in the effect) keeps the lint rule happy.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const d = await getWeekDetail(year, month, week.key);
        if (!cancelled) setDetail(d);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load week');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [year, month, week.key]);

  const reload = useCallback(async () => {
    try {
      const d = await getWeekDetail(year, month, week.key);
      setDetail(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load week');
    }
  }, [year, month, week.key]);

  const commitDraft = useCallback(async (categoryId: string, rawValue?: string) => {
    const draft = rawValue ?? drafts[categoryId];
    setDrafts((prev) => ({ ...prev, [categoryId]: null }));
    if (draft === null || draft === undefined) return;
    const cents = parseAmountToCents(draft);
    const current = detail?.categories.find((c) => c.categoryId === categoryId)?.plannedCents;
    if (cents === current) return;
    setError(null);
    try {
      await assignToCategory(categoryId, cents / 100, week.key);
      await reload();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, [detail, drafts, reload, router, week.key]);

  if (loading && !detail) {
    return <div className={classes.loading}>Loading week…</div>;
  }

  const plannedTotal = detail?.categories.reduce((s, c) => s + c.plannedCents, 0) ?? 0;
  const left = (detail?.incomeCents ?? 0) - plannedTotal;
  const leftTone = left < 0 ? classes.negative : left > 0 ? classes.positive : '';

  return (
    <div className={classes.workspace}>
      <header className={classes.head}>
        <span className={classes.kicker}>
          {formatWeekRange(week.start, week.end)} · {week.tag === 'current' ? 'Current' : week.tag === 'past' ? 'Past' : 'Future'} week
        </span>
        <h2 className={classes.title}>This week</h2>
        {detail?.isClosed && (
          <span className={classes.closedBadge}>✓ Review closed</span>
        )}
      </header>

      <div className={classes.summary}>
        <div className={classes.summaryCell}>
          <span className={classes.label}>Income expected</span>
          <span className={classes.value}>
            {formatCents(detail?.incomeCents ?? 0)}
          </span>
          {(detail?.incomeCount ?? 0) === 0 && (
            <span className={classes.hint}>No income this week</span>
          )}
        </div>
        <div className={classes.summaryCell}>
          <span className={classes.label}>Planned</span>
          <span className={classes.value}>{formatCents(plannedTotal)}</span>
        </div>
        <div className={classes.summaryCell}>
          <span className={classes.label}>Left for this week</span>
          <span className={`${classes.value} ${leftTone}`}>{formatCents(left)}</span>
        </div>
      </div>

      {error && <div className={classes.error}>{error}</div>}

      <div className={classes.rows}>
        <div className={`${classes.row} ${classes.rowHead}`}>
          <span>Category</span>
          <span>Planned</span>
          <span>Spent</span>
          <span>Left</span>
        </div>
        {detail?.categories.map((cat) => {
          const focused = drafts[cat.categoryId] !== undefined && drafts[cat.categoryId] !== null;
          const spentLeft = cat.plannedCents - cat.spentCents;
          const over = cat.plannedCents > 0 && cat.spentCents > cat.plannedCents;
          return (
            <div key={cat.categoryId} className={classes.row}>
              <span className={classes.catName}>{cat.name}</span>
              <input
                className={`${classes.amountInput} ${!focused && cat.plannedCents === 0 ? classes.faint : ''}`}
                value={focused
                  ? drafts[cat.categoryId] ?? ''
                  : formatCents(cat.plannedCents)}
                aria-label={`Planned amount for ${cat.name} this week`}
                inputMode="decimal"
                onFocus={(e) => {
                  if (!focused) {
                    setDrafts((p) => ({ ...p, [cat.categoryId]: formatCents(cat.plannedCents) }));
                  }
                  e.target.select();
                }}
                onBlur={(e) => {
                  // Pass the live input value: the memoized commitDraft may hold
                  // a stale `drafts` snapshot if React batched the re-render.
                  void commitDraft(cat.categoryId, e.currentTarget.value);
                }}
                onChange={(e) => setDrafts((p) => ({
                  ...p,
                  [cat.categoryId]: sanitizeAmountText(e.target.value),
                }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  else if (e.key === 'Escape') {
                    setDrafts((p) => ({ ...p, [cat.categoryId]: null }));
                    e.currentTarget.blur();
                  }
                }}
              />
              <span className={`${classes.num} ${cat.spentCents === 0 ? classes.faint : ''}`}>
                {formatCents(cat.spentCents)}
              </span>
              <span className={`${classes.num} ${over ? classes.over : cat.spentCents === 0 ? classes.faint : ''}`}>
                {over ? '⚠ ' : ''}{formatCents(spentLeft)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Close-week footer (spec Phase C): rollover leftover into next week */}
      {detail && !detail.isClosed && (
        <footer className={classes.closeBar}>
          {closeState === 'idle' && (
            <button
              type="button"
              className={classes.closeBtn}
              disabled={plannedTotal === 0}
              onClick={() => setCloseState('confirm')}
            >
              Close week review
            </button>
          )}
          {closeState === 'confirm' && (
            <div className={classes.confirmBox}>
              <span className={classes.confirmText}>
                Roll{' '}
                <strong>
                  {formatCents(
                    detail.categories.reduce(
                      (s, c) => s + Math.max(c.plannedCents - c.spentCents, 0),
                      0,
                    ),
                  )}
                </strong>{' '}
                of leftovers into next week?
              </span>
              <div className={classes.confirmActions}>
                <button
                  type="button"
                  className={classes.confirmRoll}
                  onClick={async () => {
                    setCloseState('closing');
                    try {
                      const result = await closeWeek(year, month, week.key, nextWeekKey, true);
                      setClosedMessage(
                        `Week closed — ${formatCents(result.rolledCents)} rolled to next week.`,
                      );
                      setCloseState('idle');
      await reload();
                      router.refresh();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Failed to close week');
                      setCloseState('idle');
                    }
                  }}
                >
                  Yes, roll it over
                </button>
                <button
                  type="button"
                  className={classes.confirmKeep}
                  onClick={async () => {
                    setCloseState('closing');
                    try {
                      await closeWeek(year, month, week.key, nextWeekKey, false);
                      setClosedMessage('Week closed — leftovers kept in place.');
                      setCloseState('idle');
      await reload();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Failed to close week');
                      setCloseState('idle');
                    }
                  }}
                >
                  Close without rolling
                </button>
                <button
                  type="button"
                  className={classes.confirmCancel}
                  onClick={() => setCloseState('idle')}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {closedMessage && <span className={classes.closedMessage}>{closedMessage}</span>}
        </footer>
      )}
    </div>
  );
}
