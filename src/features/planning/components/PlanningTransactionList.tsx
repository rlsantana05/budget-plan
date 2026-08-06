'use client';

import type { BudgetTransactionDTO } from '@/types/budget';
import PlanningTransactionRow from './PlanningTransactionRow';
import classes from './PlanningTransactionList.module.css';

interface PlanningTransactionListProps {
  groups: Array<{ label: string; txs: BudgetTransactionDTO[] }>;
  busy: 'add' | 'row' | null;
  onTrack: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PlanningTransactionList({
  groups,
  busy,
  onTrack,
  onDelete,
}: PlanningTransactionListProps) {
  return (
    <>
      {groups.map(({ label, txs }) => (
        <div className={classes.monthGroup} key={label}>
          <div className={classes.monthLabel}>{label}</div>
          {txs.length === 0 ? (
            <div className={classes.empty}>No transactions</div>
          ) : (
            txs.map((t) => (
              <PlanningTransactionRow
                key={t.id}
                tx={t}
                busy={busy}
                onTrack={onTrack}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      ))}
    </>
  );
}
