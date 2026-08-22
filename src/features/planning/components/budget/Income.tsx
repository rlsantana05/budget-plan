'use client';

import { useEffect, useState } from 'react';
import {
  ChevronDown,
  GripVertical,
  Plus,
  Trash,
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import { useBudgetGroupsStore } from '../../store/budgetGroupsStore';
import {
  formatMoney,
  parseAmountText,
  sanitizeAmountText,
} from '../../utils/formatters';
import type { GroupItem } from '../../types';
import rowClasses from '../budget-group/BudgetGroupCard/BudgetGroupCardItem.module.css';
import classes from './Income.module.css';

/**
 * Single income source row, styled to match BudgetGroupCardItem.
 * Layout (5 cols): grip+name | plan | received | remaining | actions
 */
function IncomeRow({
  item,
  onPlanChange,
  onDelete,
}: {
  item: GroupItem;
  onPlanChange: (amount: number) => void;
  onDelete: () => void;
}) {
  const [planDraft, setPlanDraft] = useState(String(item.planned));
  const [planFocused, setPlanFocused] = useState(false);

  useEffect(() => {
    if (!planFocused) {
      setPlanDraft(String(item.planned));
    }
  }, [item.planned, planFocused]);

  const commitPlan = () => {
    setPlanFocused(false);
    const amount = parseAmountText(planDraft);
    setPlanDraft(String(amount));
    if (amount !== item.planned) onPlanChange(amount);
  };

  const remaining = item.planned - item.received;

  return (
    <div
      className={`${rowClasses.gRow} ${rowClasses.gRowIncome} ${classes.row}`}
    >
      <span className={rowClasses.gNameCell}>
        <button
          type="button"
          className={rowClasses.grip}
          data-row-drag
          aria-label={`Drag to reorder ${item.name}`}
        >
          <GripVertical size={14} />
        </button>
        <span className={classes.name}>{item.name}</span>
      </span>

      <input
        className={`${rowClasses.gAmountInput} ${classes.planInput}`}
        value={planFocused ? planDraft : `${formatMoney(item.planned)}`}
        aria-label={`Plan for ${item.name}`}
        inputMode="decimal"
        onFocus={(e) => {
          setPlanFocused(true);
          e.target.select();
        }}
        onBlur={commitPlan}
        onChange={(e) => setPlanDraft(sanitizeAmountText(e.target.value))}
      />

      <span className={rowClasses.gValue}>
        {formatMoney(item.received)}
      </span>

      <span
        className={`${rowClasses.pill} ${classes.remaining}`}
        data-tone={remaining > 0 ? 'pos' : remaining < 0 ? 'neg' : 'zero'}
      >
        <span className={rowClasses.pillText}>
          {formatMoney(remaining)}
        </span>
      </span>

      <div className={rowClasses.gActions}>
        <button
          type="button"
          className={`${rowClasses.gAction} ${rowClasses.gActionDanger}`}
          aria-label={`Delete ${item.name}`}
          onClick={onDelete}
        >
          <Trash size={15} />
        </button>
      </div>
    </div>
  );
}

/**
 * Income component - self-contained table of income sources, visually matching
 * the category group cards.
 */
export default function Income() {
  const groups = useBudgetGroupsStore((s) => s.groups);
  const handleUpdateItem = useBudgetGroupsStore((s) => s.handleUpdateItem);
  const handleDeleteItem = useBudgetGroupsStore((s) => s.handleDeleteItem);
  const addIncomeSource = useBudgetGroupsStore((s) => s.addIncomeSource);
  const handleReorder = useBudgetGroupsStore((s) => s.handleReorderItems);
  const handleReorderCommit = useBudgetGroupsStore(
    (s) => s.handleReorderCommit,
  );

  const group = groups.find((g) => g.isIncome);
  const [expanded, setExpanded] = useState(true);

  if (!group) return null;

  const items = group.items ?? [];

  const handlePlanChange = (item: GroupItem, amount: number) =>
    handleUpdateItem(item.id, { ...item, name: item.name, planned: amount });

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
          values={items}
          onReorder={(ordered) => {
            const orderedIds = ordered.map((i) => i.id);
            handleReorder(group.id, orderedIds);
            handleReorderCommit(group.id, orderedIds);
          }}
          className={classes.rows}
        >
          {items.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className={classes.reorderItem}
              whileDrag={{ zIndex: 50 }}
            >
              <IncomeRow
                item={item}
                onPlanChange={(amount) => handlePlanChange(item, amount)}
                onDelete={() => handleDeleteItem(item, group.id)}
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