import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { LogoMark } from './components/brand/Logo'
import { AppShell } from './components/layout/AppShell'
import PromptsPage from './pages/PromptsPage'
import { RouteError } from './pages/RouteError'

/** Pages other than the home grid are split into their own chunks and loaded on demand. */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default })

/** Shown for a split second when the first page you open is still loading its code. */
function AppLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink" aria-busy="true" aria-label="Loading">
      <LogoMark className="size-11 animate-pulse" />
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    ErrorBoundary: RouteError,
    HydrateFallback: AppLoading,
    children: [
      { index: true, Component: PromptsPage },
      { path: 'trending', lazy: page(() => import('./pages/TrendingPage')) },
      { path: 'p/:slug', lazy: page(() => import('./pages/PromptPage')) },
      { path: 'u/:handle', lazy: page(() => import('./pages/CreatorPage')) },
      { path: 'skills', lazy: page(() => import('./pages/SkillsPage')) },
      { path: 'saved', lazy: page(() => import('./pages/SavedPage')) },
      { path: 'profile', lazy: page(() => import('./pages/ProfilePage')) },
      { path: 'share', lazy: page(() => import('./pages/SharePage')) },
      { path: 'share/:id', lazy: page(() => import('./pages/SharePage')) },
      { path: 'admin', lazy: page(() => import('./pages/AdminPage')) },
      { path: '*', lazy: page(() => import('./pages/NotFoundPage')) },
    ],
  },
])
