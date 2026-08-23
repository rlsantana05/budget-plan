import { describe, it, expect } from 'vitest';
import { getAvailableStatus, resolveTargetDueDate } from './status';

describe('status utils', () => {
  describe('getAvailableStatus', () => {
    const now = new Date('2026-01-15T12:00:00.000Z');

    it('returns unset when target is 0', () => {
      expect(getAvailableStatus(100, 0, null, now)).toBe('unset');
    });

    it('returns complete when assigned >= target', () => {
      expect(getAvailableStatus(100, 100, null, now)).toBe('complete');
      expect(getAvailableStatus(150, 100, null, now)).toBe('complete');
    });

    it('returns at-risk when due date is within 7 days', () => {
      const dueDate = new Date(now);
      dueDate.setDate(now.getDate() + 5);
      expect(getAvailableStatus(50, 100, dueDate, now)).toBe('at-risk');
    });

    it('returns in-progress when none of the above', () => {
      const dueDate = new Date(now);
      dueDate.setDate(now.getDate() + 10);
      expect(getAvailableStatus(50, 100, dueDate, now)).toBe('in-progress');
    });
  });

  describe('resolveTargetDueDate', () => {
    const now = new Date('2026-01-15T12:00:00.000Z');

    it('returns null for NONE target type', () => {
      const item = {
        id: 'test-id',
        name: 'test',
        dueDate: null,
        plannedCents: 0,
        fundedCents: 0,
        spentCents: 0,
        receivedCents: 0,
        remainingCents: 0,
        transactionCount: 0,
        templateId: null,
        targetType: 'NONE' as const,
        targetAmountCents: 0,
        targetDue: null,
        targetDate: null,
        targetMonthDay: null,
        neededCents: 0,
        trend: [],
      };
      expect(resolveTargetDueDate(item, now)).toBeNull();
    });

    it('returns dueDate for ONCE target type', () => {
      const dueDate = '2026-02-20T00:00:00.000Z';
      const item = {
        id: 'test-id',
        name: 'test',
        dueDate: null,
        plannedCents: 0,
        fundedCents: 0,
        spentCents: 0,
        receivedCents: 0,
        remainingCents: 0,
        transactionCount: 0,
        templateId: null,
        targetType: 'ONCE' as const,
        targetAmountCents: 10000,
        targetDue: null,
        targetDate: dueDate,
        targetMonthDay: null,
        neededCents: 0,
        trend: [],
      };
      expect(resolveTargetDueDate(item, now)).toEqual(new Date(dueDate));
    });

    it('returns null for invalid ONCE date', () => {
      const item = {
        id: 'test-id',
        name: 'test',
        dueDate: null,
        plannedCents: 0,
        fundedCents: 0,
        spentCents: 0,
        receivedCents: 0,
        remainingCents: 0,
        transactionCount: 0,
        templateId: null,
        targetType: 'ONCE' as const,
        targetAmountCents: 10000,
        targetDue: null,
        targetDate: 'invalid-date',
        targetMonthDay: null,
        neededCents: 0,
        trend: [],
      };
      expect(resolveTargetDueDate(item, now)).toBeNull();
    });

    it('returns appropriate due date for MONTHLY target', () => {
      const item = {
        id: 'test-id',
        name: 'test',
        dueDate: null,
        plannedCents: 0,
        fundedCents: 0,
        spentCents: 0,
        receivedCents: 0,
        remainingCents: 0,
        transactionCount: 0,
        templateId: null,
        targetType: 'MONTHLY' as const,
        targetAmountCents: 10000,
        targetDue: null,
        targetDate: null,
        targetMonthDay: 15,
        neededCents: 0,
        trend: [],
      };
      const result = resolveTargetDueDate(item, now);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(15);
    });

    it('returns next month when current day has passed', () => {
      const nowRef = new Date('2026-01-20T12:00:00.000Z');
      const item = {
        id: 'test-id',
        name: 'test',
        dueDate: null,
        plannedCents: 0,
        fundedCents: 0,
        spentCents: 0,
        receivedCents: 0,
        remainingCents: 0,
        transactionCount: 0,
        templateId: null,
        targetType: 'MONTHLY' as const,
        targetAmountCents: 10000,
        targetDue: null,
        targetDate: null,
        targetMonthDay: 15,
        neededCents: 0,
        trend: [],
      };
      const result = resolveTargetDueDate(item, nowRef);
      expect(result?.getFullYear()).toBe(2026);
      expect(result?.getMonth()).toBe(1); // February
      expect(result?.getDate()).toBe(15);
    });

    it('handles end of month edge case for MONTHLY target', () => {
      const nowRef = new Date('2026-02-20T12:00:00.000Z');
      const item = {
        id: 'test-id',
        name: 'test',
        dueDate: null,
        plannedCents: 0,
        fundedCents: 0,
        spentCents: 0,
        receivedCents: 0,
        remainingCents: 0,
        transactionCount: 0,
        templateId: null,
        targetType: 'MONTHLY' as const,
        targetAmountCents: 10000,
        targetDue: null,
        targetDate: null,
        targetMonthDay: 31,
        neededCents: 0,
        trend: [],
      };
      const result = resolveTargetDueDate(item, nowRef);
      // February 2026 has 28 days (not a leap year) — day 31 clamps to 28
      expect(result?.getMonth()).toBe(1); // February
      expect(result?.getDate()).toBe(28); // 2026 is not a leap year
    });
  });
});
