import { useState } from 'react'
import { seedTasks, seedClients, seedMeetings, seedPriorities } from '../data/seed'
import type { Task, Client, Meeting, Priority, ChangeLog } from '../types'

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
export function useDeletedPriorities() {
  return useLocalStorage<Priority[]>('gg_deleted_priorities', [])
}
export function useDeletedTasks() {
  return useLocalStorage<Task[]>('gg_deleted_tasks', [])
}
export function useDeletedClients() {
  return useLocalStorage<Client[]>('gg_deleted_clients', [])
}
export function useChangeLog() {
  return useLocalStorage<ChangeLog[]>('gg_changelog', [])
}

export function appendLog(
  _log: ChangeLog[],
  setLog: (v: ChangeLog[] | ((p: ChangeLog[]) => ChangeLog[])) => void,
  user: string,
  action: string,
  entity: string,
  detail: string
) {
  const entry: ChangeLog = {
    id: Date.now().toString(),
    user,
    action,
    entity,
    detail,
    timestamp: new Date().toISOString(),
  }
  setLog(prev => [entry, ...prev].slice(0, 200))
  return entry
}
