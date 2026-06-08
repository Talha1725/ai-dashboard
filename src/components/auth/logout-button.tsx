"use client"

import * as React from "react"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants"

export function LogoutButton() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } finally {
      router.replace(AUTH_ROUTES.login)
      router.refresh()
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
      <LogOut className="h-4 w-4" />
      {isLoggingOut ? "Signing out..." : "Logout"}
    </Button>
  )
}
