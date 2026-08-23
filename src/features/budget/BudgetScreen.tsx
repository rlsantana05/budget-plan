'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { MonthBudgetPlanDTO } from '@/types/budget';
import { toCents } from '@/features/planning/utils/money';
import { toBudgetGroups, computeBudgetTotals } from './utils/mappers';
import { useCollapsedGroups } from './hooks/useCollapsedGroups';
import MonthSelector from './components/MonthSelector/MonthSelector';
import BudgetHero from './components/BudgetHero/BudgetHero';
import MoneyStrip from './components/MoneyStrip/MoneyStrip';
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
    () => (initialData ? computeBudgetTotals(initialData) : { leftToBudgetCents: 0, totalAssignedCents: 0, totalIncomeCents: 0 }),
    [initialData],
  );

  // Real-money numbers for the strip. Ready to Assign mirrors the server's
  // pool calculation (cash on hand − assigned); cash on hand is not in the
  // plan DTO so it derives from RTA + assigned as an exact client-side proxy
  // until a dedicated overview endpoint exists.
  const money = useMemo(() => {
    const readyToAssignCents = initialData?.availableToAssignCents ?? 0;
    return {
      readyToAssignCents,
      totalAssignedCents: totals.totalAssignedCents,
      cashOnHandCents: readyToAssignCents + totals.totalAssignedCents,
    };
  }, [initialData, totals]);

  const { isCollapsed, toggleCollapse } = useCollapsedGroups();

  const handleAddItem = useCallback((_groupId: string) => {
    // TODO: wire into add-category-item flow
  }, []);

  return (
    <div className={classes.screen}>
      <MonthSelector selectedValue={selectedMonth ?? ''} onGoToMonth={goToMonth} />

      <MoneyStrip
        cashOnHandCents={money.cashOnHandCents}
        readyToAssignCents={money.readyToAssignCents}
        totalAssignedCents={money.totalAssignedCents}
      />

      <BudgetHero
        leftToBudgetCents={totals.leftToBudgetCents}
        totalAssignedCents={totals.totalAssignedCents}
        totalIncomeCents={totals.totalIncomeCents}
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
            allGroups={groups}
            collapsed={isCollapsed(group.id)}
            onToggleCollapse={toggleCollapse}
            onAddItem={handleAddItem}
          />
        ))}
      </div>
    </div>
  );
}