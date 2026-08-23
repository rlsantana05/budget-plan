/**
 * Money invariant (spec 2026-08-22-money-in-cents): every field ending in
 * `Cents` holds an INTEGER number of cents. Format for display with
 * utils/money.ts `formatCents`; parse user input with `parseAmountToCents`.
 */

export interface GroupItem {
  id: string;
  /** Stable client-side id that never changes after the server assigns `id`.
   *  Use as React key. Optional for legacy/mock data (falls back to `id`). */
  clientId?: string;
  name: string;
  dueDate: string | null;
  plannedCents: number;
  fundedCents: number;
  spentCents: number;
  receivedCents: number;
  remainingCents: number;
  transactionCount: number;
  templateId: string | null;
  targetType: 'NONE' | 'ONCE' | 'MONTHLY';
  targetAmountCents: number;
  targetDue: string | null;
  targetDate: string | null;
  targetMonthDay: number | null;
  neededCents: number;
  trend: Array<{ month: string; activityCents: number }>;
}

export interface PlanningCategory {
  name: string;
  plannedCents: number;
  spentCents: number;
  remainingCents: number;
  isIncome: boolean;
}

export interface Group {
  id: string;
  name: string;
  defaultExpanded: boolean;
  isIncome: boolean;
  rightColumnOptions: Array<{ label: 'Spent' | 'Remaining'; selected: boolean }>;
  items: GroupItem[];
}
