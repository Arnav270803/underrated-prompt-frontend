# Underrated Prompts: frontend

The website for Underrated Prompts: share and discover creative AI prompts.

Built with Vite, React 19, TypeScript, Tailwind CSS v4, Motion, React Router and TanStack Query.
The backend lives in its own repository, `Underrated-prompt-backend`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run typecheck  # TypeScript
npm run build      # production build in dist/
npm run preview    # serve the production build on http://localhost:4173
```

## Demo mode (no backend yet)

Everything runs in the browser for now:

- `src/lib/api/mock/` answers every API call and stores what you do in `localStorage`.
  `src/lib/api/index.ts` is the only file the UI imports, so the real backend can replace the mock
  without touching the pages.
- "Continue with Google" pretends to sign you in, and makes you the admin so you can review your own
  submissions at `/admin`.
- The photos in `public/mock/` are cropped from the reference design. They are placeholders until real
  uploads exist.

To reset the demo, clear this site's data in your browser (or run `localStorage.clear()` in the console).

## Where things are

| Path | What |
|---|---|
| `src/pages/` | One file per page (Prompts, Trending, prompt detail, Saved, Skills, Profile, Share, Admin…) |
| `src/components/prompt/` | Prompt cards and their previews (image, before/after, code, checklist, text) |
| `src/components/layout/` | Sidebar, top bar with the Live/Visitors counters and search, mobile tab bar |
| `src/lib/catalog.ts` | Editable lists: prompt types, "works with" tools, sort orders, limits |
| `src/lib/validation.ts` | Zod rules for the share form and profiles (to be shared with the backend) |
| `src/lib/presence.ts` | The Visitors / Live heartbeat |
