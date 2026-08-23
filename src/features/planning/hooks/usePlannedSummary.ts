import { useMemo } from 'react';
import type { Group, PlanningCategory } from '../types';

export function usePlannedSummary(groups: Group[]) {
  return useMemo(() => {
    const cats: PlanningCategory[] = groups
      .filter((group) => !group.isIncome)
      .flatMap((group) => (
        group.items.map((item) => ({
          name: item.name,
          plannedCents: item.plannedCents,
          spentCents: item.spentCents,
          remainingCents: item.remainingCents,
          isIncome: group.isIncome,
        }))
      ));

    const totals = cats.reduce(
      (acc, cat) => {
        acc.plannedCents += cat.plannedCents;
        acc.spentCents += cat.spentCents;
        acc.remainingCents += cat.remainingCents;
        return acc;
      },
      { plannedCents: 0, spentCents: 0, remainingCents: 0 },
    );

    return { categories: cats, totals };
  }, [groups]);
}
