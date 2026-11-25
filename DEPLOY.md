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
