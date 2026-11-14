import { useCallback } from 'react'
import { createStore, useStore } from '../storage'

/** Saved prompts live in this browser only: no account needed. Newest first. */
const savedStore = createStore<string[]>('up:saved', [])
/** Prompts this browser has liked / copied, so the UI knows without asking the server. */
const likedStore = createStore<string[]>('up:liked', [])
const copiedStore = createStore<string[]>('up:copied', [])

export function useSaved() {
  const ids = useStore(savedStore)
  const isSaved = useCallback((id: string) => ids.includes(id), [ids])
  const toggle = useCallback((id: string) => {
    let nowSaved = false
    savedStore.set((prev) => {
      nowSaved = !prev.includes(id)
      return nowSaved ? [id, ...prev] : prev.filter((x) => x !== id)
    })
    return nowSaved
  }, [])
  return { ids, isSaved, toggle }
}

export function useLiked() {
  const ids = useStore(likedStore)
  const isLiked = useCallback((id: string) => ids.includes(id), [ids])
  return { ids, isLiked }
}

export const likedIds = {
  add: (id: string) => likedStore.set((prev) => (prev.includes(id) ? prev : [...prev, id])),
  remove: (id: string) => likedStore.set((prev) => prev.filter((x) => x !== id)),
}

export const copiedIds = {
  has: (id: string) => copiedStore.get().includes(id),
  add: (id: string) => copiedStore.set((prev) => (prev.includes(id) ? prev : [...prev, id])),
}
