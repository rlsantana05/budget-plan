import {
  Button, Group,
} from '@mantine/core';
import { Plus } from 'lucide-react';
import classes from './BudgetCategoryHeader.module.css';

interface BudgetCategoryHeaderProps {
  onAddGroup: () => void;
  hasAccounts: boolean;
}

export function BudgetCategoryHeader({
  onAddGroup,
  hasAccounts,
}: BudgetCategoryHeaderProps) {
  return (
    <div className={classes.header}>
      <Group justify="flex-end" align="center" className={classes.headerRow}>
        <Button
          leftSection={<Plus size={14} />}
          onClick={onAddGroup}
          disabled={!hasAccounts}
          className={classes.addButton}
        >
          Add Group
        </Button>
      </Group>
    </div>
  );
}
