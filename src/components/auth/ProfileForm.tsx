import { useQuery } from '@tanstack/react-query'
import { AtSign, CircleCheck, LoaderCircle, Info } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Field, inputClass } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError, type CreatorProfile } from '@/lib/api'
import { LIMITS } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { useSaveProfile } from '@/lib/hooks/mutations'
import { fieldErrors, HANDLE_PATTERN, profileSchema, type FieldErrors } from '@/lib/validation'

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function suggestHandle(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '').slice(0, 20)
  return /^[a-z]/.test(base) ? base : ''
}

/** Profile setup (first sign-in) and editing. Handle, display name, short bio, up to 3 links. */
export function ProfileForm({ existing, onDone }: { existing?: CreatorProfile | null; onDone?: () => void }) {
  const { session } = useAuth()
  const toast = useToast()
  const mode = existing ? 'update' : 'create'
  const save = useSaveProfile(mode)
  const [handle, setHandle] = useState(existing?.handle ?? suggestHandle(session?.name ?? ''))
  const [displayName, setDisplayName] = useState(existing?.displayName ?? (session?.name === 'Demo Creator' ? '' : (session?.name ?? '')))
  const [bio, setBio] = useState(existing?.bio ?? '')
  const [links, setLinks] = useState<string[]>(() => {
    const list = [...(existing?.links ?? [])]
    while (list.length < LIMITS.links) list.push('')
    return list
  })
  const [errors, setErrors] = useState<FieldErrors>({})

  const normalizedHandle = handle.trim().toLowerCase()
  const debouncedHandle = useDebounced(normalizedHandle)
  const handleChanged = normalizedHandle !== existing?.handle
  const availability = useQuery({
    queryKey: ['handle-available', debouncedHandle],
    queryFn: () => api.checkHandle(debouncedHandle),
    enabled: handleChanged && HANDLE_PATTERN.test(debouncedHandle),
    staleTime: 30_000,
  })
  const checking = handleChanged && HANDLE_PATTERN.test(normalizedHandle) && (debouncedHandle !== normalizedHandle || availability.isFetching)
  const taken = handleChanged && availability.data?.available === false && debouncedHandle === normalizedHandle

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = profileSchema.safeParse({ handle, displayName, bio, links: links.map((l) => l.trim()).filter(Boolean) })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    if (taken) {
      setErrors({ handle: 'That handle is taken. Try another one.' })
      return
    }
    setErrors({})
    save.mutate(parsed.data, {
      onSuccess: () => {
        toast({ title: mode === 'create' ? 'Profile created' : 'Profile saved', description: mode === 'create' ? 'You can share prompts now.' : undefined })
        onDone?.()
      },
      onError: (error) => {
        const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
        if (error instanceof ApiError && error.status === 409) setErrors({ handle: message })
        else toast({ title: "Couldn't save your profile", description: message, tone: 'error' })
      },
    })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Field
        label="Handle"
        htmlFor="handle"
        error={errors.handle}
        hint={
          checking ? (
            <span className="inline-flex items-center gap-1.5"><LoaderCircle className="size-3.5 animate-spin" /> Checking…</span>
          ) : taken ? (
            <span className="inline-flex items-center gap-1.5 text-danger"><Info className="size-3.5" /> Taken. Try another one.</span>
          ) : handleChanged && availability.data?.available ? (
            <span className="inline-flex items-center gap-1.5 text-success"><CircleCheck className="size-3.5" /> Available: your page will be /u/{normalizedHandle}</span>
          ) : (
            'Your public name on the site, like @lena.makes. Lowercase letters, numbers, dots and underscores.'
          )
        }
      >
        <div className="relative">
          <AtSign className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/\s/g, '').toLowerCase())}
            maxLength={24}
            autoComplete="username"
            aria-invalid={Boolean(errors.handle) || taken}
            className={cn(inputClass, 'h-11 pl-9')}
            placeholder="yourname"
          />
        </div>
      </Field>

      <Field label="Display name" htmlFor="displayName" error={errors.displayName}>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          autoComplete="name"
          aria-invalid={Boolean(errors.displayName)}
          className={cn(inputClass, 'h-11')}
          placeholder="How your name appears on your prompts"
        />
      </Field>

      <Field label="Bio" htmlFor="bio" optional error={errors.bio} counter={{ value: bio.length, max: LIMITS.bio }}>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          aria-invalid={Boolean(errors.bio)}
          className={cn(inputClass, 'resize-none py-3 leading-relaxed')}
          placeholder="What kind of prompts do you make?"
        />
      </Field>

      <Field label="Links" optional error={errors.links} hint="Your site, X, GitHub… Up to 3.">
        <div className="space-y-2">
          {links.map((link, i) => (
            <input
              key={i}
              value={link}
              onChange={(e) => setLinks((list) => list.map((l, j) => (j === i ? e.target.value : l)))}
              inputMode="url"
              aria-label={`Link ${i + 1}`}
              className={cn(inputClass, 'h-11')}
              placeholder="https://"
            />
          ))}
        </div>
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="primary" size="lg" loading={save.isPending}>
          {mode === 'create' ? 'Create profile' : 'Save changes'}
        </Button>
        {mode === 'update' && onDone && (
          <Button variant="ghost" size="lg" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
