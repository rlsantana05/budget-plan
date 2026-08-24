"use server";

import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assignmentLedger,
  budgetCategories,
  categoryRollups,
  transactions,
} from "@/db/schema";
import { getOrCreateDefaultBudget, getOrCreateMonthBudget } from "./budget-planning";
import { toCents } from "@/features/planning/utils/money";

export interface WeekCategoryRow {
  categoryId: string;
  name: string;
  /** Σ week-tagged ASSIGN rows for this category (integer cents). */
  plannedCents: number;
  /** Σ tracked expense txs dated inside the window (positive cents). */
  spentCents: number;
}

export interface WeekDetail {
  weekKey: string;
  /** Income transactions dated inside the window. */
  incomeCents: number;
  incomeCount: number;
  categories: WeekCategoryRow[];
}

function windowDates(weekKey: string): { start: Date; endExclusive: Date } {
  const start = new Date(`${weekKey}T00:00:00`);
  const endExclusive = new Date(start);
  endExclusive.setDate(endExclusive.getDate() + 7);
  return { start, endExclusive };
}

/**
 * Week workspace data (spec 2026-08-23-budget-weekly-ledger Phase B):
 * income landing in the window + per-category planned (week-tagged ledger)
 * vs spent (tracked transactions in window).
 */
export async function getWeekDetail(
  year: number,
  month: number,
  weekKey: string,
): Promise<WeekDetail> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekKey)) {
    throw new Error("Invalid week key");
  }

  const budget = await getOrCreateDefaultBudget();
  const { mb } = await getOrCreateMonthBudget(budget.id, true, year, month);
  const { start, endExclusive } = windowDates(weekKey);

  // Income in window
  const [income] = await db
    .select({
      total: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.monthBudgetId, mb.id),
        gte(transactions.date, start),
        lt(transactions.date, endExclusive),
        sql`${transactions.amount} > 0`,
      ),
    );

  // Week-planned per category
  const plannedRows = await db
    .select({
      categoryId: assignmentLedger.categoryId,
      name: budgetCategories.name,
      total: sql<string>`coalesce(sum(${assignmentLedger.amount}), 0)`,
    })
    .from(assignmentLedger)
    .innerJoin(
      budgetCategories,
      eq(budgetCategories.id, assignmentLedger.categoryId),
    )
    .where(
      and(
        eq(assignmentLedger.monthBudgetId, mb.id),
        eq(assignmentLedger.weekKey, weekKey),
      ),
    )
    .groupBy(assignmentLedger.categoryId, budgetCategories.name);

  // Spent in window per category — tracked expense txs.
  // activity is negative for expenses; take abs into spentCents.
  const spentRows = await db
    .select({
      categoryId: transactions.categoryId,
      total: sql<string>`coalesce(sum(abs(${transactions.amount})), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.monthBudgetId, mb.id),
        gte(transactions.date, start),
        lt(transactions.date, endExclusive),
        eq(transactions.status, "TRACKED"),
        sql`${transactions.categoryId} is not null`,
        sql`${transactions.amount} < 0`,
      ),
    )
    .groupBy(transactions.categoryId);

  const spentByCat = new Map(spentRows.map((r) => [r.categoryId!, toCents(r.total)]));

  // Include all month categories that have a rollup so the workspace can show
  // the full envelope list; zero-filled where the week has no plan.
  const rollupRows = await db
    .select({
      categoryId: categoryRollups.categoryId,
      name: budgetCategories.name,
    })
    .from(categoryRollups)
    .innerJoin(
      budgetCategories,
      eq(budgetCategories.id, categoryRollups.categoryId),
    )
    .where(eq(categoryRollups.monthBudgetId, mb.id));

  const plannedByCat = new Map(
    plannedRows.map((r) => [r.categoryId, toCents(r.total)]),
  );

  const seen = new Set<string>();
  const categories: WeekCategoryRow[] = [];
  for (const r of rollupRows) {
    if (seen.has(r.categoryId)) continue;
    seen.add(r.categoryId);
    categories.push({
      categoryId: r.categoryId,
      name: r.name,
      plannedCents: plannedByCat.get(r.categoryId) ?? 0,
      spentCents: spentByCat.get(r.categoryId) ?? 0,
    });
  }

  return {
    weekKey,
    incomeCents: toCents(income?.total ?? "0"),
    incomeCount: income?.count ?? 0,
    categories,
  };
}
