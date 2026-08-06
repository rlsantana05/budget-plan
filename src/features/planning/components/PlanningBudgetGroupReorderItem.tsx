'use client';

import { memo } from 'react';
import { useReducedMotion, Reorder } from 'framer-motion';
import type { GroupItem } from '../types';
import classes from './PlanningBudgetGroupCard.module.css';
import PlanningBudgetGroupItemRow from './PlanningBudgetGroupItemRow';
import PlanningBudgetGroupItemEditForm from './PlanningBudgetGroupItemEditForm';

interface PlanningBudgetGroupReorderItemProps {
  item: GroupItem;
  groupId: string;
  isIncome: boolean;
  isEditing: boolean;
  dragEnabled: boolean;
  isDragging: boolean;

  busy: 'add' | 'row' | null;
  deleteArmingId: string | null;
  onArmDelete: (id: string | null) => void;
  onDeleteItem: (item: GroupItem, groupId: string) => void;
  onReceiveIncome: (item: GroupItem) => void;
  onStartEdit: (item: GroupItem) => void;

  editName: string;
  onEditNameChange: (value: string) => void;
  editPlanned: number;
  onEditPlannedChange: (value: number) => void;
  onSaveEdit: (itemId: string) => void;
  onCancelEdit: () => void;

  registerItemRef: (id: string, el: HTMLLIElement | null) => void;
  onDragStart: (id: string) => void;
  onDrag: () => void;
  onDragEnd: () => void;
}

function PlanningBudgetGroupReorderItem({
  item,
  groupId,
  isIncome,
  isEditing,
  dragEnabled,
  isDragging,
  busy,
  deleteArmingId,
  onArmDelete,
  onDeleteItem,
  onReceiveIncome,
  onStartEdit,
  editName,
  onEditNameChange,
  editPlanned,
  onEditPlannedChange,
  onSaveEdit,
  onCancelEdit,
  registerItemRef,
  onDragStart,
  onDrag,
  onDragEnd,
}: PlanningBudgetGroupReorderItemProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Reorder.Item
      ref={(el: HTMLLIElement | null) => registerItemRef(item.id, el)}
      value={item.id}
      {...(dragEnabled ? {} : { drag: false })}
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
      {isEditing ? (
        <PlanningBudgetGroupItemEditForm
          item={item}
          editName={editName}
          onEditNameChange={onEditNameChange}
          editPlanned={editPlanned}
          onEditPlannedChange={onEditPlannedChange}
          busy={busy}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
        />
      ) : (
        <PlanningBudgetGroupItemRow
          item={item}
          groupId={groupId}
          isIncome={isIncome}
          busy={busy}
          deleteArmingId={deleteArmingId}
          isDraggable={dragEnabled}
          isDragging={isDragging}
          onReceiveIncome={onReceiveIncome}
          onStartEdit={onStartEdit}
          onArmDelete={onArmDelete}
          onDeleteItem={onDeleteItem}
        />
      )}
    </Reorder.Item>
  );
}

export default memo(PlanningBudgetGroupReorderItem);
