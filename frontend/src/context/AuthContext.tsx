import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../lib/api'

interface AuthUser {
  id: number
  username: string
  role: 'superadmin' | 'admin' | 'member' | 'guest'
  company_id: number | null
  department?: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => { setToken(null); localStorage.removeItem('token') })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password })
    const { access_token } = res.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    try {
      const me = await api.get('/auth/me')
      setUser(me.data)
    } catch (err) {
      localStorage.removeItem('token')
      setToken(null)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
