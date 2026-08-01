import { getBudgetScreen } from "@/actions/budget-planning";
import BudgetingPrototype from "../_components/BudgetingPrototype";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const budgetScreen = await getBudgetScreen();

  return (
    <>
      <BudgetingPrototype initialData={budgetScreen} />
    </>
  );
}
