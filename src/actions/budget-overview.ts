"use server";

import { toCents } from "@/features/planning/utils/money";
import { calculateAvailableToAssign, getLiquidAccountBalance } from "@/lib/pool";
import type { MonthBudgetPlanDTO } from "@/types/budget";

/**
 * Budget-screen overview (spec 2026-08-22-budget-envelope-screen, Phase 1).
 * Wraps the month plan with the real-money numbers the envelope UI needs:
 * Cash on Hand (Σ liquid balances) and Ready to Assign (pool − assigned).
 * All monetary values are integer cents.
 */
export async function getBudgetOverview(
  plan: MonthBudgetPlanDTO,
): Promise<{
  cashOnHandCents: number;
  readyToAssignCents: number;
  totalAssignedCents: number;
}> {
  const cashOnHandCents = toCents(await getLiquidAccountBalance());
  const readyToAssignCents = toCents(await calculateAvailableToAssign(
    plan.id,
  ));
  const totalAssignedCents = (plan.categories ?? [])
    .filter((g) => g.name !== "Income")
    .flatMap((g) => g.items)
    .reduce((sum, it) => sum + (it.fundedCents ?? 0), 0);

  return { cashOnHandCents, readyToAssignCents, totalAssignedCents };
}
