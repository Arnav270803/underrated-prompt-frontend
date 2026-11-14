import { useInView } from 'motion/react'
import { CloudOff, LoaderCircle, SearchX, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { FilterBar } from '@/components/feed/FilterBar'
import { PromptGrid, PromptGridSkeleton } from '@/components/prompt/PromptCard'
import { buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/misc'
import type { SortKey, TypeFilter } from '@/lib/api/types'
import { PROMPT_TYPES, SORTS, TYPE_BY_ID } from '@/lib/catalog'
import { useFeed } from '@/lib/hooks/queries'
import { useSearch } from '@/lib/hooks/search'

const parseType = (value: string | null): TypeFilter =>
  PROMPT_TYPES.some((t) => t.id === value) ? (value as TypeFilter) : 'all'
const parseSort = (value: string | null): SortKey => (SORTS.some((s) => s.id === value) ? (value as SortKey) : 'trending')

export default function PromptsPage() {
  const [params, setParams] = useSearchParams()
  const type = parseType(params.get('type'))
  const sort = parseSort(params.get('sort'))
  const query = (params.get('q') ?? '').trim()

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const title = query ? `“${query}” · Underrated Prompts` : type !== 'all' ? `${TYPE_BY_ID[type].long} prompts · Underrated Prompts` : 'Underrated Prompts'

  return (
    <>
      <title>{title}</title>
      <h1 className="sr-only">{query ? `Search results for ${query}` : 'Prompts'}</h1>
      <FilterBar
        type={type}
        sort={sort}
        searching={Boolean(query)}
        onType={(t) => update('type', t === 'all' ? null : t)}
        onSort={(s) => update('sort', s === 'trending' ? null : s)}
      />
      {query ? <SearchResults query={query} type={type} /> : <Feed sort={sort} type={type} />}
    </>
  )
}

function Feed({ sort, type }: { sort: SortKey; type: TypeFilter }) {
  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(sort, type)
  const sentinel = useRef<HTMLDivElement>(null)
  const nearEnd = useInView(sentinel, { margin: '0px 0px 600px 0px' })

  useEffect(() => {
    if (nearEnd && hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [nearEnd, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isPending) return <PromptGridSkeleton count={15} />
  if (isError)
    return (
      <EmptyState
        icon={CloudOff}
        title="Couldn't load prompts"
        action={
          <button type="button" className={buttonClass('secondary')} onClick={() => void refetch()}>
            Try again
          </button>
        }
      >
        Check your connection and try again.
      </EmptyState>
    )

  const prompts = data.pages.flatMap((page) => page.items)
  if (prompts.length === 0)
    return (
      <EmptyState
        icon={Sparkles}
        title={`No ${type === 'all' ? '' : TYPE_BY_ID[type].label.toLowerCase() + ' '}prompts yet`}
        action={
          <Link to="/share" className={buttonClass('primary')}>
            Share the first one
          </Link>
        }
      >
        Got a good one? It could be the first thing people see here.
      </EmptyState>
    )

  return (
    <>
      <PromptGrid key={`${sort}-${type}`} prompts={prompts} />
      <div ref={sentinel} className="flex h-16 items-center justify-center text-[13px] text-muted">
        {isFetchingNextPage && <LoaderCircle className="size-5 animate-spin" aria-label="Loading more" />}
        {!hasNextPage && prompts.length > 20 && "You've reached the end. Try another sort or type."}
      </div>
    </>
  )
}

function SearchResults({ query, type }: { query: string; type: TypeFilter }) {
  const { results, isPending, isError } = useSearch(query, type)

  if (isPending) return <PromptGridSkeleton count={10} />
  if (isError) return <EmptyState icon={CloudOff} title="Search isn't available right now">Please try again in a moment.</EmptyState>
  if (results.length === 0)
    return (
      <EmptyState icon={SearchX} title={`Nothing matches “${query}”`}>
        Try fewer words, a tool name like <span className="text-fg-2">Midjourney</span>, or a creator&apos;s handle.
        {type !== 'all' && ' You can also clear the type filter.'}
      </EmptyState>
    )

  return (
    <>
      <p className="px-1 pb-3 text-[13px] text-muted">
        {results.length} {results.length === 1 ? 'prompt' : 'prompts'} for “{query}”
      </p>
      <PromptGrid key={`search-${query}-${type}`} prompts={results} />
    </>
  )
}
