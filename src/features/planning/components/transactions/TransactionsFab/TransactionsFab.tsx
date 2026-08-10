'use client';

import { Plus } from 'lucide-react';
import classes from './TransactionsFab.module.css';

interface TransactionsFabProps {
  onClick: () => void;
}

export default function TransactionsFab({
  onClick,
}: TransactionsFabProps) {
  return (
    <button
      type="button"
      className={classes.fab}
      aria-label="Add transaction"
      onClick={onClick}
    >
      <Plus size={26} />
    </button>
  );
}
