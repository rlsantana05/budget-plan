"use server";

import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assignmentLedger,
  budgetCategories,
  categoryRollups,
  categoryTemplates,
  closedWeeks,
  transactions,
} from "@/db/schema";
import {
  assignToCategory,
  getOrCreateDefaultBudget,
  getOrCreateMonthBudget,
} from "./budget-planning";
import { toCents } from "@/features/planning/utils/money";
import {
  classifyCadence,
  effectiveDueDate,
} from "@/features/budget/utils/cadence";

export interface WeekCategoryRow {
  categoryId: string;
  name: string;
  /** Σ week-tagged ASSIGN rows for this category (integer cents). */
  plannedCents: number;
  /** Σ tracked expense txs dated inside the window (positive cents). */
  spentCents: number;
  /** Every-week vs monthly bill bucket for this week. */
  cadence: "weekly" | "monthly-due-this-week" | "monthly-not-due";
  /** Human date ("Aug 26") when the bill is due in-window. */
  dueLabel?: string;
}

export interface WeekDetail {
  weekKey: string;
  /** Income transactions dated inside the window. */
  incomeCents: number;
  incomeCount: number;
  categories: WeekCategoryRow[];
  /** True once the user has closed this week's review. */
  isClosed: boolean;
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
  // the full envelope list; zero-filled where the week has no plan. Also pull
  // target fields for cadence classification.
  const rollupRows = await db
    .select({
      categoryId: categoryRollups.categoryId,
      name: budgetCategories.name,
      targetType: categoryTemplates.targetType,
      targetAmount: categoryTemplates.targetAmount,
      targetMonthDay: categoryTemplates.targetMonthDay,
      targetDueDate: categoryTemplates.targetDueDate,
    })
    .from(categoryRollups)
    .innerJoin(
      budgetCategories,
      eq(budgetCategories.id, categoryRollups.categoryId),
    )
    .leftJoin(
      categoryTemplates,
      eq(categoryTemplates.id, budgetCategories.templateId),
    )
    .where(eq(categoryRollups.monthBudgetId, mb.id));

  const plannedByCat = new Map(
    plannedRows.map((r) => [r.categoryId, toCents(r.total)]),
  );

  // Window dates for the cadence classifier (reuses the query window).
  const weekEnd = new Date(endExclusive);
  weekEnd.setDate(weekEnd.getDate() - 1); // endExclusive → actual Friday

  const seen = new Set<string>();
  const categories: WeekCategoryRow[] = [];
  for (const r of rollupRows) {
    if (seen.has(r.categoryId)) continue;
    seen.add(r.categoryId);

    const cadence = classifyCadence(
      {
        targetType: r.targetType ?? 'NONE',
        targetAmountCents: toCents(r.targetAmount ?? '0'),
        targetMonthDay: r.targetMonthDay,
        targetDueDate: r.targetDueDate,
      },
      start,
      weekEnd,
    );
    const dueLabel =
      cadence === 'monthly-due-this-week'
        ? (r.targetDueDate ??
           (r.targetMonthDay != null
             ? effectiveDueDate(r.targetMonthDay, start)
             : start))
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : undefined;

    categories.push({
      categoryId: r.categoryId,
      name: r.name,
      plannedCents: plannedByCat.get(r.categoryId) ?? 0,
      spentCents: spentByCat.get(r.categoryId) ?? 0,
      cadence,
      dueLabel,
    });
  }

  // Closed marker
  const [closed] = await db
    .select({ weekKey: closedWeeks.weekKey })
    .from(closedWeeks)
    .where(
      and(eq(closedWeeks.monthBudgetId, mb.id), eq(closedWeeks.weekKey, weekKey)),
    )
    .limit(1);

  return {
    weekKey,
    incomeCents: toCents(income?.total ?? "0"),
    incomeCount: income?.count ?? 0,
    categories,
    isClosed: closed !== undefined,
  };
}

export interface CloseWeekResult {
  closedWeekKey: string;
  nextWeekKey: string;
  /** Per-category amounts rolled into the next week (integer cents). */
  rolledCents: number;
}

/**
 * Close a review week (spec Phase C): mark it closed and optionally roll each
 * category's leftover (planned − spent) into the same category next week via
 * week-tagged ASSIGN ledger rows. "Roll with the punches" — the monthly
 * envelope totals are unchanged; only week attribution moves.
 */
export async function closeWeek(
  year: number,
  month: number,
  weekKey: string,
  nextWeekKey: string,
  rollLeftover: boolean,
): Promise<CloseWeekResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekKey) || !/^\d{4}-\d{2}-\d{2}$/.test(nextWeekKey)) {
    throw new Error("Invalid week key");
  }
  if (nextWeekKey <= weekKey) {
    throw new Error("Next week must be after the closing week");
  }

  const detail = await getWeekDetail(year, month, weekKey);

  // Idempotent: closing twice must not double-roll.
  await db
    .insert(closedWeeks)
    .values({ monthBudgetId: (await getOrCreateMonthBudgetId(year, month)), weekKey })
    .onConflictDoNothing();

  let rolled = 0;
  if (rollLeftover) {
    for (const cat of detail.categories) {
      const leftover = cat.plannedCents - cat.spentCents;
      if (leftover <= 0 || cat.plannedCents === 0) continue;
      // Leftover rolls as dollars; assignToCategory validates + writes a
      // week-tagged ASSIGN row and bumps rollups.
      await assignToCategory(cat.categoryId, leftover / 100, nextWeekKey);
      rolled += leftover;
    }
  }

  return { closedWeekKey: weekKey, nextWeekKey, rolledCents: rolled };
}

async function getOrCreateMonthBudgetId(year: number, month: number): Promise<string> {
  const budget = await getOrCreateDefaultBudget();
  const { mb } = await getOrCreateMonthBudget(budget.id, true, year, month);
  return mb.id;
}
