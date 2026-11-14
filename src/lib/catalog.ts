import {
  AudioLines,
  Briefcase,
  Clapperboard,
  Clock,
  Code,
  Copy,
  Dice5,
  Flame,
  Gem,
  GraduationCap,
  Image as ImageIcon,
  ListChecks,
  PenLine,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import type { PromptType, SortKey, TrendWindow } from './api/types'

export interface PromptTypeInfo {
  id: PromptType
  label: string
  long: string
  icon: LucideIcon
}

/** The one "what is this prompt for" choice a creator makes. Edit freely; it drives the filters too. */
export const PROMPT_TYPES: PromptTypeInfo[] = [
  { id: 'image', label: 'Image', long: 'Image generation', icon: ImageIcon },
  { id: 'video', label: 'Video', long: 'Video generation', icon: Clapperboard },
  { id: 'writing', label: 'Writing', long: 'Writing & content', icon: PenLine },
  { id: 'coding', label: 'Coding', long: 'Coding & technical', icon: Code },
  { id: 'audio', label: 'Audio', long: 'Audio & music', icon: AudioLines },
  { id: 'learning', label: 'Learning', long: 'Learning & research', icon: GraduationCap },
  { id: 'business', label: 'Business', long: 'Business & marketing', icon: Briefcase },
  { id: 'productivity', label: 'Productivity', long: 'Productivity', icon: ListChecks },
  { id: 'fun', label: 'Fun', long: 'Fun & roleplay', icon: Dice5 },
  { id: 'other', label: 'Other', long: 'Something else', icon: Sparkles },
]

export const PROMPT_TYPE_IDS = PROMPT_TYPES.map((t) => t.id) as [PromptType, ...PromptType[]]

export const TYPE_BY_ID = Object.fromEntries(PROMPT_TYPES.map((t) => [t.id, t])) as Record<
  PromptType,
  PromptTypeInfo
>

export interface SortInfo {
  id: SortKey
  label: string
  hint: string
  icon: LucideIcon
}

export const SORTS: SortInfo[] = [
  { id: 'trending', label: 'Trending', hint: 'Liked and copied the most lately', icon: Flame },
  { id: 'underrated', label: 'Underrated', hint: 'Loved by the few who found them', icon: Gem },
  { id: 'copied', label: 'Most copied', hint: 'Copied the most, all time', icon: Copy },
  { id: 'top', label: 'Top', hint: 'Most liked, all time', icon: Trophy },
  { id: 'new', label: 'New', hint: 'Newest first', icon: Clock },
]

export const SORT_BY_ID = Object.fromEntries(SORTS.map((s) => [s.id, s])) as Record<SortKey, SortInfo>

export const TREND_WINDOWS: Array<{ id: TrendWindow; label: string }> = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
]

/** "Works with" options, grouped for the share form. Edit freely. */
export const TOOL_GROUPS: Array<{ label: string; tools: string[] }> = [
  { label: 'Chat & text', tools: ['ChatGPT', 'Claude', 'Gemini', 'Grok', 'DeepSeek', 'Perplexity', 'Any chatbot'] },
  { label: 'Image', tools: ['Midjourney', 'GPT Image', 'Flux', 'Stable Diffusion', 'Ideogram'] },
  { label: 'Video', tools: ['Sora', 'Veo', 'Runway', 'Kling'] },
  { label: 'Audio', tools: ['Suno', 'Udio', 'ElevenLabs'] },
]

export const TOOLS = TOOL_GROUPS.flatMap((group) => group.tools)

/** Chat tools that accept a prompt in the URL, so "Open in …" can pre-fill it. */
export const OPEN_IN: Array<{ id: string; label: string; matches: string[]; url: (text: string) => string }> = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    matches: ['ChatGPT', 'Any chatbot'],
    url: (text) => `https://chatgpt.com/?q=${encodeURIComponent(text)}`,
  },
  {
    id: 'claude',
    label: 'Claude',
    matches: ['Claude', 'Any chatbot'],
    url: (text) => `https://claude.ai/new?q=${encodeURIComponent(text)}`,
  },
]

export const REPORT_REASONS = [
  'Spam or self-promotion',
  'Copied from someone else',
  'Harmful or inappropriate',
  "Doesn't work",
  'Something else',
]

export const REJECT_REASONS = [
  'Duplicate of an existing prompt',
  'Too vague: say what it does and show a result',
  "Example images don't match the prompt",
  'Breaks the content policy',
  'Low effort or spam',
]

export const LIMITS = {
  title: 80,
  body: 8000,
  whatItDoes: 200,
  sampleOutput: 2000,
  tips: 500,
  settings: 120,
  tags: 5,
  tools: 6,
  images: 3,
  bio: 160,
  links: 3,
  pendingPerUser: 3,
  submissionsPerDay: 5,
} as const
