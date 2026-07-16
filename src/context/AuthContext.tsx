import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '@/core/api'
import type { Role, UserAccount } from '@/core/types'

interface AuthState {
  user: UserAccount | null
  /** true selama sesi awal masih diperiksa ke server. */
  loading: boolean
  login: (username: string, password: string) => Promise<UserAccount>
  register: (payload: {
    name: string; username: string; email: string; password: string; role: Role
  }) => Promise<UserAccount>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null)
  const [loading, setLoading] = useState(true)

  // Pulihkan sesi dari cookie httpOnly saat aplikasi dimuat.
  useEffect(() => {
    let alive = true
    authApi
      .me()
      .then(d => { if (alive) setUser(d.user) })
      .catch(() => { if (alive) setUser(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { user: u } = await authApi.login(username, password)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (payload: {
    name: string; username: string; email: string; password: string; role: Role
  }) => {
    const { user: u } = await authApi.register(payload)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      // Bersihkan state lokal apa pun hasil panggilan server.
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
