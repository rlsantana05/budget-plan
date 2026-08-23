export type CategoryMeta = {
  type: 'met' | 'due';
  text: string;
};

export interface BudgetCategoryItem {
  id: string;
  name: string;
  assignedCents: number;
  activityCents: number;
  meta?: CategoryMeta;
}

export interface BudgetGroup {
  id: string;
  name: string;
  items: BudgetCategoryItem[];
}

export interface BudgetTotals {
  leftToBudgetCents: number;
  totalAssignedCents: number;
  totalIncomeCents: number;
}
