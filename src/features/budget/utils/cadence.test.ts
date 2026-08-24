import { describe, expect, it } from 'vitest';
import { classifyCadence, type CadenceInput } from './cadence';

const base: CadenceInput = {
  targetType: 'NONE' as const,
  targetAmountCents: 0,
  targetMonthDay: null,
  targetDueDate: null,
};

// Aug 2026: Sat Aug 22 – Fri Aug 28
const weekStart = new Date(2026, 7, 22);
const weekEnd = new Date(2026, 7, 28);

describe('classifyCadence', () => {
  it('no-target category is weekly', () => {
    expect(classifyCadence(base, weekStart, weekEnd)).toBe('weekly');
  });

  it('MONTHLY bill due inside window -> monthly-due-this-week', () => {
    expect(classifyCadence(
      { ...base, targetType: 'MONTHLY', targetAmountCents: 200_000, targetMonthDay: 26 },
      weekStart,
      weekEnd,
    )).toBe('monthly-due-this-week');
  });

  it('MONTHLY bill due outside window -> monthly-not-due', () => {
    expect(classifyCadence(
      { ...base, targetType: 'MONTHLY', targetAmountCents: 200_000, targetMonthDay: 5 },
      weekStart,
      weekEnd,
    )).toBe('monthly-not-due');
  });

  it('month-day 31 clamps to month length (Feb -> 28th)', () => {
    // Feb 2026: Sat Feb 21 – Fri Feb 27. Day 31 clamps to Feb 28 → NOT in window.
    const febStart = new Date(2026, 1, 21);
    const febEnd = new Date(2026, 1, 27);
    expect(classifyCadence(
      { ...base, targetType: 'MONTHLY', targetAmountCents: 100_000, targetMonthDay: 31 },
      febStart,
      febEnd,
    )).toBe('monthly-not-due');

    // Jan 2026 has a 31st: Sat Jan 24 – Fri Jan 30 window contains the 31st? No.
    // Use Sat Jan 25–Fri Jan 31: clamped day stays 31 and IS in window.
    const janStart = new Date(2026, 0, 25);
    const janEnd = new Date(2026, 0, 31);
    expect(classifyCadence(
      { ...base, targetType: 'MONTHLY', targetAmountCents: 100_000, targetMonthDay: 31 },
      janStart,
      janEnd,
    )).toBe('monthly-due-this-week');
  });

  it('ONCE target due in window -> monthly-due-this-week', () => {
    expect(classifyCadence(
      { ...base, targetType: 'ONCE', targetAmountCents: 50_000, targetDueDate: new Date(2026, 7, 25) },
      weekStart,
      weekEnd,
    )).toBe('monthly-due-this-week');
  });

  it('MONTHLY with zero amount behaves like weekly (no real bill set)', () => {
    expect(classifyCadence(
      { ...base, targetType: 'MONTHLY', targetAmountCents: 0, targetMonthDay: 26 },
      weekStart,
      weekEnd,
    )).toBe('weekly');
  });
});
