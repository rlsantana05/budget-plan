export interface GroupItem {
  id: string;
  name: string;
  dueDate: string | null;
  planned: number;
  spent: number;
  received: number;
  remaining: number;
  transactionCount: number;
}

export interface PlanningCategory {
  name: string;
  planned: number;
  spent: number;
  remaining: number;
  isIncome: boolean;
}

export interface Group {
  id: string;
  name: string;
  defaultExpanded: boolean;
  isIncome: boolean;
  rightColumnOptions: Array<{ label: 'Spent' | 'Remaining'; selected: boolean }>;
  items: GroupItem[];
}
