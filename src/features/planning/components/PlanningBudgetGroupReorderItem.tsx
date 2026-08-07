'use client';

import { memo, useCallback } from 'react';
import type { PointerEvent } from 'react';
import {
  Reorder, useDragControls, useReducedMotion,
} from 'framer-motion';
import type { GroupItem } from '../types';
import classes from './PlanningBudgetGroupCard.module.css';
import PlanningBudgetGroupItemRow from './PlanningBudgetGroupItemRow';

interface PlanningBudgetGroupReorderItemProps {
  item: GroupItem;
  groupId: string;
  isIncome: boolean;
  isDragging: boolean;

  busy: 'add' | 'row' | null;
  deleteArmingId: string | null;
  onArmDelete: (id: string | null) => void;
  onDeleteItem: (item: GroupItem, groupId: string) => void;
  onReceiveIncome: (item: GroupItem) => void;
  onUpdateItem: (itemId: string, patch: { name: string; planned: number }) => void;

  registerItemRef: (id: string, el: HTMLLIElement | null) => void;
  onDragStart: (id: string) => void;
  onDrag: () => void;
  onDragEnd: () => void;
}

function PlanningBudgetGroupReorderItem({
  item,
  groupId,
  isIncome,
  isDragging,
  busy,
  deleteArmingId,
  onArmDelete,
  onDeleteItem,
  onReceiveIncome,
  onUpdateItem,
  registerItemRef,
  onDragStart,
  onDrag,
  onDragEnd,
}: PlanningBudgetGroupReorderItemProps) {
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();

  const handleGripPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      event.stopPropagation();
      dragControls.start(event);
    },
    [dragControls],
  );

  return (
    <Reorder.Item
      ref={(el: HTMLLIElement | null) => registerItemRef(item.id, el)}
      value={item.id}
      dragListener={false}
      dragControls={dragControls}
      className={classes.reorderItem}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, height: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.18,
        ease: 'easeOut',
      }}
      onDragStart={() => onDragStart(item.id)}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
    >
      <PlanningBudgetGroupItemRow
        item={item}
        groupId={groupId}
        isIncome={isIncome}
        busy={busy}
        deleteArmingId={deleteArmingId}
        isDragging={isDragging}
        onReceiveIncome={onReceiveIncome}
        onArmDelete={onArmDelete}
        onDeleteItem={onDeleteItem}
        onUpdateItem={onUpdateItem}
        onGripPointerDown={handleGripPointerDown}
      />
    </Reorder.Item>
  );
}

export default memo(PlanningBudgetGroupReorderItem);
