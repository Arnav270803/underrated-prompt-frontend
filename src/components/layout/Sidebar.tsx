import { Bookmark, Layers, LayoutGrid, Plus, TrendingUp, User, type LucideIcon } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { LogoMark, Wordmark } from '@/components/brand/Logo'
import { cn } from '@/lib/cn'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Prompts', icon: LayoutGrid, end: true },
  { to: '/trending', label: 'Trending', icon: TrendingUp },
  { to: '/skills', label: 'Skills', icon: Layers },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: User },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[228px] flex-col border-r border-[#19191c] bg-ink-2 lg:flex">
      <Link to="/" className="flex items-center gap-[15px] px-[22px] pt-[20px] outline-offset-4" aria-label="Underrated Prompts home">
        <LogoMark className="size-[42px]" />
        <Wordmark />
      </Link>

      <div className="min-h-6 flex-1" />

      <nav aria-label="Main" className="flex flex-col gap-1 px-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex h-[44px] items-center gap-[19px] rounded-[10px] px-[17px] text-[16px] transition-colors duration-150',
                isActive ? 'bg-raised font-semibold text-white' : 'font-medium text-[#dedee0] hover:bg-white/[0.035] hover:text-white',
              )
            }
          >
            <Icon className="size-[22px]" strokeWidth={1.7} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="h-[92px] shrink" />

      <div className="px-4 pb-[31px]">
        <Link
          to="/share"
          className="flex h-[47px] items-center justify-center gap-[10px] rounded-[9px] bg-accent text-[16px] font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-2 active:scale-[0.99]"
        >
          <Plus className="size-[20px]" strokeWidth={2.4} aria-hidden />
          Share a prompt
        </Link>
      </div>
    </aside>
  )
}
