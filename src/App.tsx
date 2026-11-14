import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, MotionConfig } from 'motion/react'
import { RouterProvider } from 'react-router/dom'
import { AuthProvider } from './auth/AuthProvider'
import { ToastProvider } from './components/ui/Toast'
import { router } from './router'

const loadMotionFeatures = () => import('./lib/motion-features').then((mod) => mod.default)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* LazyMotion + `m` components keep animation code out of the first bundle. */}
        <LazyMotion features={loadMotionFeatures} strict>
          <MotionConfig reducedMotion="user">
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
          </MotionConfig>
        </LazyMotion>
      </AuthProvider>
    </QueryClientProvider>
  )
}
