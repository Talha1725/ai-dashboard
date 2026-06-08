import type { Metadata } from "next"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset Password | Business Health Dashboard",
  description: "Create a new password for your dashboard account",
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <ResetPasswordForm token={token ?? ""} />
    </div>
  )
}
