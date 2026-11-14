import { cn } from '@/lib/cn'

/** The orange "knot" mark from the reference design. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('shrink-0', className)} aria-hidden>
      <rect width="40" height="40" rx="10" fill="#F97424" />
      <g fill="none" stroke="#151110" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16.5c0-3.4 5.2-4.2 8-0.6c2.8-3.6 8-2.8 8 0.6c0 2.2-2.2 3-4.2 1.9" />
        <path d="M12 16.5c0 2.2 2.2 3 4.2 1.9" />
        <path d="M16.2 18.4l8.2 8.6c1 1.1 2.9 1.2 3.6-0.4" />
        <path d="M23.8 18.4l-8.2 8.6c-1 1.1-2.9 1.2-3.6-0.4" />
      </g>
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('text-[21px] font-bold leading-[1.06] tracking-[-0.015em] text-fg', className)}>
      Underrated
      <br />
      Prompts
    </span>
  )
}
