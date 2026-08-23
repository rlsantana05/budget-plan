import type { MonthBudgetPlanDTO } from '@/types/budget';
import type { Group } from '../types';

/**
 * Map the server DTO (integer cents) to the client Group model. Money passes
 * through unchanged — both sides are integer cents; no conversion here.
 */
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
      plannedCents: it.plannedCents ?? 0,
      fundedCents: it.fundedCents ?? 0,
      spentCents: it.spentCents ?? 0,
      receivedCents: it.receivedCents ?? 0,
      remainingCents: it.remainingCents ?? 0,
      transactionCount: it.transactionCount,
      templateId: it.templateId ?? null,
      targetType: it.targetType ?? 'NONE',
      targetAmountCents: it.targetAmountCents ?? 0,
      targetDue: it.targetDue ?? null,
      targetDate: it.targetDate ?? null,
      targetMonthDay: it.targetMonthDay ?? null,
      neededCents: it.neededCents ?? 0,
      trend: (it.trend ?? []).map((t) => ({
        month: t.month,
        activityCents: t.activityCents ?? 0,
      })),
    })),
  }));
}
