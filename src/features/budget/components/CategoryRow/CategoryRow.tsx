import { memo } from 'react';
import { formatCents } from '../../utils/formatters';
import type { BudgetCategoryItem, CategoryMeta } from '../../types/budget.types';
import MetaPill from '../MetaPill/MetaPill';
import classes from './CategoryRow.module.css';

type AvailableState = 'negative' | 'positive' | 'due' | 'neutral';

function getAvailableState(
  assigned: number,
  activity: number,
  meta?: CategoryMeta,
): AvailableState {
  const available = assigned - activity;

  if (available < -0.004) return 'negative';
  if (available > 0.004) return 'positive';
  if (meta?.type === 'due') return 'due';
  return 'neutral';
}

interface CategoryRowProps {
  item: BudgetCategoryItem;
  onAddItem?: () => void;
}

function CategoryRow({ item }: CategoryRowProps) {
  const state: AvailableState = getAvailableState(
    item.assignedCents,
    item.activityCents,
    item.meta,
  );
  const availableCents = item.assignedCents - item.activityCents;

  return (
    <div
      className={`${classes.gRow} ${item.meta ? classes.gRowWithPill : ''}`}
      data-category-row
    >
      <span className={classes.gCategoryCell}>
        <span className={classes.gName}>{item.name}</span>
        {item.meta && <MetaPill meta={item.meta} />}
      </span>

      <span
        className={`${classes.gCell} ${item.assignedCents === 0 ? classes.gFaint : ''}`}
      >
        {formatCents(item.assignedCents)}
      </span>
      <span
        className={`${classes.gCell} ${item.activityCents === 0 ? classes.gFaint : ''}`}
      >
        {formatCents(item.activityCents)}
      </span>
      <span className={`${classes.gAvailable} ${classes[state]}`}>
        {state === 'negative' && (
          <span className={classes.warnIcon} role="img" aria-label="Over spent">
            !
          </span>
        )}
        {formatCents(availableCents)}
      </span>
    </div>
  );
}

export default memo(CategoryRow);