import { ArrowLeft, ArrowUpRight, Copy, Eye, Flag, Lightbulb, Link2, Play, SearchX, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BookmarkButton, CopyPromptButton, LikeButton } from '@/components/prompt/actions'
import { HighlightedPrompt, ToolChip, TypeBadge } from '@/components/prompt/bits'
import { PromptGrid } from '@/components/prompt/PromptCard'
import { BeforeAfter, ChecklistView, CodeView, TextView } from '@/components/prompt/previews'
import { Button, buttonClass } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { inputClass } from '@/components/ui/Field'
import { Avatar, EmptyState, Page, Skeleton } from '@/components/ui/misc'
import { useToast } from '@/components/ui/Toast'
import type { Prompt } from '@/lib/api/types'
import { OPEN_IN, REPORT_REASONS } from '@/lib/catalog'
import { copyText } from '@/lib/clipboard'
import { cn } from '@/lib/cn'
import { formatCompact, formatDate, timeAgo } from '@/lib/format'
import { useReport } from '@/lib/hooks/mutations'
import { usePrompt, useRelated } from '@/lib/hooks/queries'
import { recordView } from '@/lib/presence'
import { fillVariables, getPreview, idFromSlugParam, parseSampleOutput, previewShowsSample, promptPath } from '@/lib/prompt-utils'

export default function PromptPage() {
  const { slug = '' } = useParams()
  const id = idFromSlugParam(slug)
  const { data: prompt, isPending, isError } = usePrompt(id)
  const navigate = useNavigate()

  useEffect(() => {
    if (!prompt) return
    recordView(prompt.id)
    // Old links keep working if the title changed; show the current URL.
    const canonical = promptPath(prompt)
    if (`/p/${slug}` !== canonical) navigate(canonical, { replace: true })
  }, [prompt, slug, navigate])

  if (isPending) return <PromptPageSkeleton />
  if (isError || !prompt)
    return (
      <EmptyState
        icon={SearchX}
        title="This prompt isn't here"
        action={
          <Link to="/" className={buttonClass('secondary')}>
            Browse prompts
          </Link>
        }
      >
        It may have been removed, or the link is mistyped.
      </EmptyState>
    )

  return <PromptDetail prompt={prompt} />
}

function PromptDetail({ prompt }: { prompt: Prompt }) {
  const showSampleSection = Boolean(prompt.sampleOutput?.trim()) && !previewShowsSample(prompt)

  return (
    <Page className="mx-auto max-w-[1260px] px-1 pb-6 lg:px-3">
      <title>{`${prompt.title} · Underrated Prompts`}</title>
      <meta name="description" content={prompt.whatItDoes} />

      <BackLink />

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] xl:gap-12">
        <section aria-label="Example result" className="lg:sticky lg:top-[84px] lg:self-start">
          <DetailMedia prompt={prompt} />
          {prompt.videoUrl && (
            <a href={prompt.videoUrl} target="_blank" rel="noopener noreferrer nofollow ugc" className={buttonClass('outline', 'md', 'mt-3 w-full')}>
              <Play className="size-4" aria-hidden /> Watch the result
            </a>
          )}
        </section>

        <section aria-label="Prompt details" className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={prompt.type} />
            {prompt.tools.map((tool) => (
              <ToolChip key={tool} tool={tool} />
            ))}
          </div>
          <h1 className="mt-4 text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[34px]">{prompt.title}</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-fg-2">{prompt.whatItDoes}</p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <Link to={`/u/${prompt.author.handle}`} className="group flex items-center gap-3">
              <Avatar handle={prompt.author.handle} name={prompt.author.displayName} size={40} />
              <span>
                <span className="block text-[14.5px] font-semibold text-fg group-hover:underline">{prompt.author.displayName}</span>
                <span className="block text-[13px] text-muted">
                  @{prompt.author.handle} · <time dateTime={prompt.publishedAt} title={formatDate(prompt.publishedAt)}>{timeAgo(prompt.publishedAt)}</time>
                </span>
              </span>
            </Link>
            <dl className="flex items-center gap-4 text-[13px] text-muted">
              <div className="flex items-center gap-1.5" title="Times copied">
                <dt><Copy className="size-4" aria-label="Copies" /></dt>
                <dd className="tabular-nums">{formatCompact(prompt.stats.copies)}</dd>
              </div>
              <div className="flex items-center gap-1.5" title="Views">
                <dt><Eye className="size-4" aria-label="Views" /></dt>
                <dd className="tabular-nums">{formatCompact(prompt.stats.views)}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <LikeButton prompt={prompt} />
            <BookmarkButton prompt={prompt} withLabel />
            <ShareLinkButton prompt={prompt} />
            <ReportButton prompt={prompt} />
          </div>

          <PromptBox prompt={prompt} />

          {showSampleSection && prompt.sampleOutput && (
            <InfoSection title="Sample output">
              <SampleOutputBlock sample={prompt.sampleOutput} />
            </InfoSection>
          )}

          {prompt.tips && (
            <InfoSection title="Tips" icon={Lightbulb}>
              <p className="text-[14.5px] leading-relaxed text-fg-2">{prompt.tips}</p>
            </InfoSection>
          )}

          {prompt.settings && (
            <InfoSection title="Settings used" icon={SlidersHorizontal}>
              <code className="inline-block rounded-lg border border-line-2 bg-inset px-3 py-2 font-mono text-[13px] text-fg-2">{prompt.settings}</code>
            </InfoSection>
          )}

          {prompt.tags.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-2">
              {prompt.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/?q=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-white/[0.05] px-3 py-1 text-[13px] text-fg-2 transition-colors hover:bg-white/[0.09] hover:text-fg"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <Related id={prompt.id} />
    </Page>
  )
}

function BackLink() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
      className="mt-1 inline-flex items-center gap-2 rounded-lg px-1 py-1 text-[14px] font-medium text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Back to prompts
    </button>
  )
}

function DetailMedia({ prompt }: { prompt: Prompt }) {
  const [selected, setSelected] = useState(0)
  const preview = getPreview(prompt)
  const gallery = prompt.images.filter((image) => image.role === 'result')
  const frame = 'overflow-hidden rounded-2xl border border-line bg-card-2'

  if (preview.kind === 'beforeAfter') {
    const ratio = preview.after.width / preview.after.height
    return (
      <div className={frame} style={{ aspectRatio: String(ratio) }}>
        <BeforeAfter before={preview.before} after={preview.after} size="page" />
      </div>
    )
  }

  if (preview.kind === 'image') {
    const current = gallery[selected] ?? preview.image
    return (
      <div>
        <div className={cn(frame, 'grid place-items-center bg-black/40')}>
          <img
            src={current.url}
            alt={current.alt}
            className="max-h-[72vh] w-full object-contain"
            style={{ aspectRatio: `${current.width} / ${current.height}` }}
          />
        </div>
        {gallery.length > 1 && (
          <div className="mt-3 flex gap-2">
            {gallery.map((image, i) => (
              <button
                key={image.url}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`Show image ${i + 1}`}
                aria-pressed={i === selected}
                className={cn('h-16 w-20 overflow-hidden rounded-lg border-2 transition-colors', i === selected ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100')}
              >
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(frame, 'min-h-[320px]')}>
      {preview.kind === 'code' ? (
        <CodeView code={preview.code} lang={preview.lang} filename={preview.filename} size="page" />
      ) : preview.kind === 'checklist' ? (
        <ChecklistView heading={preview.heading} items={preview.items} size="page" />
      ) : (
        <TextView heading={preview.heading ?? (prompt.sampleOutput ? null : 'The prompt')} text={preview.text} size="page" />
      )}
    </div>
  )
}

function SampleOutputBlock({ sample }: { sample: string }) {
  const view = parseSampleOutput(sample)
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card-2">
      {view.kind === 'code' ? (
        <CodeView code={view.code} lang={view.lang} filename={view.filename} size="page" />
      ) : view.kind === 'checklist' ? (
        <ChecklistView heading={view.heading} items={view.items} size="page" />
      ) : (
        <TextView heading={view.heading} text={view.text} size="page" />
      )}
    </div>
  )
}

function PromptBox({ prompt }: { prompt: Prompt }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const filled = useMemo(() => fillVariables(prompt.body, values), [prompt.body, values])
  const openIn = OPEN_IN.filter((target) => target.matches.some((tool) => prompt.tools.includes(tool)))
  const hasValues = Object.values(values).some((v) => v.trim())

  return (
    <div className="mt-7 overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="text-[14px] font-semibold text-fg">The prompt</h2>
        <span className="text-[12.5px] tabular-nums text-faint">{prompt.body.length.toLocaleString()} characters</span>
      </div>

      {prompt.variables.length > 0 && (
        <div className="border-b border-line bg-white/[0.015] px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-fg-2">Fill in the blanks</p>
            {hasValues && (
              <button type="button" onClick={() => setValues({})} className="text-[12.5px] font-medium text-muted hover:text-fg">
                Clear
              </button>
            )}
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {prompt.variables.map((name) => (
              <label key={name} className="block">
                <span className="mb-1 block text-[12px] font-medium text-muted">{name}</span>
                <input
                  value={values[name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                  className={cn(inputClass, 'h-10 text-[14px]')}
                  placeholder={`Your ${name}`}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-[380px] overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[13.5px] leading-[1.75] text-fg-2">
        <HighlightedPrompt body={prompt.body} values={values} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4">
        <CopyPromptButton prompt={prompt} text={filled} variant="primary" />
        {openIn.map((target) => (
          <a
            key={target.id}
            href={target.url(filled)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass('outline', 'md', 'h-11 rounded-[11px]')}
          >
            Open in {target.label}
            <ArrowUpRight className="size-4 text-muted" aria-hidden />
          </a>
        ))}
      </div>
    </div>
  )
}

function InfoSection({ title, icon: Icon, children }: { title: string; icon?: typeof Lightbulb; children: ReactNode }) {
  return (
    <div className="mt-7">
      <h2 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-fg">
        {Icon && <Icon className="size-4 text-accent" aria-hidden />}
        {title}
      </h2>
      {children}
    </div>
  )
}

function ShareLinkButton({ prompt }: { prompt: Prompt }) {
  const toast = useToast()
  return (
    <button
      type="button"
      onClick={async () => {
        const url = `${window.location.origin}${promptPath(prompt)}`
        if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
          try {
            await navigator.share({ title: prompt.title, text: prompt.whatItDoes, url })
            return
          } catch {
            /* cancelled: fall back to copying */
          }
        }
        if (await copyText(url)) toast({ title: 'Link copied', tone: 'info' })
      }}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[14px] font-semibold text-fg transition-colors hover:bg-white/[0.04]"
    >
      <Link2 className="size-[17px]" aria-hidden />
      Share
    </button>
  )
}

function ReportButton({ prompt }: { prompt: Prompt }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REPORT_REASONS[0] ?? '')
  const [note, setNote] = useState('')
  const report = useReport()
  const toast = useToast()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex h-10 items-center gap-2 rounded-full px-3 text-[13.5px] font-medium text-muted transition-colors hover:bg-white/[0.04] hover:text-fg"
      >
        <Flag className="size-4" aria-hidden />
        Report
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Report this prompt" description="Reports go to the moderator. Thanks for keeping the site useful.">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            report.mutate(
              { promptId: prompt.id, reason, note },
              {
                onSuccess: () => {
                  setOpen(false)
                  setNote('')
                  toast({ title: 'Report sent', description: "We'll take a look.", tone: 'info' })
                },
                onError: () => toast({ title: "Couldn't send the report", tone: 'error' }),
              },
            )
          }}
          className="space-y-4"
        >
          <fieldset className="space-y-2">
            <legend className="sr-only">Reason</legend>
            {REPORT_REASONS.map((option) => (
              <label key={option} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[14px] transition-colors', reason === option ? 'border-accent/60 bg-accent/10' : 'border-line-2 hover:bg-white/[0.03]')}>
                <input type="radio" name="reason" value={option} checked={reason === option} onChange={() => setReason(option)} className="accent-[#f97424]" />
                {option}
              </label>
            ))}
          </fieldset>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Anything else? (optional)"
            className={cn(inputClass, 'resize-none py-3')}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={report.isPending}>
              Send report
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}

function Related({ id }: { id: string }) {
  const { data } = useRelated(id)
  if (!data?.length) return null
  return (
    <section aria-label="Related prompts" className="mt-16">
      <h2 className="mb-4 px-1 text-[20px] font-semibold tracking-[-0.01em]">More like this</h2>
      <PromptGrid prompts={data} />
    </section>
  )
}

function PromptPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1260px] px-1 lg:px-3" aria-busy="true" aria-label="Loading prompt">
      <Skeleton className="mt-2 h-6 w-36" />
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] xl:gap-12">
        <Skeleton className="aspect-[11/8] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-7 w-48 rounded-full" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
