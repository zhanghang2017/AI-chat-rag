import { z } from "zod";
import { createApiError } from "./errors";

/**
 * 使用 zod 校验输入数据并返回类型安全的结果。
 * @param schema zod 校验 schema。
 * @param value 待校验的原始输入。
 * @param location 当前输入位置描述（如 request body、query params）。
 * @returns 校验通过后的强类型数据。
 * @throws VALIDATION_ERROR 当输入不符合 schema 时抛出。
 */
export function validate<T>(schema: z.ZodType<T>, value: unknown, location: string): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  // Normalize zod issues so frontend always receives a flat details array.
  const details = parsed.error.issues.map((issue) => ({
    path: issue.path.map((part) => String(part)).join("."),
    message: issue.message,
  }));

  throw createApiError(400, "VALIDATION_ERROR", `Invalid ${location}`, details);
}
