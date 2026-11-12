import { z } from "zod";

export const createSessionSchema = z.object({
  body: z.object({
    email: z
      .email({
        error: "Email is required",
      })
      .trim()
      .toLowerCase(),
    password: z.string({
      error: "password is required",
    }),
  }),
});
