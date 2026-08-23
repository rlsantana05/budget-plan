import { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { UnstyledButton } from '@mantine/core';
import { formatCents } from '../../utils/formatters';
import type { BudgetCategoryItem } from '../../types/budget.types';
import CategoryRow from '../CategoryRow/CategoryRow';
import AddItemRow from '../AddItemRow/AddItemRow';
import classes from './CategoryGroup.module.css';

export interface CategoryGroupProps {
  id: string;
  name: string;
  items: BudgetCategoryItem[];
  collapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onAddItem: (groupId: string) => void;
}

function CategoryGroup({
  id,
  name,
  items,
  collapsed,
  onToggleCollapse,
  onAddItem,
}: CategoryGroupProps) {
  const subtotal = items.reduce((sum, item) => sum + item.assignedCents, 0);

  return (
    <div className={classes.card}>
      <div className={classes.gHeader}>
        <UnstyledButton
          className={classes.gTitle}
          onClick={() => onToggleCollapse(id)}
          aria-expanded={!collapsed}
          aria-controls={`group-${id}`}
        >
          <ChevronDown
            size={16}
            className={`${classes.gChev} ${collapsed ? classes.collapsed : ''}`}
            aria-hidden="true"
          />
          <span>{name}</span>
        </UnstyledButton>
        <span className={classes.gSubtotal}>{formatCents(subtotal)}</span>
      </div>

      <div
        id={`group-${id}`}
        className={`${classes.gBody} ${collapsed ? classes.gBodyCollapsed : ''}`}
      >
        <div className={classes.gRows}>
          {items.map((item) => (
            <CategoryRow key={item.id} item={item} />
          ))}
          <AddItemRow onAddItem={() => onAddItem(id)} />
        </div>
      </div>
    </div>
  );
}

export default memo(CategoryGroup);