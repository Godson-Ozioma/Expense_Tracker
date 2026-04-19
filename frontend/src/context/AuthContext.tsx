import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { api, API_BASE } from '../api/client'
import type { TokenPair } from '../types'

type AuthContextValue = {
  username: string | null
  login: (username: string, password: string) => Promise<void>
  register: (
    username: string,
    password: string,
    email?: string,
  ) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem('username'),
  )

  const persistTokens = useCallback((pair: TokenPair, user: string) => {
    localStorage.setItem('access_token', pair.access)
    localStorage.setItem('refresh_token', pair.refresh)
    localStorage.setItem('username', user)
    setUsername(user)
  }, [])

  const login = useCallback(
    async (u: string, password: string) => {
      const { data } = await axios.post<TokenPair>(
        `${API_BASE}/auth/token/`,
        { username: u, password },
        { headers: { 'Content-Type': 'application/json' } },
      )
      persistTokens(data, u)
      navigate('/')
    },
    [navigate, persistTokens],
  )

  const register = useCallback(
    async (u: string, password: string, email?: string) => {
      await api.post('/auth/register/', {
        username: u,
        password,
        ...(email ? { email } : {}),
      })
      await login(u, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('username')
    setUsername(null)
    navigate('/login')
  }, [navigate])

  const value = useMemo(
    () => ({ username, login, register, logout }),
    [username, login, register, logout],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
