import { Bookmark, LayoutGrid, Plus, TrendingUp, User } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/cn'

const TABS = [
  { to: '/', label: 'Prompts', icon: LayoutGrid, end: true },
  { to: '/trending', label: 'Trending', icon: TrendingUp },
  { to: '/share', label: 'Share', icon: Plus, primary: true },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: User },
]

export function MobileTabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, end, primary }) => (
          <li key={to} className="grid">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn('flex flex-col items-center justify-center gap-1 text-[11px] font-medium', isActive ? 'text-fg' : 'text-muted')
              }
            >
              {primary ? (
                <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-ink shadow-[0_6px_20px_-6px_rgb(249_116_36/0.7)]">
                  <Icon className="size-5" strokeWidth={2.4} aria-hidden />
                </span>
              ) : (
                <Icon className="size-[21px]" strokeWidth={1.8} aria-hidden />
              )}
              <span className={primary ? 'sr-only' : undefined}>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
