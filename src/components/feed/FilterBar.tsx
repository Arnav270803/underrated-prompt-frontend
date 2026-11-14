import { Check, ChevronDown, Search } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { SortKey, TypeFilter } from '@/lib/api/types'
import { PROMPT_TYPES, SORT_BY_ID, SORTS } from '@/lib/catalog'
import { cn } from '@/lib/cn'

interface FilterBarProps {
  type: TypeFilter
  sort: SortKey
  searching: boolean
  onType: (type: TypeFilter) => void
  onSort: (sort: SortKey) => void
}

const CHIPS: Array<{ id: TypeFilter; label: string }> = [{ id: 'all', label: 'All' }, ...PROMPT_TYPES.map(({ id, label }) => ({ id, label }))]

/** The slim row above the grid: type chips on the left, sort menu on the right. */
export function FilterBar({ type, sort, searching, onType, onSort }: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 pb-[11px]">
      <div role="tablist" aria-label="Prompt type" className="no-scrollbar -mx-0.5 flex min-w-0 flex-1 items-center gap-[6px] overflow-x-auto px-0.5 py-0.5">
        {CHIPS.map((chip) => {
          const active = chip.id === type
          const Icon = chip.id === 'all' ? null : PROMPT_TYPES.find((t) => t.id === chip.id)?.icon
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onType(chip.id)}
              className={cn(
                'flex h-[31px] shrink-0 items-center gap-1.5 rounded-full border px-[12px] text-[13px] font-medium transition-colors duration-150',
                active
                  ? 'border-transparent bg-fg text-ink'
                  : 'border-line bg-card text-fg-2 hover:border-line-2 hover:text-fg',
              )}
            >
              {Icon && <Icon className="size-[14px]" strokeWidth={2} aria-hidden />}
              {chip.label}
            </button>
          )
        })}
      </div>
      {searching ? (
        <span className="flex h-[31px] shrink-0 items-center gap-2 rounded-full border border-line px-3 text-[13px] font-medium text-muted">
          <Search className="size-[14px]" aria-hidden />
          Best match
        </span>
      ) : (
        <SortMenu sort={sort} onSort={onSort} />
      )}
    </div>
  )
}

export function SortMenu({ sort, onSort }: { sort: SortKey; onSort: (sort: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = SORT_BY_ID[sort]
  const CurrentIcon = current.icon

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sort: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-[31px] items-center gap-2 rounded-full border border-line bg-card pl-3 pr-2.5 text-[13px] font-medium text-fg-2 transition-colors hover:border-line-2 hover:text-fg"
      >
        <CurrentIcon className="size-[14px] text-accent" strokeWidth={2.2} aria-hidden />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className={cn('size-3.5 text-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <m.ul
            role="listbox"
            aria-label="Sort prompts"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-[38px] z-30 w-64 origin-top-right rounded-xl border border-line-2 bg-[#1a1b1d] p-1.5 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.85)]"
          >
            {SORTS.map((option) => {
              const Icon = option.icon
              const active = option.id === sort
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onSort(option.id)
                      setOpen(false)
                    }}
                    className={cn('flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors', active ? 'bg-white/[0.05]' : 'hover:bg-white/[0.04]')}
                  >
                    <Icon className={cn('mt-0.5 size-4 shrink-0', active ? 'text-accent' : 'text-muted')} strokeWidth={2} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-semibold text-fg">{option.label}</span>
                      <span className="block text-[12px] text-muted">{option.hint}</span>
                    </span>
                    {active && <Check className="mt-0.5 size-4 text-accent" aria-hidden />}
                  </button>
                </li>
              )
            })}
          </m.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
