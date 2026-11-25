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
