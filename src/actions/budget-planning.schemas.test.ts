import { describe, expect, it } from 'vitest';
import {
  addCategoryItemSchema,
  addTransactionSchema,
  formatValidationError,
  moveBetweenCategoriesSchema,
  reorderCategoryItemsSchema,
  setCategoryAssignedSchema,
  setCategoryTargetSchema,
  updateCategoryItemSchema,
} from './budget-planning.schemas';

describe('server action validation schemas (spec 2026-08-22-server-action-validation)', () => {
  describe('addCategoryItemSchema', () => {
    it('accepts valid input', () => {
      const result = addCategoryItemSchema.safeParse({
        groupId: 'g1',
        name: 'Groceries',
        plannedCents: 25000,
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-integer cents (float money is forbidden)', () => {
      const result = addCategoryItemSchema.safeParse({
        groupId: 'g1',
        name: 'X',
        plannedCents: 12.34,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative amounts', () => {
      const result = addCategoryItemSchema.safeParse({
        groupId: 'g1',
        name: 'X',
        plannedCents: -5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty and oversized names', () => {
      expect(
        addCategoryItemSchema.safeParse({ groupId: 'g1', name: '', plannedCents: 0 }).success,
      ).toBe(false);
      expect(
        addCategoryItemSchema.safeParse({ groupId: 'g1', name: 'x'.repeat(81), plannedCents: 0 }).success,
      ).toBe(false);
    });

    it('trims names via transform', () => {
      const result = addCategoryItemSchema.parse({
        groupId: 'g1',
        name: '  Gas  ',
        plannedCents: 0,
      });
      expect(result.name).toBe('Gas');
    });
  });

  describe('updateCategoryItemSchema', () => {
    it('allows partial patches', () => {
      expect(updateCategoryItemSchema.safeParse({ id: 'c1' }).success).toBe(true);
      expect(
        updateCategoryItemSchema.safeParse({ id: 'c1', plannedCents: 500 }).success,
      ).toBe(true);
    });

    it('rejects whitespace-only names after trim', () => {
      const result = updateCategoryItemSchema.safeParse({ id: 'c1', name: '   ' });
      expect(result.success).toBe(false);
    });
  });

  describe('setCategoryAssignedSchema', () => {
    it('allows zero (unassigning)', () => {
      expect(setCategoryAssignedSchema.safeParse({ categoryId: 'c1', amountCents: 0 }).success).toBe(true);
    });
    it('rejects NaN-ish float cents', () => {
      expect(setCategoryAssignedSchema.safeParse({ categoryId: 'c1', amountCents: 10.005 }).success).toBe(false);
    });
  });

  describe('setCategoryTargetSchema', () => {
    it('accepts NONE without other fields', () => {
      expect(setCategoryTargetSchema.safeParse({ type: 'NONE' }).success).toBe(true);
    });

    it('requires dueDate for ONCE', () => {
      const missing = setCategoryTargetSchema.safeParse({
        type: 'ONCE',
        amountCents: 5000,
      });
      expect(missing.success).toBe(false);

      const badDate = setCategoryTargetSchema.safeParse({
        type: 'ONCE',
        amountCents: 5000,
        dueDate: 'not-a-date',
      });
      expect(badDate.success).toBe(false);

      const ok = setCategoryTargetSchema.safeParse({
        type: 'ONCE',
        amountCents: 5000,
        dueDate: '2026-09-01',
      });
      expect(ok.success).toBe(true);
    });

    it('requires monthDay 1-31 for MONTHLY', () => {
      expect(
        setCategoryTargetSchema.safeParse({ type: 'MONTHLY', amountCents: 5000, monthDay: 32 }).success,
      ).toBe(false);
      expect(
        setCategoryTargetSchema.safeParse({ type: 'MONTHLY', amountCents: 5000, monthDay: 0 }).success,
      ).toBe(false);
    });

    it('rejects zero/negative target amounts', () => {
      expect(setCategoryTargetSchema.safeParse({ type: 'MONTHLY', amountCents: 0, monthDay: 5 }).success).toBe(false);
    });
  });

  describe('moveBetweenCategoriesSchema', () => {
    it('rejects moving to the same category only if ids match is allowed by schema (business rule elsewhere)', () => {
      // Same-id guard is a business rule; schema validates shape.
      const result = moveBetweenCategoriesSchema.safeParse({
        fromCategoryId: 'a',
        toCategoryId: 'b',
        amountCents: 100,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('reorderCategoryItemsSchema', () => {
    it('rejects empty lists and >200 items', () => {
      expect(reorderCategoryItemsSchema.safeParse({ groupId: 'g1', orderedIds: [] }).success).toBe(false);
      expect(
        reorderCategoryItemsSchema.safeParse({ groupId: 'g1', orderedIds: Array.from({ length: 201 }, (_, i) => `id${i}`) })
          .success,
      ).toBe(false);
    });
  });

  describe('addTransactionSchema', () => {
    it('accepts dollars with account', () => {
      expect(
        addTransactionSchema.safeParse({ amount: 25.5, accountId: 'acc1' }).success,
      ).toBe(true);
    });
    it('rejects zero and negative amounts', () => {
      expect(addTransactionSchema.safeParse({ amount: 0, accountId: 'acc1' }).success).toBe(false);
      expect(addTransactionSchema.safeParse({ amount: -3, accountId: 'acc1' }).success).toBe(false);
    });
    it('rejects Infinity/NaN', () => {
      expect(addTransactionSchema.safeParse({ amount: Number.POSITIVE_INFINITY, accountId: 'a' }).success).toBe(false);
      expect(addTransactionSchema.safeParse({ amount: Number.NaN, accountId: 'a' }).success).toBe(false);
    });
  });

  describe('formatValidationError', () => {
    it('produces path-prefixed messages the client can display', () => {
      const result = addCategoryItemSchema.safeParse({ groupId: '', name: '', plannedCents: -1 });
      if (result.success) throw new Error('expected failure');
      const message = formatValidationError(result.error);
      expect(message).toContain('groupId');
      expect(message).toContain(';');
    });
  });
});
