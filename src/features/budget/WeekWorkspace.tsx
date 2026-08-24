'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
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
}

/**
 * Planned-week workspace (spec 2026-08-23-budget-weekly-ledger Phase B):
 * income expected / planned / left + per-category planned vs spent rows.
 * Inline editing writes week-tagged ASSIGN ledger rows.
 */
export default function WeekWorkspace({ year, month, week }: WeekWorkspaceProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<WeekDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getWeekDetail(year, month, week.key);
      setDetail(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load week');
    } finally {
      setLoading(false);
    }
  }, [year, month, week.key]);

  useEffect(() => {
    void load();
  }, [load]);

  const commitDraft = useCallback(async (categoryId: string) => {
    const draft = drafts[categoryId];
    setDrafts((prev) => ({ ...prev, [categoryId]: null }));
    if (draft === null || draft === undefined) return;
    const cents = parseAmountToCents(draft);
    const current = detail?.categories.find((c) => c.categoryId === categoryId)?.plannedCents;
    if (cents === current) return;
    setError(null);
    try {
      await assignToCategory(categoryId, cents / 100, week.key);
      await load();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, [detail, drafts, load, router, week.key]);

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
                onBlur={() => void commitDraft(cat.categoryId)}
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
    </div>
  );
}
