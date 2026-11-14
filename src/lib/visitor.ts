const KEY = 'up:vid'
let memoryId: string | null = null

/**
 * The browser's anonymous visitor ID: a random UUID created on the first visit and kept in
 * localStorage. It powers the Visitors/Live counters, view counts, copy counts and likes.
 * It is not linked to the account, and no IP address or cookie is stored with it.
 */
export function getVisitorId(): string {
  try {
    let id = window.localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      window.localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    // Storage blocked (some private windows): count this tab as a visitor for this session only.
    memoryId ??= crypto.randomUUID()
    return memoryId
  }
}
