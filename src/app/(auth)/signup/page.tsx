import { Metadata } from "next"
import { SignupForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Sign Up | Business Health Dashboard",
  description: "Create an account to access your business intelligence dashboard",
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignupForm />
    </div>
  )
}
