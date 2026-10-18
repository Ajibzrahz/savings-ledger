import * as z from "zod";

export const createUserSchema = z.object({
  body: z
    .object({
      email: z
        .email({
          pattern:
            /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i,
          error: (issue) =>
            issue.input === undefined
              ? "Email is required"
              : "Invalid email address",
        })
        .toLowerCase(),
      name: z.string({ error: "name is required" }).trim(),
      password: z
        .string({ error: "Password is required" })
        .min(6, "password too short - should be 6 chars minimmum"),
      passwordConfirmation: z.string({
        error: "PasswordConfirmation is required",
      }),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: "passwords do not match",
      path: ["passwordConfirmation"],
    }),
});

export type createUserInput = Omit<
  z.infer<typeof createUserSchema>["body"],
  "passwordConfirmation"
>;

export const updateUserSchema = z.object({
  body: z
    .strictObject({
      email: z
        .email({
          pattern:
            /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i,
          error: "Invalid email address",
        })
        .toLowerCase(),
      name: z
        .string({ error: "Name must be a string" })
        .trim()
        .min(1, "Name cannot be empty"),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
    }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
