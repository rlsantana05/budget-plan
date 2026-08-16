import { describe, it, expect } from 'vitest';
import { formatMoney, sanitizeAmountText, parseAmountText } from './formatters';

describe('formatters', () => {
  describe('formatMoney', () => {
    it('formats positive number with currency', () => {
      expect(formatMoney(1234.56)).toBe('$1,234.56');
    });

    it('formats negative number with currency', () => {
      expect(formatMoney(-45.67)).toBe('$-45.67');
    });

    it('formats zero', () => {
      expect(formatMoney(0)).toBe('$0.00');
    });

    it('handles large numbers', () => {
      expect(formatMoney(1234567)).toBe('$1,234,567.00');
    });
  });

  describe('sanitizeAmountText', () => {
    it('removes all non-digit and non-dot characters', () => {
      expect(sanitizeAmountText('abc123.45def')).toBe('123.45');
    });

    it('limits to 9 characters', () => {
      expect(sanitizeAmountText('123456789012')).toBe('123456789');
    });

    it('limits decimal part to 2 digits', () => {
      expect(sanitizeAmountText('123.456')).toBe('123.45');
    });

    it('handles multiple dots', () => {
      expect(sanitizeAmountText('1.2.3')).toBe('1.23');
    });

    it('returns empty string for non-digit input', () => {
      expect(sanitizeAmountText('abc')).toBe('');
    });
  });

  describe('parseAmountText', () => {
    it('parses valid number string', () => {
      expect(parseAmountText('123.45')).toBe(123.45);
    });

    it('parses integer string', () => {
      expect(parseAmountText('42')).toBe(42);
    });

    it('handles empty string', () => {
      expect(parseAmountText('')).toBe(0);
    });

    it('handles just dot', () => {
      expect(parseAmountText('.')).toBe(0);
    });

    it('converts NaN to 0', () => {
      expect(parseAmountText('abc')).toBe(0);
    });
  });
});
