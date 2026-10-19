import * as z from "zod";
import { objectId } from "../../utils/common";

export const addMemberSchema = z.object({
  params: z.object({ groupId: objectId }),
  body: z.strictObject({
    name: z.string({ error: "name is required" }).trim(),
    phone: z.string({ error: "phone is required" }).trim(),
  }),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
