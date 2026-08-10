import { Plus } from 'lucide-react';
import { UnstyledButton } from '@mantine/core';
import classes from './AddItemRow.module.css';

interface AddItemRowProps {
  onAddItem: () => void;
  label?: string;
}

export default function AddItemRow({ onAddItem, label = 'Add item' }: AddItemRowProps) {
  return (
    <div className={classes.wrap}>
      <UnstyledButton className={classes.addItem} onClick={onAddItem}>
        <span className={classes.icon} aria-hidden="true">
          <Plus size={14} />
        </span>
        <span className={classes.label}>{label}</span>
      </UnstyledButton>
    </div>
  );
}