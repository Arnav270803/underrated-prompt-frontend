import { useQueryClient } from '@tanstack/react-query'
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'
import { setMockSession, type Session } from '@/lib/api'
import { readJSON, removeKey, writeJSON } from '@/lib/storage'
import { getVisitorId } from '@/lib/visitor'

/**
 * Sign-in is only needed to share prompts. Visitors browse, copy, like and save without it.
 *
 * DEMO: this provider pretends to sign in with Google so the full flow can be tried before the
 * backend exists. The real version will use Cognito managed login (Google only) through
 * react-oidc-context, with the same `signInWithGoogle` / `signOut` / `session` shape.
 */
interface AuthContextValue {
  session: Session | null
  signingIn: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const SESSION_KEY = 'up:demo-session'

function initialSession(): Session | null {
  const stored = readJSON<Session | null>(SESSION_KEY, null)
  setMockSession(stored)
  return stored
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(initialSession)
  const [signingIn, setSigningIn] = useState(false)

  const signInWithGoogle = useCallback(async () => {
    setSigningIn(true)
    // Stands in for the Google consent screen.
    await new Promise((resolve) => setTimeout(resolve, 900))
    const next: Session = {
      userId: `demo-${getVisitorId().slice(0, 8)}`,
      email: 'you@example.com',
      name: 'Demo Creator',
      // In the demo you are also the admin, so you can review your own submissions.
      isAdmin: true,
    }
    writeJSON(SESSION_KEY, next)
    setMockSession(next)
    setSession(next)
    setSigningIn(false)
    await queryClient.invalidateQueries({ queryKey: ['me'] })
  }, [queryClient])

  const signOut = useCallback(() => {
    removeKey(SESSION_KEY)
    setMockSession(null)
    setSession(null)
    for (const key of ['me', 'my-submissions', 'admin-queue']) queryClient.removeQueries({ queryKey: [key] })
  }, [queryClient])

  const value = useMemo(
    () => ({ session, signingIn, signInWithGoogle, signOut }),
    [session, signingIn, signInWithGoogle, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
