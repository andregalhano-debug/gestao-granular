import { useState } from 'react'

export interface User {
  email: string
  name: string
  initials: string
  color: string
}

const USERS: Record<string, { password: string; user: User }> = {
  'andre@grupogranular.com.br': {
    password: 'granular2026',
    user: { email: 'andre@grupogranular.com.br', name: 'André', initials: 'A', color: '#1B4332' }
  },
  'eduardo@grupogranular.com.br': {
    password: 'granular2026',
    user: { email: 'eduardo@grupogranular.com.br', name: 'Eduardo', initials: 'E', color: '#1B4332' }
  },
  'gabriel@grupogranular.com.br': {
    password: 'granular2026',
    user: { email: 'gabriel@grupogranular.com.br', name: 'Gabriel', initials: 'G', color: '#1B4332' }
  },
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('gg_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const signIn = (email: string, password: string): boolean => {
    const entry = USERS[email.toLowerCase()]
    if (entry && entry.password === password) {
      localStorage.setItem('gg_user', JSON.stringify(entry.user))
      setUser(entry.user)
      return true
    }
    return false
  }

  const signOut = () => {
    localStorage.removeItem('gg_user')
    setUser(null)
  }

  return { user, signIn, signOut }
}
