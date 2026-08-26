'use client';

import { ArrowLeft, Pencil, Target } from 'lucide-react';
import { Sparkline } from '@mantine/charts';
import type { BudgetTransactionDTO } from '@/types/budget';
import type { GroupItem } from '../../../types';
import { formatCents, fromCents } from '../../../utils/money';
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
  const targetShortfall = item.neededCents > 0;
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
        {formatCents(item.plannedCents)}
      </div>

      <div className={classes.stats}>
        <div className={classes.statBlock}>
          <span className={classes.statLabel}>Assigned</span>
          <span className={`${classes.statValue} ${classes.statAssigned}`}>
            {formatCents(item.fundedCents)}
          </span>
        </div>
        <div className={classes.statBlock}>
          <span className={classes.statLabel}>Activity</span>
          <span className={`${classes.statValue} ${classes.statSpent}`}>
            {formatCents(item.spentCents)}
          </span>
        </div>
        <div className={classes.statBlock}>
          <span className={classes.statLabel}>Available</span>
          <span className={`${classes.statValue} ${classes.statAvailable} ${item.remainingCents < 0 ? classes.statAvailableNegative : ''}`}>
            {formatCents(item.remainingCents)}
          </span>
        </div>
      </div>

      {item.trend.length > 0 && (
        <div className={classes.trendCard}>
          <span className={classes.txHeader}>Spending trend</span>
          <Sparkline
            data={item.trend.map((t) => fromCents(t.activityCents))}
            strokeWidth={2}
            color="var(--accent-bright)"
            fillOpacity={0.15}
          />
          <div className={classes.trendLabels}>
            {item.trend.map((point, index) => (
              <span key={`${point.month}-${index}`} className={classes.trendLabel}>
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
                    {formatCents(item.neededCents)}
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
                {assignBusy ? 'Assigning…' : `Assign ${formatCents(Math.min(item.neededCents, readyToAssign))}`}
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
