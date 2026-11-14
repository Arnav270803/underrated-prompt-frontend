import { Bot, FileText, Layers, Wrench } from 'lucide-react'
import { Link } from 'react-router'
import { buttonClass } from '@/components/ui/Button'
import { Page } from '@/components/ui/misc'

const IDEAS = [
  { icon: FileText, title: 'Reusable instructions', body: 'A skill teaches an AI agent how to do a whole job, not just answer one prompt.' },
  { icon: Wrench, title: 'Files and scripts included', body: 'Templates, examples and helper scripts travel with the skill.' },
  { icon: Bot, title: 'Works with agents', body: 'Drop it into your agent and it knows when to use it.' },
]

export default function SkillsPage() {
  return (
    <Page className="mx-auto max-w-3xl px-1 py-10 text-center">
      <title>Skills · Underrated Prompts</title>
      <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-line-2 bg-card text-accent">
        <Layers className="size-6" aria-hidden />
      </span>
      <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[12.5px] font-semibold text-accent">
        Coming next
      </p>
      <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.02em]">Skills</h1>
      <p className="mx-auto mt-3 max-w-xl text-[15.5px] leading-relaxed text-muted">
        We&apos;re launching with prompts. Skills, reusable instruction packs for AI agents, come right after.
      </p>
      <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
        {IDEAS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-line bg-card p-5">
            <Icon className="size-5 text-accent" aria-hidden />
            <p className="mt-3 text-[14.5px] font-semibold">{title}</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
      <Link to="/" className={buttonClass('secondary', 'md', 'mt-10')}>
        Browse prompts
      </Link>
    </Page>
  )
}
