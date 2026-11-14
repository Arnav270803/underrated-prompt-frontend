import type { Prompt, PromptImage } from './api/types'

/* ---------------------------------------------------------------- IDs and URLs */

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/** Random ID from an alphabet without "-", so `/p/<slug>-<id>` always splits cleanly. */
export function makeId(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let id = ''
  for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length]
  return id
}

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  return slug || 'prompt'
}

export function promptPath(prompt: Pick<Prompt, 'id' | 'slug'>): string {
  return `/p/${prompt.slug}-${prompt.id}`
}

export function idFromSlugParam(param: string): string {
  const dash = param.lastIndexOf('-')
  return dash === -1 ? param : param.slice(dash + 1)
}

export function normalizeForDuplicateCheck(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

/* ---------------------------------------------------------------- {{blanks}} */

const VARIABLE = String.raw`\{\{\s*([A-Za-z][\w .-]{0,30}?)\s*\}\}`

export type PromptSegment = { kind: 'text'; value: string } | { kind: 'var'; name: string; raw: string }

export function splitByVariables(text: string): PromptSegment[] {
  const parts: PromptSegment[] = []
  let last = 0
  for (const match of text.matchAll(new RegExp(VARIABLE, 'g'))) {
    const start = match.index ?? 0
    if (start > last) parts.push({ kind: 'text', value: text.slice(last, start) })
    parts.push({ kind: 'var', name: (match[1] ?? '').trim(), raw: match[0] })
    last = start + match[0].length
  }
  if (last < text.length) parts.push({ kind: 'text', value: text.slice(last) })
  return parts
}

export function extractVariables(text: string): string[] {
  const names = new Set<string>()
  for (const part of splitByVariables(text)) if (part.kind === 'var') names.add(part.name)
  return [...names]
}

/** Replace each {{blank}} that has a value; leave the rest as {{blank}}. */
export function fillVariables(text: string, values: Record<string, string>): string {
  return splitByVariables(text)
    .map((part) => (part.kind === 'text' ? part.value : values[part.name]?.trim() || part.raw))
    .join('')
}

/* ---------------------------------------------------------------- card previews */

export type ChecklistItem = { text: string; done: boolean }

export type SampleView =
  | { kind: 'code'; lang: string | null; filename: string | null; code: string }
  | { kind: 'checklist'; heading: string | null; items: ChecklistItem[] }
  | { kind: 'text'; heading: string | null; text: string }

export type CardPreview =
  | { kind: 'image'; image: PromptImage }
  | { kind: 'beforeAfter'; before: PromptImage; after: PromptImage }
  | SampleView

const FENCE = /^```([\w+#.-]*)[ \t]*([^\n]*)\n([\s\S]*?)\n?```\s*$/
const CHECK_ITEM = /^\s*(?:[-*]\s*\[( |x|X)\]|[✓✔])\s+(.+)$/

/** How a sample output should be drawn: a code editor, a checklist, or a text panel. */
export function parseSampleOutput(sample: string): SampleView {
  const trimmed = sample.trim()
  const fence = FENCE.exec(trimmed)
  if (fence) {
    return {
      kind: 'code',
      lang: fence[1] || null,
      filename: fence[2]?.trim() || null,
      code: fence[3] ?? '',
    }
  }

  let lines = trimmed.split('\n')
  let heading: string | null = null
  if (lines[0]?.startsWith('# ')) {
    heading = lines[0].slice(2).trim()
    lines = lines.slice(1)
  }

  const nonEmpty = lines.filter((line) => line.trim())
  const matches = nonEmpty.map((line) => CHECK_ITEM.exec(line))
  if (nonEmpty.length >= 2 && matches.every((m) => m !== null)) {
    return {
      kind: 'checklist',
      heading,
      items: matches.map((m) => ({ done: m?.[1] !== ' ', text: (m?.[2] ?? '').trim() })),
    }
  }

  return { kind: 'text', heading, text: lines.join('\n').trim() }
}

/** What a prompt card shows on top: its example image(s), its sample output, or the prompt itself. */
export function getPreview(prompt: Pick<Prompt, 'images' | 'sampleOutput' | 'body'>): CardPreview {
  const input = prompt.images.find((image) => image.role === 'input')
  const result = prompt.images.find((image) => image.role === 'result')
  if (input && result) return { kind: 'beforeAfter', before: input, after: result }

  const first = result ?? prompt.images[0]
  if (first) return { kind: 'image', image: first }

  if (prompt.sampleOutput?.trim()) return parseSampleOutput(prompt.sampleOutput)
  return { kind: 'text', heading: null, text: prompt.body }
}

/** True when the card preview already shows the sample output (so the page shouldn't repeat it). */
export function previewShowsSample(prompt: Pick<Prompt, 'images' | 'sampleOutput'>): boolean {
  return prompt.images.length === 0 && Boolean(prompt.sampleOutput?.trim())
}
