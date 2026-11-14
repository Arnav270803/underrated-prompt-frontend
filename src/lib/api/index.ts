/**
 * The one place the UI talks to the backend.
 *
 * Today every call is answered by an in-browser mock (./mock/server.ts), so the frontend can be
 * built and demoed before the backend exists. The real implementation will:
 *  - read public data as static JSON from the CDN (/data/feed/…, /data/p/<id>.json, /data/stats.json)
 *  - send writes to /api/* (API Gateway → Lambda → PostgreSQL)
 * Keep these function signatures and swap the implementation behind them.
 */
export { mockApi as api, setMockSession } from './mock/server'
export * from './types'
