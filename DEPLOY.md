# Deployment

Three supported paths. All of them need a PostgreSQL database and the environment variables
from [`.env.example`](./.env.example).

## 1. Vercel (fastest)

1. Create a free Postgres database at [Neon](https://neon.tech) or [Supabase](https://supabase.com)
   and copy its connection string (add `?sslmode=require` for Neon).
2. Import the repository on Vercel, or use the deploy button in the README.
3. Set the environment variables:
   - `DATABASE_URL` — the Postgres connection string
   - `NEXT_PUBLIC_SITE_URL` — `https://<your-project>.vercel.app` (or your domain)
   - `BUSINESS_PHONE`, `BUSINESS_WHATSAPP`, `BUSINESS_EMAIL`
   - `BKASH_MERCHANT_NUMBER`, `NAGAD_MERCHANT_NUMBER`, `ROCKET_MERCHANT_NUMBER`
4. Apply the schema and seed once from your machine, pointed at the same database:

   ```bash
   DATABASE_URL="postgresql://…" npx prisma migrate deploy
   DATABASE_URL="postgresql://…" npm run db:seed
   ```

   (Or run `npm run db:seed` from a Vercel CLI shell — the seed is idempotent.)
5. Uploads are written to `UPLOAD_DIR`, which is ephemeral on Vercel. For production, point
   `UPLOAD_DIR` at a mounted volume or swap `src/lib/storage.ts` for S3/R2.

## 1b. Vercel from GitHub Actions (no local setup)

`.github/workflows/deploy-vercel.yml` deploys `main` to production on every push once three
repository secrets exist. Nothing else needs to change.

| Secret | Where to find it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account settings → Tokens → Create |
| `VERCEL_ORG_ID` | `vercel link` writes it to `.vercel/project.json`, or Project → Settings → General |
| `VERCEL_PROJECT_ID` | same file / same page |

Set `DATABASE_URL` and the other variables in the Vercel project itself (not in GitHub) — the
workflow pulls them with `vercel pull`. It then runs `prisma migrate deploy` against that
database before publishing, and skips migrations if `DATABASE_URL` is absent.

`npm install` runs `prisma generate` through the `postinstall` script, so the Prisma client
exists before `next build` on any host.

## 2. Docker / any VPS

```bash
git clone https://github.com/shawonhaque/Hawa-Computer-.git
cd Hawa-Computer-
cp .env.example .env            # set POSTGRES_PASSWORD and NEXT_PUBLIC_SITE_URL
docker compose --profile setup run --rm migrate   # migrate + seed
docker compose up -d --build
```

The app listens on port 3000. Put Nginx/Caddy in front for TLS, then set
`NEXT_PUBLIC_SITE_URL` to the public origin and rebuild so canonical links and the sitemap match.

`docker compose` persists the database in the `db_data` volume and uploads in `uploads`.

## 3. Bare Node process

```bash
npm ci
npx prisma migrate deploy
npm run db:seed          # first deploy only
npm run build
npm start                # PORT=3000 by default
```

Run it under systemd or pm2, behind a TLS-terminating proxy. Persist `UPLOAD_DIR`.

## Post-deploy checklist

- [ ] `NEXT_PUBLIC_SITE_URL` matches the public origin (sitemap, canonical URLs, Open Graph).
- [ ] Staff password changed from the seeded `Admin@12345`.
- [ ] Merchant numbers and gateway keys live in the host's secret manager, not in git.
- [ ] `UPLOAD_DIR` is backed up together with the database.
- [ ] More than one app instance? Move the rate limiter in `src/lib/rate-limit.ts` to Redis.
- [ ] `GET /admin` while logged out redirects to `/login`; a customer is sent to `/account`.

## 4. Production runbook (VPS)

The Docker path is the reference deployment. A 2 vCPU / 2 GB box runs the app, Postgres and
Caddy comfortably for a single shop.

**First deploy**

```bash
git clone https://github.com/shawonhaque/Hawa-Computer-.git /srv/hawa
cd /srv/hawa
cp .env.example .env                     # POSTGRES_PASSWORD, NEXT_PUBLIC_SITE_URL, BUSINESS_*
sed -i "s/^NEXT_PUBLIC_SITE_URL=.*/NEXT_PUBLIC_SITE_URL=https:\/\/shop.example.com/" .env
docker compose --profile setup run --rm migrate
SITE_DOMAIN=shop.example.com docker compose --profile proxy up -d --build
docker compose exec app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.text()).then(console.log)"
```

Caddy obtains the TLS certificate on its own once DNS points at the box and ports 80/443 are
open. Without `SITE_DOMAIN` the proxy serves `localhost` with an internal certificate, which is
fine for a smoke test only.

**Health**

`GET /api/health` returns `{"status":"ok","db":"up"}` with `200`, or `503` when Postgres is
unreachable. Point UptimeRobot / Better Stack / your monitoring at
`https://shop.example.com/api/health` and alert on non-200.

**Backups**

```bash
# nightly at 02:30, keeps 14 dumps under /srv/hawa/backups
( crontab -l 2>/dev/null; echo "30 2 * * * /srv/hawa/scripts/backup-db.sh >> /var/log/hawa-backup.log 2>&1" ) | crontab -
```

Restore drill (do it once before you need it):

```bash
gunzip -c backups/hawa-20260101T023000Z.sql.gz | docker compose exec -T db psql -U hawa -d hawa_computer
docker compose restart app
```

Copy dumps off the box (`rclone`, `scp`, or an object-storage bucket). A dump that only lives on
the same disk as the database is not a backup.

**Updates**

```bash
cd /srv/hawa && git pull
docker compose --profile setup run --rm migrate       # applies new migrations, seed is idempotent
docker compose up -d --build
docker compose ps                                     # wait for "healthy"
```

**What still needs an account before it is fully live**

| Capability | State in code | What to add |
|---|---|---|
| Card / mobile-money gateway | Not integrated — checkout records the method and staff confirm payment | bKash or SSLCommerz merchant account + a webhook route, then flip the order to `PAID` |
| SMS (order updates) | `sendSms()` logs and skips unless configured | `SMS_API_URL`, `SMS_API_KEY` (any provider accepting a JSON POST) |
| Email (order + contact notifications) | `sendEmail()` logs and skips unless configured | `EMAIL_API_URL`, `EMAIL_API_KEY`, `EMAIL_FROM` |
| Static GitHub Pages mirror | Read-only brochure: carts, logins and orders live in the visitor's browser | Nothing — it is a preview; the Docker/Vercel host is the shop |

### Static preview (GitHub Pages)

`scripts/build-static.sh` + `scripts/publish-gh-pages.sh` publish a crawl-based mirror of the
site to the `gh-pages` branch for `https://shawonhaque.github.io/Hawa-Computer-/`. It is built with
`NEXT_PUBLIC_STATIC_MODE=1`, so a checkout stores the order in the browser and offers a
prefilled WhatsApp message instead of writing to Postgres. Use it for demos and SEO — real
orders belong on the server deployment.

### CI

`.github/workflows/ci.yml` runs on every push and pull request: installs with the committed
lockfile, applies migrations to a throwaway Postgres 17 service, seeds, then runs
`typecheck`, `lint` and `build`. A second job builds the production image and smoke-runs it.
`.github/workflows/deploy-vercel.yml` stays as the optional Vercel path.
