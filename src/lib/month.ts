const MONTH_RE = /^(\d{4})-(\d{2})$/;

export function parseMonthValue(
  value?: string,
): { year: number; month: number } {
  const m = value?.match(MONTH_RE);
  if (m) {
    const month = Number(m[2]);
    if (month >= 1 && month <= 12) return { year: Number(m[1]), month };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function formatMonthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function shiftMonthValue(value: string, delta: number): string {
  const { year, month } = parseMonthValue(value);
  const d = new Date(year, month - 1 + delta, 1);
  return formatMonthValue(d.getFullYear(), d.getMonth() + 1);
}

export function normalizeMonthParam(
  value?: string | string[],
): { year: number; month: number } {
  return parseMonthValue(Array.isArray(value) ? value[0] : value);
}
