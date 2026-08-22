'use client';

import {
  memo, useCallback, useEffect, useRef, useState,
} from 'react';
import { Reorder } from 'framer-motion';
import { Accordion } from '@mantine/core';
import type { Group } from '../../../types';
import classes from './BudgetGroupCard.module.css';
import { useBudgetGroupsStore } from '../../../store/budgetGroupsStore';
import { BudgetGroupHeader } from '../BudgetGroupHeader/BudgetGroupHeader';
import BudgetGroupReorderItem from '../BudgetGroupReorderItem/BudgetGroupReorderItem';
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
  const receiveHint = useBudgetGroupsStore((s) => s.receiveHint);

  const toggleGroup = useBudgetGroupsStore((s) => s.toggleGroup);
  const addCategoryRow = useBudgetGroupsStore((s) => s.addCategoryRow);
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
    : group.items.reduce((sum, it) => sum + it.remaining, 0);

  const totalAssigned = group.items.reduce(
    (sum, it) => sum + (group.isIncome ? it.planned : it.funded),
    0,
  );
  const totalActivity = group.items.reduce(
    (sum, it) => sum + (group.isIncome ? it.received : it.spent),
    0,
  );
  let availableTone: 'pos' | 'neg' | 'zero' = 'zero';
  if (available > 0) availableTone = 'pos';
  else if (available < 0) availableTone = 'neg';

  return (
    <Accordion
      unstyled
      value={isExpanded ? group.id : null}
      onChange={onToggle}
      chevron={null}
      transitionDuration={0}
      className={classes.groupCard}
      classNames={{
        label: classes.controlLabel,
        item: classes.item,
        panel: classes.panel,
      }}
      styles={{
        control: {
          display: 'flex',
          flexDirection: 'row-reverse',
          alignItems: 'center',
          width: '100%',
          padding: 0,
          backgroundColor: 'transparent',
          border: 0,
        },
      }}
    >
      <Accordion.Item value={group.id}>
        <Accordion.Control>
          <BudgetGroupHeader
            title={group.name}
            assigned={totalAssigned}
            activity={totalActivity}
            available={available}
            availableTone={availableTone}
            isExpanded={isExpanded}
            itemCount={group.items.length}
            onAddItem={() => addCategoryRow(group.id)}
          />
        </Accordion.Control>

        <Accordion.Panel>
          <div className={classes.gDivider} />
          <div className={classes.items}>
            <div className={classes.reorderWrap} ref={reorderWrapRef}>
              <Reorder.Group
              axis="y"
              values={group.items.map((it) => it.id)}
              onReorder={handleLiveReorder}
              className={classes.reorderGroup}
              >
              {group.items.map((item) => (
                <BudgetGroupReorderItem
                  key={item.clientId ?? item.id}
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
              </Reorder.Group>
              <div className={classes.dropIndicator} ref={indicatorRef} />
            </div>

            {group.items.length === 0 && (
              <div className={classes.emptyState}>
                {group.isIncome
                  ? 'No income recorded yet — add your first income source.'
                  : 'No categories yet — add your first item.'}
              </div>
            )}

            {group.isIncome && receiveHint && (
              <div className={rowClasses.receiveHint}>{receiveHint}</div>
            )}
          </div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

export default memo(BudgetGroupCard);
