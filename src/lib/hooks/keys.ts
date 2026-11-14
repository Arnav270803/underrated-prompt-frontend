import type { SortKey, TrendWindow, TypeFilter } from '../api/types'

export const qk = {
  feed: (sort: SortKey, type: TypeFilter) => ['feed', sort, type] as const,
  trending: (window: TrendWindow) => ['trending', window] as const,
  prompt: (id: string) => ['prompt', id] as const,
  related: (id: string) => ['related', id] as const,
  searchIndex: ['search-index'] as const,
  searchEngine: ['search-engine'] as const,
  siteStats: ['site-stats'] as const,
  creator: (handle: string) => ['creator', handle] as const,
  me: (userId: string | undefined) => ['me', userId] as const,
  mySubmissions: (userId: string | undefined) => ['my-submissions', userId] as const,
  queue: ['admin-queue'] as const,
}

/** Everything that shows published prompts; refreshed after an approval or removal. */
export const PUBLIC_DATA_KEYS = [['feed'], ['trending'], ['related'], ['search-index'], ['search-engine'], ['creator']]
