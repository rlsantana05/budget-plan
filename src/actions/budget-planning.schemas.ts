import { z } from 'zod';

/**
 * Input validation schemas for budget-planning server actions
 * (spec 2026-08-22-server-action-validation).
 *
 * Money invariant: every `*Cents` field is an INTEGER ≥ 0.
 * Server actions parse their input through these schemas before any DB access;
 * a failed parse throws and the client surfaces it via runTxAction.
 */

const cuid = z.string().min(1).max(64);

/** Integer cents: whole numbers, zero or positive, capped at $10M. */
const cents = z.number().int().min(0).max(1_000_000_000);

/** Category / item name as typed by a user. */
const itemName = z
  .string()
  .trim()
  // Strip control characters that would corrupt the ledger display.
  .transform((s) => s.replace(/[\u0000-\u001F\u007F]/g, ''))
  .pipe(z.string().min(1, 'Name is required').max(80));

export const addCategoryItemSchema = z.object({
  groupId: cuid,
  name: itemName,
  plannedCents: cents,
});

export const updateCategoryItemSchema = z.object({
  id: cuid,
  name: itemName.optional(),
  plannedCents: cents.optional(),
});

export const deleteCategoryItemSchema = z.object({ id: cuid });
export const restoreCategoryItemSchema = z.object({ id: cuid });
export const setCategoryAssignedSchema = z.object({
  categoryId: cuid,
  amountCents: cents,
});
export const assignToCategorySchema = z.object({
  categoryId: cuid,
  amountCents: cents,
});

export const moveBetweenCategoriesSchema = z.object({
  fromCategoryId: cuid,
  toCategoryId: cuid,
  amountCents: cents,
});

export const reorderCategoryItemsSchema = z.object({
  groupId: cuid,
  orderedIds: z.array(cuid).min(1).max(200),
});

export const receivePlannedIncomeSchema = z.object({ categoryItemId: cuid });

export const setCategoryTargetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('NONE') }),
  z.object({
    type: z.literal('ONCE'),
    amountCents: cents.refine((v) => v > 0, 'Target amount must be positive'),
    dueDate: z.string().refine(
      (s) => !Number.isNaN(Date.parse(s)),
      'Due date is invalid',
    ),
  }),
  z.object({
    type: z.literal('MONTHLY'),
    amountCents: cents.refine((v) => v > 0, 'Target amount must be positive'),
    monthDay: z.number().int().min(1).max(31),
  }),
]);

export const addTransactionSchema = z.object({
  /** User-entered dollars at the modal boundary; converted server-side. */
  amount: z.number().finite().gt(0).max(10_000_000),
  categoryId: cuid.nullish(),
  accountId: cuid.nullish(),
  payee: z.string().trim().max(120).nullish(),
  memo: z.string().trim().max(500).nullish(),
  date: z.date().optional(),
});

export const transactionIdSchema = z.object({ id: cuid });

export const upsertMonthBudgetNoteSchema = z.object({
  monthBudgetId: cuid,
  note: z.string().trim().max(2000),
});

export const addPaycheckSchema = z.object({
  monthBudgetId: cuid,
  accountId: cuid,
  amountCents: cents.refine((v) => v > 0, 'Paycheck amount must be positive'),
  note: z.string().trim().max(200).optional(),
});

/** Format a ZodError into the single message string the client already displays. */
export function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`)
    .join('; ');
}
