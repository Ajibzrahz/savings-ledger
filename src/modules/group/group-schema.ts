import * as z from "zod";
import { FREQUENCIES, STATUSES } from "./group-model";
import { objectId } from "../../utils/common";

export const createGroupSchema = z.object({
  body: z.strictObject({
    name: z.string({ error: "name is required" }).trim(),
    contributionAmount: z
      .number({ error: "contributionAmount is required" })
      .int()
      .positive(),
    frequency: z.enum(FREQUENCIES, { error: "a frequency is required" }),
    startDate: z.coerce.date().optional(),
  }),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>["body"];

export const updateGroupSchema = z.object({
  params: z.object({ groupId: objectId }),
  body: z
    .strictObject({
      name: z.string({ error: "name is required" }).trim().optional(),
      contributionAmount: z
        .number({ error: "contributionAmount is required" })
        .int()
        .positive()
        .optional(),
      frequency: z
        .enum(FREQUENCIES, { error: "a frequency is required" })
        .optional(),
      startDate: z.coerce.date().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
    }),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
