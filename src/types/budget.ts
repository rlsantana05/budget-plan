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
  remaining: number;
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
  viewTabs: {
    active: string;
    options: string[];
  };
  categories: BudgetCategoryGroupDTO[];
  note: string | null;
  transactions: BudgetTransactionDTO[];
  accounts: BudgetAccountOptionDTO[];
}

export interface BudgetScreenCategoryItemDTO {
  id: string;
  groupId: string;
  name: string;
  planned: number;
  dueDate: string | null;
  assigned: number;
  activity: number;
  available: number;
  availableStatus: "positive" | "negative" | "neutral";
  status?: string;
}

export interface BudgetScreenCategoryGroupDTO {
  id: string;
  monthBudgetId: string;
  name: string;
  sortOrder: number;
  collapsed: boolean;
  assigned: number;
  activity: number;
  available: number;
  items: BudgetScreenCategoryItemDTO[];
}

export interface BudgetScreenDTO {
  id: string;
  month: string;
  year: number;
  note: string | null;
  readyToAssign: {
    amount: number;
    label: "Ready to Assign";
    action: "Assign";
  };
  filterTabs: {
    active: string;
    options: string[];
  };
  toolbar: {
    actions: string[];
    viewToggle: string[];
  };
  columns: string[];
  categoryGroups: BudgetScreenCategoryGroupDTO[];
}

export interface DefaultItemSet {
  groupName: string;
  items: string[];
}
