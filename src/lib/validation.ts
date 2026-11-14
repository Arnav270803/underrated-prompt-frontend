import { z } from 'zod'
import { LIMITS, PROMPT_TYPE_IDS } from './catalog'

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export const HANDLE_PATTERN = /^[a-z][a-z0-9._]{2,23}$/
const TAG_PATTERN = /^[a-z0-9][a-z0-9-]{1,23}$/

export const profileSchema = z.object({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(HANDLE_PATTERN, '3–24 characters: lowercase letters, numbers, dots or underscores, starting with a letter'),
  displayName: z.string().trim().min(1, 'Add a display name').max(40, 'Keep it under 40 characters'),
  bio: z.string().trim().max(LIMITS.bio, `Keep your bio under ${LIMITS.bio} characters`),
  links: z
    .array(z.string().trim().refine(isHttpUrl, 'Use a full link starting with https://'))
    .max(LIMITS.links, `Up to ${LIMITS.links} links`),
})

const imageSchema = z.object({
  id: z.string(),
  url: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  role: z.enum(['result', 'input']),
  alt: z.string().max(200),
  bytes: z.number().int().nonnegative(),
})

export const promptDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Give it a title of at least 5 characters')
    .max(LIMITS.title, `Keep the title under ${LIMITS.title} characters`),
  body: z
    .string()
    .trim()
    .min(20, 'The prompt needs at least 20 characters')
    .max(LIMITS.body, 'Prompts can be up to 8,000 characters'),
  type: z.enum(PROMPT_TYPE_IDS, { message: 'Pick what this prompt is for' }),
  whatItDoes: z
    .string()
    .trim()
    .min(10, 'Describe the result in one short sentence')
    .max(LIMITS.whatItDoes, `Keep it under ${LIMITS.whatItDoes} characters`),
  tools: z
    .array(z.string())
    .min(1, 'Pick at least one tool it works with')
    .max(LIMITS.tools, `Pick up to ${LIMITS.tools} tools`),
  tags: z.array(z.string().regex(TAG_PATTERN, 'Tags use letters, numbers and dashes')).max(LIMITS.tags),
  images: z.array(imageSchema).max(LIMITS.images, `Up to ${LIMITS.images} images`),
  videoUrl: z
    .string()
    .trim()
    .refine((value) => value === '' || isHttpUrl(value), 'Use a full link starting with https://'),
  sampleOutput: z.string().trim().max(LIMITS.sampleOutput, 'Sample output can be up to 2,000 characters'),
  tips: z.string().trim().max(LIMITS.tips, `Tips can be up to ${LIMITS.tips} characters`),
  settings: z.string().trim().max(LIMITS.settings, 'Keep settings to one short line'),
})

export type FieldErrors = Partial<Record<string, string>>

/** First error message per top-level field, for showing under each input. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    errors[key] ??= issue.message
  }
  return errors
}

export function normalizeTag(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^#/, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
}
