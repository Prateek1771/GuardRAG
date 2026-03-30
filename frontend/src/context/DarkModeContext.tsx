import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface DarkModeContextType {
  isDark: boolean
  toggle: () => void
}

const DarkModeContext = createContext<DarkModeContextType>({ isDark: false, toggle: () => {} })

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('guardrag-theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('guardrag-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <DarkModeContext.Provider value={{ isDark, toggle: () => setIsDark(d => !d) }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export const useDarkMode = () => useContext(DarkModeContext)
