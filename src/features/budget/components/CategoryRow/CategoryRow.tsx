import { memo } from 'react';
import { formatMoney } from '../../utils/formatters';
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
    item.assigned,
    item.activity,
    item.meta,
  );
  const available = item.assigned - item.activity;

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
        className={`${classes.gCell} ${item.assigned === 0 ? classes.gFaint : ''}`}
      >
        {formatMoney(item.assigned)}
      </span>
      <span
        className={`${classes.gCell} ${item.activity === 0 ? classes.gFaint : ''}`}
      >
        {formatMoney(item.activity)}
      </span>
      <span className={`${classes.gAvailable} ${classes[state]}`}>
        {state === 'negative' && (
          <span className={classes.warnIcon} role="img" aria-label="Over spent">
            !
          </span>
        )}
        {formatMoney(available)}
      </span>
    </div>
  );
}

export default memo(CategoryRow);