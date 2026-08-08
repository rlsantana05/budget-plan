'use client';

import {
  memo, useCallback, useEffect, useRef, useState,
} from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Check, GripVertical, Trash } from 'lucide-react';
import type { GroupItem } from '../types';
import { formatMoney, parseAmountText, sanitizeAmountText } from '../utils/formatters';
import classes from './PlanningBudgetGroupItemRow.module.css';

interface PlanningBudgetGroupItemRowProps {
  item: GroupItem;
  groupId: string;
  isIncome: boolean;
  busy: 'add' | 'row' | null;
  deleteArmingId: string | null;
  isDragging: boolean;
  onReceiveIncome: (item: GroupItem) => void;
  onArmDelete: (id: string | null) => void;
  onDeleteItem: (item: GroupItem, groupId: string) => void;
  onUpdateItem: (
    itemId: string,
    patch: { name: string; planned: number },
  ) => void;
  onGripPointerDown: (event: PointerEvent<HTMLElement>) => void;
}

function PlanningBudgetGroupItemRow({
  item,
  groupId,
  isIncome,
  busy,
  deleteArmingId,
  isDragging,
  onReceiveIncome,
  onArmDelete,
  onDeleteItem,
  onUpdateItem,
  onGripPointerDown,
}: PlanningBudgetGroupItemRowProps) {
  const [draftName, setDraftName] = useState(item.name);
  const [draftAmount, setDraftAmount] = useState(String(item.planned));
  const [amountFocused, setAmountFocused] = useState(false);
  const nameFocusedRef = useRef(false);
  const amountFocusedRef = useRef(false);
  const revertRef = useRef(false);

  useEffect(() => {
    if (!nameFocusedRef.current) setDraftName(item.name);
  }, [item.name]);

  useEffect(() => {
    if (!amountFocusedRef.current) setDraftAmount(String(item.planned));
  }, [item.planned]);

  const commitIfDirty = useCallback(() => {
    if (revertRef.current || busy !== null) {
      revertRef.current = false;
      return;
    }
    const name = draftName.trim();
    if (!name) {
      setDraftName(item.name);
      return;
    }
    const planned = parseAmountText(draftAmount);
    if (name !== item.name || planned !== item.planned) {
      onUpdateItem(item.id, { name, planned });
    }
  }, [busy, draftName, draftAmount, item, onUpdateItem]);

  const revertToItem = useCallback(() => {
    revertRef.current = true;
    setDraftName(item.name);
    setDraftAmount(String(item.planned));
  }, [item]);

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

  const handleDeleteClick = useCallback(() => {
    if (item.transactionCount > 0 && deleteArmingId !== item.id) {
      onArmDelete(item.id);
    } else {
      onDeleteItem(item, groupId);
    }
  }, [item, groupId, deleteArmingId, onArmDelete, onDeleteItem]);

  let amountDisplay = draftAmount ? `${formatMoney(parseAmountText(draftAmount))}` : '';
  if (amountFocused) amountDisplay = draftAmount;

  return (
    <>
      <div className={`${classes.gRow} ${isDragging ? classes.dragging : ''}`}>
        <span className={classes.gNameCell}>
          <button
            type="button"
            className={classes.grip}
            aria-label={`Drag to reorder ${item.name}`}
            onPointerDown={onGripPointerDown}
          >
            <GripVertical size={14} />
          </button>
          <input
            className={classes.gNameInput}
            value={draftName}
            aria-label="Item name"
            onFocus={(e) => {
              nameFocusedRef.current = true;
              e.target.select();
            }}
            onBlur={() => {
              nameFocusedRef.current = false;
              commitIfDirty();
            }}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={handleNameKeyDown}
          />
        </span>
        <input
          className={classes.gAmountInput}
          value={amountDisplay}
          aria-label="Planned amount"
          inputMode="decimal"
          onFocus={(e) => {
            setAmountFocused(true);
            amountFocusedRef.current = true;
            e.target.select();
          }}
          onBlur={() => {
            setAmountFocused(false);
            amountFocusedRef.current = false;
            commitIfDirty();
          }}
          onChange={(e) => setDraftAmount(sanitizeAmountText(e.target.value))}
          onKeyDown={handleAmountKeyDown}
        />
        <span className={classes.gValue}>
          {formatMoney(isIncome ? item.received : item.spent)}
        </span>
        <span className={`${classes.gValue} ${classes.gRemaining}`}>
          {formatMoney(item.remaining)}
        </span>
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

export default memo(PlanningBudgetGroupItemRow);
