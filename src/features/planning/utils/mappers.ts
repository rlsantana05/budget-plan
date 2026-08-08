import type { MonthBudgetPlanDTO } from '@/types/budget';
import type { Group } from '../types';

export function toGroups(dto: MonthBudgetPlanDTO): Group[] {
  return (dto.categories ?? []).map((cg) => ({
    id: cg.id,
    name: cg.name,
    defaultExpanded: (cg.items ?? []).length > 0,
    isIncome: cg.name === 'Income',
    rightColumnOptions:
      cg.name === 'Income'
        ? []
        : [
          { label: 'Remaining', selected: cg.rightColumn === 'Remaining' },
          { label: 'Spent', selected: cg.rightColumn === 'Spent' },
        ],
    items: (cg.items ?? []).map((it) => ({
      id: it.id,
      name: it.name,
      dueDate: it.dueDate ?? null,
      planned: Number(it.planned),
      funded: Number(it.funded ?? 0),
      spent: Number(it.spent),
      received: Number(it.received ?? 0),
      remaining: Number(it.remaining),
      transactionCount: it.transactionCount,
      templateId: it.templateId ?? null,
      targetType: it.targetType ?? 'NONE',
      targetAmount: Number(it.targetAmount ?? 0),
      targetDue: it.targetDue ?? null,
      targetDate: it.targetDate ?? null,
      targetMonthDay: it.targetMonthDay ?? null,
      needed: Number(it.needed ?? 0),
      trend: (it.trend ?? []).map((t) => ({
        month: t.month,
        activity: Number(t.activity ?? 0),
      })),
    })),
  }));
}
