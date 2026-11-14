import { useQueryClient } from '@tanstack/react-query'
import { m } from 'motion/react'
import { Link, useNavigate } from 'react-router'
import type { Prompt } from '@/lib/api/types'
import { TYPE_BY_ID } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { qk } from '@/lib/hooks/keys'
import { getPreview, promptPath } from '@/lib/prompt-utils'
import { BookmarkButton, CopyPromptButton } from './actions'
import { BeforeAfter, ChecklistView, CodeView, TextView } from './previews'

const preloadPromptPage = () => import('@/pages/PromptPage')

export function CardMedia({ prompt, onActivate }: { prompt: Prompt; onActivate?: () => void }) {
  const preview = getPreview(prompt)
  switch (preview.kind) {
    case 'image':
      return (
        <img
          src={preview.image.url}
          alt={preview.image.alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
        />
      )
    case 'beforeAfter':
      return <BeforeAfter before={preview.before} after={preview.after} onActivate={onActivate} />
    case 'code':
      return <CodeView code={preview.code} lang={preview.lang} filename={preview.filename} />
    case 'checklist':
      return <ChecklistView heading={preview.heading} items={preview.items} />
    case 'text':
      return <TextView heading={preview.heading} text={preview.text} />
  }
}

interface PromptCardProps {
  prompt: Prompt
  rank?: number
  /** Live preview in the share form: nothing is clickable. */
  inert?: boolean
  index?: number
}

export function PromptCard({ prompt, rank, inert = false, index = 0 }: PromptCardProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const path = promptPath(prompt)
  const interactiveMedia = getPreview(prompt).kind === 'beforeAfter'

  // The feed already has the full prompt, so opening it is instant.
  const warm = () => {
    if (inert) return
    queryClient.setQueryData(qk.prompt(prompt.id), (prev: Prompt | undefined) => prev ?? prompt)
    void preloadPromptPage()
  }

  return (
    <m.article
      initial={inert ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: Math.min(index, 14) * 0.028 }}
      onPointerEnter={warm}
      onFocus={warm}
      className="group relative flex flex-col overflow-hidden rounded-[10px] border border-line bg-card transition-colors duration-200 hover:border-[#2c2d31] has-[a.card-link:focus-visible]:ring-2 has-[a.card-link:focus-visible]:ring-accent"
    >
      <div className={cn('relative aspect-[11/8] overflow-hidden bg-card-2', interactiveMedia && !inert && 'z-10')}>
        <CardMedia prompt={prompt} onActivate={inert ? undefined : () => navigate(path)} />
        {rank !== undefined && (
          <span
            className={cn(
              'pointer-events-none absolute left-2.5 top-2.5 rounded-md bg-black/65 px-2 py-0.5 text-[12.5px] font-bold tabular-nums backdrop-blur-sm',
              rank <= 3 ? 'text-accent' : 'text-white',
            )}
          >
            #{rank}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-[9px] px-[14px] pb-[9px] pt-[11px]">
        <h3 className="truncate text-[15px] font-semibold leading-[21px] text-fg">
          {inert ? (
            prompt.title || 'Your prompt title'
          ) : (
            <Link to={path} className="card-link outline-none after:absolute after:inset-0 after:content-['']" title={prompt.title}>
              {prompt.title}
            </Link>
          )}
        </h3>
        <div className="flex items-center justify-between gap-2">
          {inert ? (
            <span className="truncate text-[12.5px] text-muted">@{prompt.author.handle}</span>
          ) : (
            <Link to={`/u/${prompt.author.handle}`} className="relative z-10 truncate text-[12.5px] text-muted transition-colors hover:text-fg">
              @{prompt.author.handle}
            </Link>
          )}
          <div className="relative z-10 flex shrink-0 items-center gap-[10px]">
            <CopyPromptButton prompt={prompt} disabled={inert} />
            <BookmarkButton prompt={prompt} disabled={inert} />
          </div>
        </div>
      </div>
      <span className="sr-only">{TYPE_BY_ID[prompt.type].long}</span>
    </m.article>
  )
}

export function PromptGrid({ prompts, ranked = false, className }: { prompts: Prompt[]; ranked?: boolean; className?: string }) {
  return (
    <div className={cn('grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-x-[11px] gap-y-[15px]', className)}>
      {prompts.map((prompt, i) => (
        <PromptCard key={prompt.id} prompt={prompt} index={i} rank={ranked ? i + 1 : undefined} />
      ))}
    </div>
  )
}

export function PromptGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-x-[11px] gap-y-[15px]" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-[10px] border border-line bg-card">
          <div className="aspect-[11/8] animate-pulse bg-white/[0.04]" />
          <div className="space-y-3 px-[14px] py-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 animate-pulse rounded bg-white/[0.05]" />
              <div className="h-[29px] w-[108px] animate-pulse rounded-full bg-white/[0.05]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
