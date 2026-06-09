import { Metadata } from "next"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { verifySessionFromCookies } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Sign In | Business Health Dashboard",
  description: "Sign in to access your business intelligence dashboard",
}

export default async function LoginPage() {
  const auth = await verifySessionFromCookies()

  if (auth.authenticated) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm />
    </div>
  )
}
