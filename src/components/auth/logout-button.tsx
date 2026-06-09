"use client"

import * as React from "react"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants"
import { appToast } from "@/lib/toast"

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Unable to sign out.")
      }

      appToast.success("Signed out successfully.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign out."
      appToast.error("Sign out failed", { description: message })
    } finally {
      router.replace(AUTH_ROUTES.login)
      router.refresh()
    }
  }

  return (
    <Button variant="outline" className={className} onClick={handleLogout} disabled={isLoggingOut}>
      <LogOut className="h-4 w-4" />
      {isLoggingOut ? "Signing out..." : "Logout"}
    </Button>
  )
}
