"use client";

import type { ReactNode, RefObject } from "react";
import type { Group, GroupItem } from "../types";
import pageClasses from "../Planning.module.css";
import PlanningBudgetGroupCard from "./PlanningBudgetGroupCard";

interface PlanningBudgetGroupListProps {
  banner?: ReactNode;
  groups: Group[];
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (id: string) => void;
  onReorder: (groupId: string, orderedIds: string[]) => void;

  editingItemId: string | null;
  editName: string;
  onEditNameChange: (value: string) => void;
  editPlanned: number;
  onEditPlannedChange: (value: number) => void;
  onSaveEdit: (itemId: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (item: GroupItem) => void;

  busy: "add" | "row" | null;
  deleteArmingId: string | null;
  onArmDelete: (id: string | null) => void;
  onDeleteItem: (item: GroupItem, groupId: string) => void;
  onReceiveIncome: (item: GroupItem) => void;

  addItemGroup: string | null;
  onBeginAddItem: (groupId: string) => void;
  newItemName: string;
  onNewItemNameChange: (value: string) => void;
  amountText: string;
  onAmountChange: (value: string) => void;
  onAddItem: (groupId: string) => void;
  onCancelAdd: () => void;
  nameInputRef: RefObject<HTMLInputElement | null>;
  amountInputRef: RefObject<HTMLInputElement | null>;

  receiveHint: string | null;
}

export default function PlanningBudgetGroupList(
  props: PlanningBudgetGroupListProps,
) {
  return (
    <div className={pageClasses.budgetScroll}>
      {props.banner}
      {props.groups.map((group) => {
        const isExpanded = props.expandedGroups[group.id] ?? group.defaultExpanded;
        return (
          <PlanningBudgetGroupCard
            key={group.id}
            group={group}
            isExpanded={isExpanded}
            onToggle={() => props.onToggleGroup(group.id)}
            onReorder={(ordered) => props.onReorder(group.id, ordered)}
            editingItemId={props.editingItemId}
            editName={props.editName}
            onEditNameChange={props.onEditNameChange}
            editPlanned={props.editPlanned}
            onEditPlannedChange={props.onEditPlannedChange}
            onSaveEdit={props.onSaveEdit}
            onCancelEdit={props.onCancelEdit}
            onStartEdit={props.onStartEdit}
            busy={props.busy}
            deleteArmingId={props.deleteArmingId}
            onArmDelete={props.onArmDelete}
            onDeleteItem={props.onDeleteItem}
            onReceiveIncome={props.onReceiveIncome}
            addItemGroup={props.addItemGroup}
            onBeginAdd={() => props.onBeginAddItem(group.id)}
            newItemName={props.newItemName}
            onNewItemNameChange={props.onNewItemNameChange}
            amountText={props.amountText}
            onAmountChange={props.onAmountChange}
            onAddItem={() => props.onAddItem(group.id)}
            onCancelAdd={props.onCancelAdd}
            nameInputRef={props.nameInputRef}
            amountInputRef={props.amountInputRef}
            receiveHint={props.receiveHint}
          />
        );
      })}
    </div>
  );
}