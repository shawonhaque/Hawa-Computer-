# Hawa Computer — website & management platform
> **Live preview:** <https://shawonhaque.github.io/Hawa-Computer-/> — static build of the public storefront (bilingual Bangla/English). Ordering, accounts and the admin panel need the full deployment.


A bilingual (Bangla / English) website and back-office for **Hawa Computer**, a Bangladeshi
computer and IT services business. One codebase covers the public site, the customer account
area and the staff admin panel.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Prisma · PostgreSQL**.

---

## What is inside

### Public site
| Area | Routes |
| --- | --- |
| Home, about, contact, FAQ | `/`, `/about`, `/contact`, `/faq` |
| Services | `/services`, `/services/[slug]` |
| Applications (passport, NID, licence…) | `/applications`, `/applications/[slug]` |
| Shop | `/shop`, `/shop/[slug]`, `/cart`, `/checkout` |
| Library | `/library`, `/library/[slug]` |
| Training | `/training`, `/training/[slug]` |
| Order tracking, certificate verification | `/track`, `/verify`, `/verify/[certNo]` |
| CMS pages, search | `/p/[slug]`, `/search` |
| Auth | `/login`, `/register` |

Every page renders Bangla or English from the `hc_locale` cookie, with per-page metadata,
canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt`.

### Customer account (`/account`)
Dashboard, orders and order detail, service orders, applications, courses and progress,
library membership and borrowed books, uploaded files, invoices (printable), support tickets,
notifications, profile and password.

### Staff admin (`/admin`)
Dashboard with revenue chart, order/service-order/application queues, product catalogue and
editor, inventory with stock movements, suppliers and purchases, library circulation,
courses, batches, students (fees, attendance, certificates), payment verification,
refunds, finance overview, expenses, reports with CSV export, customers, staff, roles and
permissions, CMS (pages, FAQs, testimonials, reviews), services, site settings, support
tickets, contact messages and the audit log.

### Business domain in Prisma
Services and service categories with dynamic form fields, applications and documents,
products, categories, stock movements, suppliers and purchases, orders, order items, invoices,
payments, refunds, courses, batches, enrollments, attendance, certificates, library books,
members and issues, support tickets and messages, notifications, CMS pages, FAQs, testimonials,
reviews, expenses, settings, users, roles, permissions, sessions, audit logs and rate limits.

---

## Getting started

```bash
npm install
cp .env.example .env          # set DATABASE_URL and NEXT_PUBLIC_SITE_URL
npx prisma migrate dev        # or: npx prisma db push
npm run db:seed               # services, products, books, courses, users, CMS content
npm run dev
```

Open <http://localhost:3000>.

### Seeded accounts

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `owner@hawacomputer.com` | `Admin@12345` |
| Admin | `admin@hawacomputer.com` | `Admin@12345` |
| Operator / photo editor / sales / librarian / instructor / accountant | see `prisma/seed.ts` | `Admin@12345` |
| Customer | `rahim@example.com` | `Customer@12345` |
| Customer | `fatema@example.com` | `Customer@12345` |

Change the staff passwords before going live.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed roles, permissions, catalogue and content |
| `npm run db:migrate` / `db:deploy` | Prisma migrations |
| `npm run db:studio` | Prisma Studio |

---

## Project layout

```
prisma/            schema.prisma, seed.ts, seed-content.ts
src/
  actions/         server actions (orders, account, applications, support, admin-*, notify)
  app/
    (site)/        public routes
    (account)/     /account routes (auth required)
    (admin)/       /admin routes (staff + permission required)
    api/           file downloads, CSV report export
  components/      ui/, site/, dashboard/ building blocks
  lib/             db, auth, permissions, validation, rate-limit, audit, i18n,
                   dictionaries, cart, payments, settings, storage, utils
  middleware.ts    session gate for /account and /admin
```

## Payments

Checkout supports bKash, Nagad, Rocket and manual/cash. Customers submit the sender number,
transaction ID and an optional screenshot; staff verify or reject each payment in
**Admin → Payments**, which updates the order payment status and writes an audit entry.
Merchant numbers come from `BKASH_MERCHANT_NUMBER`, `NAGAD_MERCHANT_NUMBER` and
`ROCKET_MERCHANT_NUMBER`, and are also editable in **Admin → Settings**.

## Security

See [SECURITY.md](./SECURITY.md) for the authentication model, RBAC enforcement, validation,
rate limiting, upload handling, headers and the go-live checklist.

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shawonhaque/Hawa-Computer-&env=DATABASE_URL,NEXT_PUBLIC_SITE_URL&project-name=hawa-computer)

Full instructions for Vercel, Docker and a bare Node process live in [DEPLOY.md](./DEPLOY.md).

```bash
# Docker / VPS
docker compose --profile setup run --rm migrate   # migrate + seed
docker compose up -d --build
```

```bash
# Vercel or any Node host
npm ci && npx prisma migrate deploy && npm run build && npm start
```

The app is stateless apart from uploads and PostgreSQL, so it scales horizontally — but replace
the in-memory rate limiter with Redis before running more than one instance.
