import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { PromptImage } from '@/lib/api/types'
import { cn } from '@/lib/cn'
import { highlightLine, LANG_BADGE, languageFamily, TOKEN_CLASS } from '@/lib/highlight'
import type { ChecklistItem } from '@/lib/prompt-utils'

/* ---------------------------------------------------------------- text */

export function TextView({ heading, text, size = 'card' }: { heading: string | null; text: string; size?: 'card' | 'page' }) {
  const page = size === 'page'
  const paragraphs = text.split(/\n\s*\n/)
  return (
    <div className={cn('flex h-full flex-col bg-card-2', page ? 'p-6 sm:p-8' : 'px-[21px] pb-[17px] pt-[23px]')}>
      {heading && (
        <p className={cn('truncate font-semibold text-fg', page ? 'mb-4 text-[20px]' : 'mb-[12px] text-[15.5px] leading-6 tracking-[-0.005em]')}>
          {heading}
        </p>
      )}
      <div
        className={cn(
          'min-h-0 flex-1 overflow-hidden rounded-[9px] border border-[#25272a] bg-inset text-fg-2',
          page ? 'space-y-4 p-6 text-[15px] leading-[1.75]' : 'fade-bottom space-y-[9px] px-[16px] py-[14px] text-[13px] leading-[1.72]',
        )}
      >
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- checklist */

export function ChecklistView({ heading, items, size = 'card' }: { heading: string | null; items: ChecklistItem[]; size?: 'card' | 'page' }) {
  const page = size === 'page'
  return (
    <div className={cn('flex h-full flex-col bg-card-2', page ? 'p-6 sm:p-8' : 'pb-4 pl-[27px] pr-[14px] pt-[22px]')}>
      {heading && (
        <p className={cn('truncate font-bold text-fg', page ? 'mb-5 text-[22px]' : 'mb-[14px] text-[17px] leading-6')}>{heading}</p>
      )}
      <ul className="overflow-hidden rounded-[9px] bg-[#1f1f22]">
        {items.map((item, i) => (
          <li
            key={i}
            className={cn(
              'flex items-center gap-3 border-[#2a2a2d] text-fg-2',
              i > 0 && 'border-t',
              page ? 'px-5 py-3.5 text-[15px]' : 'px-[11px] py-[5px] text-[13px] leading-[18px]',
            )}
          >
            <Check
              className={cn('shrink-0', item.done ? 'text-success' : 'text-faint', page ? 'size-[18px]' : 'size-[15px]')}
              strokeWidth={2.6}
              aria-hidden
            />
            <span className="truncate">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------------------------------------------------------------- code */

export function CodeView({
  code,
  lang,
  filename,
  size = 'card',
}: {
  code: string
  lang: string | null
  filename: string | null
  size?: 'card' | 'page'
}) {
  const page = size === 'page'
  const family = languageFamily(lang)
  const badge = LANG_BADGE[(lang ?? '').toLowerCase()]
  const lines = code.replace(/\s+$/, '').split('\n')

  return (
    <div className={cn('flex h-full flex-col bg-[#1b1d1e]', page ? 'rounded-xl' : '')}>
      <div className={cn('flex shrink-0 items-center', page ? 'px-4 pt-4' : 'pl-[13px] pt-[12px]')}>
        <div className={cn('flex h-[30px] flex-1 items-center gap-2 rounded-l-[7px] bg-[#25282d] pl-[10px]', page && 'rounded-[8px]')}>
          {badge && (
            <span className={cn('grid h-[15px] min-w-[15px] place-items-center rounded-[3px] px-[2px] text-[7.5px] font-extrabold tracking-tight', badge.className)}>
              {badge.label}
            </span>
          )}
          <span className="truncate text-[12.5px] text-fg">{filename ?? (lang ? `snippet.${lang}` : 'output')}</span>
          <span className="ml-2 h-4 w-px bg-white/25" aria-hidden />
        </div>
      </div>
      <pre
        className={cn(
          'min-h-0 flex-1 overflow-hidden font-mono',
          page ? 'overflow-x-auto px-4 py-4 text-[13px] leading-[1.7]' : 'px-[12px] pt-[9px] text-[11.6px] leading-[16.4px]',
        )}
      >
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className={cn('shrink-0 select-none text-right text-[#62666d]', page ? 'mr-5 w-6' : 'mr-[22px] w-3')}>{i + 1}</span>
              <span className="whitespace-pre">
                {highlightLine(line, family).map((token, j) => (
                  <span key={j} className={TOKEN_CLASS[token.kind]}>
                    {token.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}

/* ---------------------------------------------------------------- before / after */

/**
 * Drag (or hover, with a mouse) to compare. A plain click/tap without dragging calls `onActivate`,
 * so the card can still open the prompt. Keyboard: arrow keys move the divider.
 */
export function BeforeAfter({
  before,
  after,
  onActivate,
  size = 'card',
}: {
  before: PromptImage
  after: PromptImage
  onActivate?: () => void
  size?: 'card' | 'page'
}) {
  const [position, setPosition] = useState(50)
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ active: boolean; moved: boolean; startX: number }>({ active: false, moved: false, startX: 0 })
  const page = size === 'page'

  const moveTo = useCallback((clientX: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    setPosition(Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100)))
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { active: true, moved: false, startX: event.clientX }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current.active) {
      if (Math.abs(event.clientX - drag.current.startX) > 3) drag.current.moved = true
      moveTo(event.clientX)
    } else if (event.pointerType === 'mouse') {
      moveTo(event.clientX)
    }
  }
  const onPointerUp = () => {
    const { active, moved } = drag.current
    drag.current.active = false
    if (active && !moved) onActivate?.()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 15 : 5
    if (event.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - step))
    else if (event.key === 'ArrowRight') setPosition((p) => Math.min(100, p + step))
    else if (event.key === 'Home') setPosition(0)
    else if (event.key === 'End') setPosition(100)
    else if (event.key === 'Enter') onActivate?.()
    else return
    event.preventDefault()
  }

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Before and after comparison"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      aria-valuetext={`${Math.round(position)}% before`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current.active = false)}
      onKeyDown={onKeyDown}
      className={cn('relative h-full w-full cursor-ew-resize touch-pan-y select-none overflow-hidden bg-black', page && 'rounded-xl')}
    >
      <img src={after.url} alt={after.alt} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={before.url} alt={before.alt} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 bg-[#f3ebe4]" style={{ left: `${position}%` }} />
      <div
        className={cn(
          'pointer-events-none absolute top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#dcdcdc] text-[#1d1d1d] shadow-[0_2px_10px_rgb(0_0_0/0.45)]',
          page ? 'size-10' : 'size-[29px]',
        )}
        style={{ left: `${position}%` }}
      >
        <span className="flex items-center">
          <ChevronLeft className={page ? 'size-4' : 'size-[12px]'} strokeWidth={2.75} />
          <ChevronRight className={cn('-ml-[3px]', page ? 'size-4' : 'size-[12px]')} strokeWidth={2.75} />
        </span>
      </div>
      <span className={cn('pointer-events-none absolute rounded-[8px] bg-black/60 font-semibold text-white backdrop-blur-sm', page ? 'bottom-4 left-4 px-3 py-1.5 text-[14px]' : 'bottom-[9px] left-[11px] px-[10px] py-[4px] text-[12.5px]')}>
        Before
      </span>
      <span className={cn('pointer-events-none absolute rounded-[8px] bg-black/60 font-semibold text-white backdrop-blur-sm', page ? 'bottom-4 right-4 px-3 py-1.5 text-[14px]' : 'bottom-[9px] right-[11px] px-[10px] py-[4px] text-[12.5px]')}>
        After
      </span>
    </div>
  )
}
