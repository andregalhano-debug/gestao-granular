import { useState } from 'react'
import { seedTasks, seedClients, seedMeetings, seedPriorities } from '../data/seed'
import type { Task, Client, Meeting, Priority } from '../types'

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch { return initial }
  })
  const set = (v: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }
  return [value, set] as const
}

export function useTasks() {
  return useLocalStorage<Task[]>('gg_tasks', seedTasks)
}
export function useClients() {
  return useLocalStorage<Client[]>('gg_clients', seedClients)
}
export function useMeetings() {
  return useLocalStorage<Meeting[]>('gg_meetings', seedMeetings)
}
export function usePriorities() {
  return useLocalStorage<Priority[]>('gg_priorities', seedPriorities)
}
