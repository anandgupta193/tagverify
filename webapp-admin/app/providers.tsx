'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { App, ConfigProvider } from 'antd'
import { antdTheme } from '@/constants/theme'
import { useAuth, type AuthState } from '@/hooks/useAuth'

type Theme = 'light' | 'dark'
const THEME_KEY = 'tv-theme'

// ── Theme context ─────────────────────────────────────────────────────────────

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    let saved: Theme = 'light'
    try {
      saved = (localStorage.getItem(THEME_KEY) as Theme) || 'light'
    } catch {}
    setTheme(saved)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {}
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ConfigProvider theme={antdTheme(theme)}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}

// ── Auth context ──────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signOut: async () => {},
})
export const useAuthContext = () => useContext(AuthContext)

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  )
}
