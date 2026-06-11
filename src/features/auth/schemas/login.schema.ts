import { z } from "zod"

const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const strongPasswordMessage =
  "Password must be at least 8 characters with one uppercase letter, one number, and one special character"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .regex(strongPasswordRegex, strongPasswordMessage),
  rememberMe: z.boolean().refine((val) => val === true, {
    message: "continue with checkbox",
  }),
})

export type LoginInput = z.infer<typeof loginSchema>
