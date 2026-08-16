export interface BudgetCategoryTrendDTO {
  /** Short month label, e.g. "Aug". */
  month: string;
  /** Rollup activity (spending) for that month. */
  activity: number;
}

export interface BudgetCategoryItemDTO {
  id: string;
  groupId: string;
  name: string;
  dueDate: string | null;
  planned: number;
  sortOrder: number;
  isPaymentCategory: boolean;
  accountId: string | null;
  funded: number;
  spent: number;
  /** Money marked received for income categories (0 for expense categories). */
  received: number;
  remaining: number;
  transactionCount: number;
  /** Durable category identity (ADR-0002). Null for legacy/unlinked rows. */
  templateId: string | null;
  /** Category target rule: "NONE" | "ONCE" | "MONTHLY" (ADR-0002). */
  targetType: "NONE" | "ONCE" | "MONTHLY";
  targetAmount: number;
  /** Due-date label, e.g. "Aug 21". Null when no target. */
  targetDue: string | null;
  /** Absolute ISO date (yyyy-mm-dd) for ONCE targets; null otherwise. */
  targetDate: string | null;
  /** Day-of-month (1–31) for MONTHLY targets; null otherwise. */
  targetMonthDay: number | null;
  /** Shortfall = target − assigned, clamped ≥ 0 (only meaningful with a target). */
  needed: number;
  /** Up to 3 most recent months of spending (rollup activity) for the durable category (ADR-0003). */
  trend: BudgetCategoryTrendDTO[];
}

export interface BudgetCategoryGroupDTO {
  id: string;
  monthBudgetId: string;
  name: string;
  sortOrder: number;
  rightColumn: "Spent" | "Remaining";
  collapsed: boolean;
  items: BudgetCategoryItemDTO[];
  totalPlanned: number;
  totalSpent: number;
  totalRemaining: number;
}

export interface BudgetStatusDTO {
  /** Signed surplus: positive = over budget, negative = under budget, 0 = on track. */
  amount: number;
  overBudgetAmount: number;
  label: "over budget" | string;
}

export type TransactionStatus = "NEW" | "TRACKED" | "DELETED";

export interface BudgetTransactionDTO {
  id: string;
  amount: number;
  payee: string | null;
  memo: string | null;
  date: string;
  status: TransactionStatus;
  categoryName: string | null;
  /** Owning category id (matches a BudgetCategoryItemDTO.id). Null when uncategorized. */
  categoryId: string | null;
  accountName: string | null;
  isIncome: boolean;
}

export interface BudgetAccountOptionDTO {
  id: string;
  name: string;
}

export interface MonthBudgetPlanDTO {
  id: string;
  budgetId: string;
  month: string;
  year: number;
  budgetStatus: BudgetStatusDTO;
  /**
   * The amount of money available to assign to categories this month.
   * Computed from liquid account balances minus money already assigned.
   */
  availableToAssign: number;
  viewTabs: {
    active: string;
    options: string[];
  };
  categories: BudgetCategoryGroupDTO[];
  note: string | null;
  transactions: BudgetTransactionDTO[];
  accounts: BudgetAccountOptionDTO[];
}

export interface DefaultItemSet {
  groupName: string;
  items: string[];
}
