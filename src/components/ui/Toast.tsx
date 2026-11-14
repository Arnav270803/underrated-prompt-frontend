import { CircleCheck, Info, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  title: string
  description?: string
  tone: Tone
}
interface ToastInput {
  title: string
  description?: string
  tone?: Tone
}

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const toast = useCallback(
    ({ title, description, tone = 'success' }: ToastInput) => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-2), { id, title, description, tone }])
      window.setTimeout(() => dismiss(id), tone === 'error' ? 5000 : 2600)
    },
    [dismiss],
  )

  const value = useMemo(() => toast, [toast])

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <m.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line-2 bg-[#1c1d20]/95 px-4 py-3 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.8)] backdrop-blur"
            >
              {t.tone === 'error' ? (
                <Info className="mt-0.5 size-[18px] shrink-0 text-danger" aria-hidden />
              ) : (
                <CircleCheck className={cn('mt-0.5 size-[18px] shrink-0', t.tone === 'success' ? 'text-success' : 'text-accent')} aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-fg">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] leading-snug text-muted">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="-mr-1 grid size-6 place-items-center rounded-md text-muted hover:bg-white/5 hover:text-fg"
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  )
}

export function useToast() {
  const toast = use(ToastContext)
  if (!toast) throw new Error('useToast must be used inside <ToastProvider>')
  return toast
}
