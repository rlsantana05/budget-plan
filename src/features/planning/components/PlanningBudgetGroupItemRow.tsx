"use client";

import { memo } from "react";
import { Menu } from "@mantine/core";
import { Check, GripVertical, MoreVertical, Pencil, Trash } from "lucide-react";
import type { GroupItem } from "../types";
import { formatMoney } from "../utils/formatters";
import classes from "./PlanningBudgetGroupItemRow.module.css";

interface PlanningBudgetGroupItemRowProps {
  item: GroupItem;
  groupId: string;
  isIncome: boolean;
  busy: "add" | "row" | null;
  deleteArmingId: string | null;
  isDraggable: boolean;
  isDragging: boolean;
  onReceiveIncome: (item: GroupItem) => void;
  onStartEdit: (item: GroupItem) => void;
  onArmDelete: (id: string | null) => void;
  onDeleteItem: (item: GroupItem, groupId: string) => void;
}

function PlanningBudgetGroupItemRow({
  item,
  groupId,
  isIncome,
  busy,
  deleteArmingId,
  isDraggable,
  isDragging,
  onReceiveIncome,
  onStartEdit,
  onArmDelete,
  onDeleteItem,
}: PlanningBudgetGroupItemRowProps) {
  return (
    <>
      <div className={`${classes.gRow} ${isDragging ? classes.dragging : ""}`}>
        <span className={classes.gNameCell}>
          <span
            className={`${classes.grip} ${isDraggable ? "" : classes.gripDisabled}`}
            aria-hidden
          >
            <GripVertical size={14} />
          </span>
          <span className={classes.gItemName}>{item.name}</span>
        </span>
        <span className={classes.gValue}>{formatMoney(item.planned)}</span>
        <span className={classes.gValue}>{formatMoney(item.spent)}</span>
        <span className={classes.gValue}>{formatMoney(item.remaining)}</span>
        <Menu
          shadow="md"
          width={160}
          position="bottom-end"
          withinPortal
        >
          <Menu.Target>
            <button
              type="button"
              className={classes.gKebab}
              disabled={busy !== null}
              aria-label={`Actions for ${item.name}`}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreVertical size={16} />
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            {isIncome && (
              <Menu.Item
                leftSection={<Check size={14} />}
                onClick={() => onReceiveIncome(item)}
              >
                Mark received
              </Menu.Item>
            )}
            <Menu.Item
              leftSection={<Pencil size={14} />}
              onClick={() => onStartEdit(item)}
            >
              Edit
            </Menu.Item>
            <Menu.Item
              leftSection={<Trash size={14} />}
              color="red"
              onClick={() => {
                if (item.transactionCount > 0 && deleteArmingId !== item.id) {
                  onArmDelete(item.id);
                } else {
                  onDeleteItem(item, groupId);
                }
              }}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
      {deleteArmingId === item.id && item.transactionCount > 0 && (
        <div className={classes.deleteWarning}>
          <span>
            {item.transactionCount}{" "}
            {item.transactionCount === 1 ? "transaction" : "transactions"} will
            be hidden with this category
          </span>
          <div className={classes.deleteWarningActions}>
            <button
              type="button"
              className={classes.deleteWarningConfirm}
              onClick={() => onDeleteItem(item, groupId)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Delete
            </button>
            <button
              type="button"
              className={classes.deleteWarningCancel}
              onClick={() => onArmDelete(null)}
              onPointerDown={(e) => e.stopPropagation()}
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