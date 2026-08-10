import type { MonthBudgetPlanDTO } from '@/types/budget';
import { formatMoney } from './formatters';
import type {
  BudgetCategoryItem,
  BudgetGroup,
  BudgetTotals,
  CategoryMeta,
} from '../types/budget.types';

export function toBudgetGroups(dto: MonthBudgetPlanDTO): BudgetGroup[] {
  return (dto.categories ?? []).map<BudgetGroup>((cg) => ({
    id: cg.id,
    name: cg.name,
    items: (cg.items ?? []).map<BudgetCategoryItem>((it) => ({
      id: it.id,
      name: it.name,
      assigned: Number(it.funded ?? 0),
      activity: Number(it.spent),
      meta: toCategoryMeta(it),
    })),
  }));
}

function toCategoryMeta(it: MonthBudgetPlanDTO['categories'][number]['items'][number]): CategoryMeta | undefined {
  if (it.targetType === 'NONE') return undefined;
  if ((it.needed ?? 0) > 0 && it.targetDue) {
    return {
      type: 'due',
      text: `${formatMoney(Number(it.needed))} needed by ${it.targetDue}`,
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
  const totalIncome = (dto.categories ?? [])
    .filter((g) => g.name === 'Income')
    .flatMap((g) => g.items)
    .reduce((sum, it) => sum + (it.received ?? 0), 0);

  const totalAssigned = (dto.categories ?? [])
    .flatMap((g) => g.items)
    .reduce((sum, it) => sum + (it.funded ?? 0), 0);

  return {
    leftToBudget: totalIncome - totalAssigned,
    totalAssigned,
    totalIncome,
  };
}