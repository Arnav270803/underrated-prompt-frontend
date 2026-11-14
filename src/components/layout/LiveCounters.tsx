import { Users } from 'lucide-react'
import { m, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { useSiteStats } from '@/lib/hooks/queries'

function AnimatedNumber({ value }: { value: number }) {
  const reduce = useReducedMotion()
  const spring = useSpring(value, { stiffness: 70, damping: 18, mass: 0.8 })
  const text = useTransform(spring, (v) => formatNumber(Math.round(v)))
  useEffect(() => {
    spring.set(value)
  }, [spring, value])
  if (reduce) return <span>{formatNumber(value)}</span>
  return <m.span>{text}</m.span>
}

/** "● 24 Live | 41,928 visitors" — see ARCHITECTURE.md §4.6 for how both are counted. */
export function LiveCounters({ className }: { className?: string }) {
  const { data } = useSiteStats()
  // You are on the site, so never show fewer than 1 live visitor.
  const live = Math.max(1, data?.live ?? 0)

  return (
    <div className={cn('flex items-center gap-[14px] whitespace-nowrap text-[15px] font-semibold tabular-nums text-fg sm:gap-[27px]', className)}>
      <span className="flex items-center gap-[9px]" title="People on the site in the last 2 minutes">
        <span className="relative flex size-[9px]">
          <span className="absolute inline-flex size-full rounded-full bg-live opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex size-[9px] rounded-full bg-live" />
        </span>
        <span>
          {data ? <AnimatedNumber value={live} /> : <span className="inline-block h-4 w-5 animate-pulse rounded bg-white/10 align-middle" />} Live
        </span>
      </span>
      <span aria-hidden className="h-[21px] w-px bg-[#4e4f51]" />
      <span className="flex items-center gap-[9px]" title="Unique visitors since launch">
        <Users className="size-[19px]" strokeWidth={2} aria-hidden />
        <span>
          {data ? <AnimatedNumber value={data.visitors} /> : <span className="inline-block h-4 w-12 animate-pulse rounded bg-white/10 align-middle" />} visitors
        </span>
      </span>
    </div>
  )
}
