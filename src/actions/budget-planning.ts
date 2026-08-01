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
  monthBudgets,
  paychecks,
  transactions,
  users,
} from "@/db/schema";
import type {
  BudgetCategoryItemDTO,
  BudgetScreenDTO,
  BudgetScreenCategoryGroupDTO,
  BudgetScreenCategoryItemDTO,
  BudgetTransactionDTO,
  MonthBudgetPlanDTO,
} from "@/types/budget";

const DEV_EMAIL = "dev@budgetplan.app";

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

/**
 * Fetch (or create + seed) the current month's budget snapshot for the
 * logged-in dev budget. Seeds the EveryDollar default groups + items on
 * first creation.
 */
async function getOrCreateMonthBudget(
  budgetId: string,
  seedDefaults = true,
): Promise<{ mb: typeof monthBudgets.$inferSelect; month: number; year: number }> {
  const { month, year } = monthYearKey();

  let [mb] = await db
    .select()
    .from(monthBudgets)
    .where(
      and(
        eq(monthBudgets.budgetId, budgetId),
        eq(monthBudgets.year, year),
        eq(monthBudgets.month, month),
        isNull(monthBudgets.deletedAt),
      ),
    )
    .limit(1);

  if (!mb) {
    mb = (
      await db
        .insert(monthBudgets)
        .values({ budgetId, year, month, note: null })
        .returning()
    )[0];
    // Brand-new month: seed the default groups + items immediately. Avoids a
    // "does it need seeding?" check on every subsequent read.
    if (seedDefaults) {
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
          await db.insert(budgetCategoriesTable).values({
            groupId: grp.id,
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

  return { mb: mb!, month, year };
}

/**
 * Fetch (or create + seed) the current month's budget snapshot for the
 * logged-in dev budget. Seeds the EveryDollar default groups + items on
 * first creation.
 */
export async function getMonthBudgetPlan(): Promise<MonthBudgetPlanDTO> {
  const budget = await getOrCreateDefaultBudget();
  const { mb, month, year } = await getOrCreateMonthBudget(budget.id);
  const monthName = new Date(year, month - 1, 1).toLocaleString("default", {
    month: "long",
  });

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
        .where(inArray(budgetCategoriesTable.groupId, groupIds))
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
          isNull(accounts.deletedAt),
        ),
      ),
  ]);

  const rollupById = new Map(rollupRows.map((r) => [r.categoryId, r]));

  const groupDTOs = groups.map((g) => {
    const items = itemsByGroup.get(g.id) ?? [];

    let totalPlanned = 0;
    let totalSpent = 0;
    let totalRemaining = 0;

    const categoryItems = items.map((it): BudgetCategoryItemDTO => {
      const rollup = rollupById.get(it.id);
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
        remaining,
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
  const incomeCategoryIds = new Set<string>();
  for (const g of groupDTOs) {
    for (const it of g.items) {
      categoryNameById.set(it.id, it.name);
      if (g.name === "Income") incomeCategoryIds.add(it.id);
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
    year,
    budgetStatus: {
      overBudgetAmount: diff > 0 ? diff : 0,
      label: diff > 0 ? "over budget" : "under budget",
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

export async function getBudgetScreen(): Promise<BudgetScreenDTO> {
  const budget = await getOrCreateDefaultBudget();
  const { mb, month, year } = await getOrCreateMonthBudget(budget.id);
  const monthName = new Date(year, month - 1, 1).toLocaleString("default", {
    month: "long",
  });

  const groupRows = await db
    .select()
    .from(categoryGroupsTable)
    .where(eq(categoryGroupsTable.monthBudgetId, mb.id))
    .orderBy(categoryGroupsTable.sortOrder);

  const groupIds = groupRows.map((g) => g.id);
  const allItems = groupIds.length
    ? await db
        .select()
        .from(budgetCategoriesTable)
        .where(inArray(budgetCategoriesTable.groupId, groupIds))
        .orderBy(budgetCategoriesTable.sortOrder)
    : [];

  const itemsByGroup = new Map<string, (typeof allItems)[number][]>();
  for (const item of allItems) {
    const list = itemsByGroup.get(item.groupId) ?? [];
    list.push(item);
    itemsByGroup.set(item.groupId, list);
  }

  const [rollupRows, [paycheckTotal]] = await Promise.all([
    db
      .select()
      .from(categoryRollups)
      .where(eq(categoryRollups.monthBudgetId, mb.id)),
    db
      .select({ total: sql<string | null>`coalesce(sum(${paychecks.amount}), 0)` })
      .from(paychecks)
      .where(eq(paychecks.monthBudgetId, mb.id)),
  ]);

  const rollupById = new Map(
    rollupRows.map((r) => [r.categoryId, r]),
  );

  const totalAssigned = rollupRows.reduce(
    (sum, r) => sum + Number(r.assigned),
    0,
  );
  const readyToAssign = Number(paycheckTotal?.total ?? 0) - totalAssigned;

  const categoryGroups: BudgetScreenCategoryGroupDTO[] = groupRows.map((g) => {
    const items = itemsByGroup.get(g.id) ?? [];
    let assigned = 0;
    let activity = 0;
    let available = 0;

    const itemDTOs: BudgetScreenCategoryItemDTO[] = items.map((it) => {
      const rollup = rollupById.get(it.id);
      const itemAssigned = Number(rollup?.assigned ?? 0);
      const itemActivity = Number(rollup?.activity ?? 0);
      const itemAvailable = itemAssigned - itemActivity;
      const planned = Number(it.planned ?? 0);

      assigned += itemAssigned;
      activity += itemActivity;
      available += itemAvailable;

      return {
        id: it.id,
        groupId: it.groupId,
        name: it.name,
        planned,
        dueDate: it.dueDate?.toISOString() ?? null,
        assigned: itemAssigned,
        activity: itemActivity,
        available: itemAvailable,
        availableStatus:
          itemAvailable > 0
            ? "positive"
            : itemAvailable < 0
              ? "negative"
              : "neutral",
        status:
          planned > 0 && itemAssigned >= planned ? "Funded" : undefined,
      };
    });

    return {
      id: g.id,
      monthBudgetId: g.monthBudgetId,
      name: g.name,
      sortOrder: g.sortOrder,
      collapsed: g.collapsed ?? false,
      assigned,
      activity,
      available,
      items: itemDTOs,
    };
  });

  return {
    id: mb.id,
    month: monthName,
    year,
    note: mb.note,
    readyToAssign: {
      amount: readyToAssign,
      label: "Ready to Assign",
      action: "Assign",
    },
    filterTabs: {
      active: "All",
      options: ["All", "Underfunded", "Overfunded", "Money Available"],
    },
    toolbar: {
      actions: ["Category Group", "Undo", "Redo", "Recent Moves"],
      viewToggle: ["list", "detail"],
    },
    columns: ["ASSIGNED", "ACTIVITY", "AVAILABLE"],
    categoryGroups,
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
) {
  return db
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
// Transactions: NEW → TRACKED → DELETED; tracking feeds Activity/Available
// ---------------------------------------------------------------------------

function revalidateBudgetPages() {
  revalidatePath("/budget");
  revalidatePath("/planning");
}

/** True when the category lives in the Income group (money in vs. spending). */
async function isIncomeCategory(categoryId: string): Promise<boolean> {
  const [row] = await db
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
): Promise<BudgetCategoryItemDTO> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Item name is required");

  const [group] = await db
    .select()
    .from(categoryGroupsTable)
    .where(eq(categoryGroupsTable.id, groupId))
    .limit(1);
  if (!group) throw new Error("Group not found");

  const [lastItem] = await db
    .select({ sortOrder: budgetCategoriesTable.sortOrder })
    .from(budgetCategoriesTable)
    .where(eq(budgetCategoriesTable.groupId, groupId))
    .orderBy(desc(budgetCategoriesTable.sortOrder))
    .limit(1);

  const [created] = await db
    .insert(budgetCategoriesTable)
    .values({
      groupId,
      name: trimmed,
      dueDate: null,
      planned: "0",
      sortOrder: (lastItem?.sortOrder ?? -1) + 1,
    })
    .returning();

  revalidateBudgetPages();

  return {
    id: created.id,
    groupId: created.groupId,
    name: created.name,
    dueDate: null,
    planned: 0,
    sortOrder: created.sortOrder,
    isPaymentCategory: false,
    accountId: null,
    funded: 0,
    spent: 0,
    remaining: 0,
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
 * Delete an item. Cascades its rollup + ledger rows; transactions referencing
 * it become uncategorized.
 */
export async function deleteCategoryItem(id: string): Promise<void> {
  const [cat] = await db
    .select()
    .from(budgetCategoriesTable)
    .where(eq(budgetCategoriesTable.id, id))
    .limit(1);
  if (!cat) return;

  await db
    .delete(budgetCategoriesTable)
    .where(eq(budgetCategoriesTable.id, id));

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

async function getDefaultAccountId(): Promise<string | null> {
  const budget = await getOrCreateDefaultBudget();
  const [account] = await db
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
 * - Expense category: applies its rollup effect (activity up, available down).
 * - Income category: money coming in — creates a paycheck (feeds Ready to
 *   Assign) instead of touching rollups.
 */
export async function trackTransaction(id: string): Promise<void> {
  const { tx, mb } = await getMonthTransaction(id);
  if (!tx || tx.status !== "NEW") return;
  if (!tx.categoryId) throw new Error("Assign a category before tracking");

  await db
    .update(transactions)
    .set({ status: "TRACKED" })
    .where(eq(transactions.id, id));

  const amount = Number(tx.amount);
  if (await isIncomeCategory(tx.categoryId)) {
    const accountId = tx.accountId ?? (await getDefaultAccountId());
    if (accountId) {
      await db.insert(paychecks).values({
        monthBudgetId: mb.id,
        accountId,
        amount: String(amount),
        date: tx.date,
        note: tx.payee,
        transactionId: tx.id,
      });
    }
  } else {
    await incrementRollup(mb.id, tx.categoryId, {
      activity: amount,
      available: -amount,
    });
  }

  revalidateBudgetPages();
}

/**
 * Mark a transaction DELETED (soft). Reverses its effect: rollup deltas for
 * expenses, or the linked paycheck for income. Remaining is restored.
 */
export async function deleteTransaction(id: string): Promise<void> {
  const { tx, mb } = await getMonthTransaction(id);
  if (!tx || tx.status === "DELETED") return;

  if (tx.status === "TRACKED") {
    if (tx.categoryId && !(await isIncomeCategory(tx.categoryId))) {
      const amount = Number(tx.amount);
      await incrementRollup(mb.id, tx.categoryId, {
        activity: -amount,
        available: amount,
      });
    } else {
      await db
        .delete(paychecks)
        .where(eq(paychecks.transactionId, tx.id));
    }
  }

  await db
    .update(transactions)
    .set({ status: "DELETED" })
    .where(eq(transactions.id, id));

  revalidateBudgetPages();
}
