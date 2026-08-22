import { Group } from '@mantine/core';
import { Plus } from 'lucide-react';
import classes from './BudgetCategoryHeader.module.css';

interface BudgetCategoryHeaderProps {
  onAddGroup: () => void;
  hasAccounts: boolean;
  // New prop to control whether to show the add button
  showAddButton?: boolean;
}

export function BudgetCategoryHeader({
  onAddGroup,
  hasAccounts,
  showAddButton = true,
}: BudgetCategoryHeaderProps) {
  // Show header only if there's something to show
  const showHeader = hasAccounts && showAddButton;

  if (!showHeader) {
    return null;
  }

  return (
    <div className={classes.header}>
      <Group justify="flex-end" align="center" className={classes.headerRow}>
        <button
          type="button"
          onClick={onAddGroup}
          className={classes.addButton}
        >
          <Plus size={14} />
          <span>Add Group</span>
        </button>
      </Group>
    </div>
  );
}