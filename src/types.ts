export type UserRole = "viewer" | "analyst" | "admin";

export type UserStatus = "active" | "inactive";

export type RecordType = "income" | "expense";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialRecord {
  id: number;
  amount: number;
  type: RecordType;
  category: string;
  recordDate: string;
  notes: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}
