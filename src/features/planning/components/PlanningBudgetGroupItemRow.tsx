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
  isSelected: boolean;
  onSelectItem: (item: GroupItem) => void;
  onReceiveIncome: (item: GroupItem) => void;
  onArmDelete: (id: string | null) => void;
  onDeleteItem: (item: GroupItem, groupId: string) => void;
  onUpdateItem: (
    itemId: string,
    patch: { name: string; planned: number },
  ) => void;
  onAssignAmount: (item: GroupItem, amount: number) => void;
  onGripPointerDown: (event: PointerEvent<HTMLElement>) => void;
}

function PlanningBudgetGroupItemRow({
  item,
  groupId,
  isIncome,
  busy,
  deleteArmingId,
  isDragging,
  isSelected,
  onSelectItem,
  onReceiveIncome,
  onArmDelete,
  onDeleteItem,
  onUpdateItem,
  onAssignAmount,
  onGripPointerDown,
}: PlanningBudgetGroupItemRowProps) {
  const [draftName, setDraftName] = useState(item.name);
  const [draftAmount, setDraftAmount] = useState(String(item.planned));
  const [amountFocused, setAmountFocused] = useState(false);
  const [draftAssigned, setDraftAssigned] = useState(String(item.funded));
  const [assignedFocused, setAssignedFocused] = useState(false);
  const nameFocusedRef = useRef(false);
  const amountFocusedRef = useRef(false);
  const assignedFocusedRef = useRef(false);
  const revertRef = useRef(false);

  useEffect(() => {
    if (!nameFocusedRef.current) setDraftName(item.name);
  }, [item.name]);

  useEffect(() => {
    if (!amountFocusedRef.current) setDraftAmount(String(item.planned));
  }, [item.planned]);

  useEffect(() => {
    if (!assignedFocusedRef.current) setDraftAssigned(String(item.funded));
  }, [item.funded]);

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

  const commitAssignedIfDirty = useCallback(() => {
    if (busy !== null) return;
    const assigned = parseAmountText(draftAssigned);
    if (assigned !== item.funded) {
      onAssignAmount(item, assigned);
    }
  }, [busy, draftAssigned, item, onAssignAmount]);

  const revertAssignedToItem = useCallback(() => {
    setDraftAssigned(String(item.funded));
  }, [item.funded]);

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
    onSelectItem(item);
  }, [isIncome, item, onSelectItem]);

  const isGripTarget = useCallback((target: EventTarget | null) => {
    const node = target as HTMLElement | null;
    if (!node) return false;
    return Boolean(node.closest('[data-row-drag]'));
  }, []);

  let amountDisplay = draftAmount ? `${formatMoney(parseAmountText(draftAmount))}` : '';
  if (amountFocused) amountDisplay = draftAmount;

  let assignedDisplay = draftAssigned ? `${formatMoney(parseAmountText(draftAssigned))}` : '';
  if (assignedFocused) assignedDisplay = draftAssigned;

  let remainingClass = classes.gZero;
  if (item.remaining > 0) remainingClass = classes.gPositive;
  else if (item.remaining < 0) remainingClass = classes.gNegative;

  return (
    <>
      <div
        className={`${classes.gRow} ${isIncome ? classes.gRowIncome : ''} ${isSelected ? classes.selected : ''} ${isDragging ? classes.dragging : ''}`}
        data-category-row
        role="button"
        tabIndex={0}
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
          {!isIncome && (
            <span className={classes.gNote}>
              {item.targetType !== 'NONE' && (
                item.needed > 0 ? (
                  <>
                    {formatMoney(item.needed)}
                    {' '}
                    needed by
                    {' '}
                    {item.targetDue}
                  </>
                ) : (
                  <>
                    Target met ·
                    {' '}
                    {item.targetDue}
                  </>
                )
              )}
            </span>
          )}
        </span>
        {isIncome && (
          <input
            className={classes.gAmountInput}
            value={amountDisplay}
            aria-label="Planned income amount"
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
        )}
        {isIncome ? (
          <span className={classes.gValue}>{formatMoney(item.received)}</span>
        ) : (
          <>
            <span aria-hidden="true" />
            <input
              className={classes.gAmountInput}
              value={assignedDisplay}
              aria-label={`Assigned amount for ${item.name}`}
              inputMode="decimal"
              onFocus={(e) => {
                setAssignedFocused(true);
                assignedFocusedRef.current = true;
                e.target.select();
              }}
              onBlur={() => {
                setAssignedFocused(false);
                assignedFocusedRef.current = false;
                commitAssignedIfDirty();
              }}
              onChange={(e) => setDraftAssigned(sanitizeAmountText(e.target.value))}
              onKeyDown={handleAssignedKeyDown}
            />
            <span className={classes.gValue}>{formatMoney(item.spent)}</span>
            <span className={`${classes.gValue} ${remainingClass}`}>
              {formatMoney(item.remaining)}
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

export default memo(PlanningBudgetGroupItemRow);
