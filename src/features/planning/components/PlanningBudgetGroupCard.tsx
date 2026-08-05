"use client";

import type { RefObject } from "react";
import { AnimatePresence, Reorder, useReducedMotion } from "framer-motion";
import { Collapse } from "@mantine/core";
import { ChevronDown } from "lucide-react";
import type { Group, GroupItem } from "../types";
import sharedClasses from "../styles/PlanningShared.module.css";
import PlanningBudgetGroupItemRow from "./PlanningBudgetGroupItemRow";
import PlanningBudgetGroupItemEditForm from "./PlanningBudgetGroupItemEditForm";
import PlanningAddCategoryItemForm from "./PlanningAddCategoryItemForm";
import rowClasses from "./PlanningBudgetGroupItemRow.module.css";
import classes from "./PlanningBudgetGroupCard.module.css";

interface PlanningBudgetGroupCardProps {
  group: Group;
  isExpanded: boolean;
  onToggle: () => void;
  onReorder: (orderedIds: string[]) => void;

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

export default function PlanningBudgetGroupCard({
  group,
  isExpanded,
  onToggle,
  onReorder,
  editingItemId,
  editName,
  onEditNameChange,
  editPlanned,
  onEditPlannedChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
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
  const reduceMotion = useReducedMotion();
  const motionTransition = {
    duration: reduceMotion ? 0 : 0.18,
    ease: "easeOut" as const,
  };
  const itemMotionProps = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98, height: 0 },
    transition: motionTransition,
  };

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
            className={`${classes.gChev} ${isExpanded ? "" : classes.open}`}
          />
        </button>
        <span className={classes.gCol}>Planned</span>
        <span className={classes.gCol}>Spent</span>
        <span className={classes.gCol}>Remaining</span>
      </div>

      <Collapse expanded={isExpanded}>
        {/* <div className={classes.gDivider} /> */}
        <div className={classes.items}>
          <Reorder.Group
            axis="y"
            values={group.items.map((it) => it.id)}
            onReorder={onReorder}
            className={classes.reorderGroup}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {group.items.map((item) =>
                editingItemId === item.id ? (
                  <Reorder.Item
                    key={item.id}
                    value={item.id}
                    className={classes.reorderItem}
                    drag={editingItemId === null}
                    {...itemMotionProps}
                  >
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
                  </Reorder.Item>
                ) : (
                  <Reorder.Item
                    key={item.id}
                    value={item.id}
                    className={classes.reorderItem}
                    drag={editingItemId === null}
                    {...itemMotionProps}
                    whileDrag={{
                      scale: 1.02,
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
                    }}
                  >
                    <PlanningBudgetGroupItemRow
                      item={item}
                      groupId={group.id}
                      isIncome={group.isIncome}
                      busy={busy}
                      deleteArmingId={deleteArmingId}
                      onReceiveIncome={onReceiveIncome}
                      onStartEdit={onStartEdit}
                      onArmDelete={onArmDelete}
                      onDeleteItem={onDeleteItem}
                    />
                  </Reorder.Item>
                ),
              )}
            </AnimatePresence>
          </Reorder.Group>

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
                  + {group.isIncome ? "Add income" : "Add item"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Collapse>
    </div>
  );
}
