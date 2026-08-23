'use client';

import {
  memo, useCallback, useEffect, useRef, useState,
} from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Check, GripVertical, Trash } from 'lucide-react';
import type { GroupItem } from '../../../types';
import {
  formatCents,
  fromCents,
  parseAmountToCents,
  sanitizeAmountText,
} from '../../../utils/money';
import { getAvailableStatus, resolveTargetDueDate } from '../../../utils/status';
import type { AvailableStatus } from '../../../utils/status';
import { useBudgetGroupsStore } from '../../../store/budgetGroupsStore';
import classes from './BudgetGroupCardItem.module.css';

interface BudgetGroupCardItemProps {
  item: GroupItem;
  groupId: string;
  isIncome: boolean;
  isDragging: boolean;
  onGripPointerDown: (event: PointerEvent<HTMLElement>) => void;
}

function BudgetGroupCardItem({
  item,
  groupId,
  isIncome,
  isDragging,
  onGripPointerDown,
}: BudgetGroupCardItemProps) {
  const busy = useBudgetGroupsStore((s) => s.busy);
  const deleteArmingId = useBudgetGroupsStore((s) => s.deleteArmingId);
  const isSelected = useBudgetGroupsStore((s) => s.selectedItemId === item.id);
  const onSelectItem = useBudgetGroupsStore((s) => s.setSelectedItemId);
  const onReceiveIncome = useBudgetGroupsStore((s) => s.handleReceiveIncome);
  const onArmDelete = useBudgetGroupsStore((s) => s.setDeleteArmingId);
  const onDeleteItem = useBudgetGroupsStore((s) => s.handleDeleteItem);
  const onUpdateItem = useBudgetGroupsStore((s) => s.handleUpdateItem);
  const onAssignAmount = useBudgetGroupsStore((s) => s.handleAssignAmount);

  // Drafts exist ONLY while their input is focused; display derives from the
  // committed item otherwise (spec: no draft-sync effects).
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftAmount, setDraftAmount] = useState<string | null>(null);
  const [draftAssigned, setDraftAssigned] = useState<string | null>(null);
  const revertRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const nameValue = draftName ?? item.name;
  const amountFocused = draftAmount !== null;
  const assignedFocused = draftAssigned !== null;

  useEffect(() => {
    if (item.name === 'New category' && item.plannedCents === 0) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [item.name, item.plannedCents]);

  const commitIfDirty = useCallback(() => {
    if (revertRef.current || busy !== null) {
      revertRef.current = false;
      setDraftName(null);
      setDraftAmount(null);
      return;
    }
    const name = nameValue.trim();
    if (!name) {
      setDraftName(null);
      return;
    }
    const plannedCents = draftAmount !== null
      ? parseAmountToCents(draftAmount)
      : item.plannedCents;
    if (name !== item.name || plannedCents !== item.plannedCents) {
      onUpdateItem(item.id, { name, plannedCents });
    }
    setDraftName(null);
    setDraftAmount(null);
  }, [busy, draftAmount, nameValue, item, onUpdateItem]);

  const revertToItem = useCallback(() => {
    revertRef.current = true;
    setDraftName(null);
    setDraftAmount(null);
  }, []);

  const handleNameKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.currentTarget.blur();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        revertToItem();
        event.currentTarget.blur();
      }
    },
    [revertToItem],
  );

  const handleAmountKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.currentTarget.blur();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        revertToItem();
        event.currentTarget.blur();
      }
    },
    [revertToItem],
  );

  const commitAssignedIfDirty = useCallback(() => {
    if (busy !== null) {
      setDraftAssigned(null);
      return;
    }
    if (draftAssigned === null) return;
    const assignedCents = parseAmountToCents(draftAssigned);
    setDraftAssigned(null);
    if (assignedCents !== item.fundedCents) {
      onAssignAmount(item, assignedCents);
    }
  }, [busy, draftAssigned, item, onAssignAmount]);

  const revertAssignedToItem = useCallback(() => {
    setDraftAssigned(null);
  }, []);

  const handleAssignedKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.currentTarget.blur();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        revertAssignedToItem();
        event.currentTarget.blur();
      }
    },
    [revertAssignedToItem],
  );

  const handleDeleteClick = useCallback(() => {
    if (item.transactionCount > 0 && deleteArmingId !== item.id) {
      onArmDelete(item.id);
    } else {
      onDeleteItem(item, groupId);
    }
  }, [item, groupId, deleteArmingId, onArmDelete, onDeleteItem]);

  const handleRowClick = useCallback(() => {
    if (isIncome) return;
    onSelectItem(item.id);
  }, [isIncome, item.id, onSelectItem]);

  const isGripTarget = useCallback((target: EventTarget | null) => {
    const node = target as HTMLElement | null;
    if (!node) return false;
    return Boolean(node.closest('[data-row-drag]'));
  }, []);

  const amountDisplay = amountFocused && draftAmount !== null
    ? draftAmount
    : formatCents(item.plannedCents);

  const assignedDisplay = assignedFocused && draftAssigned !== null
    ? draftAssigned
    : formatCents(item.fundedCents);

  const status: AvailableStatus = getAvailableStatus(
    fromCents(item.fundedCents),
    fromCents(item.targetAmountCents),
    resolveTargetDueDate(item),
  );
  const statusClass = {
    complete: classes.statusComplete,
    'at-risk': classes.statusAtRisk,
    'in-progress': classes.statusInProgress,
    unset: classes.statusUnset,
  }[status];
  const showCaption = !isIncome
    && (status === 'at-risk' || status === 'in-progress')
    && item.targetDue
    && item.neededCents > 0;

  return (
    <>
      <div
        className={`${classes.gRow} ${isIncome ? classes.gRowIncome : ''} ${isSelected ? classes.selected : ''} ${isDragging ? classes.dragging : ''}`}
        data-category-row
        role="button"
        tabIndex={isIncome ? -1 : 0}
        aria-pressed={isSelected}
        aria-label={`${item.name} — open details`}
        onClick={(event) => {
          if (!isGripTarget(event.target)) handleRowClick();
        }}
        onKeyDown={(event) => {
          if (isIncome) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleRowClick();
          }
        }}
        onFocus={(event) => {
          if (event.target !== event.currentTarget) event.currentTarget.blur();
        }}
      >
        <span className={classes.gNameCell}>
          <button
            type="button"
            className={classes.grip}
            data-row-drag
            aria-label={`Drag to reorder ${item.name}`}
            onPointerDown={onGripPointerDown}
          >
            <GripVertical size={14} />
          </button>
          <input
            ref={nameInputRef}
            className={classes.gNameInput}
            value={nameValue}
            aria-label="Item name"
            onFocus={(e) => {
              if (draftName === null) setDraftName(item.name);
              e.target.select();
            }}
            onBlur={() => {
              commitIfDirty();
            }}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={handleNameKeyDown}
          />
          {!isIncome && status === 'complete' && (
            <span
              className={classes.gComplete}
              aria-label={`${item.name} target met`}
            >
              <Check size={14} />
            </span>
          )}
          {showCaption && (
            <div className={classes.gCaption}>
              {formatCents(item.neededCents)}
              {' '}
              {status === 'at-risk' ? 'needed by' : 'more by'}
              {' '}
              {item.targetDue}
            </div>
          )}
        </span>
        {isIncome && (
          <input
            className={classes.gAmountInput}
            value={amountDisplay}
            aria-label="Planned income amount"
            inputMode="decimal"
            onFocus={(e) => {
              if (draftAmount === null) setDraftAmount(formatCents(item.plannedCents));
              e.target.select();
            }}
            onBlur={() => {
              commitIfDirty();
            }}
            onChange={(e) => setDraftAmount(sanitizeAmountText(e.target.value))}
            onKeyDown={handleAmountKeyDown}
          />
        )}
        {isIncome ? (
          <span className={classes.gValue}>{formatCents(item.receivedCents)}</span>
        ) : (
          <>
            <input
              className={classes.gAmountInput}
              value={assignedDisplay}
              aria-label={`Assigned amount for ${item.name}`}
              inputMode="decimal"
              onFocus={(e) => {
                if (draftAssigned === null) setDraftAssigned(formatCents(item.fundedCents));
                e.target.select();
              }}
              onBlur={() => {
                commitAssignedIfDirty();
              }}
              onChange={(e) => setDraftAssigned(sanitizeAmountText(e.target.value))}
              onKeyDown={handleAssignedKeyDown}
            />
            <span className={classes.gValue}>{formatCents(item.spentCents)}</span>
            <span className={`${classes.pill} ${statusClass}`}>
              <span className={classes.pillText}>{formatCents(item.remainingCents)}</span>
            </span>
          </>
        )}
        <div className={classes.gActions}>
          {isIncome && (
            <button
              type="button"
              className={classes.gAction}
              disabled={busy !== null}
              aria-label={`Mark ${item.name} as received`}
              onClick={() => onReceiveIncome(item)}
            >
              <Check size={15} />
            </button>
          )}
          <button
            type="button"
            className={`${classes.gAction} ${classes.gActionDanger}`}
            disabled={busy !== null}
            aria-label={`Delete ${item.name}`}
            onClick={handleDeleteClick}
          >
            <Trash size={15} />
          </button>
        </div>
      </div>
      {deleteArmingId === item.id && item.transactionCount > 0 && (
        <div className={classes.deleteWarning}>
          <span>
            {item.transactionCount}
            {' '}
            {item.transactionCount === 1 ? 'transaction' : 'transactions'}
            {' '}
            will
            be hidden with this category
          </span>
          <div className={classes.deleteWarningActions}>
            <button
              type="button"
              className={classes.deleteWarningConfirm}
              onClick={() => onDeleteItem(item, groupId)}
            >
              Delete
            </button>
            <button
              type="button"
              className={classes.deleteWarningCancel}
              onClick={() => onArmDelete(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(BudgetGroupCardItem);
