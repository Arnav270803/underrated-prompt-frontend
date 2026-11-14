import { Check, CircleCheck, Inbox, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/auth/AuthProvider'
import { SignInPanel } from '@/components/auth/SignInPanel'
import { HighlightedPrompt, ToolChip, TypeBadge } from '@/components/prompt/bits'
import { PromptCard } from '@/components/prompt/PromptCard'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/Field'
import { EmptyState, Page, PageHeader, Skeleton } from '@/components/ui/misc'
import { useToast } from '@/components/ui/Toast'
import type { QueueItem } from '@/lib/api/types'
import { REJECT_REASONS } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import { useModerate } from '@/lib/hooks/mutations'
import { useAdminQueue } from '@/lib/hooks/queries'
import { promptPath } from '@/lib/prompt-utils'

export default function AdminPage() {
  const { session } = useAuth()
  const queue = useAdminQueue(Boolean(session?.isAdmin))
  const [selected, setSelected] = useState(0)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const moderate = useModerate()
  const toast = useToast()
  const items = queue.data ?? []

  const approve = (item: QueueItem) =>
    moderate.mutate(
      { id: item.submission.id, action: 'approve' },
      { onSuccess: () => toast({ title: 'Published', description: `“${item.submission.title}” is live in the feeds.` }) },
    )

  // Keyboard review: J/K to move, A to approve, R to reject.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || rejecting || moderate.isPending) return
      const item = items[selected]
      if (event.key === 'j') setSelected((i) => Math.min(items.length - 1, i + 1))
      else if (event.key === 'k') setSelected((i) => Math.max(0, i - 1))
      else if (event.key === 'a' && item) approve(item)
      else if (event.key === 'r' && item) setRejecting(item.submission.id)
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (selected > items.length - 1) setSelected(Math.max(0, items.length - 1))
  }, [items.length, selected])

  if (!session) return <SignInPanel title="Admins only" reason="Sign in with the admin account to review submissions." />
  if (!session.isAdmin)
    return <EmptyState icon={ShieldCheck} title="Admins only">This page is for reviewing submissions.</EmptyState>

  return (
    <Page className="px-1">
      <title>Review queue · Underrated Prompts</title>
      <PageHeader
        icon={ShieldCheck}
        title="Review queue"
        description={
          <>
            Oldest first. Shortcuts: <Kbd>J</Kbd>/<Kbd>K</Kbd> move, <Kbd>A</Kbd> approve, <Kbd>R</Kbd> reject.
          </>
        }
      />

      {queue.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Inbox} title="Nothing to review">
          New submissions show up here. In the demo, share a prompt and it will appear.
        </EmptyState>
      ) : (
        <ol className="space-y-4">
          {items.map((item, i) => (
            <QueueCard
              key={item.submission.id}
              item={item}
              active={i === selected}
              onFocus={() => setSelected(i)}
              onApprove={() => approve(item)}
              busy={moderate.isPending && moderate.variables?.id === item.submission.id}
              rejecting={rejecting === item.submission.id}
              onStartReject={() => setRejecting(item.submission.id)}
              onCancelReject={() => setRejecting(null)}
              onReject={(reason) =>
                moderate.mutate(
                  { id: item.submission.id, action: 'reject', reason },
                  {
                    onSuccess: () => {
                      setRejecting(null)
                      toast({ title: 'Rejected', description: 'The creator will see your reason and can resubmit.', tone: 'info' })
                    },
                  },
                )
              }
            />
          ))}
        </ol>
      )}
    </Page>
  )
}

function Kbd({ children }: { children: string }) {
  return <kbd className="mx-0.5 rounded border border-line-2 bg-card px-1.5 py-px font-mono text-[12px] text-fg-2">{children}</kbd>
}

interface QueueCardProps {
  item: QueueItem
  active: boolean
  busy: boolean
  rejecting: boolean
  onFocus: () => void
  onApprove: () => void
  onStartReject: () => void
  onCancelReject: () => void
  onReject: (reason: string) => void
}

function QueueCard({ item, active, busy, rejecting, onFocus, onApprove, onStartReject, onCancelReject, onReject }: QueueCardProps) {
  const { submission: s, similar } = item
  const [reason, setReason] = useState(REJECT_REASONS[0] ?? '')
  const [note, setNote] = useState('')
  // Weak overlaps (shared everyday words) are noise; only flag real look-alikes.
  const matches = similar.filter((m) => m.similarity >= 0.3)
  const top = matches[0]

  return (
    <li
      onClick={onFocus}
      className={cn('rounded-2xl border bg-card p-4 transition-colors sm:p-5', active ? 'border-accent/50 ring-1 ring-accent/30' : 'border-line')}
    >
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="w-full shrink-0 md:w-[277px]">
          <PromptCard prompt={s} inert />
          <p className="mt-2 text-[12.5px] text-muted">
            by @{s.author.handle} · submitted {timeAgo(s.createdAt)}
          </p>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={s.type} />
            {s.tools.map((t) => (
              <ToolChip key={t} tool={t} />
            ))}
            {s.tags.map((t) => (
              <span key={t} className="text-[12.5px] text-muted">#{t}</span>
            ))}
          </div>
          <div>
            <p className="text-[17px] font-semibold">{s.title}</p>
            <p className="mt-1 text-[14px] text-fg-2">{s.whatItDoes}</p>
          </div>
          <div className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-inset px-4 py-3 font-mono text-[13px] leading-relaxed text-fg-2">
            <HighlightedPrompt body={s.body} />
          </div>
          {(s.tips || s.settings) && (
            <p className="text-[13px] text-muted">
              {s.tips && <>Tips: {s.tips} </>}
              {s.settings && <span className="font-mono">{s.settings}</span>}
            </p>
          )}

          <div className={cn('rounded-xl px-4 py-3 text-[13.5px]', !top ? 'bg-success/10 text-success' : top.similarity > 0.6 ? 'bg-danger/10 text-[#fca5a5]' : 'bg-warning/10 text-warning')}>
            {!top ? (
              <span className="inline-flex items-center gap-2">
                <CircleCheck className="size-4" aria-hidden /> Originality check: looks original
                {similar[0] && ` (closest match is ${Math.round(similar[0].similarity * 100)}% similar)`}.
              </span>
            ) : (
              <>
                <p className="font-semibold">Originality check: similar prompts found</p>
                <ul className="mt-1.5 space-y-1">
                  {matches.map((m) => (
                    <li key={m.prompt.id}>
                      {Math.round(m.similarity * 100)}% similar to{' '}
                      <Link to={promptPath(m.prompt)} target="_blank" className="font-semibold underline underline-offset-2">
                        {m.prompt.title}
                      </Link>{' '}
                      by @{m.prompt.author.handle}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {rejecting ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                onReject(note.trim() ? `${reason}. ${note.trim()}` : reason)
              }}
              className="space-y-3 rounded-xl border border-line-2 p-4"
            >
              <p className="text-[14px] font-semibold">Why isn&apos;t it approved? The creator will see this.</p>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={cn(inputClass, 'h-10')} autoFocus>
                {REJECT_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} placeholder="Add a note (optional)" className={cn(inputClass, 'h-10')} />
              <div className="flex gap-2">
                <Button type="submit" variant="danger" loading={busy}>
                  Reject
                </Button>
                <Button variant="ghost" onClick={onCancelReject}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={onApprove} loading={busy}>
                <Check className="size-4" aria-hidden /> Approve
              </Button>
              <Button variant="outline" onClick={onStartReject} disabled={busy}>
                <X className="size-4" aria-hidden /> Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
