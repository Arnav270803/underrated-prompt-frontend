import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

/**
 * Global search. Typing updates `?q=` on the Prompts page (debounced), so results are shareable.
 * Press "/" anywhere to jump here.
 */
export function SearchBox() {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const onHome = location.pathname === '/'
  const urlQuery = onHome ? (params.get('q') ?? '') : ''
  const [value, setValue] = useState(urlQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)

  // Keep the box in sync when the URL changes (back/forward, clearing from elsewhere).
  useEffect(() => {
    setValue(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (event.key === '/' && !typing) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const commit = (next: string) => {
    const nextParams = new URLSearchParams(onHome ? params : undefined)
    if (next.trim()) nextParams.set('q', next.trim())
    else nextParams.delete('q')
    const search = nextParams.toString()
    navigate({ pathname: '/', search: search ? `?${search}` : '' }, { replace: onHome })
  }

  const onChange = (next: string) => {
    setValue(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => commit(next), 220)
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        window.clearTimeout(timer.current)
        commit(value)
      }}
      className="flex h-[42px] w-full items-center gap-[13px] rounded-[10px] border border-line-2 bg-field px-[15px] transition-colors focus-within:border-[#4a4b4f]"
    >
      <Search className="size-[19px] shrink-0 text-fg" strokeWidth={2} aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (value) onChange('')
            else inputRef.current?.blur()
          }
        }}
        placeholder="Search prompts, creators, or results..."
        aria-label="Search prompts, creators, or results"
        className="h-full min-w-0 flex-1 bg-transparent text-[14.5px] text-fg outline-none placeholder:text-[#9c9ea2]"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            window.clearTimeout(timer.current)
            setValue('')
            commit('')
            inputRef.current?.focus()
          }}
          className="-mr-1.5 grid size-7 place-items-center rounded-md text-muted hover:bg-white/5 hover:text-fg"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  )
}
