import { getMonthBudgetPlan } from "@/actions/budget-planning";
import { formatMonthValue, normalizeMonthParam } from "@/lib/month";
import Planning from "@/features/planning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanningSearchParams = Promise<{ month?: string | string[] }>;

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: PlanningSearchParams;
}) {
  const { year, month } = normalizeMonthParam((await searchParams).month);
  const monthBudget = await getMonthBudgetPlan(year, month);
  const selectedMonth = formatMonthValue(year, month);

  return <Planning initialData={monthBudget} selectedMonth={selectedMonth} />;
}
