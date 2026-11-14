import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api } from '../api'
import type { Prompt, TypeFilter } from '../api/types'
import { TYPE_BY_ID } from '../catalog'
import { qk } from './keys'

const FIELDS = ['title', 'whatItDoes', 'tags', 'tools', 'handle', 'displayName', 'typeLabel', 'body', 'sampleOutput']

function fieldValue(prompt: Prompt, field: string): string {
  switch (field) {
    case 'tags':
      return prompt.tags.join(' ')
    case 'tools':
      return prompt.tools.join(' ')
    case 'handle':
      return prompt.author.handle
    case 'displayName':
      return prompt.author.displayName
    case 'typeLabel':
      return `${TYPE_BY_ID[prompt.type].label} ${TYPE_BY_ID[prompt.type].long}`
    case 'title':
      return prompt.title
    case 'whatItDoes':
      return prompt.whatItDoes
    case 'body':
      return prompt.body
    case 'sampleOutput':
      return prompt.sampleOutput ?? ''
    default:
      return ''
  }
}

/** Full-text search runs in the browser over the search index (ARCHITECTURE.md): no search server. */
function useSearchEngine(enabled: boolean) {
  return useQuery({
    queryKey: qk.searchEngine,
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [{ default: MiniSearch }, index] = await Promise.all([import('minisearch'), api.getSearchIndex()])
      const engine = new MiniSearch<Prompt>({
        fields: FIELDS,
        storeFields: ['id'],
        extractField: (doc, field) => (field === 'id' ? doc.id : fieldValue(doc, field)),
        searchOptions: {
          boost: { title: 3, tags: 2, handle: 2, whatItDoes: 1.5, typeLabel: 1.5 },
          prefix: true,
          fuzzy: 0.2,
          combineWith: 'AND',
        },
      })
      engine.addAll(index.items)
      return { engine, byId: new Map(index.items.map((p) => [p.id, p])) }
    },
  })
}

export function useSearch(query: string, type: TypeFilter) {
  const q = query.trim()
  const { data, isPending, isError } = useSearchEngine(q.length > 0)
  const results = useMemo(() => {
    if (!data || !q) return []
    return data.engine
      .search(q)
      .map((hit) => data.byId.get(String(hit.id)))
      .filter((p): p is Prompt => Boolean(p) && (type === 'all' || p?.type === type))
  }, [data, q, type])
  return { results, isPending: q.length > 0 && isPending, isError }
}
