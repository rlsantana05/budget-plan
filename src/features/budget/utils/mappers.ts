import type { MonthBudgetPlanDTO } from '@/types/budget';
import { formatCents } from './formatters';
import type {
  BudgetCategoryItem,
  BudgetGroup,
  BudgetTotals,
  CategoryMeta,
} from '../types/budget.types';

/**
 * Map the server DTO (integer cents) to the Budget screen model. Money stays
 * in integer cents throughout; display formats with `formatCents`.
 */
export function toBudgetGroups(dto: MonthBudgetPlanDTO): BudgetGroup[] {
  return (dto.categories ?? []).map<BudgetGroup>((cg) => ({
    id: cg.id,
    name: cg.name,
    items: (cg.items ?? []).map<BudgetCategoryItem>((it) => ({
      id: it.id,
      name: it.name,
      assignedCents: it.fundedCents ?? 0,
      activityCents: it.spentCents ?? 0,
      meta: toCategoryMeta(it),
    })),
  }));
}

type PlanItem = MonthBudgetPlanDTO['categories'][number]['items'][number];

function toCategoryMeta(it: PlanItem): CategoryMeta | undefined {
  if (it.targetType === 'NONE') return undefined;
  if ((it.neededCents ?? 0) > 0 && it.targetDue) {
    return {
      type: 'due',
      text: `${formatCents(it.neededCents)} needed by ${it.targetDue}`,
    };
  }
  if (it.targetDue) {
    return {
      type: 'met',
      text: `Target met · ${it.targetDue}`,
    };
  }
  return undefined;
}

export function computeBudgetTotals(dto: MonthBudgetPlanDTO): BudgetTotals {
  const totalIncomeCents = (dto.categories ?? [])
    .filter((g) => g.name === 'Income')
    .flatMap((g) => g.items)
    .reduce((sum, it) => sum + (it.receivedCents ?? 0), 0);

  const totalAssignedCents = (dto.categories ?? [])
    .flatMap((g) => g.items)
    .reduce((sum, it) => sum + (it.fundedCents ?? 0), 0);

  return {
    leftToBudgetCents: totalIncomeCents - totalAssignedCents,
    totalAssignedCents,
    totalIncomeCents,
  };
}
