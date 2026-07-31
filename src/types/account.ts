export type AccountType =
  | "CHECKING"
  | "SAVINGS"
  | "MONEY_MARKET"
  | "CREDIT_CARD"
  | "CASH"
  | "INVESTMENT"
  | "OTHER";

export interface AccountDTO {
  id: string;
  name: string;
  type: AccountType;
  institutionName: string | null;
  balance: number;
  createdAt: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  institutionName?: string;
  balance: number;
}
