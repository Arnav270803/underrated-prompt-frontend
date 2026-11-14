import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const inputClass =
  'w-full rounded-[10px] border border-line-2 bg-[#141517] px-3.5 text-[14px] text-fg placeholder:text-faint outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/15 aria-[invalid=true]:border-danger/70'

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: ReactNode
  error?: string
  optional?: boolean
  counter?: { value: number; max: number }
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, hint, error, optional, counter, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[14px] font-semibold text-fg">
          {label}
          {optional && <span className="ml-1.5 text-[12.5px] font-normal text-muted">optional</span>}
        </label>
        {counter && (
          <span
            className={cn('text-[12px] tabular-nums', counter.value > counter.max ? 'text-danger' : 'text-faint')}
            aria-live="polite"
          >
            {counter.value.toLocaleString()}/{counter.max.toLocaleString()}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="text-[12.5px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
