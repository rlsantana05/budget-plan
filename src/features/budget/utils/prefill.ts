/**
 * Smart prefill suggestions (spec: weekly-cadence-buckets, Task 4).
 *
 * For "every week" categories: average the per-week planned totals across
 * distinct week_keys in this month (ignores null weeks). Plain mean — v1.
 */

/** Input rows: one per (category, week) with that week's total cents. */
export interface WeeklyHistoryRow {
  categoryId: string;
  weekKey: string;
  totalCents: number;
}

/**
 * Average of per-week totals per category across DISTINCT week keys.
 * Returns a map categoryId → suggested cents (rounded to whole dollars).
 */
export function averageWeeklyPlan(rows: WeeklyHistoryRow[]): Map<string, number> {
  const sums = new Map<string, number>();
  const weekCounts = new Map<string, number>();

  for (const r of rows) {
    if (!Number.isFinite(r.totalCents)) continue;
    const key = `${r.categoryId}::${r.weekKey}`;
    if (sums.has(key)) continue; // dedupe identical (cat, week) pairs defensively
    sums.set(key, r.totalCents);
    weekCounts.set(r.categoryId, (weekCounts.get(r.categoryId) ?? 0) + 1);
  }

  // Sum again per category
  const totals = new Map<string, number>();
  for (const [key, cents] of sums) {
    const cat = key.split('::')[0];
    totals.set(cat, (totals.get(cat) ?? 0) + cents);
  }

  const out = new Map<string, number>();
  for (const [cat, total] of totals) {
    const weeks = weekCounts.get(cat) ?? 1;
    const avg = Math.round(total / weeks / 100) * 100; // whole dollars
    out.set(cat, avg);
  }
  return out;
}
