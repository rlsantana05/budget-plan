'use client';

import { memo, useCallback } from 'react';
import type { PointerEvent } from 'react';
import {
  Reorder, useDragControls, useReducedMotion,
} from 'framer-motion';
import type { GroupItem } from '../../../types';
import classes from '../BudgetGroupCard/BudgetGroupCard.module.css';
import BudgetGroupCardItem from '../BudgetGroupCard/BudgetGroupCardItem';

interface BudgetGroupReorderItemProps {
  item: GroupItem;
  groupId: string;
  isIncome: boolean;
  isDragging: boolean;
  registerItemRef: (id: string, el: HTMLLIElement | null) => void;
  onDragStart: (id: string) => void;
  onDrag: () => void;
  onDragEnd: () => void;
}

function BudgetGroupReorderItem({
  item,
  groupId,
  isIncome,
  isDragging,
  registerItemRef,
  onDragStart,
  onDrag,
  onDragEnd,
}: BudgetGroupReorderItemProps) {
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
      <BudgetGroupCardItem
        item={item}
        groupId={groupId}
        isIncome={isIncome}
        isDragging={isDragging}
        onGripPointerDown={handleGripPointerDown}
      />
    </Reorder.Item>
  );
}

export default memo(BudgetGroupReorderItem);
