import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/misc'
import type { CreatorProfile } from '@/lib/api/types'
import { formatCompact, formatDate, hostname } from '@/lib/format'

export function ProfileHeader({
  profile,
  totals,
  actions,
}: {
  profile: CreatorProfile
  totals?: { prompts: number; likes: number; copies: number }
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-line bg-card p-6 sm:flex-row sm:items-start sm:p-7">
      <Avatar handle={profile.handle} name={profile.displayName} size={76} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-[26px] font-semibold tracking-[-0.02em]">{profile.displayName}</h1>
            <p className="mt-0.5 text-[14.5px] text-muted">
              @{profile.handle} · Joined {formatDate(profile.joinedAt)}
            </p>
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {profile.bio && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-2">{profile.bio}</p>}
        {profile.links.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {profile.links.map((link) => (
              <li key={link}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3 py-1 text-[13px] text-fg-2 transition-colors hover:text-fg"
                >
                  {hostname(link)}
                  <ExternalLink className="size-3.5 text-muted" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
        {totals && (
          <dl className="mt-5 flex flex-wrap gap-x-7 gap-y-2">
            {[
              ['Prompts', totals.prompts],
              ['Likes', totals.likes],
              ['Copies', totals.copies],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2">
                <dd className="text-[18px] font-semibold tabular-nums">{formatCompact(Number(value))}</dd>
                <dt className="text-[13px] text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  )
}
