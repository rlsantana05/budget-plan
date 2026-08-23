'use client';

import { memo } from 'react';
import type { BudgetTransactionDTO } from '@/types/budget';
import { Trash } from 'lucide-react';
import { formatCents } from '../../../utils/money';
import { formatTxDate } from '../../../utils/formatters';
import classes from './TransactionRow.module.css';

interface TransactionRowProps {
  tx: BudgetTransactionDTO;
  busy: 'add' | 'row' | null;
  onTrack: (id: string) => void;
  onDelete: (id: string) => void;
}

function TransactionRow({
  tx,
  busy,
  onTrack,
  onDelete,
}: TransactionRowProps) {
  return (
    <div className={classes.txRow}>
      <div className={classes.txMain}>
        <div className={classes.txPayee}>{tx.payee ?? 'Untracked'}</div>
        <div className={classes.txMeta}>
          {tx.categoryName ?? 'No category'}
          {' · '}
          {formatTxDate(tx.date)}
          {tx.accountName ? ` · ${tx.accountName}` : ''}
        </div>
      </div>
      <div className={classes.txRight}>
        <span
          className={`${classes.txAmount} ${
            tx.isIncome ? classes.txAmountIn : ''
          }`}
        >
          {tx.isIncome ? '+' : '-'}
          {formatCents(tx.amountCents)}
        </span>
        <div className={classes.txActions}>
          {tx.status === 'NEW' && (
          <button
            type="button"
            className={classes.txTrack}
            onClick={() => onTrack(tx.id)}
            disabled={busy !== null}
          >
            Track
          </button>
          )}
          {tx.status !== 'DELETED' && (
          <button
            type="button"
            className={classes.txDelete}
            onClick={() => onDelete(tx.id)}
            disabled={busy !== null}
            aria-label="Delete transaction"
          >
            <Trash size={13} />
          </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(TransactionRow);
