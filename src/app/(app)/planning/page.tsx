import { getMonthBudgetPlan } from "@/actions/budget-planning";
import PlanningPrototype from "../_components/PlanningPrototype";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PlanningPage() {
  const monthBudget = await getMonthBudgetPlan();

  return (
    <>
      <PlanningPrototype initialData={monthBudget} />
    </>
  );
}
