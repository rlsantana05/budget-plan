'use client';

import {
  memo, useCallback, useEffect, useRef, useState,
} from 'react';
import { AnimatePresence, Reorder } from 'framer-motion';
import { Collapse } from '@mantine/core';
import type { Group } from '../../../types';
import sharedClasses from '../../shared/BudgetPlanShared.module.css';
import classes from './BudgetGroupCard.module.css';
import { useBudgetGroupsStore } from '../../../store/budgetGroupsStore';
import { BudgetGroupHeader } from '../BudgetGroupHeader/BudgetGroupHeader';
import BudgetGroupReorderItem from '../BudgetGroupReorderItem/BudgetGroupReorderItem';
import BudgetGroupAddItemForm from '../BudgetGroupAddItemForm/BudgetGroupAddItemForm';
import { formatMoney } from '../../../utils/formatters';
import rowClasses from './BudgetGroupCardItem.module.css';

interface BudgetGroupCardProps {
  group: Group;
}

function BudgetGroupCard({ group }: BudgetGroupCardProps) {
  const reorderWrapRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const startOrderRef = useRef<string[] | null>(null);
  const pendingOrderRef = useRef<string[] | null>(null);
  const latestOrderRef = useRef<string[]>(group.items.map((it) => it.id));
  const draggingIdRef = useRef<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const isExpanded = useBudgetGroupsStore(
    (s) => s.expandedGroups[group.id] ?? group.defaultExpanded,
  );
  const addItemGroup = useBudgetGroupsStore((s) => s.addItemGroup);
  const receiveHint = useBudgetGroupsStore((s) => s.receiveHint);

  const toggleGroup = useBudgetGroupsStore((s) => s.toggleGroup);
  const beginAddItem = useBudgetGroupsStore((s) => s.beginAddItem);
  const onToggle = useCallback(() => toggleGroup(group.id), [toggleGroup, group.id]);

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
      useBudgetGroupsStore.getState().handleReorderItems(group.id, orderedIds);
      pendingOrderRef.current = orderedIds;
    },
    [group.id],
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
    if (changed) useBudgetGroupsStore.getState().handleReorderCommit(group.id, pending);
  }, [group.id, showIndicator]);

  const available = group.isIncome
    ? group.items.reduce((sum, it) => sum + (it.received - it.planned), 0)
    : group.items.reduce((sum, it) => sum + (it.planned - it.spent), 0);

  return (
    <div className={`${sharedClasses.card} ${classes.groupCard}`}>
      <BudgetGroupHeader
        title={group.name}
        available={formatMoney(available)}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      <Collapse expanded={isExpanded}>
        <div className={classes.gDivider} />
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
                  <BudgetGroupReorderItem
                    key={item.id}
                    item={item}
                    groupId={group.id}
                    isIncome={group.isIncome}
                    isDragging={draggingItemId === item.id}
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
                <BudgetGroupAddItemForm
                  className={classes.gFooterForm}
                  isIncome={group.isIncome}
                />
              </div>
            </div>
          ) : (
            <div className={classes.gFooterBlock}>
              <div className={classes.gDivider} />
              <div className={`${classes.gFooter} ${group.isIncome ? classes.gFooterIncome : ''}`}>
                <button
                  type="button"
                  className={classes.gAdd}
                  onClick={() => beginAddItem(group.id)}
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
                      {formatMoney(group.items.reduce((sum, it) => sum + it.received, 0))}
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

export default memo(BudgetGroupCard);
