'use client';

import type { RefObject } from 'react';
import {
  memo, useCallback, useEffect, useRef, useState,
} from 'react';
import { AnimatePresence, Reorder } from 'framer-motion';
import { Collapse } from '@mantine/core';
import { ChevronDown } from 'lucide-react';
import type { Group, GroupItem } from '../types';
import sharedClasses from '../styles/PlanningShared.module.css';
import classes from './PlanningBudgetGroupCard.module.css';
import PlanningBudgetGroupReorderItem from './PlanningBudgetGroupReorderItem';
import PlanningAddCategoryItemForm from './PlanningAddCategoryItemForm';
import { formatMoney } from '../utils/formatters';
import rowClasses from './PlanningBudgetGroupItemRow.module.css';

interface PlanningBudgetGroupCardProps {
  group: Group;
  isExpanded: boolean;
  onToggle: () => void;
  onReorder: (orderedIds: string[]) => void;
  onReorderEnd: (orderedIds: string[]) => void;
  onUpdateItem: (itemId: string, patch: { name: string; planned: number }) => void;

  busy: 'add' | 'row' | null;
  deleteArmingId: string | null;
  onArmDelete: (id: string | null) => void;
  onDeleteItem: (item: GroupItem, groupId: string) => void;
  onReceiveIncome: (item: GroupItem) => void;

  addItemGroup: string | null;
  onBeginAdd: () => void;
  newItemName: string;
  onNewItemNameChange: (value: string) => void;
  amountText: string;
  onAmountChange: (value: string) => void;
  onAddItem: () => void;
  onCancelAdd: () => void;
  nameInputRef: RefObject<HTMLInputElement | null>;
  amountInputRef: RefObject<HTMLInputElement | null>;

  receiveHint: string | null;
}

function PlanningBudgetGroupCard({
  group,
  isExpanded,
  onToggle,
  onReorder,
  onReorderEnd,
  onUpdateItem,
  busy,
  deleteArmingId,
  onArmDelete,
  onDeleteItem,
  onReceiveIncome,
  addItemGroup,
  onBeginAdd,
  newItemName,
  onNewItemNameChange,
  amountText,
  onAmountChange,
  onAddItem,
  onCancelAdd,
  nameInputRef,
  amountInputRef,
  receiveHint,
}: PlanningBudgetGroupCardProps) {
  const reorderWrapRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const startOrderRef = useRef<string[] | null>(null);
  const pendingOrderRef = useRef<string[] | null>(null);
  const latestOrderRef = useRef<string[]>(group.items.map((it) => it.id));
  const draggingIdRef = useRef<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  useEffect(() => {
    latestOrderRef.current = group.items.map((it) => it.id);
  }, [group.items]);

  const showIndicator = useCallback((top: number | null) => {
    const el = indicatorRef.current;
    if (!el) return;
    if (top === null) {
      el.style.opacity = '0';
      return;
    }
    el.style.transform = `translateY(${top}px)`;
    el.style.opacity = '1';
  }, []);

  const registerItemRef = useCallback((id: string, el: HTMLElement | null) => {
    itemRefs.current[id] = el;
  }, []);

  const handleDragStart = useCallback((id: string) => {
    draggingIdRef.current = id;
    setDraggingItemId(id);
    startOrderRef.current = latestOrderRef.current;
    pendingOrderRef.current = null;
  }, []);

  const handleLiveReorder = useCallback(
    (orderedIds: string[]) => {
      latestOrderRef.current = orderedIds;
      onReorder(orderedIds);
      pendingOrderRef.current = orderedIds;
    },
    [onReorder],
  );

  const handleDrag = useCallback(() => {
    const wrapEl = reorderWrapRef.current;
    const draggingId = draggingIdRef.current;
    if (!wrapEl || !draggingId) return;
    const order = latestOrderRef.current;
    const idx = order.findIndex((id) => id === draggingId);
    if (idx === -1) return;
    const wrapRect = wrapEl.getBoundingClientRect();
    let top = 0;
    if (idx > 0) {
      const above = order[idx - 1];
      const el = itemRefs.current[above];
      if (!el) return;
      top = el.getBoundingClientRect().bottom - wrapRect.top - 1;
    }
    showIndicator(top);
  }, [showIndicator]);

  const handleDragEnd = useCallback(() => {
    const start = startOrderRef.current;
    const pending = pendingOrderRef.current;
    draggingIdRef.current = null;
    setDraggingItemId(null);
    showIndicator(null);
    startOrderRef.current = null;
    pendingOrderRef.current = null;
    if (!start || !pending || start.length !== pending.length) return;
    const changed = start.some((value, index) => value !== pending[index]);
    if (changed) onReorderEnd(pending);
  }, [onReorderEnd, showIndicator]);

  return (
    <div className={`${sharedClasses.card} ${classes.groupCard}`}>
      <div className={classes.gHeader}>
        <button
          type="button"
          className={classes.gTitleBtn}
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <span>{group.name}</span>
          <ChevronDown
            size={14}
            className={`${classes.gChev} ${isExpanded ? '' : classes.open}`}
          />
        </button>
        <span className={classes.gCol}>Planned</span>
        <span className={classes.gCol}>{group.isIncome ? 'Received' : 'Spent'}</span>
        <span className={classes.gCol}>Remaining</span>
      </div>

      <Collapse expanded={isExpanded}>
        {/* <div className={classes.gDivider} /> */}
        <div className={classes.items}>
          <div className={classes.reorderWrap} ref={reorderWrapRef}>
            <Reorder.Group
              axis="y"
              values={group.items.map((it) => it.id)}
              onReorder={handleLiveReorder}
              className={classes.reorderGroup}
            >
              <AnimatePresence initial={false} mode="popLayout">
                {group.items.map((item) => (
                  <PlanningBudgetGroupReorderItem
                    key={item.id}
                    item={item}
                    groupId={group.id}
                    isIncome={group.isIncome}
                    isDragging={draggingItemId === item.id}
                    busy={busy}
                    deleteArmingId={deleteArmingId}
                    onArmDelete={onArmDelete}
                    onDeleteItem={onDeleteItem}
                    onReceiveIncome={onReceiveIncome}
                    onUpdateItem={onUpdateItem}
                    registerItemRef={registerItemRef}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
            <div className={classes.dropIndicator} ref={indicatorRef} />
          </div>

          {group.isIncome && receiveHint && (
            <div className={rowClasses.receiveHint}>{receiveHint}</div>
          )}

          {addItemGroup === group.id ? (
            <div className={classes.gFooterBlock}>
              <div className={classes.gDivider} />
              <div className={classes.gFooter}>
                <PlanningAddCategoryItemForm
                  className={classes.gFooterForm}
                  isIncome={group.isIncome}
                  busy={busy}
                  newItemName={newItemName}
                  onNewItemNameChange={onNewItemNameChange}
                  amountText={amountText}
                  onAmountChange={onAmountChange}
                  onAddItem={onAddItem}
                  onCancel={onCancelAdd}
                  nameInputRef={nameInputRef}
                  amountInputRef={amountInputRef}
                />
              </div>
            </div>
          ) : (
            <div className={classes.gFooterBlock}>
              <div className={classes.gDivider} />
              <div className={classes.gFooter}>
                <button
                  type="button"
                  className={classes.gAdd}
                  onClick={onBeginAdd}
                >
                  +
                  {' '}
                  {group.isIncome ? 'Add income' : 'Add item'}
                </button>
                {group.isIncome && (
                  <>
                    <span className={`${classes.gTotal} ${classes.gTotalPlanned}`}>
                      {formatMoney(group.items.reduce((sum, it) => sum + it.planned, 0))}
                    </span>
                    <span className={`${classes.gTotal} ${classes.gTotalSpent}`}>
                      {formatMoney(group.items.reduce((sum, it) => {
                        const value = group.isIncome ? it.received : it.spent;
                        return sum + value;
                      }, 0))}
                    </span>
                    <span className={`${classes.gTotal} ${classes.gTotalRemaining}`}>
                      {formatMoney(group.items.reduce((sum, it) => sum + it.remaining, 0))}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Collapse>
    </div>
  );
}

export default memo(PlanningBudgetGroupCard);
