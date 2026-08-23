export function formatMoney(n: number): string {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function sanitizeAmountText(text: string): string {
  const value = text.replace(/[^\d.]/g, '');
  const firstDot = value.indexOf('.');
  if (firstDot !== -1) {
    const before = value.slice(0, firstDot);
    const after = value
      .slice(firstDot + 1)
      .replace(/\./g, '')
      .slice(0, 2);
    return `${before.slice(0, 9)}${after ? `.${after}` : '.'}`;
  }
  return value.slice(0, 9);
}

export function parseAmountText(text: string): number {
  const value = text.replace(/\.$/, '');
  if (value === '') return 0;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

export function formatTxDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatMonthLabel(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
