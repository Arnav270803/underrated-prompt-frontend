import { useSyncExternalStore } from 'react'

/** localStorage can be missing or throw (private windows, blocked site data), so every access is guarded. */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* nothing to clean up */
  }
}

export interface Store<T> {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

/** A tiny persisted store that keeps every component (and other tabs) in sync. */
export function createStore<T>(key: string, fallback: T): Store<T> {
  let value = readJSON<T>(key, fallback)
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())

  window.addEventListener('storage', (event) => {
    if (event.key === key) {
      value = readJSON<T>(key, fallback)
      emit()
    }
  })

  return {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
      writeJSON(key, value)
      emit()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
