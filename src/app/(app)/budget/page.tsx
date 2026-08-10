import { getMonthBudgetPlan } from "@/actions/budget-planning";
import { formatMonthValue, normalizeMonthParam } from "@/lib/month";
import BudgetScreen from "@/features/budget/BudgetScreen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BudgetSearchParams = Promise<{ month?: string | string[] }>;

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: BudgetSearchParams;
}) {
  const { year, month } = normalizeMonthParam((await searchParams).month);
  const monthBudget = await getMonthBudgetPlan(year, month);
  const selectedMonth = formatMonthValue(year, month);

  return (
    <BudgetScreen initialData={monthBudget} selectedMonth={selectedMonth} />
  );
}
