import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
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
