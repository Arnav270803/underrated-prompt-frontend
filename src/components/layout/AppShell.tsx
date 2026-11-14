import { Outlet, ScrollRestoration } from 'react-router'
import { usePresence } from '@/lib/presence'
import { MobileTabBar } from './MobileTabBar'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  usePresence()

  return (
    <div className="min-h-dvh bg-ink">
      <a
        href="#main"
        className="sr-only z-[70] rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="lg:pl-[228px]">
        <TopBar />
        <main id="main" className="px-2.5 pb-28 pt-[9px] lg:pb-10 lg:pl-[10px] lg:pr-[5px]">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
      <ScrollRestoration />
    </div>
  )
}
