/**
 * Money representation: all monetary values are **integer cents** end to end.
 *
 * Rules:
 * - Never do arithmetic on dollars (floats). Convert at the boundary once.
 * - `toCents` accepts Prisma Decimal | number | string and rounds half-up.
 * - `fromCents` is for display/formatting only — never feed its float result
 *   back into arithmetic.
 */

export function toCents(value: number | string): number {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Display-only conversion. Do not use the result for further math. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Parse a user-typed amount string ("12.34", "12.", ".5") into integer cents.
 * Non-numeric input yields 0. Mirrors sanitizeAmountText's accepted grammar:
 * optional digits, optional decimal point, up to 2 decimals.
 */
export function parseAmountToCents(text: string): number {
  const trimmed = text.trim().replace(/\.$/, '');
  if (trimmed === '' || trimmed === '.') return 0;
  if (!/^-?\d*(\.\d{0,2})?$/.test(trimmed)) return 0;
  return toCents(trimmed);
}

const CENTS_PER_DOLLAR = 100;

/** Format integer cents as "$1,234.56". */
export function formatCents(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / CENTS_PER_DOLLAR);
  const rem = abs % CENTS_PER_DOLLAR;
  const formatted = `${dollars.toLocaleString('en-US')}.${String(rem).padStart(2, '0')}`;
  return `${negative ? '-' : ''}$${formatted}`;
}
