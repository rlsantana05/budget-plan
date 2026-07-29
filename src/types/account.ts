export type AccountType = "banking" | "cash";

export type BankingAccountType = "checking" | "savings" | "money-market";

export interface Account {
  id: string;
  type: AccountType;
  nickname: string;
  balance: number;
  createdAt: Date;
  bankingAccountType?: BankingAccountType;
  institutionName?: string;
}
