import { Bookmark, Check, Copy, Heart } from 'lucide-react'
import { m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import type { Prompt } from '@/lib/api/types'
import { copyText } from '@/lib/clipboard'
import { cn } from '@/lib/cn'
import { formatCompact } from '@/lib/format'
import { useLiked, useSaved } from '@/lib/hooks/local'
import { useRecordCopy, useToggleLike } from '@/lib/hooks/mutations'

/** The card's "Copy prompt" pill, or the big orange button on the prompt page. */
export function CopyPromptButton({
  prompt,
  text,
  variant = 'card',
  disabled,
}: {
  prompt: Prompt
  text?: string
  variant?: 'card' | 'primary'
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const toast = useToast()
  const recordCopy = useRecordCopy()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onClick = async () => {
    const value = text ?? prompt.body
    const ok = await copyText(value)
    if (!ok) {
      toast({ title: "Couldn't copy", description: 'Your browser blocked the clipboard. Select the text and copy it by hand.', tone: 'error' })
      return
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
    const blanksLeft = /\{\{.+?\}\}/.test(value)
    toast({
      title: 'Prompt copied',
      description: blanksLeft ? 'Replace the {{blanks}} before you send it.' : 'Paste it into your favourite AI tool.',
    })
    recordCopy.mutate(prompt)
  }

  const Icon = copied ? Check : Copy
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold transition-[background-color,transform] duration-150 active:scale-[0.96] disabled:pointer-events-none',
        variant === 'card'
          ? 'h-[29px] min-w-[104px] gap-[6px] rounded-full bg-pill px-[11px] text-[11.75px] text-fg hover:bg-[#35363a]'
          : 'h-11 gap-2 rounded-[11px] bg-accent px-5 text-[15px] text-accent-ink hover:bg-accent-2',
      )}
    >
      <Icon className={variant === 'card' ? 'size-[13px]' : 'size-[18px]'} strokeWidth={2.2} aria-hidden />
      {copied ? 'Copied' : 'Copy prompt'}
    </button>
  )
}

export function BookmarkButton({ prompt, withLabel = false, disabled }: { prompt: Prompt; withLabel?: boolean; disabled?: boolean }) {
  const { isSaved, toggle } = useSaved()
  const toast = useToast()
  const saved = isSaved(prompt.id)

  const onClick = () => {
    const nowSaved = toggle(prompt.id)
    if (nowSaved) toast({ title: 'Saved', description: 'Find it under Saved. It stays in this browser.', tone: 'info' })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={saved}
      aria-label={saved ? `Remove “${prompt.title}” from saved` : `Save “${prompt.title}”`}
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-colors disabled:pointer-events-none',
        withLabel
          ? cn('h-10 gap-2 rounded-full border px-4 text-[14px] font-semibold', saved ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line-2 text-fg hover:bg-white/[0.04]')
          : cn('h-[30px] w-[26px] rounded-md', saved ? 'text-accent' : 'text-[#c9cacd] hover:text-white'),
      )}
    >
      <m.span key={String(saved)} initial={{ scale: saved ? 0.55 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 14 }} className="grid">
        <Bookmark className={cn(withLabel ? 'size-[17px]' : 'size-[20px]', saved && 'fill-current')} strokeWidth={1.7} aria-hidden />
      </m.span>
      {withLabel && (saved ? 'Saved' : 'Save')}
    </button>
  )
}

export function LikeButton({ prompt }: { prompt: Prompt }) {
  const { isLiked } = useLiked()
  const toggleLike = useToggleLike()
  const toast = useToast()
  const liked = isLiked(prompt.id)

  const onClick = () =>
    toggleLike.mutate(
      { prompt, like: !liked },
      { onError: () => toast({ title: "Couldn't save your like", description: 'Please try again in a moment.', tone: 'error' }) },
    )

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold tabular-nums transition-colors',
        liked ? 'border-[#f43f5e]/40 bg-[#f43f5e]/10 text-[#fb7185]' : 'border-line-2 text-fg hover:bg-white/[0.04]',
      )}
    >
      <m.span key={String(liked)} initial={{ scale: liked ? 0.5 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 12 }} className="grid">
        <Heart className={cn('size-[17px]', liked && 'fill-current')} strokeWidth={2} aria-hidden />
      </m.span>
      {formatCompact(prompt.stats.likes)}
    </button>
  )
}
