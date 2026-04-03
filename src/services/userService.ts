import { Database } from "better-sqlite3";
import { z } from "zod";
import { mapUser } from "../db/mappers";
import { User } from "../types";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { parseWithSchema } from "../utils/validation";

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  role: z.enum(["viewer", "analyst", "admin"]),
  status: z.enum(["active", "inactive"]).default("active")
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(["viewer", "analyst", "admin"]).optional(),
  status: z.enum(["active", "inactive"]).optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided for update"
});

export function listUsers(db: Database): User[] {
  const rows = db.prepare("SELECT * FROM users ORDER BY id ASC").all() as Record<string, unknown>[];
  return rows.map(mapUser);
}

export function getUserById(db: Database, id: number): User {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) {
    throw new NotFoundError(`User ${id} was not found`);
  }
  return mapUser(row);
}

export function createUser(db: Database, payload: unknown): User {
  const input = parseWithSchema(createUserSchema, payload);

  try {
    const result = db.prepare(`
      INSERT INTO users (name, email, role, status)
      VALUES (@name, @email, @role, @status)
    `).run(input);

    return getUserById(db, Number(result.lastInsertRowid));
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new BadRequestError("A user with this email already exists");
    }

    throw error;
  }
}

export function updateUser(db: Database, id: number, payload: unknown): User {
  const input = parseWithSchema(updateUserSchema, payload);
  getUserById(db, id);

  const updateFields: string[] = [];
  const params: Record<string, unknown> = { id };

  if (input.name !== undefined) {
    updateFields.push("name = @name");
    params.name = input.name;
  }
  if (input.role !== undefined) {
    updateFields.push("role = @role");
    params.role = input.role;
  }
  if (input.status !== undefined) {
    updateFields.push("status = @status");
    params.status = input.status;
  }

  updateFields.push("updated_at = CURRENT_TIMESTAMP");

  db.prepare(`
    UPDATE users
    SET ${updateFields.join(", ")}
    WHERE id = @id
  `).run(params);

  return getUserById(db, id);
}
