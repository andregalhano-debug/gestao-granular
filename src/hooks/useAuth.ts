import { useState } from 'react'

export interface User {
  email: string
  name: string
  initials: string
  color: string
  role: 'admin' | 'editor' | 'viewer'
}

const USERS: Record<string, { password: string; user: User }> = {
  'andre.galhano@grupogranular.com.br': {
    password: 'granular2026',
    user: { email: 'andre.galhano@grupogranular.com.br', name: 'André', initials: 'A', color: '#1B4332', role: 'admin' }
  },
  'eduardo.lage@grupogranular.com.br': {
    password: 'granular2026',
    user: { email: 'eduardo.lage@grupogranular.com.br', name: 'Eduardo', initials: 'E', color: '#1B4332', role: 'admin' }
  },
  'gabriel.rocha@grupogranular.com.br': {
    password: 'granular2026',
    user: { email: 'gabriel.rocha@grupogranular.com.br', name: 'Gabriel', initials: 'G', color: '#1B4332', role: 'admin' }
  },
  'daniela.neves@grupogranular.com.br': {
    password: 'granular2026',
    user: { email: 'daniela.neves@grupogranular.com.br', name: 'Daniela', initials: 'D', color: '#1B4332', role: 'editor' }
  },
}

export const ALL_USERS = Object.values(USERS).map(e => e.user)

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
    window.location.replace('/login')
  }

  return { user, signIn, signOut }
}
