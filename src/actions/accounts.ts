"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  accounts,
  budgetCategories,
  budgetMembers,
  budgets,
  categoryGroups,
  users,
} from "@/db/schema";
import { addTransaction, getOrCreateMonthBudget } from "@/actions/budget-planning";
import type {
  AccountDTO,
  CreateAccountInput,
  UpdateAccountInput,
} from "@/types/account";

const DEV_EMAIL = "dev@budgetplan.app";

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

  await db
    .insert(budgetMembers)
    .values({ userId: user.id, budgetId: budget.id, role: "OWNER" });

  return budget;
}

function toDTO(account: typeof accounts.$inferSelect): AccountDTO {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    institutionName: account.institutionName,
    balance: Number(account.balance),
    createdAt: account.createdAt.toISOString(),
  };
}

export async function getAccounts(): Promise<AccountDTO[]> {
  const budget = await getOrCreateDefaultBudget();

  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.budgetId, budget.id), isNull(accounts.deletedAt)))
    .orderBy(accounts.createdAt);

  return rows.map(toDTO);
}

export async function getAccountTotal(): Promise<number> {
  const budget = await getOrCreateDefaultBudget();

  const rows = await db
    .select({ balance: accounts.balance })
    .from(accounts)
    .where(
      and(
        eq(accounts.budgetId, budget.id),
        isNull(accounts.deletedAt),
        eq(accounts.isLiquid, true),
        eq(accounts.isActive, true),
      ),
    );

  return rows.reduce((sum, row) => sum + Number(row.balance), 0);
}

export async function createAccount(
  input: CreateAccountInput,
): Promise<AccountDTO> {
  const budget = await getOrCreateDefaultBudget();

  const balance = input.balance.toString();

  const [account] = await db
    .insert(accounts)
    .values({
      name: input.name,
      type: input.type,
      institutionName: input.institutionName ?? null,
      balance,
      initialBalance: balance,
      budgetId: budget.id,
    })
    .returning();

  // Opening balance becomes visible budgeted income (a "Starting Balance"
  // income transaction) so Available to Assign reconciles with Planning.
  if (input.balance > 0 && isLiquidType(input.type)) {
    try {
      await recordStartingBalanceIncome(account.id, account.name, input.balance);
    } catch {
      // Non-fatal: account exists; pool math still works, planning just won't
      // show a matching received row for this opening balance.
    }
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/planning");

  return toDTO(account);
}

/** Liquid account types whose balances feed the Available to Assign pool. */
function isLiquidType(type: AccountDTO["type"]): boolean {
  return ["CHECKING", "SAVINGS", "MONEY_MARKET", "CASH", "OTHER"].includes(type);
}

/**
 * Create an income transaction in the current month's Income group category so
 * an account's opening balance is budgeted like any other money on hand.
 */
async function recordStartingBalanceIncome(
  accountId: string,
  accountName: string,
  amount: number,
): Promise<void> {
  const budget = await getOrCreateDefaultBudget();
  const { mb } = await getOrCreateMonthBudget(budget.id);

  // Find (or create) the "Starting Balance" row inside the Income group.
  const [incomeGroup] = await db
    .select()
    .from(categoryGroups)
    .where(and(eq(categoryGroups.monthBudgetId, mb.id), eq(categoryGroups.name, "Income")))
    .limit(1);

  let categoryId: string | undefined;
  if (incomeGroup) {
    const [existing] = await db
      .select({ id: budgetCategories.id })
      .from(budgetCategories)
      .where(
        and(eq(budgetCategories.groupId, incomeGroup.id), eq(budgetCategories.name, "Starting Balance")),
      )
      .limit(1);
    if (existing) {
      categoryId = existing.id;
    } else {
      const [created] = await db
        .insert(budgetCategories)
        .values({
          groupId: incomeGroup.id,
          name: "Starting Balance",
          planned: "0",
        })
        .returning({ id: budgetCategories.id });
      categoryId = created?.id;
    }
  }

  await addTransaction({
    amount,
    categoryId,
    accountId,
    payee: `Starting Balance — ${accountName}`,
    memo: "Account opening balance recorded as starting income",
  });
}

export async function updateAccount(
  id: string,
  input: UpdateAccountInput,
): Promise<AccountDTO> {
  const budget = await getOrCreateDefaultBudget();

  const [account] = await db
    .update(accounts)
    .set({
      name: input.name,
      type: input.type,
      institutionName: input.institutionName ?? null,
      balance: input.balance.toString(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(accounts.id, id),
        eq(accounts.budgetId, budget.id),
        isNull(accounts.deletedAt),
      ),
    )
    .returning();

  if (!account) {
    throw new Error("Account not found");
  }

  revalidatePath("/accounts");
  revalidatePath("/");

  return toDTO(account);
}

export async function deleteAccount(id: string): Promise<void> {
  const budget = await getOrCreateDefaultBudget();

  const [account] = await db
    .update(accounts)
    .set({
      deletedAt: new Date(),
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(accounts.id, id),
        eq(accounts.budgetId, budget.id),
        isNull(accounts.deletedAt),
      ),
    )
    .returning();

  if (!account) {
    throw new Error("Account not found");
  }

  revalidatePath("/accounts");
  revalidatePath("/");
}
