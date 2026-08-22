'use client';

import { useBudgetGroupsStore } from '../../../store/budgetGroupsStore';
import { BudgetCategoryContainer } from '../BudgetCategoryContainer/BudgetCategoryContainer';

export default function BudgetGroupList() {
  const groups = useBudgetGroupsStore((s) => s.groups);
  const busy = useBudgetGroupsStore((s) => s.busy);
  const hasAccounts = useBudgetGroupsStore((s) => s.hasAccounts);

  const handleAddGroup = () => {
    // TODO: open the "create group" form inside the container
  };

  return (
    <BudgetCategoryContainer
      groups={groups}
      hasAccounts={hasAccounts}
      onAddGroup={handleAddGroup}
      busy={busy}
      showAddButton={false}
    />
  );
}