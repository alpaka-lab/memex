# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Memex is a self-hosted personal bookmark manager built with Next.js 15 (App Router). Currently at v0.1 (basic CRUD). AI features planned for v0.3+.

## Commands

```bash
npm run dev              # Dev server with Turbopack (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run db:generate      # Generate Drizzle migrations after schema changes
npm run db:migrate       # Run pending migrations (tsx src/lib/db/migrate.ts)
npm run db:studio        # Drizzle Studio GUI for database
```

Setup after clone: `cp .env.example .env && npm install && npm run db:migrate`

## Architecture

### Route Groups
- `(app)/` — Protected routes (bookmarks, collections, tags, search, settings). Uses sidebar+header layout.
- `(auth)/` — Public auth routes (login, register). Centered minimal layout.
- `api/` — API routes for bookmarks, collections, tags, search, metadata, auth.
- Root `page.tsx` redirects to `/bookmarks`.

### Auth Flow (Better Auth)
- Server: `src/lib/auth.ts` — betterAuth instance with Drizzle adapter
- Client: `src/lib/auth-client.ts` — exports `signIn`, `signUp`, `signOut`, `useSession`
- Middleware (`src/middleware.ts`) calls `/api/auth/get-session` to check auth; protects all non-public routes
- API route pattern for checking auth:
  ```typescript
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  ```

### Database (SQLite + Drizzle ORM)
- `src/lib/db/index.ts` — better-sqlite3 instance with WAL mode, exports `db` (Drizzle) and `sqlite` (raw)
- `src/lib/db/schema.ts` — All tables. Auth tables (users, sessions, accounts, verifications) follow Better Auth schema. App tables: bookmarks, collections, tags, bookmark_tags.
- `src/lib/db/fts.ts` — FTS5 virtual table on bookmarks(title, description, note) with auto-sync triggers. Checks if bookmarks table exists before init (safe during build).
- IDs use CUID2 (`@paralleldrive/cuid2`)
- Migrations in `drizzle/` directory

### Data Fetching & State
- **Server state**: TanStack React Query v5 (`useInfiniteQuery` for paginated lists, `useMutation` for writes). Hooks in `src/lib/hooks/`.
- **Client state**: Zustand stores in `src/lib/stores/` (view toggle, sidebar, modals). Not persisted.
- API pagination: cursor-based using `createdAt`. Response shape: `{ data: T[], nextCursor: string | null }`.
- Toast notifications via Sonner.

### Styling
- **Tailwind CSS v4** — CSS-based config in `globals.css` (no `tailwind.config.ts`). All theme config via `@theme inline` block.
- **OKLCH color space** for all theme variables. Dark mode borders use transparency (`oklch(1 0 0 / 10%)`).
- **shadcn/ui** style: `base-nova` (uses `@base-ui/react` primitives, NOT Radix). Components don't have `asChild` prop; use `render` prop or style the trigger directly.
- Component variants via CVA. Use `cn()` from `@/lib/utils` for class merging.
- Icons: `lucide-react`.

### Docker
- Multi-stage Dockerfile with `output: 'standalone'` in next.config.ts
- `serverExternalPackages: ['better-sqlite3']` required for native bindings
- SQLite data persisted via Docker volume at `/app/data`

## Key Conventions

- `@/*` alias maps to `src/`
- Prettier: single quotes, semicolons, 100 char width, es5 trailing commas
- All API routes are auth-protected except `/api/auth/*`
- FTS5 search uses raw SQLite prepared statements (not Drizzle) for the MATCH query
- Tag filtering does a 2-step lookup: find tag ID, then bookmark IDs via junction table
