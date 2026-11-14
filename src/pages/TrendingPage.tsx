import { CloudOff, TrendingUp } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { PromptCard, PromptGridSkeleton } from '@/components/prompt/PromptCard'
import { EmptyState, Page, PageHeader } from '@/components/ui/misc'
import type { TrendWindow } from '@/lib/api/types'
import { TREND_WINDOWS } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { useTrending } from '@/lib/hooks/queries'

export default function TrendingPage() {
  const [params, setParams] = useSearchParams()
  const window = (TREND_WINDOWS.find((w) => w.id === params.get('window'))?.id ?? 'week') as TrendWindow
  const { data, isPending, isError } = useTrending(window)

  return (
    <Page>
      <title>Trending · Underrated Prompts</title>
      <PageHeader
        icon={TrendingUp}
        title="Trending"
        description="The prompts people are liking and copying the most right now."
        actions={
          <div role="tablist" aria-label="Time window" className="flex rounded-full border border-line bg-card p-1">
            {TREND_WINDOWS.map((w) => (
              <button
                key={w.id}
                type="button"
                role="tab"
                aria-selected={w.id === window}
                onClick={() => setParams(w.id === 'week' ? {} : { window: w.id }, { replace: true })}
                className={cn(
                  'h-8 rounded-full px-3.5 text-[13px] font-medium transition-colors',
                  w.id === window ? 'bg-fg text-ink' : 'text-fg-2 hover:text-fg',
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
        }
      />
      {isPending ? (
        <PromptGridSkeleton count={10} />
      ) : isError ? (
        <EmptyState icon={CloudOff} title="Couldn't load trending prompts">Please try again in a moment.</EmptyState>
      ) : (
        <div key={window} className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-x-[11px] gap-y-[15px]">
          {data.map((prompt, i) => (
            <PromptCard key={prompt.id} prompt={prompt} rank={prompt.rank} index={i} />
          ))}
        </div>
      )}
    </Page>
  )
}
