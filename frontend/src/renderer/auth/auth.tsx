import React, { createContext, useContext, useEffect, useState } from 'react'
import { message } from 'antd'
import { BASE_URL } from '../../utils/network'

interface AuthContextType {
  token: string | null
  username: string | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  username: null,
  isLoggedIn: false,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUsername = localStorage.getItem('auth_username')
    if (savedToken && savedUsername) {
      fetch(`${BASE_URL}/api/v1/auth/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 200) {
            setToken(savedToken)
            setUsername(savedUsername)
          } else {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_username')
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_username')
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (user: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password }),
      })
      const data = await res.json()
      if (data.status === 200) {
        const { token: newToken, username: newUsername } = data.data
        localStorage.setItem('auth_token', newToken)
        localStorage.setItem('auth_username', newUsername)
        setToken(newToken)
        setUsername(newUsername)
        message.success('登录成功')
        return true
      } else {
        message.error(data.message || '登录失败')
        return false
      }
    } catch {
      message.error('网络错误，请稍后重试')
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch(`${BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      // ignore
    }
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_username')
    setToken(null)
    setUsername(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        isLoggedIn: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
