const KEY = 'up:reloaded-at'

/**
 * After a deploy, a tab that was already open may request a JS chunk that no longer exists.
 * Reload once to pick up the new build, but never loop.
 */
export function reloadOnce(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(KEY) ?? 0)
    if (Date.now() - last < 15_000) return false
    window.sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* storage unavailable: reload anyway */
  }
  window.location.reload()
  return true
}

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    message,
  )
}
