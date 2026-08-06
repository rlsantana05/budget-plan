export interface GroupItem {
  id: string;
  name: string;
  dueDate: string | null;
  planned: number;
  spent: number;
  remaining: number;
  transactionCount: number;
}

export interface Group {
  id: string;
  name: string;
  defaultExpanded: boolean;
  isIncome: boolean;
  rightColumnOptions: Array<{ label: 'Spent' | 'Remaining'; selected: boolean }>;
  items: GroupItem[];
}
