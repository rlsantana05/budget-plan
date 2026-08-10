'use client';

import { useState } from 'react';
import { TextInput } from '@mantine/core';
import { Check } from 'lucide-react';
import { formatMoney, parseAmountText } from '../../../utils/formatters';
import { useBudgetGroupsStore } from '../../../store/budgetGroupsStore';
import sharedClasses from '../../shared/BudgetPlanShared.module.css';
import classes from './BudgetGroupAddItemForm.module.css';

interface BudgetGroupAddItemFormProps {
  className?: string;
  isIncome: boolean;
}

export default function BudgetGroupAddItemForm({
  className,
  isIncome,
}: BudgetGroupAddItemFormProps) {
  const busy = useBudgetGroupsStore((s) => s.busy);
  const newItemName = useBudgetGroupsStore((s) => s.newItemName);
  const setNewItemName = useBudgetGroupsStore((s) => s.setNewItemName);
  const amountText = useBudgetGroupsStore((s) => s.amountText);
  const handleAmountInputChange = useBudgetGroupsStore((s) => s.handleAmountInputChange);
  const handleAddItem = useBudgetGroupsStore((s) => s.handleAddItem);
  const cancelAddItem = useBudgetGroupsStore((s) => s.cancelAddItem);
  const addItemGroup = useBudgetGroupsStore((s) => s.addItemGroup);
  const nameInputRef = useBudgetGroupsStore((s) => s.nameInputRef);
  const amountInputRef = useBudgetGroupsStore((s) => s.amountInputRef);

  const [amountFocused, setAmountFocused] = useState(false);
  let amountDisplay = amountText ? `${formatMoney(parseAmountText(amountText))}` : '';
  if (amountFocused) amountDisplay = amountText;

  const addItem = () => {
    if (addItemGroup !== null) handleAddItem(addItemGroup);
  };

  return (
    <div className={`${classes.addItemForm} ${className ?? ''}`}>
      <TextInput
        ref={nameInputRef}
        autoFocus
        size="xs"
        placeholder={isIncome ? 'e.g. Paycheck' : 'Groceries, rent, coffee…'}
        value={newItemName}
        onChange={(e) => setNewItemName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            amountInputRef.current?.focus();
          }
          if (e.key === 'Escape') cancelAddItem();
        }}
      />
      <TextInput
        ref={amountInputRef}
        size="xs"
        inputMode="decimal"
        placeholder="0.00"
        value={amountDisplay}
        onFocus={(e) => {
          setAmountFocused(true);
          e.currentTarget.select();
        }}
        onBlur={() => setAmountFocused(false)}
        onChange={(e) => handleAmountInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addItem();
          }
          if (e.key === 'Escape') cancelAddItem();
        }}
      />
      <button
        type="button"
        className={sharedClasses.addItemSave}
        onClick={addItem}
        disabled={busy !== null || !newItemName.trim()}
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        className={sharedClasses.addItemCancel}
        onClick={cancelAddItem}
        aria-label="Cancel add item"
      >
        <span aria-hidden>×</span>
      </button>
    </div>
  );
}
