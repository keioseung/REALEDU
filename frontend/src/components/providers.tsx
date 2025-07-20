'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import React, { createContext, useContext } from 'react'

interface AuthContextType {
  isLoggedIn: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isAdminLoggedIn') === 'true'
    }
    return false
  })

  const login = (password: string) => {
    if (password === 'admin1234') {
      setIsLoggedIn(true)
      localStorage.setItem('isAdminLoggedIn', 'true')
      return true
    }
    return false
  }

  const logout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('isAdminLoggedIn')
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        retry: 1,
      },
    },
  }))

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthProvider>
  )
} 