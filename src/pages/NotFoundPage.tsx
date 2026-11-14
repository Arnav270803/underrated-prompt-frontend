import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/misc'

export default function NotFoundPage() {
  return (
    <>
      <title>Not found · Underrated Prompts</title>
      <EmptyState
        icon={Compass}
        title="This page wandered off"
        action={
          <Link to="/" className={buttonClass('secondary')}>
            Back to prompts
          </Link>
        }
      >
        The link may be old or mistyped.
      </EmptyState>
    </>
  )
}
