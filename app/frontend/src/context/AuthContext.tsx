import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { apiClient } from '../api/client'

interface CurrentUser {
  id: number
  email: string
  is_admin: boolean
}

interface CurrentTenant {
  id: number
  name: string
  plan: string
}

interface AuthState {
  user: CurrentUser | null
  tenant: CurrentTenant | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [tenant, setTenant] = useState<CurrentTenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient
      .get('/me')
      .then(({ data }) => {
        setUser(data.user)
        setTenant(data.tenant)
      })
      .catch(() => {
        setUser(null)
        setTenant(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data } = await apiClient.post('/sign_in', { user: { email, password } })
    setUser(data.user)
    setTenant(data.tenant)
  }

  const signOut = async () => {
    await apiClient.delete('/sign_out')
    setUser(null)
    setTenant(null)
  }

  return <AuthContext.Provider value={{ user, tenant, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
