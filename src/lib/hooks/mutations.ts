import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthProvider'
import { api } from '../api'
import type { ProfileInput, Prompt, PromptDraft, PromptStats } from '../api/types'
import { ensurePresence } from '../presence'
import { getVisitorId } from '../visitor'
import { qk, PUBLIC_DATA_KEYS } from './keys'
import { copiedIds, likedIds } from './local'

function setPromptStats(queryClient: QueryClient, id: string, update: (stats: PromptStats) => PromptStats) {
  queryClient.setQueryData<Prompt>(qk.prompt(id), (prev) => (prev ? { ...prev, stats: update(prev.stats) } : prev))
}

function refreshPublicData(queryClient: QueryClient) {
  return Promise.all(PUBLIC_DATA_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
}

/** Like / unlike, one per browser. Updates the count right away and corrects it from the server reply. */
export function useToggleLike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ prompt, like }: { prompt: Prompt; like: boolean }) => {
      await ensurePresence(queryClient)
      return like ? api.like(prompt.id, getVisitorId()) : api.unlike(prompt.id, getVisitorId())
    },
    onMutate: ({ prompt, like }) => {
      if (like) likedIds.add(prompt.id)
      else likedIds.remove(prompt.id)
      setPromptStats(queryClient, prompt.id, (s) => ({ ...s, likes: Math.max(0, s.likes + (like ? 1 : -1)) }))
    },
    onSuccess: (stats, { prompt }) => setPromptStats(queryClient, prompt.id, () => stats),
    onError: (_error, { prompt, like }) => {
      if (like) likedIds.remove(prompt.id)
      else likedIds.add(prompt.id)
      setPromptStats(queryClient, prompt.id, (s) => ({ ...s, likes: Math.max(0, s.likes + (like ? -1 : 1)) }))
    },
  })
}

/** Copies count once per browser per prompt. */
export function useRecordCopy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (prompt: Prompt) => {
      if (copiedIds.has(prompt.id)) return null
      copiedIds.add(prompt.id)
      await ensurePresence(queryClient)
      return api.recordCopy(prompt.id, getVisitorId())
    },
    onSuccess: (stats, prompt) => {
      if (stats) setPromptStats(queryClient, prompt.id, () => stats)
    },
  })
}

export function useReport() {
  return useMutation({
    mutationFn: (input: { promptId: string; reason: string; note: string }) =>
      api.report({ ...input, visitorId: getVisitorId() }),
  })
}

export function useSaveProfile(mode: 'create' | 'update') {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  return useMutation({
    mutationFn: (input: ProfileInput) => (mode === 'create' ? api.createProfile(input) : api.updateProfile(input)),
    onSuccess: async (profile) => {
      queryClient.setQueryData(qk.me(session?.userId), { profile })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.mySubmissions(session?.userId) }),
        refreshPublicData(queryClient),
      ])
    },
  })
}

export function useSubmitPrompt(editingId?: string) {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  return useMutation({
    mutationFn: (draft: PromptDraft) => (editingId ? api.updateSubmission(editingId, draft) : api.submitPrompt(draft)),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.mySubmissions(session?.userId) }),
        queryClient.invalidateQueries({ queryKey: qk.queue }),
      ]),
  })
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  return useMutation({
    mutationFn: (id: string) => api.deleteSubmission(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.mySubmissions(session?.userId) }),
        queryClient.invalidateQueries({ queryKey: qk.queue }),
        refreshPublicData(queryClient),
      ]),
  })
}

export function useModerate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) =>
      action === 'approve' ? api.approve(id) : api.reject(id, reason ?? 'Did not meet the guidelines'),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.queue }),
        queryClient.invalidateQueries({ queryKey: ['my-submissions'] }),
        refreshPublicData(queryClient),
      ]),
  })
}
