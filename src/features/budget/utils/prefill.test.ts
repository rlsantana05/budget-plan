import { describe, expect, it } from 'vitest';
import { averageWeeklyPlan, type WeeklyHistoryRow } from './prefill';

const row = (categoryId: string, weekKey: string, totalCents: number): WeeklyHistoryRow => ({
  categoryId,
  weekKey,
  totalCents,
});

describe('averageWeeklyPlan (spec Task 4)', () => {
  it('averages across distinct weeks', () => {
    const rows = [
      row('gas', '2026-08-01', 10_000),
      row('gas', '2026-08-08', 20_000),
      row('gas', '2026-08-15', 30_000),
    ];
    const out = averageWeeklyPlan(rows);
    expect(out.get('gas')).toBe(20_000); // mean of 10/20/30
  });

  it('rounds to whole dollars', () => {
    const rows = [row('food', '2026-08-01', 10_050), row('food', '2026-08-08', 10_000)];
    // mean = 10_025 cents → rounds to 10_000 ($100)
    expect(averageWeeklyPlan(rows).get('food')).toBe(10_000);
  });

  it('ignores duplicate (category, week) rows defensively', () => {
    const rows = [
      row('gas', '2026-08-01', 10_000),
      row('gas', '2026-08-01', 99_999), // duplicate week — must not double-count
    ];
    expect(averageWeeklyPlan(rows).get('gas')).toBe(10_000);
  });

  it('handles multiple categories independently', () => {
    const rows = [
      row('gas', '2026-08-01', 10_000),
      row('food', '2026-08-01', 50_000),
      row('gas', '2026-08-08', 20_000),
      row('food', '2026-08-08', 70_000),
    ];
    const out = averageWeeklyPlan(rows);
    expect(out.get('gas')).toBe(15_000);
    expect(out.get('food')).toBe(60_000);
  });

  it('empty input → empty map', () => {
    expect(averageWeeklyPlan([]).size).toBe(0);
  });
});
