import { FinancialRecord, User } from "../types";

export function mapUser(row: Record<string, unknown>): User {
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role as User["role"],
    status: row.status as User["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapRecord(row: Record<string, unknown>): FinancialRecord {
  return {
    id: Number(row.id),
    amount: Number(row.amount),
    type: row.type as FinancialRecord["type"],
    category: String(row.category),
    recordDate: String(row.record_date),
    notes: row.notes ? String(row.notes) : null,
    createdBy: Number(row.created_by),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
