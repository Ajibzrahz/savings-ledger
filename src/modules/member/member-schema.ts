import * as z from "zod";
import { objectId } from "../../common/utils/common";

export const addMemberSchema = z.object({
  params: z.object({ groupId: objectId }),
  body: z.strictObject({
    name: z.string({ error: "name is required" }).trim().min(2).max(20),
    phone: z.string({ error: "phone is required" }).trim(),
  }),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberSchema = z.object({
  params: z.object({ groupId: objectId, memberId: objectId }),
  body: z
    .strictObject({
      name: z
        .string({ error: "name is required" })
        .trim()
        .min(1)
        .max(20)
        .optional(),
      phone: z.string().trim().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
    }),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const listMembersSchema = z.object({
  params: z.object({ groupId: objectId }),
});
export type ListMembersInput = z.infer<typeof listMembersSchema>;

export const removeMemberSchema = z.object({
  params: z.object({ groupId: objectId, memberId: objectId }),
});
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

export const reorderMembersSchema = z.object({
  params: z.object({ groupId: objectId }),
  body: z.strictObject({
    memberIds: z
      .array(objectId, { error: "memberIds must be a list of ids" })
      .min(1, "memberIds cannot be empty")
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "memberIds must not contain duplicates",
      }),
  }),
});
export type ReorderMembersInput = z.infer<typeof reorderMembersSchema>;