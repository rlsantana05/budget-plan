import { getMonthBudgetPlan } from "@/actions/budget-planning";
import { formatMonthValue, normalizeMonthParam } from "@/lib/month";
import PlanningPrototype from "../_components/PlanningPrototype";

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

  return <PlanningPrototype initialData={monthBudget} selectedMonth={selectedMonth} />;
}
