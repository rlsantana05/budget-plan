import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, categoryRollups } from "@/db/schema";

/**
 * Calculates total liquid account balance (checking, savings, money market, cash, other)
 * Excludes credit cards and investments.
 */
export async function getLiquidAccountBalance(): Promise<number> {
  const rows = await db
    .select({ balance: accounts.balance })
    .from(accounts)
    .where(eq(accounts.isLiquid, true));

  return rows.reduce(
    (sum, a) => sum + Number(a.balance ?? 0),
    0,
  );
}

/**
 * Calculates Available to Assign as liquid balance minus assigned funds.
 * Pool = sum of liquid account balances − money already assigned.
 */
export async function calculateAvailableToAssign(monthBudgetId: string): Promise<number> {
  const liquidBalance = await getLiquidAccountBalance();
  const [rollup] = await db
    .select({ assigned: categoryRollups.assigned })
    .from(categoryRollups)
    .where(eq(categoryRollups.monthBudgetId, monthBudgetId))
    .limit(1);

  const assigned = rollup ? Number(rollup.assigned ?? 0) : 0;
  return Math.max(liquidBalance - assigned, 0);
}
