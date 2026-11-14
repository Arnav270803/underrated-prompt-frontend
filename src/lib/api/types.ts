/**
 * Shapes shared between the frontend and the backend.
 * When the backend repo exists, these (and lib/validation.ts) move into a shared package.
 */

export type PromptType =
  | 'image'
  | 'video'
  | 'writing'
  | 'coding'
  | 'audio'
  | 'learning'
  | 'business'
  | 'productivity'
  | 'fun'
  | 'other'

export type TypeFilter = PromptType | 'all'
export type SortKey = 'trending' | 'underrated' | 'copied' | 'top' | 'new'
export type TrendWindow = 'day' | 'week' | 'month' | 'all'
export type PromptStatus = 'pending' | 'published' | 'rejected' | 'removed'
export type ImageRole = 'result' | 'input'

export interface PromptImage {
  url: string
  width: number
  height: number
  /** `input` = the starting image a prompt needs; `result` = what the prompt produced. */
  role: ImageRole
  alt: string
}

export interface PromptStats {
  likes: number
  copies: number
  views: number
}

export interface AuthorRef {
  handle: string
  displayName: string
}

export interface Prompt {
  /** 10-character random ID; also the last part of the URL: /p/<slug>-<id> */
  id: string
  slug: string
  title: string
  type: PromptType
  whatItDoes: string
  body: string
  /** Names of the {{blanks}} found in `body`, in order of first appearance. */
  variables: string[]
  tools: string[]
  tags: string[]
  images: PromptImage[]
  videoUrl?: string
  /** What the AI produced. Supports a ``` fenced code block, a `- [x]` checklist, or plain text with an optional `# heading`. */
  sampleOutput?: string
  tips?: string
  settings?: string
  author: AuthorRef
  publishedAt: string
  stats: PromptStats
}

export interface FeedPage {
  items: Prompt[]
  nextPage: number | null
  total: number
  generatedAt: string
}

export interface RankedPrompt extends Prompt {
  rank: number
}

export interface SearchIndex {
  items: Prompt[]
  generatedAt: string
}

export interface SiteStats {
  visitors: number
  live: number
  generatedAt: string
}

export interface CreatorProfile {
  handle: string
  displayName: string
  bio: string
  links: string[]
  joinedAt: string
}

export interface CreatorPage {
  profile: CreatorProfile
  prompts: Prompt[]
  totals: { prompts: number; likes: number; copies: number }
}

export interface Submission extends Prompt {
  status: PromptStatus
  rejectReason?: string
  createdAt: string
  updatedAt: string
}

export interface DraftImage extends PromptImage {
  id: string
  bytes: number
}

export interface PromptDraft {
  title: string
  body: string
  type: PromptType
  whatItDoes: string
  tools: string[]
  tags: string[]
  images: DraftImage[]
  videoUrl: string
  sampleOutput: string
  tips: string
  settings: string
}

export interface ProfileInput {
  handle: string
  displayName: string
  bio: string
  links: string[]
}

export interface Session {
  userId: string
  email: string
  name: string
  isAdmin: boolean
}

export interface SimilarPrompt {
  prompt: Prompt
  /** 0–1, trigram similarity of the prompt text (what PostgreSQL's pg_trgm computes). */
  similarity: number
}

export interface QueueItem {
  submission: Submission
  similar: SimilarPrompt[]
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
