import { describe, expect, it } from 'vitest';
import {
  formatWeekRange,
  getMonthWeeks,
  tagLabel,
  toIsoDate,
  withTags,
} from './weeks';

describe('weeks (spec 2026-08-23-budget-weekly-ledger)', () => {
  it('produces Sat→Fri weeks clipped to the month', () => {
    const weeks = getMonthWeeks(2026, 4); // April 2026
    // Apr 1 2026 is a Wednesday; first week starts Sat Mar 28.
    const first = weeks[0];
    expect(toIsoDate(first.start)).toBe('2026-03-28');
    expect(toIsoDate(first.end)).toBe('2026-04-03');
    // Last week ends on or after Apr 30 (Apr 30 is a Thursday → Fri May 1).
    const last = weeks[weeks.length - 1];
    expect(toIsoDate(last.end)).toBe('2026-05-01');
    // All windows are 7 days.
    for (const w of weeks) {
      const days = Math.round((+w.end - +w.start) / 86_400_000);
      expect(days).toBe(6);
    }
    // 4–5 weeks per month.
    expect(weeks.length).toBeGreaterThanOrEqual(4);
    expect(weeks.length).toBeLessThanOrEqual(5);
  });

  it('keys are consecutive Saturdays', () => {
    const weeks = getMonthWeeks(2026, 8); // Aug 2026
    for (let i = 1; i < weeks.length; i++) {
      const prev = new Date(weeks[i - 1].start);
      prev.setDate(prev.getDate() + 7);
      expect(toIsoDate(prev)).toBe(weeks[i].key);
    }
  });

  it('tags past/current/future relative to now', () => {
    const weeks = getMonthWeeks(2026, 4);
    const midApril = new Date(2026, 3, 13); // inside week 3
    const tagged = withTags(weeks, midApril);
    expect(tagged.filter((w) => w.tag === 'past').length).toBe(2);
    expect(tagged.filter((w) => w.tag === 'current').length).toBe(1);
    const current = tagged.find((w) => w.tag === 'current')!;
    expect(current.start <= midApril && current.end >= midApril).toBe(true);
  });

  it('formats ranges compactly within a month and across months', () => {
    expect(formatWeekRange(new Date(2026, 3, 11), new Date(2026, 3, 17)))
      .toBe('Apr 11 – 17');
    expect(formatWeekRange(new Date(2026, 2, 28), new Date(2026, 3, 3)))
      .toBe('Mar 28 – Apr 3');
  });

  it('tag labels are human words', () => {
    expect(tagLabel('past')).toBe('Past');
    expect(tagLabel('current')).toBe('Current');
    expect(tagLabel('future')).toBe('Future');
  });
});
