import { useMemo } from 'react';
import type { Group, PlanningCategory } from '../types';

export function usePlannedSummary(groups: Group[]) {
  return useMemo(() => {
    const cats: PlanningCategory[] = groups
      .filter((group) => !group.isIncome)
      .flatMap((group) => (
        group.items.map((item) => ({
          name: item.name,
          planned: item.planned,
          spent: item.spent,
          remaining: item.remaining,
          isIncome: group.isIncome,
        }))
      ));

    const totals = cats.reduce(
      (acc, cat) => {
        acc.planned += cat.planned;
        acc.spent += cat.spent;
        acc.remaining += cat.remaining;
        return acc;
      },
      { planned: 0, spent: 0, remaining: 0 },
    );

    return { categories: cats, totals };
  }, [groups]);
}
