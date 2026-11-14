import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from './api'
import { qk } from './hooks/keys'
import { getVisitorId } from './visitor'

/**
 * Visitors / Live counters (ARCHITECTURE.md §4.6).
 *  - The first heartbeat goes out once the tab has been visible for ~3 s (skips bounces and prerendering).
 *  - Then one every 60 s while the tab stays visible; hidden tabs send nothing.
 *  - Prompt pages viewed since the last beat ride along, so views cost no extra requests.
 */
const FIRST_BEAT_DELAY = 3_000
const BEAT_INTERVAL = 60_000

let lastBeatAt = 0
let inFlight: Promise<void> | null = null
const pendingViews = new Set<string>()

export function sendHeartbeat(queryClient: QueryClient): Promise<void> {
  if (inFlight) return inFlight
  const viewed = [...pendingViews]
  pendingViews.clear()
  inFlight = api
    .heartbeat({ visitorId: getVisitorId(), viewedPromptIds: viewed })
    .then((stats) => {
      lastBeatAt = Date.now()
      queryClient.setQueryData(qk.siteStats, stats)
    })
    .catch(() => {
      viewed.forEach((id) => pendingViews.add(id)) // try again on the next beat
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

/** Likes are only accepted from browsers the server has already seen, so register first if needed. */
export function ensurePresence(queryClient: QueryClient): Promise<void> {
  return lastBeatAt ? Promise.resolve() : sendHeartbeat(queryClient)
}

export function recordView(promptId: string): void {
  pendingViews.add(promptId)
}

export function usePresence(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (navigator.webdriver) return // automated browsers aren't visitors
    let firstTimer: number | undefined
    let interval: number | undefined

    const stop = () => {
      window.clearTimeout(firstTimer)
      window.clearInterval(interval)
    }
    const beatAndRepeat = () => {
      void sendHeartbeat(queryClient)
      interval = window.setInterval(() => void sendHeartbeat(queryClient), BEAT_INTERVAL)
    }
    const start = () => {
      stop()
      if (lastBeatAt === 0) firstTimer = window.setTimeout(beatAndRepeat, FIRST_BEAT_DELAY)
      else beatAndRepeat()
    }
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop())
    // Leaving the page: flush any views that haven't been sent yet.
    const onPageHide = () => {
      if (pendingViews.size) void sendHeartbeat(queryClient)
    }

    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [queryClient])
}
