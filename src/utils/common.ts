// src/schema/common.ts
import { z } from "zod";

export const objectId = z
  .string({ error: "ID must be a string" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");