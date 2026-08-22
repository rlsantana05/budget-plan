import { Loader } from '@mantine/core';
import { BudgetCategoryHeader } from '../BudgetCategoryHeader/BudgetCategoryHeader';
import { BudgetColumnHeader } from '../BudgetColumnHeader/BudgetColumnHeader';
import BudgetGroupCard from '../BudgetGroupCard/BudgetGroupCard';
import type { Group } from '../../../types';
import classes from './BudgetCategoryContainer.module.css';

interface BudgetCategoryContainerProps {
  groups: Group[];
  hasAccounts: boolean;
  onAddGroup: () => void;
  busy: 'add' | 'row' | null;
  showAddButton?: boolean;
}

export function BudgetCategoryContainer({
  groups,
  hasAccounts,
  onAddGroup,
  busy,
  showAddButton = true,
}: BudgetCategoryContainerProps) {
  const spendingGroups = groups.filter((g) => !g.isIncome);

  return (
    <div className={classes.container}>
      <div className={classes.tableHead}>
        <BudgetCategoryHeader
          onAddGroup={onAddGroup}
          hasAccounts={hasAccounts}
          showAddButton={showAddButton}
        />
        <BudgetColumnHeader />
      </div>
      <div className={classes.cardsWrapper}>
        {busy !== null && (
          <div className={classes.loadingOverlay}>
            <Loader color="var(--accent-bright)" size={24} />
          </div>
        )}
        {spendingGroups.map((group) => (
          <BudgetGroupCard
            key={group.id}
            group={group}
          />
        ))}
      </div>
    </div>
  );
}

export default BudgetCategoryContainer;