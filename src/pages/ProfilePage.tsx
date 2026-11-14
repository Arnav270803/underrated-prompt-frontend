import { Inbox, LogOut, Pencil, Plus, ShieldCheck, Trash } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '@/auth/AuthProvider'
import { ProfileForm } from '@/components/auth/ProfileForm'
import { SignInPanel } from '@/components/auth/SignInPanel'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { MiniThumb, StatusBadge } from '@/components/prompt/bits'
import { PromptGrid } from '@/components/prompt/PromptCard'
import { Button, buttonClass } from '@/components/ui/Button'
import { EmptyState, Page, Skeleton } from '@/components/ui/misc'
import { useToast } from '@/components/ui/Toast'
import type { Submission } from '@/lib/api/types'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import { useDeleteSubmission } from '@/lib/hooks/mutations'
import { useMe, useMySubmissions } from '@/lib/hooks/queries'
import { promptPath } from '@/lib/prompt-utils'

type Tab = 'submissions' | 'published' | 'edit'
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'submissions', label: 'Submissions' },
  { id: 'published', label: 'Published' },
  { id: 'edit', label: 'Edit profile' },
]

export default function ProfilePage() {
  const { session, signOut } = useAuth()
  const me = useMe()
  const submissions = useMySubmissions()
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'submissions') as Tab

  if (!session) return <SignInPanel />

  if (me.isPending)
    return (
      <div className="space-y-4 px-1 pt-2">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )

  if (!me.data?.profile)
    return (
      <Page className="mx-auto max-w-xl px-1 py-6">
        <title>Create your profile · Underrated Prompts</title>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Set up your profile</h1>
        <p className="mt-2 text-[15px] text-muted">This is how people will see you next to your prompts.</p>
        <div className="mt-8 rounded-2xl border border-line bg-card p-6">
          <ProfileForm />
        </div>
      </Page>
    )

  const profile = me.data.profile
  const list = submissions.data ?? []
  const published = list.filter((s) => s.status === 'published')
  const totals = {
    prompts: published.length,
    likes: published.reduce((sum, p) => sum + p.stats.likes, 0),
    copies: published.reduce((sum, p) => sum + p.stats.copies, 0),
  }

  return (
    <Page className="space-y-6 px-1 pt-2">
      <title>Your profile · Underrated Prompts</title>
      <ProfileHeader
        profile={profile}
        totals={totals}
        actions={
          <>
            {session.isAdmin && (
              <Link to="/admin" className={buttonClass('outline', 'sm')}>
                <ShieldCheck className="size-4" aria-hidden /> Review queue
              </Link>
            )}
            <Link to={`/u/${profile.handle}`} className={buttonClass('outline', 'sm')}>
              Public page
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4" aria-hidden /> Sign out
            </Button>
          </>
        }
      />

      <div role="tablist" aria-label="Profile sections" className="flex gap-1 border-b border-line px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === tab}
            onClick={() => setParams(t.id === 'submissions' ? {} : { tab: t.id }, { replace: true })}
            className={cn(
              '-mb-px border-b-2 px-3 pb-3 pt-1 text-[14px] font-semibold transition-colors',
              t.id === tab ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
            )}
          >
            {t.label}
            {t.id === 'submissions' && list.length > 0 && <span className="ml-1.5 text-muted">{list.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'submissions' &&
        (submissions.isPending ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : list.length ? (
          <SubmissionList submissions={list} />
        ) : (
          <EmptyState
            icon={Inbox}
            title="You haven't shared anything yet"
            action={
              <Link to="/share" className={buttonClass('primary')}>
                <Plus className="size-4" aria-hidden /> Share a prompt
              </Link>
            }
          >
            Every prompt is reviewed before it goes live. You&apos;ll see its status here.
          </EmptyState>
        ))}

      {tab === 'published' &&
        (published.length ? (
          <PromptGrid prompts={published} />
        ) : (
          <EmptyState icon={Inbox} title="Nothing published yet">
            Once a prompt is approved, it shows up here and on your public page.
          </EmptyState>
        ))}

      {tab === 'edit' && (
        <div className="max-w-xl rounded-2xl border border-line bg-card p-6">
          <ProfileForm existing={profile} onDone={() => setParams({}, { replace: true })} />
        </div>
      )}
    </Page>
  )
}

function SubmissionList({ submissions }: { submissions: Submission[] }) {
  const remove = useDeleteSubmission()
  const toast = useToast()

  return (
    <ul className="space-y-3">
      {submissions.map((s) => (
        <li key={s.id} className="flex gap-4 rounded-2xl border border-line bg-card p-3 sm:p-4">
          <MiniThumb prompt={s} className="w-[96px] sm:w-[132px]" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={s.status} />
              <span className="text-[12.5px] text-muted">Updated {timeAgo(s.updatedAt)}</span>
            </div>
            <p className="mt-1.5 truncate text-[15px] font-semibold">{s.title}</p>
            <p className="truncate text-[13.5px] text-muted">{s.whatItDoes}</p>
            {s.status === 'rejected' && s.rejectReason && (
              <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-[#fca5a5]">Reason: {s.rejectReason}</p>
            )}
            {s.status === 'pending' && <p className="mt-2 text-[13px] text-muted">Most reviews happen within a day.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {s.status === 'published' && (
                <Link to={promptPath(s)} className={buttonClass('secondary', 'sm')}>
                  View
                </Link>
              )}
              {(s.status === 'rejected' || s.status === 'pending') && (
                <Link to={`/share/${s.id}`} className={buttonClass('secondary', 'sm')}>
                  <Pencil className="size-3.5" aria-hidden /> {s.status === 'rejected' ? 'Edit & resubmit' : 'Edit'}
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                loading={remove.isPending && remove.variables === s.id}
                onClick={() => {
                  const verb = s.status === 'published' ? 'Delete' : 'Withdraw'
                  if (!window.confirm(`${verb} “${s.title}”? This can't be undone.`)) return
                  remove.mutate(s.id, { onSuccess: () => toast({ title: `${verb === 'Delete' ? 'Deleted' : 'Withdrawn'}`, tone: 'info' }) })
                }}
              >
                <Trash className="size-3.5" aria-hidden /> {s.status === 'published' ? 'Delete' : 'Withdraw'}
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
