import { Bookmark } from 'lucide-react'
import { Link } from 'react-router'
import { PromptGrid, PromptGridSkeleton } from '@/components/prompt/PromptCard'
import { buttonClass } from '@/components/ui/Button'
import { EmptyState, Page, PageHeader } from '@/components/ui/misc'
import type { Prompt } from '@/lib/api/types'
import { useSaved } from '@/lib/hooks/local'
import { useSearchIndex } from '@/lib/hooks/queries'

export default function SavedPage() {
  const { ids } = useSaved()
  const { data, isPending } = useSearchIndex(ids.length > 0)
  const byId = new Map(data?.items.map((p) => [p.id, p]))
  const prompts = ids.map((id) => byId.get(id)).filter((p): p is Prompt => Boolean(p))

  return (
    <Page>
      <title>Saved · Underrated Prompts</title>
      <PageHeader
        icon={Bookmark}
        title="Saved"
        description="Prompts you bookmarked. They stay in this browser, no account needed."
      />
      {ids.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          action={
            <Link to="/" className={buttonClass('secondary')}>
              Browse prompts
            </Link>
          }
        >
          Tap the bookmark on any prompt to keep it here.
        </EmptyState>
      ) : isPending ? (
        <PromptGridSkeleton count={Math.min(ids.length, 10)} />
      ) : (
        <PromptGrid prompts={prompts} />
      )}
    </Page>
  )
}
