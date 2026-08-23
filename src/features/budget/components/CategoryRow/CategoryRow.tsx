'use client';

import { memo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  assignToCategory,
  moveBetweenCategories,
} from '@/actions/budget-planning';
import { formatCents, parseAmountToCents, sanitizeAmountText } from '../../utils/formatters';
import type { BudgetCategoryItem, BudgetGroup, CategoryMeta } from '../../types/budget.types';
import MetaPill from '../MetaPill/MetaPill';
import classes from './CategoryRow.module.css';

type AvailableState = 'negative' | 'positive' | 'due' | 'neutral';

function getAvailableState(
  assignedCents: number,
  activityCents: number,
  meta?: CategoryMeta,
): AvailableState {
  const available = assignedCents - activityCents;
  if (available < 0) return 'negative';
  if (available > 0) return 'positive';
  if (meta?.type === 'due') return 'due';
  return 'neutral';
}

interface CategoryRowProps {
  item: BudgetCategoryItem;
  /** Sibling groups for the cover-overspend donor picker. */
  allGroups?: BudgetGroup[];
}

function CategoryRow({ item, allGroups }: CategoryRowProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<string | null>(null);
  const [covering, setCovering] = useState(false);
  const [donorId, setDonorId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const state: AvailableState = getAvailableState(
    item.assignedCents,
    item.activityCents,
    item.meta,
  );
  const availableCents = item.assignedCents - item.activityCents;
  const focused = draft !== null;

  const commitAssign = useCallback(async () => {
    setDraft(null);
    if (draft === null) return;
    const amountCents = parseAmountToCents(draft);
    if (amountCents === item.assignedCents) return;
    setError(null);
    try {
      await assignToCategory(item.id, amountCents);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, [draft, item, router]);

  const coverOverspend = useCallback(async () => {
    if (!donorId) return;
    const shortfall = -availableCents;
    setError(null);
    try {
      await moveBetweenCategories(donorId, item.id, shortfall / 100);
      setCovering(false);
      setDonorId('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, [availableCents, donorId, item, router]);

  const donors = (allGroups ?? [])
    .flatMap((g) => g.items)
    .filter((it) => it.id !== item.id && it.assignedCents - it.activityCents > 0);

  return (
    <>
      <div
        className={`${classes.gRow} ${item.meta ? classes.gRowWithPill : ''}`}
        data-category-row
      >
        <span className={classes.gCategoryCell}>
          <span className={classes.gName}>{item.name}</span>
          {item.meta && <MetaPill meta={item.meta} />}
        </span>

        <input
          className={`${classes.gCell} ${classes.assignInput} ${!focused && item.assignedCents === 0 ? classes.gFaint : ''}`}
          value={focused ? draft ?? '' : formatCents(item.assignedCents)}
          aria-label={`Assigned amount for ${item.name}`}
          inputMode="decimal"
          onFocus={(e) => {
            if (draft === null) setDraft(formatCents(item.assignedCents));
            e.target.select();
          }}
          onBlur={commitAssign}
          onChange={(e) => setDraft(sanitizeAmountText(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setDraft(null);
              e.currentTarget.blur();
            }
          }}
        />
        <span
          className={`${classes.gCell} ${item.activityCents === 0 ? classes.gFaint : ''}`}
        >
          {formatCents(item.activityCents)}
        </span>
        <span className={`${classes.gAvailable} ${classes[state]}`}>
          {state === 'negative' && (
            <button
              type="button"
              className={classes.coverBtn}
              aria-label={`Cover overspend of ${formatCents(-availableCents)} for ${item.name}`}
              title="Cover this overspend from another category"
              onClick={() => setCovering((v) => !v)}
            >
              !
            </button>
          )}
          {formatCents(availableCents)}
        </span>
      </div>

      {covering && (
        <div className={classes.coverRow}>
          <select
            className={classes.coverSelect}
            value={donorId}
            onChange={(e) => setDonorId(e.target.value)}
            aria-label={`Source category to cover ${item.name}`}
          >
            <option value="">Choose a category…</option>
            {donors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {' — '}
                {formatCents(d.assignedCents - d.activityCents)}
                {' available'}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={classes.coverConfirm}
            disabled={!donorId}
            onClick={coverOverspend}
          >
            Cover {formatCents(-availableCents)}
          </button>
          <button
            type="button"
            className={classes.coverCancel}
            onClick={() => {
              setCovering(false);
              setDonorId('');
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {error && <div className={classes.error}>{error}</div>}
    </>
  );
}

export default memo(CategoryRow);
