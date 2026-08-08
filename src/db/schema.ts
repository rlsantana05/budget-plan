import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type", [
  "CHECKING",
  "SAVINGS",
  "MONEY_MARKET",
  "CREDIT_CARD",
  "CASH",
  "INVESTMENT",
  "OTHER",
]);

export const roleEnum = pgEnum("role", ["OWNER", "MEMBER"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    clerkId: text("clerk_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_clerk_id_unique").on(table.clerkId),
    index("users_deleted_at_idx").on(table.deletedAt),
  ],
);

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("budgets_deleted_at_idx").on(table.deletedAt),
  ],
);

export const budgetMembers = pgTable(
  "budget_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("MEMBER"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("budget_members_user_budget_unique").on(
      table.userId,
      table.budgetId,
    ),
    index("budget_members_user_id_idx").on(table.userId),
    index("budget_members_budget_id_idx").on(table.budgetId),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull(),
    institutionName: text("institution_name"),
    initialBalance: numeric("initial_balance", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    balance: numeric("balance", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    lastReconciledAt: timestamp("last_reconciled_at", { withTimezone: true }),
    isLiquid: boolean("is_liquid").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("accounts_budget_id_idx").on(table.budgetId),
    index("accounts_type_idx").on(table.type),
    index("accounts_is_active_idx").on(table.isActive),
    index("accounts_deleted_at_idx").on(table.deletedAt),
  ],
);

// --- Budget planning: EveryDollar-style monthly snapshot + YNAB-style funding ---

export const transactionStatusEnum = pgEnum("transaction_status", [
  "NEW",
  "TRACKED",
  "DELETED",
]);

export const moveTypeEnum = pgEnum("move_type", [
  "ASSIGN",
  "MOVE_IN",
  "MOVE_OUT",
  "CREDIT_SPEND",
  "CARD_PAYMENT",
]);

export const categoryTargetTypeEnum = pgEnum("category_target_type", [
  "NONE",
  "ONCE",
  "MONTHLY",
]);

// One budget-month snapshot (EveryDollar: copy month → month with structure only)
export const monthBudgets = pgTable(
  "month_budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("month_budgets_budget_year_month_unique").on(
      table.budgetId,
      table.year,
      table.month,
    ),
    index("month_budgets_budget_id_idx").on(table.budgetId),
    index("month_budgets_year_month_idx").on(table.year, table.month),
    index("month_budgets_deleted_at_idx").on(table.deletedAt),
  ],
);

// Group within a month (Income, Giving, Housing, …, "Credit Cards")
export const categoryGroups = pgTable(
  "category_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monthBudgetId: uuid("month_budget_id")
      .notNull()
      .references(() => monthBudgets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    rightColumn: text("right_column").notNull().default("Spent"),
    collapsed: boolean("collapsed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("category_groups_month_budget_id_idx").on(table.monthBudgetId),
    index("category_groups_sort_order_idx").on(table.sortOrder),
  ],
);

// Durable category identity + its target rule (ADR-0002). Each month's
// budget_categories row links to one template via budget_categories.template_id,
// giving a stable "Groceries" across months for targets and history.
export const categoryTemplates = pgTable(
  "category_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    groupName: text("group_name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    targetType: categoryTargetTypeEnum("target_type")
      .notNull()
      .default("NONE"),
    targetAmount: numeric("target_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    targetDueDate: timestamp("target_due_date", { withTimezone: true }),
    targetMonthDay: integer("target_month_day"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("category_templates_budget_id_idx").on(table.budgetId),
    index("category_templates_name_group_idx").on(table.budgetId, table.name, table.groupName),
  ],
);

// Budget item (category) within a group. Spent/Remaining are DERIVED from transactions.
export const budgetCategories = pgTable(
  "budget_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => categoryGroups.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").references(() => categoryTemplates.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    planned: numeric("planned", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    sortOrder: integer("sort_order").notNull().default(0),
    // A payment category is tied to a credit-card account (Budgeting screen only)
    isPaymentCategory: boolean("is_payment_category")
      .notNull()
      .default(false),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("budget_categories_group_id_idx").on(table.groupId),
    index("budget_categories_template_id_idx").on(table.templateId),
    index("budget_categories_account_id_idx").on(table.accountId),
    index("budget_categories_due_date_idx").on(table.dueDate),
  ],
);

// Income event — seeds the per-check Ready to Assign pool (envelope-style)
export const paychecks = pgTable(
  "paychecks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monthBudgetId: uuid("month_budget_id")
      .notNull()
      .references(() => monthBudgets.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    date: timestamp("date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    note: text("note"),
    // Income transactions link to the paycheck they create (planning screen)
    transactionId: uuid("transaction_id").references(() => transactions.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("paychecks_month_budget_id_idx").on(table.monthBudgetId),
    index("paychecks_account_id_idx").on(table.accountId),
    index("paychecks_date_idx").on(table.date),
    index("paychecks_transaction_id_idx").on(table.transactionId),
  ],
);

// Spending transactions (feeds Spent/Activity on Planning; Activity on Budgeting)
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monthBudgetId: uuid("month_budget_id")
      .notNull()
      .references(() => monthBudgets.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id").references(() => budgetCategories.id, {
      onDelete: "set null",
    }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    date: timestamp("date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    payee: text("payee"),
    memo: text("memo"),
    cleared: boolean("cleared").notNull().default(false),
    status: transactionStatusEnum("status").notNull().default("NEW"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("transactions_month_budget_id_idx").on(table.monthBudgetId),
    index("transactions_account_id_idx").on(table.accountId),
    index("transactions_category_id_idx").on(table.categoryId),
    index("transactions_status_idx").on(table.status),
    index("transactions_date_idx").on(table.date),
  ],
);

// Source of truth for funding assignments (ledger). Rollups are materialized from this.
export const assignmentLedger = pgTable(
  "assignment_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monthBudgetId: uuid("month_budget_id")
      .notNull()
      .references(() => monthBudgets.id, { onDelete: "cascade" }),
    paycheckId: uuid("paycheck_id").references(() => paychecks.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => budgetCategories.id, { onDelete: "cascade" }),
    // Links debit/credit rows that form a single "move" between categories
    moveId: uuid("move_id"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    moveType: moveTypeEnum("move_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("assignment_ledger_month_budget_id_idx").on(table.monthBudgetId),
    index("assignment_ledger_paycheck_id_idx").on(table.paycheckId),
    index("assignment_ledger_category_id_idx").on(table.categoryId),
    index("assignment_ledger_move_id_idx").on(table.moveId),
  ],
);

// Materialized read model (assigned/activity/available per category). Refreshed on write.
export const categoryRollups = pgTable(
  "category_rollups",
  {
    monthBudgetId: uuid("month_budget_id")
      .notNull()
      .references(() => monthBudgets.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => budgetCategories.id, { onDelete: "cascade" }),
    assigned: numeric("assigned", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    activity: numeric("activity", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    available: numeric("available", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    assignedFromCredit: numeric("assigned_from_credit", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.monthBudgetId, table.categoryId] }),
    index("category_rollups_category_id_idx").on(table.categoryId),
  ],
);
