import type { LucideIcon } from 'lucide-react'
import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Generated avatar: a gradient from the handle + its first letter. No image requests, no photo hotlinking. */
export function Avatar({ handle, name, size = 40, className }: { handle: string; name?: string; size?: number; className?: string }) {
  let hash = 0
  for (const char of handle) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const hue = hash % 360
  const letter = (name || handle).replace(/[^\p{L}\p{N}]/gu, '').charAt(0).toUpperCase() || '?'
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-full font-semibold text-white/95', className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: `linear-gradient(135deg, hsl(${hue} 72% 58%), hsl(${(hue + 48) % 360} 70% 42%))`,
      }}
    >
      {letter}
    </span>
  )
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </m.div>
  )
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  title: string
  description?: ReactNode
  icon?: LucideIcon
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4 px-1 pb-5 pt-3', className)}>
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-[26px] font-semibold tracking-[-0.02em]">
          {Icon && <Icon className="size-6 text-accent" strokeWidth={2} aria-hidden />}
          {title}
        </h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center', className)}>
      <span className="grid size-14 place-items-center rounded-2xl border border-line-2 bg-card text-muted">
        <Icon className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="mt-5 text-[18px] font-semibold">{title}</h2>
      {children && <div className="mt-2 text-[14.5px] leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-white/[0.05]', className)} aria-hidden />
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold', className)}>
      {children}
    </span>
  )
}
