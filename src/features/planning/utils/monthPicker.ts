import { formatMonthValue } from "@/lib/month";

export function buildMonthsForYear(year: number): Array<{
  value: string;
  label: string;
}> {
  const months = [];
  for (let m = 1; m <= 12; m++) {
    months.push({
      value: formatMonthValue(year, m),
      label: new Date(year, m - 1, 1).toLocaleString("default", {
        month: "short",
      }),
    });
  }
  return months;
}