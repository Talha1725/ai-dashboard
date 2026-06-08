import { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot Password | Business Health Dashboard",
  description: "Reset your password to regain access to your account",
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <ForgotPasswordForm />
    </div>
  )
}
