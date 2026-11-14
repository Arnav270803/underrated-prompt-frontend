import { CircleCheck, Code, Info, ListChecks, ShieldCheck, Type } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '@/auth/AuthProvider'
import { ProfileForm } from '@/components/auth/ProfileForm'
import { SignInPanel } from '@/components/auth/SignInPanel'
import { PromptCard } from '@/components/prompt/PromptCard'
import { ImageUploader, TagInput, ToolPicker, TypePicker } from '@/components/share/inputs'
import { Button, buttonClass } from '@/components/ui/Button'
import { Field, inputClass } from '@/components/ui/Field'
import { Page, Skeleton } from '@/components/ui/misc'
import { useToast } from '@/components/ui/Toast'
import { ApiError, type CreatorProfile, type DraftImage, type Prompt, type PromptType, type Submission } from '@/lib/api'
import { LIMITS } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { useSubmitPrompt } from '@/lib/hooks/mutations'
import { useMe, useMySubmissions } from '@/lib/hooks/queries'
import { extractVariables, parseSampleOutput, slugify } from '@/lib/prompt-utils'
import { fieldErrors, promptDraftSchema, type FieldErrors } from '@/lib/validation'

interface DraftState {
  title: string
  body: string
  type: PromptType | ''
  whatItDoes: string
  tools: string[]
  tags: string[]
  images: DraftImage[]
  videoUrl: string
  sampleOutput: string
  tips: string
  settings: string
}

const EMPTY: DraftState = { title: '', body: '', type: '', whatItDoes: '', tools: [], tags: [], images: [], videoUrl: '', sampleOutput: '', tips: '', settings: '' }

const FIELD_ORDER = ['title', 'body', 'type', 'whatItDoes', 'tools', 'tags', 'images', 'videoUrl', 'sampleOutput', 'tips', 'settings']

function fromSubmission(s: Submission): DraftState {
  return {
    title: s.title,
    body: s.body,
    type: s.type,
    whatItDoes: s.whatItDoes,
    tools: s.tools,
    tags: s.tags,
    images: s.images.map((img, i) => ({ ...img, id: `existing-${i}`, bytes: 0 })),
    videoUrl: s.videoUrl ?? '',
    sampleOutput: s.sampleOutput ?? '',
    tips: s.tips ?? '',
    settings: s.settings ?? '',
  }
}

export default function SharePage() {
  const { session } = useAuth()
  const me = useMe()
  const { id: editingId } = useParams()

  if (!session)
    return <SignInPanel title="Share a prompt" reason="Sign in with Google to create your profile. Your prompt is reviewed before it goes live." />

  if (me.isPending) return <ShareSkeleton />

  if (!me.data?.profile)
    return (
      <Page className="mx-auto max-w-xl px-1 py-6">
        <title>Create your profile · Underrated Prompts</title>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">Step 1 of 2</p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em]">First, set up your profile</h1>
        <p className="mt-2 text-[15px] text-muted">This is how people will see you next to your prompts.</p>
        <div className="mt-8 rounded-2xl border border-line bg-card p-6">
          <ProfileForm />
        </div>
      </Page>
    )

  return editingId ? <EditLoader id={editingId} profile={me.data.profile} /> : <ShareForm profile={me.data.profile} />
}

function EditLoader({ id, profile }: { id: string; profile: CreatorProfile }) {
  const mine = useMySubmissions()
  if (mine.isPending) return <ShareSkeleton />
  const submission = mine.data?.find((s) => s.id === id)
  if (!submission || submission.status === 'published')
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-[16px] font-semibold">This submission can&apos;t be edited</p>
        <p className="mt-2 text-[14px] text-muted">Published prompts are locked. You can withdraw it and share a new version.</p>
        <Link to="/profile" className={buttonClass('secondary', 'md', 'mt-6')}>
          Back to your submissions
        </Link>
      </div>
    )
  return <ShareForm key={id} profile={profile} editing={submission} />
}

function ShareForm({ profile, editing }: { profile: CreatorProfile; editing?: Submission }) {
  const { session } = useAuth()
  const [draft, setDraft] = useState<DraftState>(() => (editing ? fromSubmission(editing) : EMPTY))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [done, setDone] = useState<Submission | null>(null)
  const submit = useSubmitPrompt(editing?.id)
  const toast = useToast()
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)

  const set = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const variables = useMemo(() => extractVariables(draft.body), [draft.body])
  const sampleKind = draft.sampleOutput.trim() ? parseSampleOutput(draft.sampleOutput).kind : null

  const preview: Prompt = useMemo(
    () => ({
      id: 'preview',
      slug: slugify(draft.title || 'preview'),
      title: draft.title.trim(),
      type: draft.type || 'other',
      whatItDoes: draft.whatItDoes,
      body: draft.body || 'Your prompt will appear here.',
      variables,
      tools: draft.tools,
      tags: draft.tags,
      images: draft.images,
      sampleOutput: draft.sampleOutput || undefined,
      author: { handle: profile.handle, displayName: profile.displayName },
      publishedAt: new Date().toISOString(),
      stats: { likes: 0, copies: 0, views: 0 },
    }),
    [draft, variables, profile],
  )

  useEffect(() => {
    if (done) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [done])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = promptDraftSchema.safeParse(draft)
    if (!parsed.success) {
      const next = fieldErrors(parsed.error)
      setErrors(next)
      const first = FIELD_ORDER.find((key) => next[key])
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    submit.mutate(parsed.data, {
      onSuccess: (submission) => setDone(submission),
      onError: (error) =>
        toast({
          title: "Couldn't submit your prompt",
          description: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
          tone: 'error',
        }),
    })
  }

  if (done)
    return (
      <Page className="mx-auto max-w-lg px-1 py-12 text-center">
        <title>Submitted · Underrated Prompts</title>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/15 text-success">
          <CircleCheck className="size-7" aria-hidden />
        </span>
        <h1 className="mt-6 text-[26px] font-semibold tracking-[-0.02em]">{editing ? 'Sent back for review' : 'Submitted for review'}</h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          Every prompt is checked by a person before it goes live. You can follow it under Profile → Submissions.
        </p>
        <div className="mx-auto mt-8 w-[277px] text-left">
          <PromptCard prompt={{ ...done }} inert />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link to="/profile" className={buttonClass('primary')}>
            View my submissions
          </Link>
          {!editing && (
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(EMPTY)
                setDone(null)
              }}
            >
              Share another
            </Button>
          )}
        </div>
        {session?.isAdmin && (
          <p className="mt-8 inline-flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-3 text-[13.5px] text-muted">
            <ShieldCheck className="size-4 text-accent" aria-hidden />
            Demo: you&apos;re also the admin.{' '}
            <button type="button" onClick={() => navigate('/admin')} className="font-semibold text-fg underline-offset-2 hover:underline">
              Review it now
            </button>
          </p>
        )}
      </Page>
    )

  return (
    <Page className="mx-auto max-w-[1180px] px-1 pb-10 pt-2">
      <title>{editing ? 'Edit your prompt' : 'Share a prompt'} · Underrated Prompts</title>
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">{editing ? 'Edit your prompt' : 'Share a prompt'}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          Show people what it does: a clear title, the outcome, and an example result. Every prompt is reviewed before it goes live.
        </p>
        {editing?.status === 'rejected' && editing.rejectReason && (
          <p className="mt-4 inline-flex items-start gap-2 rounded-xl bg-danger/10 px-4 py-3 text-[14px] text-[#fca5a5]">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> Last review: {editing.rejectReason}
          </p>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-14">
        <form ref={formRef} onSubmit={onSubmit} noValidate className="min-w-0 space-y-9">
          <Section number={1} title="The prompt">
            <div data-field="title">
              <Field label="Title" htmlFor="title" error={errors.title} counter={{ value: draft.title.length, max: LIMITS.title }}>
                <input id="title" value={draft.title} onChange={(e) => set('title', e.target.value)} aria-invalid={Boolean(errors.title)} className={cn(inputClass, 'h-11')} placeholder="Cinematic travel portrait" />
              </Field>
            </div>
            <div data-field="body">
              <Field
                label="Prompt"
                htmlFor="body"
                error={errors.body}
                counter={{ value: draft.body.length, max: LIMITS.body }}
                hint={
                  variables.length ? (
                    <span>
                      Blanks people can fill in:{' '}
                      {variables.map((v) => (
                        <span key={v} className="mr-1 inline-block rounded bg-accent/15 px-1.5 font-mono text-[12px] text-accent">{`{{${v}}}`}</span>
                      ))}
                    </span>
                  ) : (
                    <span>
                      Tip: write <span className="rounded bg-white/10 px-1 font-mono text-[12px]">{'{{topic}}'}</span> for parts people should fill in. They get an input box for it.
                    </span>
                  )
                }
              >
                <textarea
                  id="body"
                  value={draft.body}
                  onChange={(e) => set('body', e.target.value)}
                  rows={9}
                  aria-invalid={Boolean(errors.body)}
                  className={cn(inputClass, 'min-h-[200px] resize-y py-3 font-mono text-[13.5px] leading-relaxed')}
                  placeholder="Paste your prompt…"
                />
              </Field>
            </div>
          </Section>

          <Section number={2} title="What it does">
            <div data-field="type">
              <Field label="Type" error={errors.type}>
                <TypePicker value={draft.type} onChange={(t) => set('type', t)} invalid={Boolean(errors.type)} />
              </Field>
            </div>
            <div data-field="whatItDoes">
              <Field label="In one sentence, what does it do?" htmlFor="whatItDoes" error={errors.whatItDoes} counter={{ value: draft.whatItDoes.length, max: LIMITS.whatItDoes }}>
                <input id="whatItDoes" value={draft.whatItDoes} onChange={(e) => set('whatItDoes', e.target.value)} aria-invalid={Boolean(errors.whatItDoes)} className={cn(inputClass, 'h-11')} placeholder="Turns any product photo into a cinematic ad shot." />
              </Field>
            </div>
            <div data-field="tools">
              <Field label="Works with" error={errors.tools} hint="Pick the tools you tested it with.">
                <ToolPicker value={draft.tools} onChange={(t) => set('tools', t)} />
              </Field>
            </div>
            <div data-field="tags">
              <Field label="Tags" optional error={errors.tags} hint="Up to 5. Press Enter or comma after each one.">
                <TagInput value={draft.tags} onChange={(t) => set('tags', t)} />
              </Field>
            </div>
          </Section>

          <Section number={3} title="Show the result" description="Prompts with an example get copied far more. Add images, sample output, or both.">
            <div data-field="images">
              <Field
                label="Example images"
                optional
                error={errors.images}
                hint="Images are shrunk and converted to WebP in your browser; location data is removed. Mark one Input and one Result to get a before/after slider."
              >
                <ImageUploader value={draft.images} onChange={(imgs) => set('images', imgs)} />
              </Field>
            </div>
            {draft.type === 'video' && (
              <div data-field="videoUrl">
                <Field label="Link to the video" htmlFor="videoUrl" optional error={errors.videoUrl} hint="We don't host videos. Link to it on YouTube, X, Instagram…">
                  <input id="videoUrl" value={draft.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} inputMode="url" aria-invalid={Boolean(errors.videoUrl)} className={cn(inputClass, 'h-11')} placeholder="https://" />
                </Field>
              </div>
            )}
            <div data-field="sampleOutput">
              <Field
                label="Sample output"
                htmlFor="sampleOutput"
                optional
                error={errors.sampleOutput}
                counter={{ value: draft.sampleOutput.length, max: LIMITS.sampleOutput }}
                hint={<SampleHint kind={sampleKind} />}
              >
                <textarea
                  id="sampleOutput"
                  value={draft.sampleOutput}
                  onChange={(e) => set('sampleOutput', e.target.value)}
                  rows={6}
                  aria-invalid={Boolean(errors.sampleOutput)}
                  className={cn(inputClass, 'resize-y py-3 font-mono text-[13px] leading-relaxed')}
                  placeholder="What the AI wrote back"
                />
              </Field>
            </div>
          </Section>

          <Section number={4} title="Extras">
            <div data-field="tips">
              <Field label="Tips" htmlFor="tips" optional error={errors.tips} counter={{ value: draft.tips.length, max: LIMITS.tips }}>
                <textarea id="tips" value={draft.tips} onChange={(e) => set('tips', e.target.value)} rows={3} className={cn(inputClass, 'resize-none py-3')} placeholder="How to get the best result, what to change…" />
              </Field>
            </div>
            <div data-field="settings">
              <Field label="Settings used" htmlFor="settings" optional error={errors.settings} hint="One line, e.g. --ar 16:9 --stylize 250 or temperature 0.7">
                <input id="settings" value={draft.settings} onChange={(e) => set('settings', e.target.value)} maxLength={LIMITS.settings + 20} className={cn(inputClass, 'h-11 font-mono text-[13px]')} placeholder="--ar 4:5 --style raw" />
              </Field>
            </div>
          </Section>

          <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
            <Button type="submit" variant="primary" size="lg" loading={submit.isPending}>
              {editing ? 'Resubmit for review' : 'Submit for review'}
            </Button>
            <p className="text-[13px] text-muted">Reviewed by a person, usually within a day.</p>
          </div>
        </form>

        <aside aria-label="Card preview" className="hidden lg:block">
          <div className="sticky top-[84px]">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">Live preview</p>
            <PromptCard prompt={preview} inert />
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted">This is how your card will look in the grid.</p>
          </div>
        </aside>
      </div>
    </Page>
  )
}

function Section({ number, title, description, children }: { number: number; title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-6">
      <legend className="mb-6 flex items-center gap-3">
        <span className="grid size-7 place-items-center rounded-full bg-white/[0.07] text-[13px] font-bold text-fg">{number}</span>
        <span className="text-[18px] font-semibold tracking-[-0.01em]">{title}</span>
      </legend>
      {description && <p className="-mt-3 text-[14px] text-muted">{description}</p>}
      {children}
    </fieldset>
  )
}

function SampleHint({ kind }: { kind: 'code' | 'checklist' | 'text' | null }) {
  if (kind === 'code')
    return (
      <span className="inline-flex items-center gap-1.5 text-success">
        <Code className="size-3.5" aria-hidden /> Shows as a code editor.
      </span>
    )
  if (kind === 'checklist')
    return (
      <span className="inline-flex items-center gap-1.5 text-success">
        <ListChecks className="size-3.5" aria-hidden /> Shows as a checklist.
      </span>
    )
  if (kind === 'text')
    return (
      <span className="inline-flex items-center gap-1.5">
        <Type className="size-3.5" aria-hidden /> Shows as text. Start with “# Heading” to add a title.
      </span>
    )
  return (
    <span>
      Wrap code in <span className="rounded bg-white/10 px-1 font-mono text-[12px]">```ts file.ts</span> fences, or write <span className="rounded bg-white/10 px-1 font-mono text-[12px]">- [x] item</span> lines for a checklist.
    </span>
  )
}

function ShareSkeleton() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-4 px-1 pt-2">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-5 w-96 max-w-full" />
      <Skeleton className="mt-6 h-[420px] max-w-3xl rounded-2xl" />
    </div>
  )
}
