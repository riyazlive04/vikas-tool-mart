# Vikas Tool Mart — CROS

**Customer & Reputation Operations System** — a cloud, multi-user, bilingual
(English/Tamil), mobile-first web app for Vikas Tool Mart's CRE team. It reads
the live WooCommerce store to auto-populate daily metrics, lets staff work the
day's orders with one-tap actions that compute KPI counts automatically, tracks
complaints, and gives leadership a trustworthy real-time dashboard.

Built by **Sirah Digital**. See `Vikas_Tool_Mart_PRD_v2.md` for the product spec.

---

## Design principle

> As flexible and easy as possible. Reduce manual entry — but manual entry must
> always be possible.

1. **Automate-first** — anything WooCommerce knows is pulled automatically.
2. **Manual override, always** — every metric is editable; auto values are
   pre-filled suggestions. The app is 100% usable with sync turned off.
3. **Configurable, not hard-coded** — KPIs, tasks, and social channels are
   admin-editable database rows.

---

## Tech stack

- **Next.js 14** (App Router, TypeScript) — UI + route handlers + server actions
- **PostgreSQL 16 + Prisma**
- **Better Auth** — email + password, session-based, role-based (ADMIN/HEAD/CRE)
- **Tailwind CSS** (VTM brand), **Recharts**, **next-intl** (en/ta)
- **node-cron** worker for scheduled WooCommerce read-sync
- **@woocommerce/woocommerce-rest-api** (read-only), **@react-pdf/renderer** + **xlsx** exports
- **Zod** validation; **Vitest** tests

---

## Folder layout

```
/app            App Router (UI, route handlers, server actions under /app/actions)
/components     Mobile-first UI components
/lib            domain logic: auth, woo client, sync, kpi engine, dashboard, report, i18n, crypto
/prisma         schema.prisma + migrations + seed
/worker         node-cron scheduler calling the sync service
/messages       en.json, ta.json
/tests          vitest unit tests (+ tests/_manual integration checks)
docker-compose.yml · Dockerfile · .env.example
```

---

## Quick start (Docker)

```bash
cp .env.example .env
# Edit .env: set BETTER_AUTH_SECRET and APP_ENCRYPTION_KEY (see below).
docker compose up --build
```

This starts **postgres**, **app** (runs migrations + seed, then serves on
`http://localhost:3000`), and the **worker**. Seed credentials print in the app
container logs on first boot.

Generate the two required secrets:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET
openssl rand -base64 32   # APP_ENCRYPTION_KEY (must decode to 32 bytes)
```

> `POSTGRES_PORT` (default 5432) is the host-published port. If 5432 is taken,
> set e.g. `POSTGRES_PORT=5433` and match it in `DATABASE_URL`.

---

## Local development (npm)

```bash
npm install
cp .env.example .env            # fill in secrets; point DATABASE_URL at your DB
docker compose up -d postgres   # or use any Postgres 16
npx prisma migrate deploy       # apply migrations
npx prisma db seed              # seed KPIs/tasks/channels/users (prints creds)
npm run dev                     # http://localhost:3000
# In a second terminal, the scheduled sync worker:
npm run worker
```

### Production run with PM2 (Hostinger VPS)

```bash
npm ci
npm run build                                   # prisma generate + next build (standalone)
npx prisma migrate deploy && npx prisma db seed
pm2 start "node .next/standalone/server.js" --name vtm-app
pm2 start "npx tsx worker/index.ts"            --name vtm-worker
pm2 save
```

> Note: with `output: 'standalone'`, run the server via
> `node .next/standalone/server.js` (the Docker image does this). `next start`
> works for quick local checks but prints a standalone warning.

---

## Environment variables

See `.env.example` for the full list. Key ones:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `BETTER_AUTH_SECRET` | Session signing secret (`openssl rand -base64 32`) |
| `APP_ENCRYPTION_KEY` | 32-byte base64 key — AES-256-GCM for Woo secrets at rest |
| `SYNC_CRON` | Worker schedule (default `30 6 * * *`); admin can override in-app |
| `SEED_*_EMAIL` / `SEED_*_PASSWORD` | Seed user credentials (change after first login) |
| `WOO_STORE_URL` / `WOO_CONSUMER_KEY` / `WOO_CONSUMER_SECRET` | Optional; configure in-app instead |

---

## WooCommerce read-only API keys

In WordPress admin: **WooCommerce → Settings → Advanced → REST API → Add key**.

1. Description: `VTM CROS (read-only)`
2. User: an admin/shop-manager account
3. Permissions: **Read**
4. Generate, copy the **Consumer key** (`ck_…`) and **Consumer secret** (`cs_…`).

Then in CROS: **Admin → WooCommerce** → enter the store URL + keys → **Test
connection** → **Save**. Keys are stored encrypted (AES-256-GCM) and never shown
again. Use **Sync now** for an immediate pull; the worker syncs on schedule.

The app reads `orders`, `customers`, and `products/reviews` only — it never
writes to the store. If sync fails, the prior cache is kept and a banner shows
the failure; all metrics remain manually editable.

---

## Seed credentials

Printed once when the seed runs (defaults from `.env`):

| Role | Email | Password |
|---|---|---|
| ADMIN (MD) | `md@vikastoolmart.test` | `ChangeMe!Admin1` |
| HEAD (Indhumathi, CRE) | `indhumathi@vikastoolmart.test` | `ChangeMe!Head1` |
| CRE | `cre@vikastoolmart.test` | `ChangeMe!Cre1` |

**Change these after first login** (Admin → Users → Reset password).

---

## Roles

- **CRE** — daily workbook, order worklist, log complaints, own reports.
- **HEAD** — everything CRE plus the management dashboard, all complaints, summaries.
- **ADMIN** — everything plus admin config (users, WooCommerce, KPIs, tasks, channels).

---

## Testing

```bash
npm test            # vitest: KPI engine + compute + woo mapping + dates (33 tests)
```

Manual integration checks (need a running DB) live in `tests/_manual/`:

```bash
npx tsx tests/_manual/worklist-integration.ts     # orders → taps → KPI counts
npx tsx tests/_manual/complaints-integration.ts   # complaints feed KPIs
```

---

## Deploy to Hostinger VPS (notes)

1. Provision Ubuntu + Docker (or Node 20 + PM2 + managed Postgres).
2. Clone the repo, `cp .env.example .env`, set secrets + `DATABASE_URL`.
3. `docker compose up -d --build` (or the PM2 path above).
4. Put Nginx in front for TLS (`proxy_pass http://127.0.0.1:3000`); set
   `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` to the public HTTPS URL.
5. Health check: `GET /api/health`.
6. Back up Postgres regularly (e.g. nightly `pg_dump`).

> **DPDP / data residency:** host Postgres in an India region; customer PII
> (names/phones from orders + complaints) is access-controlled by role.

---

## Upgrade paths (left as clean extension points)

- **BullMQ** — replace the in-process cron trigger (`/worker`) with a Redis-backed
  queue when sync volume/retries grow (marked in `worker/index.ts`).
- **Google Business Profile** — auto-pull Google reviews (manual in P1).
- **Service / Marketing modules** — the config-driven KPIs + service-layer
  interfaces are ready for additional departments.
```
