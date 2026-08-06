import { formatMonthValue } from '@/lib/month';

export function buildMonthsForYear(year: number): Array<{
  value: string;
  label: string;
}> {
  return Array.from({ length: 12 }, (_, m) => ({
    value: formatMonthValue(year, m + 1),
    label: new Date(year, m, 1).toLocaleString('default', { month: 'short' }),
  }));
}
