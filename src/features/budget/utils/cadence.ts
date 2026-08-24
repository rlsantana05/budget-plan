export type Cadence = 'weekly' | 'monthly-due-this-week' | 'monthly-not-due';

export interface CadenceInput {
  targetType: 'NONE' | 'ONCE' | 'MONTHLY';
  targetAmountCents: number;
  targetMonthDay: number | null;
  targetDueDate: Date | null;
}

/**
 * Clamp a recurring month-day (1–31) to the actual length of the month
 * containing `ref`. Day 31 in a 30-day month → 30; in February → 28/29.
 */
function effectiveDueDate(targetMonthDay: number, ref: Date): Date {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(targetMonthDay, lastDay));
}

/** Local-date comparison via epoch ms avoids string-ordering bugs. */
function inWindow(d: Date, start: Date, end: Date): boolean {
  const t = d.setHours(0, 0, 0, 0);
  return t >= start.setHours(0, 0, 0, 0) && t <= end.setHours(0, 0, 0, 0);
}

/**
 * Bucket a category for a given week window (spec:
 * weekly-cadence-buckets). First match wins:
 *
 * - ONCE with due date inside the window → monthly-due-this-week
 * - MONTHLY with a real amount and clamped month-day inside → due this week
 * - MONTHLY with a real amount, outside → monthly-not-due
 * - everything else (no target / zero-amount MONTHLY) → weekly
 */
export function classifyCadence(
  input: CadenceInput,
  weekStart: Date,
  weekEnd: Date,
): Cadence {
  if (input.targetType === 'ONCE') {
    if (input.targetDueDate && inWindow(input.targetDueDate, weekStart, weekEnd)) {
      return 'monthly-due-this-week';
    }
    return 'weekly';
  }

  const hasRealBill = input.targetType === 'MONTHLY' && input.targetAmountCents > 0;
  if (hasRealBill && input.targetMonthDay != null) {
    const due = effectiveDueDate(input.targetMonthDay, weekStart);
    return inWindow(due, weekStart, weekEnd)
      ? 'monthly-due-this-week'
      : 'monthly-not-due';
  }

  return 'weekly';
}
