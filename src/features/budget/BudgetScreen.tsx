'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { MonthBudgetPlanDTO } from '@/types/budget';
import { toBudgetGroups, computeBudgetTotals } from './utils/mappers';
import { useCollapsedGroups } from './hooks/useCollapsedGroups';
import MonthSelector from './components/MonthSelector/MonthSelector';
import BudgetHero from './components/BudgetHero/BudgetHero';
import CategoryGroup from './components/CategoryGroup/CategoryGroup';
import classes from './BudgetScreen.module.css';

export interface BudgetScreenProps {
  initialData?: MonthBudgetPlanDTO;
  selectedMonth?: string;
}

export default function BudgetScreen({
  initialData,
  selectedMonth,
}: BudgetScreenProps) {
  const router = useRouter();

  const goToMonth = useCallback(
    (value: string) => {
      router.push(`/budget?month=${value}`);
      router.refresh();
    },
    [router],
  );

  const groups = useMemo(
    () => (initialData ? toBudgetGroups(initialData) : []),
    [initialData],
  );
  const totals = useMemo(
    () => (initialData ? computeBudgetTotals(initialData) : { leftToBudget: 0, totalAssigned: 0, totalIncome: 0 }),
    [initialData],
  );

  const { isCollapsed, toggleCollapse } = useCollapsedGroups();

  const handleAddItem = useCallback((groupId: string) => {
    // TODO: wire into add-category-item flow
    console.log('add item', groupId);
  }, []);

  return (
    <div className={classes.screen}>
      <MonthSelector selectedValue={selectedMonth ?? ''} onGoToMonth={goToMonth} />

      <BudgetHero
        leftToBudget={totals.leftToBudget}
        totalAssigned={totals.totalAssigned}
        totalIncome={totals.totalIncome}
        onAssignClick={() => {}}
      />

      <div className={classes.colHeader} role="columnheader">
        <span>Category</span>
        <span>Assigned</span>
        <span>Activity</span>
        <span>Available</span>
      </div>

      <div className={classes.groupList}>
        {groups.map((group) => (
          <CategoryGroup
            key={group.id}
            id={group.id}
            name={group.name}
            items={group.items}
            collapsed={isCollapsed(group.id)}
            onToggleCollapse={toggleCollapse}
            onAddItem={handleAddItem}
          />
        ))}
      </div>
    </div>
  );
}