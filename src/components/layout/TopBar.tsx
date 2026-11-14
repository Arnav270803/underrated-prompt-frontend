import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { LogoMark } from '@/components/brand/Logo'
import { cn } from '@/lib/cn'
import { LiveCounters } from './LiveCounters'
import { SearchBox } from './SearchBox'

export function TopBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b bg-ink/85 backdrop-blur-md transition-colors duration-200',
        scrolled ? 'border-line' : 'border-transparent',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 px-3 py-3 lg:h-[66px] lg:flex-nowrap lg:py-0 lg:pl-6 lg:pr-[17px]">
        <Link to="/" className="lg:hidden" aria-label="Underrated Prompts home">
          <LogoMark className="size-8" />
        </Link>
        <LiveCounters className="text-[14px] lg:text-[15px]" />
        <div className="order-last w-full lg:order-none lg:ml-auto lg:w-[518px] lg:max-w-[46%]">
          <SearchBox />
        </div>
      </div>
    </header>
  )
}
