import { describe, expect, it } from 'vitest';
import {
  formatCents,
  fromCents,
  parseAmountToCents,
  toCents,
} from './money';

describe('toCents', () => {
  it('converts dollars to cents', () => {
    expect(toCents(12.34)).toBe(1234);
    expect(toCents('12.34')).toBe(1234);
    expect(toCents(0.1)).toBe(10);
    expect(toCents(0)).toBe(0);
    expect(toCents(-5.25)).toBe(-525);
  });

  it('rounds half-up on sub-cent precision', () => {
    expect(toCents(0.005)).toBe(1);
    expect(toCents(10.999)).toBe(1100);
    expect(toCents('19.99')).toBe(1999);
  });

  it('maps non-finite input to 0', () => {
    expect(toCents(Number.NaN)).toBe(0);
    expect(toCents(Number.POSITIVE_INFINITY)).toBe(0);
    expect(toCents('not-a-number')).toBe(0);
    expect(toCents('')).toBe(0);
  });
});

describe('fromCents', () => {
  it('round-trips cents to display dollars', () => {
    expect(fromCents(1234)).toBeCloseTo(12.34, 10);
    expect(fromCents(0)).toBe(0);
    expect(fromCents(-525)).toBeCloseTo(-5.25, 10);
  });

  it('round-trips through toCents for all cent values', () => {
    for (let c = -100000; c <= 100000; c += 7) {
      expect(toCents(fromCents(c))).toBe(c);
    }
  });
});

describe('parseAmountToCents', () => {
  it('parses user-typed amounts', () => {
    expect(parseAmountToCents('12.34')).toBe(1234);
    expect(parseAmountToCents('12.3')).toBe(1230);
    expect(parseAmountToCents('12')).toBe(1200);
    expect(parseAmountToCents('0.05')).toBe(5);
  });

  it('handles trailing dot and empty input', () => {
    expect(parseAmountToCents('12.')).toBe(1200);
    expect(parseAmountToCents('.')).toBe(0);
    expect(parseAmountToCents('')).toBe(0);
  });

  it('returns 0 for garbage instead of NaN (regression)', () => {
    expect(parseAmountToCents('abc')).toBe(0);
    expect(parseAmountToCents('NaN')).toBe(0);
    expect(parseAmountToCents('1.234')).toBe(0); // >2 decimals rejected
  });
});

describe('formatCents', () => {
  it('formats with thousands separators and 2 decimals', () => {
    expect(formatCents(1234)).toBe('$12.34');
    expect(formatCents(275000)).toBe('$2,750.00');
    expect(formatCents(5)).toBe('$0.05');
    expect(formatCents(100000000)).toBe('$1,000,000.00');
  });

  it('formats negatives with a leading minus', () => {
    expect(formatCents(-1234)).toBe('-$12.34');
    expect(formatCents(-50)).toBe('-$0.50');
  });

  it('is the inverse of parsing for whole-cent values', () => {
    const samples = ['0', '5', '12.34', '2750', '999999.99'];
    samples.forEach((text) => {
      expect(formatCents(parseAmountToCents(text))).toBe(`$${Number(text).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    });
  });
});
