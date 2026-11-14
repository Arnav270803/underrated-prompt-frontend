import type { Prompt, PromptStatus, PromptType } from '@/lib/api/types'
import { TYPE_BY_ID } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { getPreview, splitByVariables } from '@/lib/prompt-utils'

export function TypeBadge({ type, className }: { type: PromptType; className?: string }) {
  const info = TYPE_BY_ID[type]
  const Icon = info.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-[12.5px] font-semibold text-accent', className)}>
      <Icon className="size-3.5" strokeWidth={2.2} aria-hidden />
      {info.long}
    </span>
  )
}

export function ToolChip({ tool }: { tool: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line-2 px-2.5 py-[3px] text-[12.5px] font-medium text-fg-2">
      {tool}
    </span>
  )
}

const STATUS_STYLE: Record<PromptStatus, { label: string; className: string }> = {
  pending: { label: 'Waiting for review', className: 'bg-warning/15 text-warning' },
  published: { label: 'Published', className: 'bg-success/15 text-success' },
  rejected: { label: 'Not approved', className: 'bg-danger/15 text-danger' },
  removed: { label: 'Removed', className: 'bg-white/5 text-muted' },
}

export function StatusBadge({ status }: { status: PromptStatus }) {
  const style = STATUS_STYLE[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[12px] font-semibold', style.className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {style.label}
    </span>
  )
}

/** Prompt text with {{blanks}} highlighted, showing filled-in values where given. */
export function HighlightedPrompt({ body, values = {} }: { body: string; values?: Record<string, string> }) {
  return (
    <>
      {splitByVariables(body).map((part, i) =>
        part.kind === 'text' ? (
          <span key={i}>{part.value}</span>
        ) : (
          <mark
            key={i}
            className={cn(
              'rounded-[5px] px-1 py-px font-semibold',
              values[part.name]?.trim() ? 'bg-success/15 text-success' : 'bg-accent/15 text-accent',
            )}
          >
            {values[part.name]?.trim() || part.raw}
          </mark>
        ),
      )}
    </>
  )
}

/** Small square thumbnail for lists: the example image, or the type icon. */
export function MiniThumb({ prompt, className }: { prompt: Pick<Prompt, 'images' | 'sampleOutput' | 'body' | 'type'>; className?: string }) {
  const preview = getPreview(prompt)
  const image = preview.kind === 'image' ? preview.image : preview.kind === 'beforeAfter' ? preview.after : null
  const Icon = TYPE_BY_ID[prompt.type].icon
  return (
    <div className={cn('grid aspect-[11/8] shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-card-2', className)}>
      {image ? (
        <img src={image.url} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <Icon className="size-6 text-muted" strokeWidth={1.6} aria-hidden />
      )}
    </div>
  )
}
