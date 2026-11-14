import { ImagePlus, LoaderCircle, X } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import type { DraftImage, ImageRole, PromptType } from '@/lib/api/types'
import { LIMITS, PROMPT_TYPES, TOOL_GROUPS } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import { ACCEPTED_IMAGE_TYPES, compressImage } from '@/lib/image'
import { makeId } from '@/lib/prompt-utils'
import { normalizeTag } from '@/lib/validation'

const chip = (active: boolean) =>
  cn(
    'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition-colors',
    active ? 'border-accent/60 bg-accent/10 text-fg' : 'border-line-2 text-fg-2 hover:border-[#3d3e41] hover:text-fg',
  )

export function TypePicker({ value, onChange, invalid }: { value: PromptType | ''; onChange: (type: PromptType) => void; invalid?: boolean }) {
  return (
    <div role="radiogroup" aria-label="What is this prompt for?" aria-invalid={invalid} className="flex flex-wrap gap-2">
      {PROMPT_TYPES.map(({ id, long, icon: Icon }) => (
        <button key={id} type="button" role="radio" aria-checked={value === id} onClick={() => onChange(id)} className={chip(value === id)}>
          <Icon className={cn('size-4', value === id ? 'text-accent' : 'text-muted')} aria-hidden />
          {long}
        </button>
      ))}
    </div>
  )
}

export function ToolPicker({ value, onChange }: { value: string[]; onChange: (tools: string[]) => void }) {
  const toggle = (tool: string) =>
    onChange(value.includes(tool) ? value.filter((t) => t !== tool) : value.length >= LIMITS.tools ? value : [...value, tool])
  return (
    <div className="space-y-3">
      {TOOL_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {group.tools.map((tool) => (
              <button key={tool} type="button" aria-pressed={value.includes(tool)} onClick={() => toggle(tool)} className={chip(value.includes(tool))}>
                {tool}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [text, setText] = useState('')
  const full = value.length >= LIMITS.tags

  const add = (raw: string) => {
    const tags = raw.split(',').map(normalizeTag).filter((t) => t.length >= 2)
    const next = [...value]
    for (const tag of tags) if (!next.includes(tag) && next.length < LIMITS.tags) next.push(tag)
    onChange(next)
    setText('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      if (text.trim()) add(text)
    } else if (event.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[10px] border border-line-2 bg-[#141517] px-2 py-1.5 focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/15">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] py-1 pl-2.5 pr-1 text-[13px] text-fg">
          #{tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="grid size-5 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-fg" aria-label={`Remove ${tag}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => text.trim() && add(text)}
        disabled={full}
        placeholder={full ? 'That’s 5 tags' : value.length ? 'Add another' : 'portrait, seo, python…'}
        aria-label="Add a tag"
        className="h-8 min-w-[120px] flex-1 bg-transparent px-1.5 text-[14px] text-fg outline-none placeholder:text-faint disabled:cursor-not-allowed"
      />
    </div>
  )
}

/** Up to 3 images, shrunk to WebP in the browser before "upload". Each is marked Result or Input. */
export function ImageUploader({ value, onChange }: { value: DraftImage[]; onChange: (images: DraftImage[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const room = LIMITS.images - value.length

  const addFiles = async (files: File[]) => {
    setError(null)
    if (!files.length) return
    if (room <= 0) {
      setError(`Up to ${LIMITS.images} images.`)
      return
    }
    setBusy(true)
    const added: DraftImage[] = []
    try {
      for (const file of files.slice(0, room)) {
        // Demo storage is small, so keep images modest; the real upload allows 1600px.
        const image = await compressImage(file, { maxSide: 1200, maxBytes: 350_000 })
        added.push({ id: makeId(8), url: image.dataUrl, width: image.width, height: image.height, bytes: image.bytes, role: 'result', alt: '' })
      }
      if (files.length > room) setError(`Only the first ${room} ${room === 1 ? 'image was' : 'images were'} added. The limit is ${LIMITS.images}.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.')
    } finally {
      if (added.length) onChange([...value, ...added])
      setBusy(false)
    }
  }

  const setRole = (id: string, role: ImageRole) => onChange(value.map((img) => (img.id === id ? { ...img, role } : img)))

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((img) => (
          <div key={img.id} className="overflow-hidden rounded-xl border border-line-2 bg-card-2">
            <div className="relative aspect-[11/8]">
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((i) => i.id !== img.id))}
                className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black"
                aria-label="Remove image"
              >
                <X className="size-3.5" />
              </button>
              <span className="absolute bottom-2 left-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] text-white/90">{formatBytes(img.bytes)}</span>
            </div>
            <div className="flex p-1.5" role="radiogroup" aria-label="Image role">
              {(['result', 'input'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  role="radio"
                  aria-checked={img.role === role}
                  onClick={() => setRole(img.id, role)}
                  className={cn('h-7 flex-1 rounded-md text-[12px] font-semibold transition-colors', img.role === role ? 'bg-white/10 text-fg' : 'text-muted hover:text-fg')}
                >
                  {role === 'result' ? 'Result' : 'Input'}
                </button>
              ))}
            </div>
          </div>
        ))}

        {room > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              void addFiles(Array.from(e.dataTransfer.files))
            }}
            className={cn(
              'flex aspect-[11/8] flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-3 text-center transition-colors',
              dragging ? 'border-accent bg-accent/10' : 'border-line-2 hover:border-[#4a4b4f] hover:bg-white/[0.02]',
            )}
          >
            {busy ? <LoaderCircle className="size-6 animate-spin text-muted" aria-hidden /> : <ImagePlus className="size-6 text-muted" aria-hidden />}
            <span className="text-[13px] font-semibold text-fg-2">{busy ? 'Optimizing…' : 'Add image'}</span>
            <span className="text-[11.5px] leading-snug text-faint">JPG, PNG or WebP</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(e) => {
          void addFiles(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
      {error && (
        <p className="mt-2 text-[12.5px] text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
