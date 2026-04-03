import { z, ZodType } from "zod";
import { BadRequestError } from "./errors";

const positiveIntegerSchema = z.coerce.number().int().positive();

export function parseWithSchema<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new BadRequestError("Validation failed", z.treeifyError(result.error));
  }

  return result.data;
}

export function parsePositiveInteger(value: unknown, fieldName: string): number {
  const result = positiveIntegerSchema.safeParse(value);

  if (!result.success) {
    throw new BadRequestError(`${fieldName} must be a positive integer`, z.treeifyError(result.error));
  }

  return result.data;
}
