# Agent notes — Hawa Computer platform

## Stack & layout
- Next.js 15 App Router, TypeScript, Tailwind 4, Prisma 6 + PostgreSQL.
- Route groups: `src/app/(site)` public, `(account)/account`, `(admin)/admin`.
- Domain logic in `src/lib/*` (auth, permissions, validation, rate-limit, audit, payments,
  settings, storage, i18n/dictionaries) and server actions in `src/actions/*`.

## Commands
- `npm run typecheck` — tsc, must stay clean.
- `npx eslint src` — 0 problems expected.
- `npx next build` — production build.
- `npm run db:seed` — reseeds roles, catalogue and CMS content (idempotent upserts).
- Runtime: `npx next start -p 3000`; kill the `next-server` process (not the `next start`
  wrapper) before restarting or you will get EADDRINUSE and keep testing a stale build.

## Conventions
- Every admin page/action starts with `requireStaff(PERMISSIONS.X)`; account pages use
  `requireUser(returnTo)` and always filter queries by the session user's id.
- Validate all mutation input with a zod schema from `src/lib/validation.ts`.
- Customer-facing copy is bilingual: read `getLocale()` and branch with `bn ? ... : ...`
  or pull from `getDict(locale)`.
- New nav entries go in `src/lib/nav.ts`; their labels live in `d.admin` / `d.account`.

## Gotchas
- `Invoice.discount` and `Order.discount` have no Prisma default — always set them explicitly.
- `requireStaff` redirects roles without `DASHBOARD_VIEW` to `/account?denied=1` to avoid an
  `/admin` redirect loop.
- Rate limiting is in-memory; multi-instance deployments need Redis.

## Static mirror (GitHub Pages)
- `scripts/build-static.sh` builds with `NEXT_PUBLIC_STATIC_MODE=1` and an asset prefix; `scripts/mirror.py`
  crawls the running origin and rewrites links into a static tree, then the gh-pages branch is replaced.
- No server exists on Pages, so `src/lib/local-auth.ts` keeps users, sessions and orders in localStorage
  (passwords hashed with Web Crypto). `STATIC_MODE` selects those components over the Prisma ones.
- Never build redirect URLs from `process.env.NEXT_PUBLIC_*` alone: env vars may be absent, so use
  `routePrefix()`, which reads the deploy sub-path from Next's own `/_next/` script URLs.
- The injected mirror script prefixes root-relative `href`/`src`/`action` values at runtime: Next hydration
  re-renders with the origin paths, and client-rendered links never pass through the crawler.
- `/checkout` and `/my-account` are not linked from crawled HTML, so they are seeded in `EXTRA`.
- Forms that handle submission themselves must set `data-allow-submit`; the mirror blocks every other form.

## Site shell (static build)
- `scripts/build-static.sh` builds the mirror to `/tmp/hawa-static`; `scripts/publish-gh-pages.sh`
  mirrors it to `/tmp/ghp-site` and force-pushes `gh-pages`. Both need `BASE_PATH=/Hawa-Computer-`
  (and `GITHUB_TOKEN` for publishing). GitHub Pages takes ~1 min to serve the new files.
- On the static build `NEXT_PUBLIC_STATIC_MODE=1` swaps server flows for local ones
  (`StaticCheckout`, `StaticTrack`, `StaticLoginForm`, `StaticContactForm`), so orders and
  accounts live in `localStorage`, not Postgres.
- `/api/locale?lang=en&next=…` links are rewritten by `scripts/mirror.py` into `/en/…` pages —
  keep using `LocaleSwitcher` for language links or the English mirror will 404.
- Header mega panels are wider than their trigger; `html { overflow-x: clip }` keeps the
  off-screen part from creating a horizontal scrollbar. Desktop nav appears from `xl`.

## Tools and order handoff
- Browser-only tools live in `src/components/tools/*` and share helpers from `src/lib/pdf.ts`
  (a dependency-free JPEG→PDF writer; validate changes by parsing the output, e.g. `pypdf`).
- `src/lib/tools.ts` is the single registry for the tool grid on `/tools` and the home-page
  count — add an entry there instead of hardcoding numbers.

## Production deploy
- Reference host setup is Docker Compose (`docker-compose.yml` + `Caddyfile`): `app`, `db`,
  one-shot `migrate` (profile `setup`), optional `proxy` (profile `proxy`, needs `SITE_DOMAIN`).
- `GET /api/health` reports DB reachability and powers the compose healthcheck; keep it
  dependency-free so it never becomes the reason a deploy is unhealthy.
- `scripts/backup-db.sh` dumps the compose database and prunes old dumps; `DEPLOY.md` §4 has
  the runbook, restore drill and the list of credentials still missing (payment gateway, SMS,
  email).
- `.github/workflows/ci.yml` runs typecheck, lint, migrate, seed and build against a throwaway
  Postgres 17, then builds the image.
