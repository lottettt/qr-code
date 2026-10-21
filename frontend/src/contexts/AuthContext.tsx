'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { Role, User } from '@/types'
import { getDemoUsers } from '@/lib/api'

const AUTH_KEY = 'qr-code-center-auth'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (username: string, role: Role) => Promise<void>
  logout: () => void
  demoUsers: User[]
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [demoUsers, setDemoUsers] = useState<User[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_KEY)

      if (raw) setUser(JSON.parse(raw) as User)
    } catch {
      // ignore
    }

    getDemoUsers()
      .then(setDemoUsers)
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, role: Role) => {
    const users = await getDemoUsers()
    const normalized = username.trim().toLowerCase()
    const match =
      users.find(u => u.username.toLowerCase() === normalized && u.role === role) ??
      users.find(u => u.username.toLowerCase() === normalized) ?? {
        id: `u-${normalized}`,
        username: normalized,
        displayName: username.trim() || normalized,
        role
      }

    window.localStorage.setItem(AUTH_KEY, JSON.stringify({ ...match, role: match.role }))
    setUser({ ...match })
    setDemoUsers(users)
  }, [])

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, demoUsers }),
    [user, loading, login, logout, demoUsers]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) throw new Error('useAuth must be used within AuthProvider')

  return ctx
}
