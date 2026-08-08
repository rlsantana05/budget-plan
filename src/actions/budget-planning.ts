"use server";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  accounts,
  assignmentLedger,
  budgets,
  budgetCategories as budgetCategoriesTable,
  budgetMembers,
  categoryGroups as categoryGroupsTable,
  categoryRollups,
  categoryTemplates as categoryTemplatesTable,
  monthBudgets,
  paychecks,
  transactions,
  users,
} from "@/db/schema";
import type {
  BudgetCategoryItemDTO,
  BudgetTransactionDTO,
  MonthBudgetPlanDTO,
} from "@/types/budget";

const DEV_EMAIL = "dev@budgetplan.app";

/** Queryable client: the shared `db` or a `db.transaction` transaction handle. */
type DbClient = Pick<typeof db, "insert" | "update" | "select" | "delete">;

// Default EveryDollar group order + default items (used to seed a new month)
const DEFAULT_GROUPS: Array<{ name: string; items: string[] }> = [
  { name: "Income", items: [] },
  { name: "Giving", items: [] },
  { name: "Housing", items: [] },
  { name: "Savings", items: [] },
  { name: "Transportation", items: ["Gas", "Maintenance"] },
  { name: "Food", items: ["Groceries"] },
  { name: "Personal", items: [] },
  { name: "Lifestyle", items: [] },
  { name: "Health", items: [] },
  { name: "Insurance", items: [] },
  { name: "Debt", items: [] },
];

async function getOrCreateDefaultBudget() {
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, DEV_EMAIL))
    .limit(1);

  if (!user) {
    [user] = await db
      .insert(users)
      .values({ email: DEV_EMAIL, name: "Dev User" })
      .returning();
  }

  const [membership] = await db
    .select()
    .from(budgetMembers)
    .where(eq(budgetMembers.userId, user.id))
    .limit(1);

  if (membership) {
    const [budget] = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, membership.budgetId))
      .limit(1);
    if (budget) return budget;
  }

  const [budget] = await db
    .insert(budgets)
    .values({ name: "Default Budget" })
    .returning();

  await db.insert(budgetMembers).values({
    userId: user.id,
    budgetId: budget.id,
    role: "OWNER",
  });

  return budget;
}

function monthYearKey(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// ADR-0002: durable category identity + targets -------------------------------
async function findCategoryTemplate(
  budgetId: string,
  name: string,
  groupName: string,
): Promise<string | null> {
  const [t] = await db
    .select({ id: categoryTemplatesTable.id })
    .from(categoryTemplatesTable)
    .where(
      and(
        eq(categoryTemplatesTable.budgetId, budgetId),
        eq(categoryTemplatesTable.name, name),
        eq(categoryTemplatesTable.groupName, groupName),
        isNull(categoryTemplatesTable.deletedAt),
      ),
    )
    .limit(1);
  return t?.id ?? null;
}

async function getOrCreateCategoryTemplate(
  budgetId: string,
  name: string,
  groupName: string,
): Promise<string> {
  const existing = await findCategoryTemplate(budgetId, name, groupName);
  if (existing) return existing;
  const [created] = await db
    .insert(categoryTemplatesTable)
    .values({ budgetId, name, groupName, sortOrder: 0 })
    .returning({ id: categoryTemplatesTable.id });
  return created.id;
}

/**
 * Every month's budget_categories row must be linked to a durable template.
 * Picks up rows created before the template table existed (or by older seed
 * code) and links them in place.
 */
async function ensureCategoryLinks(
  monthBudgetId: string,
  budgetId: string,
): Promise<void> {
  const missing = await db
    .select({
      id: budgetCategoriesTable.id,
      name: budgetCategoriesTable.name,
      groupId: budgetCategoriesTable.groupId,
    })
    .from(budgetCategoriesTable)
    .innerJoin(
      categoryGroupsTable,
      eq(budgetCategoriesTable.groupId, categoryGroupsTable.id),
    )
    .where(
      and(
        eq(categoryGroupsTable.monthBudgetId, monthBudgetId),
        isNull(budgetCategoriesTable.deletedAt),
        isNull(budgetCategoriesTable.templateId),
      ),
    );
  if (missing.length === 0) return;

  for (const row of missing) {
    const [grp] = await db
      .select({ name: categoryGroupsTable.name })
      .from(categoryGroupsTable)
      .where(eq(categoryGroupsTable.id, row.groupId))
      .limit(1);
    const templateId = await getOrCreateCategoryTemplate(
      budgetId,
      row.name,
      grp?.name ?? "Other",
    );
    await db
      .update(budgetCategoriesTable)
      .set({ templateId })
      .where(eq(budgetCategoriesTable.id, row.id));
  }
}

/**
 * Fetch (or create + seed) the current month's budget snapshot for the
 * logged-in dev budget. Seeds the EveryDollar default groups + items on
 * first creation.
 */
async function getOrCreateMonthBudget(
  budgetId: string,
  seedDefaults = true,
  year?: number,
  month?: number,
): Promise<{ mb: typeof monthBudgets.$inferSelect; month: number; year: number }> {
  const { year: keyYear, month: keyMonth } = monthYearKey();
  const targetYear = year ?? keyYear;
  const targetMonth = month ?? keyMonth;

  let [mb] = await db
    .select()
    .from(monthBudgets)
    .where(
      and(
        eq(monthBudgets.budgetId, budgetId),
        eq(monthBudgets.year, targetYear),
        eq(monthBudgets.month, targetMonth),
        isNull(monthBudgets.deletedAt),
      ),
    )
    .limit(1);

  if (!mb) {
    mb = (
      await db
        .insert(monthBudgets)
        .values({ budgetId, year: targetYear, month: targetMonth, note: null })
        .returning()
    )[0];
    // Brand-new month: seed the default groups + items immediately. Avoids a
    // "does it need seeding?" check on every subsequent read.
    if (seedDefaults) {
      // Clone the previous month's structure so categories persist across
      // months (ADR-0002). First month on this budget uses the EveryDollar
      // defaults and also creates the durable templates.
      const [prev] = await db
        .select()
        .from(monthBudgets)
        .where(
          and(
            eq(monthBudgets.budgetId, budgetId),
            isNull(monthBudgets.deletedAt),
          ),
        )
        .orderBy(desc(monthBudgets.year), desc(monthBudgets.month))
        .limit(1);

      if (prev) {
        const prevGroups = await db
          .select()
          .from(categoryGroupsTable)
          .where(eq(categoryGroupsTable.monthBudgetId, prev.id))
          .orderBy(categoryGroupsTable.sortOrder);
        const prevGroupIds = prevGroups.map((g) => g.id);
        const prevItems = prevGroupIds.length
          ? await db
            .select()
            .from(budgetCategoriesTable)
            .where(
              and(
                inArray(budgetCategoriesTable.groupId, prevGroupIds),
                isNull(budgetCategoriesTable.deletedAt),
              ),
            )
            .orderBy(budgetCategoriesTable.sortOrder)
          : [];
        const prevItemsByGroup = new Map<string, (typeof prevItems)[number][]>();
        for (const item of prevItems) {
          const list = prevItemsByGroup.get(item.groupId) ?? [];
          list.push(item);
          prevItemsByGroup.set(item.groupId, list);
        }
        for (const grp of prevGroups) {
          const [newGroup] = await db
            .insert(categoryGroupsTable)
            .values({
              monthBudgetId: mb.id,
              name: grp.name,
              sortOrder: grp.sortOrder,
              rightColumn: grp.rightColumn,
              collapsed: grp.collapsed,
            })
            .returning();
          for (const item of prevItemsByGroup.get(grp.id) ?? []) {
            await db.insert(budgetCategoriesTable).values({
              groupId: newGroup.id,
              templateId: item.templateId ?? null,
              name: item.name,
              dueDate: item.dueDate,
              planned: item.planned,
              sortOrder: item.sortOrder,
              isPaymentCategory: item.isPaymentCategory,
              accountId: item.accountId,
            });
          }
        }
        await ensureCategoryLinks(mb.id, budgetId);
      } else {
        for (const [gi, g] of DEFAULT_GROUPS.entries()) {
          const [grp] = await db
            .insert(categoryGroupsTable)
            .values({
              monthBudgetId: mb.id,
              name: g.name,
              sortOrder: gi,
              rightColumn: g.name === "Income" ? "Received" : "Spent",
              collapsed: false,
            })
            .returning();

          let itemSort = 0;
          for (const itemName of g.items) {
            const templateId = await getOrCreateCategoryTemplate(
              budgetId,
              itemName,
              g.name,
            );
            await db.insert(budgetCategoriesTable).values({
              groupId: grp.id,
              templateId,
              name: itemName,
              dueDate: null,
              planned: "0",
              sortOrder: itemSort,
            });
            itemSort++;
          }
        }
      }
    }
  }

  return { mb: mb!, month: targetMonth, year: targetYear };
}

/**
 * Fetch (or create + seed) the current month's budget snapshot for the
 * logged-in dev budget. Seeds the EveryDollar default groups + items on
 * first creation.
 */
export async function getMonthBudgetPlan(
  year = monthYearKey().year,
  month = monthYearKey().month,
): Promise<MonthBudgetPlanDTO> {
  const budget = await getOrCreateDefaultBudget();
  const {
    mb,
    month: resolvedMonth,
    year: resolvedYear,
  } = await getOrCreateMonthBudget(budget.id, true, year, month);
  const monthName = new Date(resolvedYear, resolvedMonth - 1, 1).toLocaleString(
    "default",
    { month: "long" },
  );

  // Link any legacy per-month rows to their durable template (ADR-0002).
  await ensureCategoryLinks(mb.id, budget.id);

  // Load categories grouped
  const groups = await db
    .select()
    .from(categoryGroupsTable)
    .where(eq(categoryGroupsTable.monthBudgetId, mb.id))
    .orderBy(categoryGroupsTable.sortOrder);

  const groupIds = groups.map((g) => g.id);
  const allItems = groupIds.length
    ? await db
        .select()
        .from(budgetCategoriesTable)
        .where(
          and(
            inArray(budgetCategoriesTable.groupId, groupIds),
            isNull(budgetCategoriesTable.deletedAt),
          ),
        )
        .orderBy(budgetCategoriesTable.sortOrder)
    : [];
  const itemsByGroup = new Map<
    string,
    (typeof allItems)[number][]
  >();
  for (const item of allItems) {
    const list = itemsByGroup.get(item.groupId) ?? [];
    list.push(item);
    itemsByGroup.set(item.groupId, list);
  }

  // Independent reads run in parallel (fewer remote round trips on Neon)
  const [rollupRows, txRows, accountRows] = await Promise.all([
    db
      .select()
      .from(categoryRollups)
      .where(eq(categoryRollups.monthBudgetId, mb.id)),
    db
      .select()
      .from(transactions)
      .where(eq(transactions.monthBudgetId, mb.id))
      .orderBy(desc(transactions.date), desc(transactions.createdAt)),
    db
      .select({ id: accounts.id, name: accounts.name })
      .from(accounts)
      .where(
        and(
          eq(accounts.budgetId, budget.id),
          eq(accounts.isActive, true),
          isNull(accounts.deletedAt),
        ),
      ),
  ]);

  const rollupById = new Map(rollupRows.map((r) => [r.categoryId, r]));

  const templateIds = Array.from(
    new Set(allItems.map((it) => it.templateId).filter((id): id is string => !!id)),
  );
  const templates = templateIds.length
    ? await db
      .select()
      .from(categoryTemplatesTable)
      .where(inArray(categoryTemplatesTable.id, templateIds))
    : [];
  const templateById = new Map(templates.map((t) => [t.id, t]));

  // ADR-0003: per-category 3-month spending trend, keyed by the durable
  // template id so history spans months even though each month has its own row.
  const trendByTemplate = new Map<
    string,
    Array<{ month: string; activity: number }>
  >();
  if (templateIds.length > 0) {
    const historyRows = await db
      .select({
        activity: categoryRollups.activity,
        year: monthBudgets.year,
        month: monthBudgets.month,
        templateId: budgetCategoriesTable.templateId,
      })
      .from(categoryRollups)
      .innerJoin(
        budgetCategoriesTable,
        eq(categoryRollups.categoryId, budgetCategoriesTable.id),
      )
      .innerJoin(
        monthBudgets,
        eq(categoryRollups.monthBudgetId, monthBudgets.id),
      )
      .where(
        and(
          inArray(budgetCategoriesTable.templateId, templateIds),
          eq(monthBudgets.budgetId, budget.id),
        ),
      );

    const monthsByTemplate = new Map<
      string,
      Array<{ year: number; month: number; activity: number }>
    >();
    for (const row of historyRows) {
      if (!row.templateId) continue;
      const list = monthsByTemplate.get(row.templateId) ?? [];
      list.push({
        year: row.year,
        month: row.month,
        activity: Number(row.activity ?? 0),
      });
      monthsByTemplate.set(row.templateId, list);
    }

    for (const [tplId, months] of monthsByTemplate) {
      const recent = months
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .slice(-3);
      trendByTemplate.set(
        tplId,
        recent.map((m) => ({
          month: new Date(m.year, m.month - 1, 1).toLocaleString("default", {
            month: "short",
          }),
          activity: m.activity,
        })),
      );
    }
  }

  const txCountByCategory = new Map<string, number>();
  for (const tx of txRows) {
    if (tx.categoryId && tx.status !== "DELETED") {
      txCountByCategory.set(
        tx.categoryId,
        (txCountByCategory.get(tx.categoryId) ?? 0) + 1,
      );
    }
  }

  const incomeCategoryIds = new Set<string>();
  for (const g of groups) {
    if (g.name !== "Income") continue;
    for (const it of itemsByGroup.get(g.id) ?? []) {
      incomeCategoryIds.add(it.id);
    }
  }
  const receivedByCategory = new Map<string, number>();
  for (const tx of txRows) {
    if (
      tx.categoryId
      && tx.status === "TRACKED"
      && incomeCategoryIds.has(tx.categoryId)
      && Number(tx.amount) > 0
    ) {
      receivedByCategory.set(
        tx.categoryId,
        (receivedByCategory.get(tx.categoryId) ?? 0) + Number(tx.amount),
      );
    }
  }

  const groupDTOs = groups.map((g) => {
    const items = itemsByGroup.get(g.id) ?? [];

    let totalPlanned = 0;
    let totalSpent = 0;
    let totalRemaining = 0;

    const categoryItems = items.map((it): BudgetCategoryItemDTO => {
      const rollup = rollupById.get(it.id);
      const template = it.templateId
        ? templateById.get(it.templateId)
        : undefined;
      const funded = Number(rollup?.assigned ?? 0);
      const spent = Number(rollup?.activity ?? 0);
      const remaining = funded - spent;
      const planned = Number(it.planned ?? 0);

      totalPlanned += planned;
      totalSpent += spent;
      totalRemaining += remaining;

      return {
        id: it.id,
        groupId: it.groupId,
        name: it.name,
        dueDate: it.dueDate?.toISOString() ?? null,
        planned,
        sortOrder: it.sortOrder,
        isPaymentCategory: !!it.isPaymentCategory,
        accountId: it.accountId,
        funded,
        spent,
        received: g.name === "Income"
          ? (receivedByCategory.get(it.id) ?? 0)
          : 0,
        remaining,
        transactionCount: txCountByCategory.get(it.id) ?? 0,
        templateId: it.templateId ?? null,
        targetType: template?.targetType ?? "NONE",
        targetAmount: template ? Number(template.targetAmount ?? 0) : 0,
        targetDue: targetDueLabel(
          template?.targetType ?? "NONE",
          template?.targetDueDate,
          template?.targetMonthDay,
          resolvedYear,
          resolvedMonth,
        ),
        targetDate: template?.targetType === "ONCE" && template.targetDueDate
          ? template.targetDueDate.toISOString().slice(0, 10)
          : null,
        targetMonthDay: template?.targetType === "MONTHLY"
          ? (template?.targetMonthDay ?? null)
          : null,
        needed: template && template.targetType !== "NONE"
          ? Math.max(Number(template.targetAmount ?? 0) - funded, 0)
          : 0,
        trend: it.templateId ? (trendByTemplate.get(it.templateId) ?? []) : [],
      };
    });

    return {
      id: g.id,
      monthBudgetId: g.monthBudgetId,
      name: g.name,
      sortOrder: g.sortOrder,
      rightColumn: (g.rightColumn as "Spent" | "Remaining") ?? "Spent",
      collapsed: g.collapsed ?? false,
      items: categoryItems,
      totalPlanned,
      totalSpent,
      totalRemaining,
    };
  });

  // Budget status: planned expenses vs planned income (EveryDollar logic)
  const incomeGroup = groupDTOs.find((g) => g.name === "Income");
  const expenseGroups = groupDTOs.filter((g) => g.name !== "Income");
  const planIncome = incomeGroup
    ? incomeGroup.items.reduce((s, it) => s + it.planned, 0)
    : 0;
  const planExpenses = expenseGroups.reduce(
    (s, g) => s + g.items.reduce((ss, it) => ss + it.planned, 0),
    0,
  );
  const diff = planExpenses - planIncome;

  const categoryNameById = new Map<string, string>();
  for (const g of groupDTOs) {
    for (const it of g.items) {
      categoryNameById.set(it.id, it.name);
    }
  }

  const accountNameById = new Map(
    accountRows.map((a) => [a.id, a.name]),
  );

  const transactionsDTO = txRows.map(
    (tx): BudgetTransactionDTO => ({
      id: tx.id,
      amount: Number(tx.amount),
      payee: tx.payee,
      memo: tx.memo,
      date: tx.date.toISOString(),
      status: tx.status,
      categoryName: tx.categoryId
        ? (categoryNameById.get(tx.categoryId) ?? null)
        : null,
      categoryId: tx.categoryId ?? null,
      accountName: tx.accountId
        ? (accountNameById.get(tx.accountId) ?? null)
        : null,
      isIncome: tx.categoryId
        ? incomeCategoryIds.has(tx.categoryId)
        : false,
    }),
  );

  return {
    id: mb.id,
    budgetId: budget.id,
    month: monthName,
    year: resolvedYear,
    budgetStatus: {
      amount: diff,
      overBudgetAmount: diff > 0 ? diff : 0,
      label: diff > 0 ? "over budget" : diff < 0 ? "under budget" : "on track",
    },
    viewTabs: { active: "transactions", options: ["summary", "transactions"] },
    categories: groupDTOs.map((g) => ({
      id: g.id,
      monthBudgetId: g.monthBudgetId,
      name: g.name,
      sortOrder: g.sortOrder,
      rightColumn: g.rightColumn,
      collapsed: g.collapsed,
      items: g.items,
      totalPlanned: g.totalPlanned,
      totalSpent: g.totalSpent,
      totalRemaining: g.totalRemaining,
    })),
    note: mb.note,
    transactions: transactionsDTO,
    accounts: accountRows.map((a) => ({ id: a.id, name: a.name })),
  };
}

export async function upsertMonthBudgetNote(
  monthBudgetId: string,
  note: string,
): Promise<void> {
  await db
    .update(monthBudgets)
    .set({ note, updatedAt: new Date() })
    .where(eq(monthBudgets.id, monthBudgetId));

  revalidatePath("/planning");
  revalidatePath("/budget");
}

// ---------------------------------------------------------------------------
// Funding: paychecks → Ready to Assign → assignment ledger → materialized rollups
// ---------------------------------------------------------------------------

function incrementRollup(
  monthBudgetId: string,
  categoryId: string,
  deltas: { assigned?: number; activity?: number; available?: number },
  client: DbClient = db,
) {
  return client
    .insert(categoryRollups)
    .values({
      monthBudgetId,
      categoryId,
      assigned: String(deltas.assigned ?? 0),
      activity: String(deltas.activity ?? 0),
      available: String(deltas.available ?? 0),
    })
    .onConflictDoUpdate({
      target: [categoryRollups.monthBudgetId, categoryRollups.categoryId],
      set: {
        assigned: sql`${categoryRollups.assigned} + EXCLUDED.assigned`,
        activity: sql`${categoryRollups.activity} + EXCLUDED.activity`,
        available: sql`${categoryRollups.available} + EXCLUDED.available`,
        updatedAt: new Date(),
      },
    });
}

/**
 * Update a cached account balance by an incremental delta. Income is applied
 * with a positive delta, spending with a negative one. No-op without an account.
 */
async function applyBalanceDelta(
  accountId: string | null,
  delta: number,
  client: DbClient = db,
): Promise<void> {
  if (!accountId || delta === 0) return;
  await client
    .update(accounts)
    .set({
      balance: sql`${accounts.balance} + ${String(delta)}`,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, accountId));
}

async function getReadyToAssign(monthBudgetId: string): Promise<number> {
  const [paycheckTotal] = await db
    .select({ total: sql<string | null>`coalesce(sum(${paychecks.amount}), 0)` })
    .from(paychecks)
    .where(eq(paychecks.monthBudgetId, monthBudgetId));
  const [assignedTotal] = await db
    .select({ total: sql<string | null>`coalesce(sum(${categoryRollups.assigned}), 0)` })
    .from(categoryRollups)
    .where(eq(categoryRollups.monthBudgetId, monthBudgetId));

  return (
    Number(paycheckTotal?.total ?? 0) - Number(assignedTotal?.total ?? 0)
  );
}

async function getCategoryMonthBudgetId(categoryId: string): Promise<string> {
  const [cat] = await db
    .select({ groupId: budgetCategoriesTable.groupId })
    .from(budgetCategoriesTable)
    .where(eq(budgetCategoriesTable.id, categoryId))
    .limit(1);
  if (!cat) throw new Error("Category not found");

  const [grp] = await db
    .select({ monthBudgetId: categoryGroupsTable.monthBudgetId })
    .from(categoryGroupsTable)
    .where(eq(categoryGroupsTable.id, cat.groupId))
    .limit(1);
  if (!grp) throw new Error("Category group not found");

  return grp.monthBudgetId;
}

function assertAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Human due label for a target rule in a specific (year, month). ONCE resolves
 * to its absolute date; MONTHLY resolves to day-of-month in the given month.
 */
function targetDueLabel(
  targetType: string,
  dueDate: Date | null | undefined,
  monthDay: number | null | undefined,
  year: number,
  month: number,
): string | null {
  if (targetType === "ONCE" && dueDate) {
    return dueDate.toLocaleDateString("default", {
      month: "short",
      day: "numeric",
    });
  }
  if (targetType === "MONTHLY" && monthDay != null) {
    const day = Math.min(monthDay, daysInMonth(year, month));
    return new Date(year, month - 1, day).toLocaleDateString("default", {
      month: "short",
      day: "numeric",
    });
  }
  return null;
}

/**
 * Seed the Ready to Assign pool with an income event. Requires at least one
 * active account on the budget.
 */
export async function addPaycheck(
  amount: number,
  note?: string,
): Promise<void> {
  assertAmount(amount);

  const budget = await getOrCreateDefaultBudget();
  const { mb } = await getOrCreateMonthBudget(budget.id);

  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.budgetId, budget.id),
        eq(accounts.isActive, true),
        isNull(accounts.deletedAt),
      ),
    )
    .limit(1);
  if (!account) throw new Error("Add an account before entering a paycheck");

  await db.insert(paychecks).values({
    monthBudgetId: mb.id,
    accountId: account.id,
    amount: String(amount),
    date: new Date(),
    note: note ?? null,
  });

  revalidatePath("/budget");
}

/**
 * Mark a planned income item as received: creates a paycheck for its planned
 * amount in the item's own month budget. Requires an active account.
 */
export async function receivePlannedIncome(categoryItemId: string): Promise<void> {
  const [item] = await db
    .select({
      planned: budgetCategoriesTable.planned,
      name: budgetCategoriesTable.name,
      groupId: budgetCategoriesTable.groupId,
    })
    .from(budgetCategoriesTable)
    .where(eq(budgetCategoriesTable.id, categoryItemId))
    .limit(1);
  if (!item) throw new Error("Category item not found");

  const [group] = await db
    .select({ monthBudgetId: categoryGroupsTable.monthBudgetId, name: categoryGroupsTable.name })
    .from(categoryGroupsTable)
    .where(eq(categoryGroupsTable.id, item.groupId))
    .limit(1);
  if (!group) throw new Error("Category group not found");
  if (group.name !== "Income") throw new Error("Only income items can be marked as received");

  const budget = await getOrCreateDefaultBudget();
  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.budgetId, budget.id),
        eq(accounts.isActive, true),
        isNull(accounts.deletedAt),
      ),
    )
    .limit(1);
  if (!account) throw new Error("Add an account before marking income as received");

  const amount = Number(item.planned);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Planned amount must be positive to be received");
  }

  await db.insert(paychecks).values({
    monthBudgetId: group.monthBudgetId,
    accountId: account.id,
    amount: String(amount),
    date: new Date(),
    note: `Marked received: ${item.name}`,
  });

  revalidatePath("/budget");
  revalidatePath("/planning");
}

/**
 * Assign money from the Ready to Assign pool into a category. Never exceeds
 * the pool; writes an ASSIGN ledger row and bumps the category rollup.
 */
export async function assignToCategory(
  categoryId: string,
  amount: number,
): Promise<void> {
  assertAmount(amount);

  const monthBudgetId = await getCategoryMonthBudgetId(categoryId);
  const readyToAssign = await getReadyToAssign(monthBudgetId);
  if (amount > readyToAssign) {
    throw new Error("Amount exceeds Ready to Assign");
  }

  await db.insert(assignmentLedger).values({
    monthBudgetId,
    categoryId,
    paycheckId: null,
    moveId: null,
    amount: String(amount),
    moveType: "ASSIGN",
  });

  await incrementRollup(monthBudgetId, categoryId, {
    assigned: amount,
    available: amount,
  });

  revalidatePath("/budget");
}

/**
 * Set a category's Assigned total directly (inline "Assigned" editing on a
 * planning row). Computes the delta against the current rollup and moves money
 * in or out of the Available to Assign pool: a positive delta is capped by the
 * pool, a negative delta returns money to it. Persists a single ASSIGN ledger
 * row so the undo-move history stays coherent.
 */
export async function setCategoryAssigned(
  categoryId: string,
  amount: number,
): Promise<void> {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Assigned amount must be zero or positive");
  }

  const monthBudgetId = await getCategoryMonthBudgetId(categoryId);

  const [rollup] = await db
    .select({ assigned: categoryRollups.assigned })
    .from(categoryRollups)
    .where(
      and(
        eq(categoryRollups.monthBudgetId, monthBudgetId),
        eq(categoryRollups.categoryId, categoryId),
      ),
    )
    .limit(1);
  const current = Number(rollup?.assigned ?? 0);
  const delta = amount - current;
  if (Math.abs(delta) < 0.005) return;

  if (delta > 0) {
    const readyToAssign = await getReadyToAssign(monthBudgetId);
    if (delta > readyToAssign) {
      throw new Error("Amount exceeds Available to Assign");
    }
  }

  await db.insert(assignmentLedger).values({
    monthBudgetId,
    categoryId,
    paycheckId: null,
    moveId: null,
    amount: String(delta),
    moveType: "ASSIGN",
  });

  await incrementRollup(monthBudgetId, categoryId, {
    assigned: delta,
    available: delta,
  });

  revalidateBudgetPages();
}

/**
 * Move money between categories. Writes a linked MOVE_OUT/MOVE_IN ledger
 * pair (shared move_id); total funded is unchanged.
 */
export async function moveBetweenCategories(
  fromCategoryId: string,
  toCategoryId: string,
  amount: number,
): Promise<void> {
  assertAmount(amount);
  if (fromCategoryId === toCategoryId) {
    throw new Error("Source and destination must differ");
  }

  const monthBudgetId = await getCategoryMonthBudgetId(fromCategoryId);
  const moveId = crypto.randomUUID();

  await db.insert(assignmentLedger).values([
    {
      monthBudgetId,
      categoryId: fromCategoryId,
      paycheckId: null,
      moveId,
      amount: String(-amount),
      moveType: "MOVE_OUT",
    },
    {
      monthBudgetId,
      categoryId: toCategoryId,
      paycheckId: null,
      moveId,
      amount: String(amount),
      moveType: "MOVE_IN",
    },
  ]);

  await incrementRollup(monthBudgetId, fromCategoryId, {
    assigned: -amount,
    available: -amount,
  });
  await incrementRollup(monthBudgetId, toCategoryId, {
    assigned: amount,
    available: amount,
  });

  revalidatePath("/budget");
}

/**
 * Reverse the most recent funding move (single ASSIGN or a full MOVE pair) by
 * appending inverse ledger rows and undoing the rollup deltas.
 */
export async function undoLastMove(): Promise<void> {
  const budget = await getOrCreateDefaultBudget();
  const { mb } = await getOrCreateMonthBudget(budget.id, false);

  const [last] = await db
    .select()
    .from(assignmentLedger)
    .where(eq(assignmentLedger.monthBudgetId, mb.id))
    .orderBy(desc(assignmentLedger.createdAt))
    .limit(1);
  if (!last) return;

  const rows = last.moveId
    ? await db
        .select()
        .from(assignmentLedger)
        .where(
          and(
            eq(assignmentLedger.moveId, last.moveId),
            eq(assignmentLedger.monthBudgetId, mb.id),
          ),
        )
    : [last];

  for (const row of rows) {
    const inverse = -Number(row.amount);
    await db.insert(assignmentLedger).values({
      monthBudgetId: mb.id,
      categoryId: row.categoryId,
      paycheckId: row.paycheckId,
      moveId: row.moveId,
      amount: String(inverse),
      moveType: row.moveType,
    });
    await incrementRollup(mb.id, row.categoryId, {
      assigned: inverse,
      available: inverse,
    });
  }

  revalidatePath("/budget");
}

// ---------------------------------------------------------------------------
// Targets + Assign-to-Targets (ADR-0002)
// ---------------------------------------------------------------------------

export interface CategoryTargetInput {
  type: "NONE" | "ONCE" | "MONTHLY";
  /** Required when type is ONCE or MONTHLY. */
  amount?: number;
  /** ISO date string, required for ONCE. */
  dueDate?: string | null;
  /** 1–31, required for MONTHLY (day the bill recurs). */
  monthDay?: number | null;
}

function assertTargetInput(input: CategoryTargetInput): void {
  const { type, amount, dueDate, monthDay } = input;
  if (type !== "NONE" && (!Number.isFinite(amount) || (amount as number) <= 0)) {
    throw new Error("Target amount must be positive");
  }
  if (type === "ONCE" && !dueDate) {
    throw new Error("A one-time target needs a due date");
  }
  if (type === "ONCE" && Number.isNaN(Date.parse(dueDate as string))) {
    throw new Error("Due date is invalid");
  }
  if (
    type === "MONTHLY"
    && (monthDay == null || monthDay < 1 || monthDay > 31)
  ) {
    throw new Error("A monthly target needs a day of the month (1–31)");
  }
  if (type === "NONE" && monthDay != null) {
    throw new Error("Cannot set a day without a target type");
  }
}

/**
 * Set (or remove) the target rule on a category's durable template
 * (ADR-0002). NONE removes the target; ONCE stores an absolute due date;
 * MONTHLY stores a recurring day-of-month.
 */
export async function setCategoryTarget(
  categoryItemId: string,
  input: CategoryTargetInput,
): Promise<void> {
  assertTargetInput(input);

  const [item] = await db
    .select({
      id: budgetCategoriesTable.id,
      name: budgetCategoriesTable.name,
      groupId: budgetCategoriesTable.groupId,
      templateId: budgetCategoriesTable.templateId,
    })
    .from(budgetCategoriesTable)
    .where(
      and(
        eq(budgetCategoriesTable.id, categoryItemId),
        isNull(budgetCategoriesTable.deletedAt),
      ),
    )
    .limit(1);
  if (!item) throw new Error("Category not found");

  const [grp] = await db
    .select({ monthBudgetId: categoryGroupsTable.monthBudgetId, name: categoryGroupsTable.name })
    .from(categoryGroupsTable)
    .where(eq(categoryGroupsTable.id, item.groupId))
    .limit(1);
  if (!grp) throw new Error("Category group not found");

  let templateId = item.templateId;
  if (!templateId) {
    const [monthB] = await db
      .select({ budgetId: monthBudgets.budgetId })
      .from(monthBudgets)
      .where(eq(monthBudgets.id, grp.monthBudgetId))
      .limit(1);
    if (!monthB) throw new Error("Month budget not found");
    templateId = await getOrCreateCategoryTemplate(
      monthB.budgetId,
      item.name,
      grp.name,
    );
    await db
      .update(budgetCategoriesTable)
      .set({ templateId })
      .where(eq(budgetCategoriesTable.id, item.id));
  }

  await db
    .update(categoryTemplatesTable)
    .set({
      targetType: input.type,
      targetAmount:
        input.type === "NONE" ? "0" : String(input.amount as number),
      targetDueDate:
        input.type === "ONCE" ? new Date(input.dueDate as string) : null,
      targetMonthDay: input.type === "MONTHLY" ? input.monthDay! : null,
      updatedAt: new Date(),
    })
    .where(eq(categoryTemplatesTable.id, templateId));

  revalidateBudgetPages();
}

/**
 * Route Available to Assign into underfunded targets (ADR-0002). When no
 * categoryItemIds are given, every category with an active target is
 * considered, in group/sort order. Funds each by its shortfall (target −
 * assigned) up to the remaining pool, never funding more than is available.
 * Returns the amount successfully assigned.
 */
export async function assignToTargets(
  categoryItemIds?: string[],
): Promise<{ assigned: number; categoryCount: number }> {
  const budget = await getOrCreateDefaultBudget();
  const { mb } = await getOrCreateMonthBudget(budget.id);

  const groups = await db
    .select()
    .from(categoryGroupsTable)
    .where(eq(categoryGroupsTable.monthBudgetId, mb.id))
    .orderBy(categoryGroupsTable.sortOrder);
  const groupIds = groups.map((g) => g.id);
  const rows = groupIds.length
    ? await db
      .select()
      .from(budgetCategoriesTable)
      .where(
        and(
          inArray(budgetCategoriesTable.groupId, groupIds),
          isNull(budgetCategoriesTable.deletedAt),
        ),
      )
      .orderBy(budgetCategoriesTable.sortOrder)
    : [];

  const templateIds = Array.from(
    new Set(rows.map((r) => r.templateId).filter((id): id is string => !!id)),
  );
  const templates = templateIds.length
    ? await db
      .select()
      .from(categoryTemplatesTable)
      .where(inArray(categoryTemplatesTable.id, templateIds))
    : [];
  const templateById = new Map(templates.map((t) => [t.id, t]));

  const rollups = await db
    .select()
    .from(categoryRollups)
    .where(eq(categoryRollups.monthBudgetId, mb.id));
  const assignedByCategory = new Map(
    rollups.map((r) => [r.categoryId, Number(r.assigned ?? 0)]),
  );

  // target := [itemId, template, assigned, shortfall], ordered by group then item
  const orderByGroup = new Map(
    groups.map((g, i) => [g.id, i]),
  );
  const targeted = rows
    .map((r) => {
      const tpl = r.templateId ? templateById.get(r.templateId) : undefined;
      if (!tpl || tpl.targetType === "NONE") return null;
      const assigned = assignedByCategory.get(r.id) ?? 0;
      const shortfall = Math.max(Number(tpl.targetAmount ?? 0) - assigned, 0);
      return { itemId: r.id, shortfall, order: orderByGroup.get(r.groupId) ?? 0 };
    })
    .filter((x): x is { itemId: string; shortfall: number; order: number } => x !== null)
    .sort((a, b) => a.order - b.order);
  if (targeted.length === 0) return { assigned: 0, categoryCount: 0 };

  const pool = await getReadyToAssign(mb.id);
  if (pool <= 0.005) return { assigned: 0, categoryCount: 0 };

  const itemsToFund = categoryItemIds && categoryItemIds.length > 0
    ? targeted.filter((t) => categoryItemIds.includes(t.itemId))
    : targeted;
  if (itemsToFund.length === 0) return { assigned: 0, categoryCount: 0 };

  let remainingPool = pool;
  let assignedTotal = 0;
  let fundedCount = 0;
  const spends: Array<{ monthBudgetId: string; categoryId: string; amount: number }> = [];

  for (const { itemId, shortfall } of itemsToFund) {
    const alloc = Math.min(shortfall, remainingPool);
    if (alloc <= 0.005) break;
    spends.push({ monthBudgetId: mb.id, categoryId: itemId, amount: alloc });
    assignedTotal += alloc;
    remainingPool -= alloc;
    if (alloc >= shortfall - 0.005) fundedCount++;
  }

  await db.transaction(async (tx) => {
    for (const s of spends) {
      await tx.insert(assignmentLedger).values({
        monthBudgetId: s.monthBudgetId,
        categoryId: s.categoryId,
        paycheckId: null,
        moveId: null,
        amount: String(s.amount),
        moveType: "ASSIGN",
      });
      await incrementRollup(s.monthBudgetId, s.categoryId, {
        assigned: s.amount,
        available: s.amount,
      }, tx);
    }
  });

  revalidateBudgetPages();
  return { assigned: assignedTotal, categoryCount: fundedCount };
}

// ---------------------------------------------------------------------------
// Transactions: NEW → TRACKED → DELETED; tracking feeds Activity/Available
// ---------------------------------------------------------------------------

function revalidateBudgetPages() {
  revalidatePath("/budget");
  revalidatePath("/planning");
  revalidatePath("/accounts");
  revalidatePath("/");
}

/** True when the category lives in the Income group (money in vs. spending). */
async function isIncomeCategory(
  categoryId: string,
  client: DbClient = db,
): Promise<boolean> {
  const [row] = await client
    .select({ groupName: categoryGroupsTable.name })
    .from(budgetCategoriesTable)
    .innerJoin(
      categoryGroupsTable,
      eq(categoryGroupsTable.id, budgetCategoriesTable.groupId),
    )
    .where(eq(budgetCategoriesTable.id, categoryId))
    .limit(1);
  return row?.groupName === "Income";
}

/**
 * Add a budget item (category line) to a group. Used by the planning screen
 * "+ Add item" button — e.g. income lines like "Paycheck" on the Income card.
 * Returns the created item so the client can render it optimistically.
 */
export async function addCategoryItem(
  groupId: string,
  name: string,
  planned = 0,
): Promise<BudgetCategoryItemDTO> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Item name is required");
  if (!Number.isFinite(planned) || planned < 0) {
    throw new Error("Planned amount must be zero or positive");
  }

  const [group] = await db
    .select()
    .from(categoryGroupsTable)
    .where(eq(categoryGroupsTable.id, groupId))
    .limit(1);
  if (!group) throw new Error("Group not found");

  const [monthB] = await db
    .select({ budgetId: monthBudgets.budgetId })
    .from(monthBudgets)
    .where(eq(monthBudgets.id, group.monthBudgetId))
    .limit(1);
  const templateId = monthB
    ? await getOrCreateCategoryTemplate(monthB.budgetId, trimmed, group.name)
    : null;

  const [lastItem] = await db
    .select({ sortOrder: budgetCategoriesTable.sortOrder })
    .from(budgetCategoriesTable)
    .where(
      and(
        eq(budgetCategoriesTable.groupId, groupId),
        isNull(budgetCategoriesTable.deletedAt),
      ),
    )
    .orderBy(desc(budgetCategoriesTable.sortOrder))
    .limit(1);

  const [created] = await db
    .insert(budgetCategoriesTable)
    .values({
      groupId,
      templateId,
      name: trimmed,
      dueDate: null,
      planned: String(planned),
      sortOrder: (lastItem?.sortOrder ?? -1) + 1,
    })
    .returning();

  revalidateBudgetPages();

  return {
    id: created.id,
    groupId: created.groupId,
    name: created.name,
    dueDate: null,
    planned,
    sortOrder: created.sortOrder,
    isPaymentCategory: false,
    accountId: null,
    funded: 0,
    spent: 0,
    received: 0,
    remaining: 0,
    transactionCount: 0,
    templateId,
    targetType: "NONE",
    targetAmount: 0,
    targetDue: null,
    targetDate: null,
    targetMonthDay: null,
    needed: 0,
    trend: [],
  };
}

/**
 * Update an item's name and/or planned amount. Planned is aspirational only
 * (never affects funded/rollups).
 */
export async function updateCategoryItem(
  id: string,
  input: { name?: string; planned?: number },
): Promise<void> {
  const name = input.name?.trim();
  if (name !== undefined && !name) throw new Error("Item name is required");
  if (
    input.planned !== undefined &&
    (!Number.isFinite(input.planned) || input.planned < 0)
  ) {
    throw new Error("Planned amount must be zero or positive");
  }

  const [cat] = await db
    .select()
    .from(budgetCategoriesTable)
    .where(eq(budgetCategoriesTable.id, id))
    .limit(1);
  if (!cat) throw new Error("Item not found");

  await db
    .update(budgetCategoriesTable)
    .set({
      ...(name !== undefined ? { name } : {}),
      ...(input.planned !== undefined
        ? { planned: String(input.planned) }
        : {}),
    })
    .where(eq(budgetCategoriesTable.id, id));

  revalidateBudgetPages();
}

/**
 * Soft-delete an item. The row is hidden from every read so it can be
 * restored (undo) without losing its transaction links.
 */
export async function deleteCategoryItem(id: string): Promise<void> {
  const [cat] = await db
    .select({ id: budgetCategoriesTable.id })
    .from(budgetCategoriesTable)
    .where(
      and(
        eq(budgetCategoriesTable.id, id),
        isNull(budgetCategoriesTable.deletedAt),
      ),
    )
    .limit(1);
  if (!cat) return;

  await db
    .update(budgetCategoriesTable)
    .set({ deletedAt: new Date() })
    .where(eq(budgetCategoriesTable.id, id));

  revalidateBudgetPages();
}

/**
 * Restore a soft-deleted item (undo). Its planned amount, rollup and
 * transaction links are all preserved.
 */
export async function restoreCategoryItem(id: string): Promise<void> {
  await db
    .update(budgetCategoriesTable)
    .set({ deletedAt: null })
    .where(eq(budgetCategoriesTable.id, id));

  revalidateBudgetPages();
}

/**
 * Rewrite item order within a group. The client sends the full ordered list of
 * ids; this persists sortOrder as 0..n in a single transaction.
 */
export async function reorderCategoryItems(
  groupId: string,
  orderedIds: string[],
): Promise<void> {
  const [group] = await db
    .select({ id: categoryGroupsTable.id })
    .from(categoryGroupsTable)
    .where(eq(categoryGroupsTable.id, groupId))
    .limit(1);
  if (!group) throw new Error("Group not found");

  await db.transaction(async (tx) => {
    for (const [i, id] of orderedIds.entries()) {
      await tx
        .update(budgetCategoriesTable)
        .set({ sortOrder: i })
        .where(
          and(
            eq(budgetCategoriesTable.id, id),
            eq(budgetCategoriesTable.groupId, groupId),
          ),
        );
    }
  });

  revalidateBudgetPages();
}

async function getMonthTransaction(id: string) {
  const budget = await getOrCreateDefaultBudget();
  const { mb } = await getOrCreateMonthBudget(budget.id, false);

  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.monthBudgetId, mb.id),
      ),
    )
    .limit(1);
  return { tx, mb };
}

async function getDefaultAccountId(
  client: DbClient = db,
): Promise<string | null> {
  const budget = await getOrCreateDefaultBudget();
  const [account] = await client
    .select({ id: accounts.id })
    .from(accounts)
    .where(
      and(
        eq(accounts.budgetId, budget.id),
        eq(accounts.isActive, true),
        isNull(accounts.deletedAt),
      ),
    )
    .limit(1);
  return account?.id ?? null;
}

/**
 * Record spending. Stored as NEW (appears in the Planning "new" tab) until
 * tracked; never modifies planned budget.
 */
export async function addTransaction(input: {
  amount: number;
  categoryId?: string | null;
  accountId?: string | null;
  payee?: string | null;
  memo?: string | null;
  date?: Date;
}): Promise<{ id: string; date: string }> {
  assertAmount(input.amount);
  if (!input.accountId) throw new Error("Account is required");

  const budget = await getOrCreateDefaultBudget();
  const { mb } = await getOrCreateMonthBudget(budget.id);

  const [row] = await db
    .insert(transactions)
    .values({
      monthBudgetId: mb.id,
      accountId: input.accountId ?? null,
      categoryId: input.categoryId ?? null,
      amount: String(input.amount),
      date: input.date ?? new Date(),
      payee: input.payee ?? null,
      memo: input.memo ?? null,
      cleared: false,
      status: "NEW",
    })
    .returning({ id: transactions.id, date: transactions.date });

  revalidateBudgetPages();

  return { id: row.id, date: row.date.toISOString() };
}

/**
 * Move a NEW transaction into TRACKED.
 * - Expense category: applies its rollup effect (activity up, available down)
 *   and decrements the linked account balance.
 * - Income category: money coming in — creates a paycheck (feeds Ready to
 *   Assign) and increments the account balance.
 * All legs run atomically.
 */
export async function trackTransaction(id: string): Promise<void> {
  const { tx, mb } = await getMonthTransaction(id);
  if (!tx || tx.status !== "NEW") return;
  if (!tx.categoryId) throw new Error("Assign a category before tracking");

  const categoryId = tx.categoryId;
  const amount = Number(tx.amount);
  await db.transaction(async (client) => {
    await client
      .update(transactions)
      .set({ status: "TRACKED" })
      .where(eq(transactions.id, id));

    if (await isIncomeCategory(categoryId, client)) {
      const accountId = tx.accountId ?? (await getDefaultAccountId(client));
      if (accountId) {
        await client.insert(paychecks).values({
          monthBudgetId: mb.id,
          accountId,
          amount: String(amount),
          date: tx.date,
          note: tx.payee,
          transactionId: tx.id,
        });
        await applyBalanceDelta(accountId, amount, client);
      }
    } else {
      await incrementRollup(mb.id, categoryId, {
        activity: amount,
        available: -amount,
      }, client);
      await applyBalanceDelta(tx.accountId, -amount, client);
    }
  });

  revalidateBudgetPages();
}

/**
 * Mark a transaction DELETED (soft). Reverses its effect: rollup deltas for
 * expenses, or the linked paycheck for income, plus the account balance
 * delta applied when it was tracked. All legs run atomically.
 */
export async function deleteTransaction(id: string): Promise<void> {
  const { tx, mb } = await getMonthTransaction(id);
  if (!tx || tx.status === "DELETED") return;

  await db.transaction(async (client) => {
    if (tx.status === "TRACKED") {
      if (tx.categoryId && !(await isIncomeCategory(tx.categoryId, client))) {
        const amount = Number(tx.amount);
        await incrementRollup(mb.id, tx.categoryId, {
          activity: -amount,
          available: amount,
        }, client);
        await applyBalanceDelta(tx.accountId, amount, client);
      } else {
        const [paycheck] = await client
          .select({ accountId: paychecks.accountId })
          .from(paychecks)
          .where(eq(paychecks.transactionId, tx.id))
          .limit(1);
        const amount = Number(tx.amount);
        await client
          .delete(paychecks)
          .where(eq(paychecks.transactionId, tx.id));
        await applyBalanceDelta(paycheck?.accountId ?? tx.accountId, -amount, client);
      }
    }

    await client
      .update(transactions)
      .set({ status: "DELETED" })
      .where(eq(transactions.id, id));
  });

  revalidateBudgetPages();
}
