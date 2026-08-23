'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Plus,
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import { useBudgetGroupsStore } from '../../store/budgetGroupsStore';
import BudgetGroupCardItem from '../budget-group/BudgetGroupCard/BudgetGroupCardItem';
import classes from './Income.module.css';

/**
 * Income card — renders the same BudgetGroupCardItem rows used by category
 * groups (spec 2026-08-22-unify-row-components). One row component, two
 * contexts; `isIncome` only switches which columns are editable.
 */
export default function Income() {
  const groups = useBudgetGroupsStore((s) => s.groups);
  const addIncomeSource = useBudgetGroupsStore((s) => s.addIncomeSource);
  const handleReorder = useBudgetGroupsStore((s) => s.handleReorderItems);
  const handleReorderCommit = useBudgetGroupsStore((s) => s.handleReorderCommit);

  const group = groups.find((g) => g.isIncome);
  const [expanded, setExpanded] = useState(true);

  if (!group) return null;

  const items = group.items ?? [];

  return (
    <div className={classes.card}>
      {/* ============ COLUMN HEADER ============ */}
      <div className={classes.headerRow} role="columnheader">
        <button
          type="button"
          className={classes.titleCell}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <ChevronDown
            size={14}
            className={classes.chevron}
            data-expanded={expanded}
          />
          <span className={classes.title}>Income</span>
        </button>
        <span className={classes.colHeader}>Plan</span>
        <span className={classes.colHeader}>Received</span>
        <span className={classes.colHeader}>Remaining</span>
        <div className={classes.headerActions}>
          <button
            type="button"
            className={classes.addBtn}
            aria-label="Add income source"
            title="Add income source"
            onClick={() => addIncomeSource(group.id)}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* ============ DATA ROWS ============ */}
      {expanded && items.length > 0 && (
        <Reorder.Group
          axis="y"
          values={items.map((i) => i.id)}
          onReorder={(orderedIds) => {
            handleReorder(group.id, orderedIds);
            handleReorderCommit(group.id, orderedIds);
          }}
          className={classes.rows}
        >
          {items.map((item) => (
            <Reorder.Item
              key={item.clientId ?? item.id}
              value={item.id}
              className={classes.reorderItem}
              whileDrag={{ zIndex: 50 }}
            >
              <BudgetGroupCardItem
                item={item}
                groupId={group.id}
                isIncome
                isDragging={false}
                onGripPointerDown={() => {}}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {expanded && items.length === 0 && (
        <button
          type="button"
          className={classes.empty}
          onClick={() => addIncomeSource(group.id)}
        >
          <Plus size={14} />
          No income sources — add one
        </button>
      )}
    </div>
  );
}
