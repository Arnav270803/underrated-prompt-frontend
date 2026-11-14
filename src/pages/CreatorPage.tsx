import { CircleUser, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { PromptGrid, PromptGridSkeleton } from '@/components/prompt/PromptCard'
import { buttonClass } from '@/components/ui/Button'
import { EmptyState, Page, Skeleton } from '@/components/ui/misc'
import { useCreator } from '@/lib/hooks/queries'

export default function CreatorPage() {
  const { handle = '' } = useParams()
  const { data, isPending, isError } = useCreator(handle.toLowerCase())

  if (isPending)
    return (
      <div className="space-y-6 px-1 pt-2">
        <Skeleton className="h-44 rounded-2xl" />
        <PromptGridSkeleton count={5} />
      </div>
    )

  if (isError || !data)
    return (
      <EmptyState
        icon={CircleUser}
        title={`@${handle} isn't here`}
        action={
          <Link to="/" className={buttonClass('secondary')}>
            Browse prompts
          </Link>
        }
      >
        This creator doesn&apos;t exist, or changed their handle.
      </EmptyState>
    )

  return (
    <Page className="space-y-8 px-1 pt-2">
      <title>{`${data.profile.displayName} (@${data.profile.handle}) · Underrated Prompts`}</title>
      <ProfileHeader profile={data.profile} totals={data.totals} />
      <section aria-label="Prompts by this creator">
        <h2 className="mb-4 px-1 text-[18px] font-semibold">Prompts</h2>
        {data.prompts.length ? (
          <PromptGrid prompts={data.prompts} />
        ) : (
          <EmptyState icon={Sparkles} title="No prompts yet" className="py-12">
            Their first prompt will show up here.
          </EmptyState>
        )}
      </section>
    </Page>
  )
}
