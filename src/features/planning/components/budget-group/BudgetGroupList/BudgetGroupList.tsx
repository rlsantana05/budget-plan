'use client';

import type { ReactNode } from 'react';
import pageClasses from '../../../Planning.module.css';
import { useBudgetGroupsStore } from '../../../store/budgetGroupsStore';
import BudgetGroupCard from '../BudgetGroupCard/BudgetGroupCard';

interface BudgetGroupListProps {
  banner?: ReactNode;
}

export default function BudgetGroupList({ banner }: BudgetGroupListProps) {
  const groups = useBudgetGroupsStore((s) => s.groups);

  return (
    <div className={pageClasses.budgetScroll}>
      {banner}
      {groups
        .filter((group) => !group.isIncome)
        .map((group) => (
          <BudgetGroupCard
            key={group.id}
            group={group}
          />
        ))}
    </div>
  );
}
