import type { GroupItem } from '../types';

export type AvailableStatus = 'unset' | 'complete' | 'at-risk' | 'in-progress';

const DAY_MS = 86_400_000;

export function getAvailableStatus(
  assigned: number,
  target: number,
  dueDate: Date | null,
  now = new Date(),
): AvailableStatus {
  if (target <= 0) return 'unset';
  if (assigned >= target) return 'complete';
  if (dueDate && dueDate.getTime() - now.getTime() <= 7 * DAY_MS) return 'at-risk';
  return 'in-progress';
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function resolveTargetDueDate(
  item: GroupItem,
  now = new Date(),
): Date | null {
  if (item.targetType === 'ONCE' && item.targetDate) {
    const date = new Date(item.targetDate);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (item.targetType === 'MONTHLY' && item.targetMonthDay != null) {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = Math.min(item.targetMonthDay, daysInMonth(year, month));
    const due = new Date(year, month - 1, day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (due.getTime() < today.getTime()) {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextDay = Math.min(item.targetMonthDay, daysInMonth(nextYear, nextMonth));
      return new Date(nextYear, nextMonth - 1, nextDay);
    }
    return due;
  }
  return null;
}
