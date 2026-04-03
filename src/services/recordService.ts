import { Database } from "better-sqlite3";
import { z } from "zod";
import { mapRecord } from "../db/mappers";
import { FinancialRecord } from "../types";
import { NotFoundError } from "../utils/errors";
import { parseWithSchema } from "../utils/validation";

const recordSchema = z.object({
  amount: z.number().nonnegative(),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(2).max(100),
  recordDate: z.iso.date(),
  notes: z.string().trim().max(500).nullable().optional()
});

const updateRecordSchema = recordSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided for update"
});

const recordFiltersSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().trim().min(1).optional(),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10)
}).refine((value) => !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo, {
  message: "dateFrom must be before or equal to dateTo",
  path: ["dateFrom"]
});

function escapeSqlLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function calculateTotalPages(total: number, pageSize: number) {
  return total === 0 ? 0 : Math.ceil(total / pageSize);
}

export function listRecords(db: Database, query: unknown) {
  const filters = parseWithSchema(recordFiltersSchema, query);
  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.type) {
    where.push("type = @type");
    params.type = filters.type;
  }
  if (filters.category) {
    where.push("LOWER(category) LIKE LOWER(@category) ESCAPE '\\'");
    params.category = `%${escapeSqlLike(filters.category)}%`;
  }
  if (filters.dateFrom) {
    where.push("record_date >= @dateFrom");
    params.dateFrom = filters.dateFrom;
  }
  if (filters.dateTo) {
    where.push("record_date <= @dateTo");
    params.dateTo = filters.dateTo;
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (filters.page - 1) * filters.pageSize;

  const rows = db.prepare(`
    SELECT *
    FROM financial_records
    ${whereClause}
    ORDER BY record_date DESC, id DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: filters.pageSize, offset }) as Record<string, unknown>[];

  const totalRow = db.prepare(`
    SELECT COUNT(*) AS count
    FROM financial_records
    ${whereClause}
  `).get(params) as { count: number };

  return {
    data: rows.map(mapRecord),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: totalRow.count,
      totalPages: calculateTotalPages(totalRow.count, filters.pageSize)
    }
  };
}

export function getRecordById(db: Database, id: number): FinancialRecord {
  const row = db.prepare("SELECT * FROM financial_records WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) {
    throw new NotFoundError(`Financial record ${id} was not found`);
  }
  return mapRecord(row);
}

export function createRecord(db: Database, payload: unknown, createdBy: number): FinancialRecord {
  const input = parseWithSchema(recordSchema, payload);
  const result = db.prepare(`
    INSERT INTO financial_records (amount, type, category, record_date, notes, created_by)
    VALUES (@amount, @type, @category, @recordDate, @notes, @createdBy)
  `).run({
    ...input,
    createdBy,
    notes: input.notes ?? null
  });

  return getRecordById(db, Number(result.lastInsertRowid));
}

export function updateRecord(db: Database, id: number, payload: unknown): FinancialRecord {
  const input = parseWithSchema(updateRecordSchema, payload);
  getRecordById(db, id);

  const updateFields: string[] = [];
  const params: Record<string, unknown> = { id };

  if (input.amount !== undefined) {
    updateFields.push("amount = @amount");
    params.amount = input.amount;
  }
  if (input.type !== undefined) {
    updateFields.push("type = @type");
    params.type = input.type;
  }
  if (input.category !== undefined) {
    updateFields.push("category = @category");
    params.category = input.category;
  }
  if (input.recordDate !== undefined) {
    updateFields.push("record_date = @recordDate");
    params.recordDate = input.recordDate;
  }
  if (input.notes !== undefined) {
    updateFields.push("notes = @notes");
    params.notes = input.notes;
  }

  updateFields.push("updated_at = CURRENT_TIMESTAMP");

  db.prepare(`
    UPDATE financial_records
    SET ${updateFields.join(", ")}
    WHERE id = @id
  `).run(params);

  return getRecordById(db, id);
}

export function deleteRecord(db: Database, id: number) {
  getRecordById(db, id);
  db.prepare("DELETE FROM financial_records WHERE id = ?").run(id);
}
