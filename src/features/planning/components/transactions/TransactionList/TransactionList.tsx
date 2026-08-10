'use client';

import type { BudgetTransactionDTO } from '@/types/budget';
import TransactionRow from './TransactionRow';
import classes from './TransactionList.module.css';

interface TransactionListProps {
  groups: Array<{ label: string; txs: BudgetTransactionDTO[] }>;
  busy: 'add' | 'row' | null;
  onTrack: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TransactionList({
  groups,
  busy,
  onTrack,
  onDelete,
}: TransactionListProps) {
  return (
    <>
      {groups.map(({ label, txs }) => (
        <div className={classes.monthGroup} key={label}>
          <div className={classes.monthLabel}>{label}</div>
          {txs.length === 0 ? (
            <div className={classes.empty}>No transactions</div>
          ) : (
            txs.map((t) => (
              <TransactionRow
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
