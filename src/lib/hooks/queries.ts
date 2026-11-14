import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthProvider'
import { api } from '../api'
import type { SortKey, TrendWindow, TypeFilter } from '../api/types'
import { qk } from './keys'

export function useFeed(sort: SortKey, type: TypeFilter) {
  return useInfiniteQuery({
    queryKey: qk.feed(sort, type),
    queryFn: ({ pageParam }) => api.getFeed({ sort, type, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  })
}

export function useTrending(window: TrendWindow) {
  return useQuery({ queryKey: qk.trending(window), queryFn: () => api.getTrending(window) })
}

export function usePrompt(id: string) {
  return useQuery({ queryKey: qk.prompt(id), queryFn: () => api.getPrompt(id), enabled: Boolean(id) })
}

export function useRelated(id: string) {
  return useQuery({ queryKey: qk.related(id), queryFn: () => api.getRelated(id), enabled: Boolean(id) })
}

export function useSearchIndex(enabled = true) {
  return useQuery({ queryKey: qk.searchIndex, queryFn: () => api.getSearchIndex(), enabled, staleTime: 5 * 60_000 })
}

export function useSiteStats() {
  return useQuery({ queryKey: qk.siteStats, queryFn: () => api.getSiteStats(), staleTime: 60_000 })
}

export function useCreator(handle: string) {
  return useQuery({ queryKey: qk.creator(handle), queryFn: () => api.getCreator(handle), enabled: Boolean(handle) })
}

export function useMe() {
  const { session } = useAuth()
  return useQuery({ queryKey: qk.me(session?.userId), queryFn: () => api.getMe(), enabled: Boolean(session) })
}

export function useMySubmissions() {
  const { session } = useAuth()
  return useQuery({
    queryKey: qk.mySubmissions(session?.userId),
    queryFn: () => api.getMySubmissions(),
    enabled: Boolean(session),
  })
}

export function useAdminQueue(enabled: boolean) {
  return useQuery({ queryKey: qk.queue, queryFn: () => api.getQueue(), enabled })
}
