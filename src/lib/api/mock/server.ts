/**
 * In-browser stand-in for the backend. Everything it "stores" lives in this browser's localStorage,
 * so the whole flow (share → review → publish, likes, copies, counters) can be demoed today.
 *
 * Each method documents the real endpoint or CDN file it stands in for.
 */
import {
  ApiError,
  type CreatorPage,
  type CreatorProfile,
  type FeedPage,
  type ProfileInput,
  type Prompt,
  type PromptDraft,
  type PromptStats,
  type QueueItem,
  type RankedPrompt,
  type SearchIndex,
  type Session,
  type SiteStats,
  type SortKey,
  type Submission,
  type TrendWindow,
  type TypeFilter,
} from '../types'
import { LIMITS } from '../../catalog'
import { extractVariables, makeId, normalizeForDuplicateCheck, slugify } from '../../prompt-utils'
import { readJSON, writeJSON } from '../../storage'
import { SEED_CREATORS, SEED_PROMPTS } from './seed'
import { similarity } from './similarity'

const PAGE_SIZE = 20

const KEYS = {
  submissions: 'up:mock:submissions',
  profiles: 'up:mock:profiles',
  likes: 'up:mock:likes',
  copies: 'up:mock:copies',
  views: 'up:mock:views',
  presence: 'up:mock:presence',
  reports: 'up:mock:reports',
} as const

const RESERVED_HANDLES = new Set([
  'admin', 'api', 'data', 'share', 'profile', 'saved', 'skills', 'trending', 'about', 'help', 'support',
  'underrated', 'underratedprompts', 'moderator', 'official',
])

const wait = (min = 120, max = 320) => new Promise<void>((resolve) => setTimeout(resolve, min + Math.random() * (max - min)))
const nowIso = () => new Date().toISOString()

/* ---------------------------------------------------------------- session */

let session: Session | null = null

/** Called by the AuthProvider. The real API reads the user from the Cognito token instead. */
export function setMockSession(next: Session | null): void {
  session = next
}

function requireSession(): Session {
  if (!session) throw new ApiError('Sign in with Google first.', 401)
  return session
}

function requireAdmin(): Session {
  const current = requireSession()
  if (!current.isAdmin) throw new ApiError('Only admins can do that.', 403)
  return current
}

/* ---------------------------------------------------------------- storage */

interface StoredSubmission extends Submission {
  ownerId: string
}
interface StoredProfile extends CreatorProfile {
  ownerId: string
}

const loadSubmissions = () => readJSON<StoredSubmission[]>(KEYS.submissions, [])
function saveSubmissions(list: StoredSubmission[]) {
  if (!writeJSON(KEYS.submissions, list)) {
    throw new ApiError("This browser's demo storage is full. Delete a test submission and try again.", 507)
  }
}
const loadProfiles = () => readJSON<StoredProfile[]>(KEYS.profiles, [])
const saveProfiles = (list: StoredProfile[]) => writeJSON(KEYS.profiles, list)
const readSet = (key: string) => new Set(readJSON<string[]>(key, []))
const saveSet = (key: string, set: Set<string>) => writeJSON(key, [...set])

function stripOwner<T extends { ownerId: string }>(value: T): Omit<T, 'ownerId'> {
  const { ownerId: _owner, ...rest } = value
  return rest
}

function toSubmission(stored: StoredSubmission): Submission {
  return stripOwner(stored)
}

function toPublicPrompt(stored: StoredSubmission): Prompt {
  const { ownerId: _o, status: _s, rejectReason: _r, createdAt: _c, updatedAt: _u, ...prompt } = stored
  return prompt
}

/** Every published prompt with this browser's own likes/copies/views added on top of the seed numbers. */
function allPublished(): Prompt[] {
  const likes = readSet(KEYS.likes)
  const copies = readSet(KEYS.copies)
  const views = readSet(KEYS.views)
  const fromUsers = loadSubmissions()
    .filter((s) => s.status === 'published')
    .map(toPublicPrompt)
  return [...SEED_PROMPTS, ...fromUsers].map((p) => ({
    ...p,
    stats: {
      likes: p.stats.likes + (likes.has(p.id) ? 1 : 0),
      copies: p.stats.copies + (copies.has(p.id) ? 1 : 0),
      views: p.stats.views + (views.has(p.id) ? 1 : 0),
    },
  }))
}

function findPublished(id: string): Prompt {
  const prompt = allPublished().find((p) => p.id === id)
  if (!prompt) throw new ApiError('That prompt was not found.', 404)
  return prompt
}

/* ---------------------------------------------------------------- ranking (the backend will do this in SQL) */

const hoursSince = (iso: string, now: number) => Math.max(0, (now - Date.parse(iso)) / 3_600_000)
const engagement = (p: Prompt) => p.stats.likes + 2 * p.stats.copies

const SCORERS: Record<SortKey, (p: Prompt, now: number) => number> = {
  trending: (p, now) => engagement(p) / Math.pow(hoursSince(p.publishedAt, now) + 2, 1.3),
  underrated: (p) => (engagement(p) + 1) / (p.stats.views + 120),
  copied: (p) => p.stats.copies,
  top: (p) => p.stats.likes,
  new: (p) => Date.parse(p.publishedAt),
}

function sortPrompts(list: Prompt[], sort: SortKey): Prompt[] {
  const now = Date.now()
  const score = SCORERS[sort]
  return [...list].sort((a, b) => score(b, now) - score(a, now))
}

const WINDOW_HOURS: Record<Exclude<TrendWindow, 'all'>, number> = { day: 24, week: 168, month: 720 }

function jitter(seed: string): number {
  let hash = 2166136261
  for (const char of seed) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return 0.85 + (((hash >>> 0) % 1000) / 1000) * 0.3
}

function windowScore(p: Prompt, window: TrendWindow, now: number): number {
  if (window === 'all') return engagement(p)
  return engagement(p) * Math.exp(-hoursSince(p.publishedAt, now) / WINDOW_HOURS[window]) * jitter(p.id + window)
}

/* ---------------------------------------------------------------- presence (visitors + live) */

interface PresenceState {
  visitors: number
  seen: string[]
  live: number
  lastTick: number
}

function readPresence(): PresenceState {
  return readJSON<PresenceState>(KEYS.presence, { visitors: 41_927, seen: [], live: 24, lastTick: Date.now() })
}

/** Simulates the rest of the world: a few new visitors each minute and a drifting live count. */
function tick(state: PresenceState, now: number) {
  const minutes = Math.min(30, Math.floor((now - state.lastTick) / 60_000))
  for (let i = 0; i < minutes; i++) {
    state.visitors += Math.floor(Math.random() * 4)
    state.live = Math.max(9, Math.min(48, state.live + Math.round((Math.random() - 0.5) * 6)))
  }
  if (minutes > 0) state.lastTick = now
}

const statsOf = (state: PresenceState): SiteStats => ({ visitors: state.visitors, live: state.live, generatedAt: nowIso() })

/* ---------------------------------------------------------------- helpers for creators */

function findProfile(handle: string): CreatorProfile | undefined {
  const h = handle.toLowerCase()
  const seedProfile = SEED_CREATORS.find((c) => c.handle === h)
  if (seedProfile) return seedProfile
  const stored = loadProfiles().find((p) => p.handle === h)
  return stored ? stripOwner(stored) : undefined
}

function myProfile(current: Session): StoredProfile | undefined {
  return loadProfiles().find((p) => p.ownerId === current.userId)
}

function handleTaken(handle: string, exceptOwner?: string): boolean {
  const h = handle.toLowerCase()
  return (
    RESERVED_HANDLES.has(h) ||
    SEED_CREATORS.some((c) => c.handle === h) ||
    loadProfiles().some((p) => p.handle === h && p.ownerId !== exceptOwner)
  )
}

function assertNotDuplicate(body: string, exceptId?: string) {
  const normalized = normalizeForDuplicateCheck(body)
  const pending = loadSubmissions().filter((s) => s.status === 'pending' && s.id !== exceptId)
  const duplicate = [...allPublished(), ...pending].find(
    (p) => p.id !== exceptId && normalizeForDuplicateCheck(p.body) === normalized,
  )
  if (duplicate) throw new ApiError(`This exact prompt is already on the site: “${duplicate.title}”.`, 409)
}

function applyDraft(target: StoredSubmission, draft: PromptDraft) {
  target.title = draft.title.trim()
  target.slug = slugify(draft.title)
  target.type = draft.type
  target.whatItDoes = draft.whatItDoes.trim()
  target.body = draft.body.trim()
  target.variables = extractVariables(target.body)
  target.tools = draft.tools
  target.tags = draft.tags
  target.images = draft.images.map(({ url, width, height, role, alt }) => ({ url, width, height, role, alt }))
  target.videoUrl = draft.videoUrl.trim() || undefined
  target.sampleOutput = draft.sampleOutput.trim() || undefined
  target.tips = draft.tips.trim() || undefined
  target.settings = draft.settings.trim() || undefined
}

/* ---------------------------------------------------------------- the API */

export const mockApi = {
  /** CDN: /data/feed/<sort>/<type>/<page>.json, written by the publisher. */
  async getFeed({ sort, type, page }: { sort: SortKey; type: TypeFilter; page: number }): Promise<FeedPage> {
    await wait()
    const list = sortPrompts(
      allPublished().filter((p) => type === 'all' || p.type === type),
      sort,
    )
    const start = (page - 1) * PAGE_SIZE
    return {
      items: list.slice(start, start + PAGE_SIZE),
      nextPage: start + PAGE_SIZE < list.length ? page + 1 : null,
      total: list.length,
      generatedAt: nowIso(),
    }
  },

  /** CDN: /data/trending/<window>.json */
  async getTrending(window: TrendWindow): Promise<RankedPrompt[]> {
    await wait()
    const now = Date.now()
    return [...allPublished()]
      .sort((a, b) => windowScore(b, window, now) - windowScore(a, window, now))
      .slice(0, 15)
      .map((p, i) => ({ ...p, rank: i + 1 }))
  },

  /** CDN: /data/p/<id>.json */
  async getPrompt(id: string): Promise<Prompt> {
    await wait(80, 200)
    return findPublished(id)
  },

  /** Part of /data/p/<id>.json in production. */
  async getRelated(id: string): Promise<Prompt[]> {
    await wait(80, 200)
    const all = allPublished()
    const current = all.find((p) => p.id === id)
    if (!current) return []
    const now = Date.now()
    return all
      .filter((p) => p.id !== id)
      .map((p) => {
        const sharedTags = p.tags.filter((t) => current.tags.includes(t)).length
        const sameType = p.type === current.type ? 2 : 0
        return { p, score: sameType + sharedTags * 1.5 + Math.log10(1 + SCORERS.trending(p, now)) }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ p }) => p)
  },

  /** CDN: /data/search/index.json */
  async getSearchIndex(): Promise<SearchIndex> {
    await wait(60, 160)
    return { items: allPublished(), generatedAt: nowIso() }
  },

  /** CDN: /data/stats.json */
  async getSiteStats(): Promise<SiteStats> {
    await wait(40, 120)
    const state = readPresence()
    tick(state, Date.now())
    writeJSON(KEYS.presence, state)
    return statsOf(state)
  },

  /** POST /api/presence — the once-a-minute heartbeat. Also records prompt views. */
  async heartbeat({ visitorId, viewedPromptIds }: { visitorId: string; viewedPromptIds: string[] }): Promise<SiteStats> {
    await wait(60, 160)
    const state = readPresence()
    tick(state, Date.now())
    if (!state.seen.includes(visitorId)) {
      state.seen.push(visitorId)
      state.visitors += 1
    }
    writeJSON(KEYS.presence, state)
    if (viewedPromptIds.length) {
      const views = readSet(KEYS.views)
      viewedPromptIds.forEach((id) => views.add(id))
      saveSet(KEYS.views, views)
    }
    return statsOf(state)
  },

  /** PUT /api/prompts/:id/like — one like per browser. */
  async like(id: string, visitorId: string): Promise<PromptStats> {
    await wait(80, 180)
    if (!readPresence().seen.includes(visitorId)) throw new ApiError('Unknown visitor.', 403)
    const likes = readSet(KEYS.likes)
    likes.add(id)
    saveSet(KEYS.likes, likes)
    return findPublished(id).stats
  },

  /** DELETE /api/prompts/:id/like */
  async unlike(id: string, _visitorId: string): Promise<PromptStats> {
    await wait(80, 180)
    const likes = readSet(KEYS.likes)
    likes.delete(id)
    saveSet(KEYS.likes, likes)
    return findPublished(id).stats
  },

  /** POST /api/prompts/:id/copy — counted once per browser. */
  async recordCopy(id: string, _visitorId: string): Promise<PromptStats> {
    await wait(60, 140)
    const copies = readSet(KEYS.copies)
    copies.add(id)
    saveSet(KEYS.copies, copies)
    return findPublished(id).stats
  },

  /** POST /api/reports */
  async report(input: { promptId: string; reason: string; note: string; visitorId: string }): Promise<void> {
    await wait(150, 300)
    const reports = readJSON<Array<typeof input & { at: string }>>(KEYS.reports, [])
    reports.push({ ...input, at: nowIso() })
    writeJSON(KEYS.reports, reports)
  },

  /** CDN: /data/u/<handle>.json */
  async getCreator(handle: string): Promise<CreatorPage> {
    await wait()
    const profile = findProfile(handle)
    if (!profile) throw new ApiError('That creator was not found.', 404)
    const prompts = sortPrompts(
      allPublished().filter((p) => p.author.handle === profile.handle),
      'new',
    )
    return {
      profile,
      prompts,
      totals: {
        prompts: prompts.length,
        likes: prompts.reduce((sum, p) => sum + p.stats.likes, 0),
        copies: prompts.reduce((sum, p) => sum + p.stats.copies, 0),
      },
    }
  },

  /* ---- signed-in creator ---- */

  /** GET /api/me */
  async getMe(): Promise<{ profile: CreatorProfile | null }> {
    const current = requireSession()
    await wait(80, 180)
    const profile = myProfile(current)
    return { profile: profile ? stripOwner(profile) : null }
  },

  async checkHandle(handle: string): Promise<{ available: boolean }> {
    await wait(150, 300)
    return { available: !handleTaken(handle, session?.userId) }
  },

  /** POST /api/me */
  async createProfile(input: ProfileInput): Promise<CreatorProfile> {
    const current = requireSession()
    await wait(200, 400)
    if (myProfile(current)) throw new ApiError('You already have a profile.', 409)
    if (handleTaken(input.handle, current.userId)) throw new ApiError('That handle is taken. Try another one.', 409)
    const profile: StoredProfile = { ...input, joinedAt: nowIso(), ownerId: current.userId }
    saveProfiles([...loadProfiles(), profile])
    return stripOwner(profile)
  },

  /** PATCH /api/me */
  async updateProfile(input: ProfileInput): Promise<CreatorProfile> {
    const current = requireSession()
    await wait(200, 400)
    const profiles = loadProfiles()
    const index = profiles.findIndex((p) => p.ownerId === current.userId)
    const existing = profiles[index]
    if (!existing) throw new ApiError('Create your profile first.', 404)
    if (input.handle !== existing.handle && handleTaken(input.handle, current.userId)) {
      throw new ApiError('That handle is taken. Try another one.', 409)
    }
    const updated: StoredProfile = { ...existing, ...input }
    profiles[index] = updated
    saveProfiles(profiles)
    // Keep the author name on this creator's prompts in sync.
    const submissions = loadSubmissions().map((s) =>
      s.ownerId === current.userId ? { ...s, author: { handle: updated.handle, displayName: updated.displayName } } : s,
    )
    saveSubmissions(submissions)
    return stripOwner(updated)
  },

  /** POST /api/prompts */
  async submitPrompt(draft: PromptDraft): Promise<Submission> {
    const current = requireSession()
    await wait(350, 650)
    const profile = myProfile(current)
    if (!profile) throw new ApiError('Create your profile first.', 403)

    const submissions = loadSubmissions()
    const mine = submissions.filter((s) => s.ownerId === current.userId)
    if (mine.filter((s) => s.status === 'pending').length >= LIMITS.pendingPerUser) {
      throw new ApiError(`You already have ${LIMITS.pendingPerUser} prompts waiting for review. Please wait for those first.`, 429)
    }
    const dayAgo = Date.now() - 24 * 3_600_000
    if (mine.filter((s) => Date.parse(s.createdAt) > dayAgo).length >= LIMITS.submissionsPerDay) {
      throw new ApiError(`You can share up to ${LIMITS.submissionsPerDay} prompts a day. Try again tomorrow.`, 429)
    }
    assertNotDuplicate(draft.body)

    const time = nowIso()
    const stored: StoredSubmission = {
      id: makeId(),
      slug: '',
      title: '',
      type: draft.type,
      whatItDoes: '',
      body: '',
      variables: [],
      tools: [],
      tags: [],
      images: [],
      author: { handle: profile.handle, displayName: profile.displayName },
      publishedAt: time,
      stats: { likes: 0, copies: 0, views: 0 },
      status: 'pending',
      createdAt: time,
      updatedAt: time,
      ownerId: current.userId,
    }
    applyDraft(stored, draft)
    saveSubmissions([stored, ...submissions])
    return toSubmission(stored)
  },

  /** PATCH /api/prompts/:id — only while pending or rejected; sends it back to review. */
  async updateSubmission(id: string, draft: PromptDraft): Promise<Submission> {
    const current = requireSession()
    await wait(300, 600)
    const submissions = loadSubmissions()
    const stored = submissions.find((s) => s.id === id && s.ownerId === current.userId)
    if (!stored) throw new ApiError('That submission was not found.', 404)
    if (stored.status !== 'pending' && stored.status !== 'rejected') {
      throw new ApiError('Published prompts can’t be edited.', 409)
    }
    assertNotDuplicate(draft.body, id)
    applyDraft(stored, draft)
    stored.status = 'pending'
    stored.rejectReason = undefined
    stored.updatedAt = nowIso()
    saveSubmissions(submissions)
    return toSubmission(stored)
  },

  /** DELETE /api/prompts/:id */
  async deleteSubmission(id: string): Promise<void> {
    const current = requireSession()
    await wait(200, 400)
    saveSubmissions(loadSubmissions().filter((s) => !(s.id === id && s.ownerId === current.userId)))
  },

  /** GET /api/me/prompts */
  async getMySubmissions(): Promise<Submission[]> {
    const current = requireSession()
    await wait(100, 220)
    return loadSubmissions()
      .filter((s) => s.ownerId === current.userId)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .map(toSubmission)
  },

  /* ---- admin ---- */

  /** GET /api/admin/queue — oldest first, with the originality check. */
  async getQueue(): Promise<QueueItem[]> {
    requireAdmin()
    await wait(150, 300)
    const published = allPublished()
    return loadSubmissions()
      .filter((s) => s.status === 'pending')
      .sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt))
      .map((s) => ({
        submission: toSubmission(s),
        similar: published
          .map((prompt) => ({ prompt, similarity: similarity(s.body, prompt.body) }))
          .filter((m) => m.similarity >= 0.12)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 3),
      }))
  },

  /** POST /api/admin/prompts/:id/approve */
  async approve(id: string): Promise<void> {
    requireAdmin()
    await wait(200, 400)
    const submissions = loadSubmissions()
    const stored = submissions.find((s) => s.id === id)
    if (!stored || stored.status !== 'pending') throw new ApiError('That prompt is no longer waiting for review.', 409)
    stored.status = 'published'
    stored.publishedAt = nowIso()
    stored.updatedAt = stored.publishedAt
    saveSubmissions(submissions)
  },

  /** POST /api/admin/prompts/:id/reject */
  async reject(id: string, reason: string): Promise<void> {
    requireAdmin()
    await wait(200, 400)
    const submissions = loadSubmissions()
    const stored = submissions.find((s) => s.id === id)
    if (!stored || stored.status !== 'pending') throw new ApiError('That prompt is no longer waiting for review.', 409)
    stored.status = 'rejected'
    stored.rejectReason = reason
    stored.updatedAt = nowIso()
    saveSubmissions(submissions)
  },
}
