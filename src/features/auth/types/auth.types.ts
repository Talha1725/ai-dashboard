export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
}
