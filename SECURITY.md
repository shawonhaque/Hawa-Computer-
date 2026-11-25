# Security notes

## Authentication
- Sessions are opaque random tokens (32 bytes, base64url) stored in the `Session` table and
  delivered in an `httpOnly`, `sameSite=lax`, `secure` (in production) cookie.
- Passwords are hashed with bcrypt (cost 12). Login uses a constant-time compare and returns a
  generic error message for both unknown emails and wrong passwords.
- Sessions expire after 30 days and are rotated on login. Logging out deletes the row.
- Expired sessions are rejected in `getSessionUser()` and cleared by the middleware.

## Authorisation (RBAC)
- `Role` → `Permission` rows are seeded for eight staff roles plus the `customer` role.
- Every server action and admin page calls `requireUser`, `requireStaff` or `requirePermission`
  before touching the database. UI hiding is never the only control.
- Customer-facing queries always filter by `customerId`/`userId` of the session user, so a
  guessed ID returns 404 rather than another customer's data.

## Input validation
- All mutations parse input with zod schemas (`src/lib/validation.ts`): strings are trimmed and
  length-capped, emails normalised, numbers coerced and bounded, enums restricted.
- File uploads are limited by size (`MAX_UPLOAD_MB`), MIME allow-list and stored under a random
  name in `UPLOAD_DIR`; downloads go through `/api/files/[id]` which checks ownership or staff
  permission before streaming.

## Abuse protection
- `src/lib/rate-limit.ts` provides a fixed-window limiter: login (10 / min per IP),
  registration (6 / min per IP), contact form (5 / 5 min per IP) and payment submission
  (10 / 10 min per user). It is in-memory, so a multi-instance deployment must swap the
  `Map` for Redis or a database table — the call sites stay the same.
- Every privileged mutation writes an `AuditLog` row (actor, action, entity, IP, user agent).

## Transport & headers
- `next.config.ts` sets `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`,
  HSTS in production and disables the `X-Powered-By` header.
- Server actions enforce a 12 MB body limit; uploads are capped separately.
- Payment gateway credentials are read from environment variables only; nothing is committed.

## Operational checklist before go-live
1. Set a strong `DATABASE_URL` password and restrict network access to the database.
2. Serve over HTTPS (HSTS is enabled only in production).
3. Change the seeded staff passwords (`Admin@12345`) immediately after the first login.
4. Point `UPLOAD_DIR` at a volume that is backed up and not web-served directly.
5. Rotate merchant numbers and gateway keys out of the repository into your secret manager.
