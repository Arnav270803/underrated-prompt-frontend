import { TriangleRight } from 'lucide-react'
import { useEffect } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/misc'
import { isChunkLoadError, reloadOnce } from '@/lib/reload'

/** Catches anything a page throws. A missing JS chunk after a deploy triggers one reload. */
export function RouteError() {
  const error = useRouteError()
  const chunkError = isChunkLoadError(error)

  useEffect(() => {
    if (chunkError) reloadOnce()
  }, [chunkError])

  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="min-h-dvh bg-ink px-4">
      <EmptyState
        icon={TriangleRight}
        title={notFound ? 'Page not found' : chunkError ? 'A new version is available' : 'Something went wrong'}
        action={
          <div className="flex gap-2">
            <button type="button" className={buttonClass('primary')} onClick={() => window.location.reload()}>
              Reload
            </button>
            <Link to="/" className={buttonClass('secondary')}>
              Home
            </Link>
          </div>
        }
      >
        {chunkError ? 'Reloading to get the latest version…' : 'Please reload the page. If it keeps happening, try again later.'}
      </EmptyState>
    </div>
  )
}
