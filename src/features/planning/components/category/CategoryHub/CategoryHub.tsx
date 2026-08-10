'use client';

import { ArrowLeft, Pencil, Target } from 'lucide-react';
import { Sparkline } from '@mantine/charts';
import type { BudgetTransactionDTO } from '@/types/budget';
import type { GroupItem } from '../../../types';
import { formatMoney } from '../../../utils/formatters';
import TransactionList from '../../transactions/TransactionList/TransactionList';
import classes from './CategoryHub.module.css';

interface CategoryHubProps {
  item: GroupItem;
  transactions: BudgetTransactionDTO[];
  busy: 'add' | 'row' | null;
  onTrack: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  onAssign: (item: GroupItem) => void;
  readyToAssign: number;
  assignBusy: boolean;
  onEditTarget: (item: GroupItem) => void;
}

export default function CategoryHub({
  item,
  transactions,
  busy,
  onTrack,
  onDelete,
  onBack,
  onAssign,
  readyToAssign,
  assignBusy,
  onEditTarget,
}: CategoryHubProps) {
  const hasTarget = item.targetType !== 'NONE';
  const targetShortfall = item.needed > 0;
  const assignable = readyToAssign > 0 && targetShortfall && !assignBusy;

  return (
    <div className={classes.hub}>
      <button type="button" className={classes.backChip} onClick={onBack}>
        <ArrowLeft size={13} />
        <span>All</span>
      </button>

      <div className={classes.hubTitle}>
        <span className={classes.hubName}>{item.name}</span>
        {hasTarget && (
          <span className={classes.targetBadge}>
            <Target size={12} />
            {item.targetType === 'ONCE' ? 'Once' : 'Monthly'}
          </span>
        )}
      </div>
      <div className={classes.hubPlanned}>
        Planned
        {' '}
        {formatMoney(item.planned)}
      </div>

      <div className={classes.stats}>
        <div className={classes.statBlock}>
          <span className={classes.statLabel}>Assigned</span>
          <span className={`${classes.statValue} ${classes.statAssigned}`}>
            {formatMoney(item.funded)}
          </span>
        </div>
        <div className={classes.statBlock}>
          <span className={classes.statLabel}>Activity</span>
          <span className={`${classes.statValue} ${classes.statSpent}`}>
            {formatMoney(item.spent)}
          </span>
        </div>
        <div className={classes.statBlock}>
          <span className={classes.statLabel}>Available</span>
          <span className={`${classes.statValue} ${classes.statAvailable} ${item.remaining < 0 ? classes.statAvailableNegative : ''}`}>
            {formatMoney(item.remaining)}
          </span>
        </div>
      </div>

      {item.trend.length > 0 && (
        <div className={classes.trendCard}>
          <span className={classes.txHeader}>Spending trend</span>
          <Sparkline
            data={item.trend.map((t) => t.activity)}
            strokeWidth={2}
            color="var(--accent-bright)"
            fillOpacity={0.15}
          />
          <div className={classes.trendLabels}>
            {item.trend.map((point) => (
              <span key={point.month} className={classes.trendLabel}>
                {point.month}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={classes.targetCard}>
        <div className={classes.targetCardHeader}>
          <span className={classes.targetCardLabel}>
            {hasTarget ? 'Target' : 'No target set'}
          </span>
          <button
            type="button"
            className={classes.editTargetBtn}
            aria-label={`Edit target for ${item.name}`}
            onClick={() => onEditTarget(item)}
          >
            <Pencil size={13} />
            <span>{hasTarget ? 'Edit' : 'Set'}</span>
          </button>
        </div>

        {hasTarget && (
          <div className={`${classes.targetNote} ${targetShortfall ? classes.targetNoteShort : classes.targetNoteMet}`}>
            <div className={classes.targetRow}>
              <span>
                {targetShortfall ? (
                  <>
                    {formatMoney(item.needed)}
                    {' '}
                    still needed by
                    {' '}
                    {item.targetDue}
                  </>
                ) : (
                  <>
                    Fully funded ·
                    {' '}
                    {item.targetDue}
                  </>
                )}
              </span>
            </div>
            {targetShortfall && (
              <button
                type="button"
                className={classes.assignBtn}
                disabled={!assignable || busy !== null}
                onClick={() => onAssign(item)}
              >
                {assignBusy ? 'Assigning…' : `Assign ${formatMoney(Math.min(item.needed, readyToAssign))}`}
              </button>
            )}
          </div>
        )}
      </div>

      <div className={classes.txHeader}>Transactions</div>
      <div className={classes.txList}>
        {transactions.length === 0 ? (
          <div className={classes.empty}>No transactions in this category</div>
        ) : (
          <TransactionList
            groups={[{ label: 'Recent', txs: transactions }]}
            busy={busy}
            onTrack={onTrack}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}
