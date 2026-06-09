import { z } from "zod"

const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const strongPasswordMessage =
  "Password must be at least 8 characters with one uppercase letter, one number, and one special character"

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .regex(strongPasswordRegex, strongPasswordMessage),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
