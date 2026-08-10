export type CategoryMeta = {
  type: 'met' | 'due';
  text: string;
};

export interface BudgetCategoryItem {
  id: string;
  name: string;
  assigned: number;
  activity: number;
  meta?: CategoryMeta;
}

export interface BudgetGroup {
  id: string;
  name: string;
  items: BudgetCategoryItem[];
}

export interface BudgetTotals {
  leftToBudget: number;
  totalAssigned: number;
  totalIncome: number;
}