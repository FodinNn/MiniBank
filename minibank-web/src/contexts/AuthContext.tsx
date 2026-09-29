import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '@/api/auth'
import { TOKEN_KEY, api } from '@/api/client'
import type { LoginRequest, RegisterRequest } from '@/api/types'

interface User {
  email: string
  fullName: string
}

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  updateProfile: (fullName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(token))

  useEffect(() => {
    let cancelled = false

    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    setLoading(true)
    authApi
      .me()
      .then((me) => {
        if (cancelled) return
        setUser({ email: me.email ?? '', fullName: me.fullName ?? '' })
      })
      .catch(() => {
        if (cancelled) return
        // Токен невалиден — чистим и остаёмся на публичной части.
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data)
    localStorage.setItem(TOKEN_KEY, res.token)
    setToken(res.token)
    setUser({ email: res.email, fullName: res.fullName })
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authApi.register(data)
    localStorage.setItem(TOKEN_KEY, res.token)
    setToken(res.token)
    setUser({ email: res.email, fullName: res.fullName })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (fullName: string) => {
    const me = await authApi.updateProfile(fullName)
    setUser((prev) =>
      prev
        ? { ...prev, fullName: me.fullName ?? fullName }
        : { email: me.email ?? '', fullName: me.fullName ?? fullName },
    )
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, updateProfile }),
    [user, token, loading, login, register, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
