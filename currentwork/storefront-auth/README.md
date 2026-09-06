# storefront-auth — Implementation Plan

**Alias:** `sa` — invoke as `/pipeline sa <section>` or `/discovery sa <section>`. Section IDs in YAML + commits still use the canonical slug `storefront-auth`.

## Context

`/products` is the monetization layer of travisgautier.com and the only place on
the site that requires authentication. Everything else — `/episodes`, `/cases`,
`/tools`, `/about` — stays open. This job is #3 in `docs/future-jobs.md` and
Phase 2 of `docs/website-implementation-plan.md` under "Products —
Storefront".

The scope is the complete `/products` route tree plus every piece of
infrastructure it needs to exist: a `Product` MDX content type and loader
(same pattern as `Episode`/`Case`), a Postgres persistence layer for users and
purchases, Auth.js v5 wired to Resend magic-link email, Stripe Checkout
integration, post-purchase delivery via a gated download route, and a
customer account page. The doc frames auth as the defining constraint —
**auth lives here and only here**, so every public route on the site must
continue to render without a session cookie after this job ships.

This job depends entirely on `website-foundation` (alias `wf`) having
shipped: brand design tokens, `<Container>`, `<Header>` + `NAV_ITEMS`, site
shell, `<EmailCapture>` (used as a shape reference for the sign-in form),
the MDX pipeline, the content loader pattern, Zod validators, the dynamic
sitemap, and the `resend` + `zod` dependencies all come from that job.

Out of scope (explicit non-goals, per `docs/future-jobs.md`):
subscription/recurring billing, course/cohort enrollment (separate
`cohort-enrollment` job), affiliate program, refund automation, search over
products, social login (magic-link only for v1), and real production product
content (seed data is two placeholder MDX files with stub copy).

The four strategic decisions flagged as jobbuild-time choices have been
resolved with the user:

1. **Auth provider**: Auth.js v5 with Resend magic-link.
2. **Payment flow**: Stripe Checkout (redirect).
3. **Delivery mechanism**: Gated download page + receipt email.
4. **Persistence**: Postgres + Drizzle ORM (local dev via `docker-compose.yml`).

## What Already Exists

### Already in the repo today (2026-04-11)
- **Next.js 16.2.3 App Router scaffold** — React 19.2.4, Tailwind 4, strict TS, `@/` → `src/`. (`package.json`, `tsconfig.json`, `next.config.ts`)
- **Content schemas** — `src/content/schemas/{content-tier,content-pillar,episode,source-material,index}.ts`
- **Test infra** — Vitest 2.1.8 + jsdom, `@testing-library/jest-dom/vitest` loaded via `src/__tests__/setup.ts`, MSW 2.7 installed, coverage thresholds 70/80/80/80 (`vitest.config.ts`)
- **Source docs** — `docs/website-implementation-plan.md`, `docs/future-jobs.md`, `docs/brand-identity.md`

### Delivered by `website-foundation` (prerequisite — NOT YET SHIPPED when this plan is written)
This job reuses these `wf` outputs and cannot start until they exist.

- **Brand design tokens** (`src/app/globals.css` from wf 1.3) — `--color-{ink,parchment,ember,steel,mist,signal}` + semantic aliases `--color-{background,foreground,muted,accent,link}`. Tailwind surface: `bg-accent`, `text-muted`, `border-mist`, `text-link`, `bg-parchment`, `font-display`.
- **`<Container>` layout primitive** (`src/components/site/Container.tsx` from wf 1.4) — `mx-auto w-full max-w-5xl px-6 md:px-10`, accepts `className` + `as` prop (`div`/`section`/`main`/`article`).
- **`<Header>` + `NAV_ITEMS`** (`src/components/site/Header.tsx` from wf 1.4) — this job modifies `NAV_ITEMS` to add `/products` alongside `/episodes`, `/cases`, `/about`.
- **`<Footer>`** (`src/components/site/Footer.tsx` from wf 1.4) — reused unchanged.
- **`<EmailCapture source="..." />`** (`src/components/capture/EmailCapture.tsx` from wf 4.1) — not rendered inside `/products` (no capture funnels from the storefront) but its `useActionState` + server action shape is the template for `<SignInForm>`.
- **Content loader pattern** (`src/lib/content/loader.ts`, `src/lib/content/episodes.ts`, `src/lib/content/cases.ts` from wf 2.2) — mirrored as `src/lib/content/products.ts` with `getAllProducts()` / `getProductBySlug()`.
- **MDX pipeline** (`next.config.ts` wrapped with `createMDX()`, `mdx-components.tsx` at project root, wf 2.1) — reused unchanged; product MDX files slot in at `src/content/products/*.mdx`.
- **Zod validators** (`src/content/schemas/validators.ts` from wf 1.2) — `CaseSchema` is the template for `ProductSchema`.
- **`Case` schema shape** (`src/content/schemas/case.ts` from wf 1.1) — reference for the `Product` interface structure and the `as const` tuple + `z.enum(TUPLE)` pattern.
- **`generateStaticParams` + `dynamicParams = false`** (wf 3.3 for `/episodes/[slug]`, wf 3.5 for `/cases/[slug]`) — same pattern for `/products/[slug]`.
- **JSON-LD via `dangerouslySetInnerHTML`** (wf 4.3) — same pattern for `Product` + `Offer` structured data on product detail pages.
- **Dynamic sitemap** (`src/app/sitemap.ts` from wf 4.4) — MODIFY to append `/products` + per-product URLs. Gated routes (`/products/account/*`, `/products/downloads/*`, `/login*`) NEVER appear in the sitemap.
- **`metadataBase`** (`src/app/layout.tsx` from wf 1.3) — reused for OpenGraph URLs.
- **`resend` dependency** (installed by wf 4.1) — reused for Auth.js magic-link + purchase confirmation emails.
- **`zod` dependency** (installed by wf 1.2) — reused throughout.

### Gaps (must build fresh — `wf` provides zero coverage)
- Auth layer (identity, session management, sign-in flow)
- Route protection middleware
- A persistence layer of any kind
- Stripe integration (checkout, webhook, fulfillment)
- Download delivery
- Customer account UI

## Feature Overview (10 Features, 4 Phases)

| #   | Feature                                                                                         | Phase                      | Size | Status  |
|-----|-------------------------------------------------------------------------------------------------|----------------------------|------|---------|
| 1.1 | Product content pipeline — schema + enums + Zod validator + loader + 2 seed MDX files           | 1 - Catalog                | M    | Shipped |
| 1.2 | Products catalog routes — `/products` index + `/products/[slug]` detail + `ProductCard`/`BuyButton` (CTA disabled until Phase 3) | 1 - Catalog                | M    | Shipped |
| 2.1 | Postgres + Drizzle setup — schema, migrations, client, `docker-compose.yml` for local dev       | 2 - Auth + Persistence     | L    | Planned |
| 2.2 | Auth.js v5 integration — Resend magic-link provider, Drizzle adapter, session config            | 2 - Auth + Persistence     | L    | Shipped |
| 2.3 | Middleware route protection + `/login` + `/login/verify` pages + `<SignInForm>` client component | 2 - Auth + Persistence     | L    | Shipped |
| 3.1 | Stripe client + price-map resolver + `createCheckoutSession()` server action + BuyButton live   | 3 - Payments + Fulfillment | L    | Shipped |
| 3.2 | Stripe webhook handler — signature verification + idempotent `purchases` write + Resend confirmation email | 3 - Payments + Fulfillment | L    | Shipped |
| 3.3 | Download route handler — verifies purchase, streams file from `private/products/`               | 3 - Payments + Fulfillment | M    | Shipped |
| 4.1 | Account UI — `/products/account` overview + `/products/account/purchases/[id]` detail + sign-out button | 4 - Account + SEO          | M    | Shipped |
| 4.2 | SEO polish + error boundaries + Lighthouse sweep — JSON-LD, sitemap, nav, robots, segment error/not-found | 4 - Account + SEO          | M    | Shipped |

**Size guide**: S = few hours, single file. M = half day, 2-3 files. L = full day, 4+ files. XL = multi-day, new content type + loader + UI.

Total rough job size: **XL** — the biggest job in the travisgautier backlog by
feature count and by the breadth of new infrastructure (DB + auth + payments
+ fulfillment, all net-new).

## Dependency Graph

```
Phase 1: Catalog (public)
│
│   1.1 → 1.2                    ← strictly sequential
│
v
Phase 2: Auth + Persistence
│
│   2.1 → 2.2 → 2.3              ← strictly sequential
│
v
Phase 3: Payments + Fulfillment
│
│   3.1 ─┬─→ 3.2 → 3.3
│        └─→ 3.3                 ← 3.2 + 3.3 both depend on 3.1 (shared client)
│
v
Phase 4: Account + SEO polish
│
    4.1, 4.2                     ← parallel after Phase 3 ships
```

Hard dependencies:
- **1.1 → 1.2** — both catalog routes call `getAllProducts()` / `getProductBySlug()`; the validator gates the loader at content boundary.
- **Phase 1 → Phase 2** — Phase 2 doesn't read the product catalog, but the plan ships sequentially so the public catalog is shippable on its own if auth/payments slip.
- **2.1 → 2.2** — Auth.js adapter consumes Drizzle schema (`users`, `sessions`, `verificationTokens` tables).
- **2.2 → 2.3** — middleware reads the Auth.js session cookie set by sign-in; `<SignInForm>` calls Auth.js's `signIn('resend', ...)` server action.
- **Phase 2 → Phase 3** — every payment feature depends on a logged-in user (Stripe customer linked to `users.id`) and on `purchases` table existing.
- **3.1 → 3.2, 3.3** — webhook + download handler both consume the Stripe client and the live BuyButton from 3.1.
- **3.2 → 3.3** — download handler reads `purchases` rows that the webhook wrote.
- **Phase 3 → Phase 4** — account pages read `purchases` rows the webhook creates.
- **4.2** can run in parallel with **4.1** after Phase 3 ships — different surfaces (account UI vs cross-cutting SEO/error polish).

## New Content Types Required

| Type      | Phase | Purpose                                                                                        |
|-----------|-------|------------------------------------------------------------------------------------------------|
| `Product` | 1     | Product catalog record — slug, title, summary, price (cents), currency, category, license type, `stripePriceId`, asset filename (resolved under `private/products/`), optional hero image, LLL crosslink URLs |

The `Product` schema lives at `src/content/schemas/product.ts` and is
re-exported from `src/content/schemas/index.ts` alongside `Episode`, `Case`,
`SourceMaterial`. Product content files live at `src/content/products/*.mdx`
following the same `export const meta = {...}` + MDX body convention
established by `wf` 2.3 for episodes and cases.

## New DB Tables (Drizzle schemas, Postgres dialect)

| Table                 | Phase | Fields (abridged)                                                                                                                                               |
|-----------------------|-------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `users`               | 2.1   | `id` (uuid pk, default `gen_random_uuid()`), `email` (text unique), `createdAt` (timestamptz), `lastSignInAt` (timestamptz nullable)                            |
| `sessions`            | 2.1   | `sessionToken` (text pk), `userId` (uuid fk → `users.id` on delete cascade), `expires` (timestamptz) — required by `@auth/drizzle-adapter`                      |
| `verificationTokens`  | 2.1   | `identifier` (text), `token` (text), `expires` (timestamptz), composite pk (`identifier`, `token`) — required by `@auth/drizzle-adapter` for magic-link         |
| `purchases`           | 2.1   | `id` (uuid pk), `userId` (uuid fk → `users.id`), `productSlug` (text), `stripeSessionId` (text unique), `stripePaymentIntentId` (text), `amountCents` (integer), `currency` (text, default `'usd'`), `purchasedAt` (timestamptz, default `now()`) |

Indexes: `purchases(user_id)` for account-page list queries,
`purchases(stripe_session_id)` (implicit via UNIQUE) for webhook idempotency
checks. No `email` password column — Auth.js v5 magic-link never touches
passwords.

## Critical Files Reference

### New files

**Content schema + catalog (Phase 1)**
| File                                                  | Role                                                                 |
|-------------------------------------------------------|----------------------------------------------------------------------|
| `src/content/schemas/product.ts`                      | NEW — `Product` interface, `PRODUCT_CATEGORIES`, `PRODUCT_LICENSE_TYPES` tuples, label maps |
| `src/content/schemas/index.ts`                        | MODIFY — `export * from './product'`                                  |
| `src/content/schemas/validators.ts`                   | MODIFY — append `ProductSchema` + `ProductInput` input type           |
| `src/content/schemas/__tests__/validators.test.ts`    | MODIFY — extend with `ProductSchema` cases                            |
| `src/content/products/workflow-templates.mdx`         | NEW — seed product #1 (stub copy)                                     |
| `src/content/products/discovery-toolkit.mdx`          | NEW — seed product #2 (stub copy)                                     |
| `src/lib/content/products.ts`                         | NEW — `getAllProducts()`, `getProductBySlug()`, built on wf's `loadContent()` core |
| `src/lib/content/__tests__/products.test.ts`          | NEW                                                                   |

**Public catalog routes (Phase 1)**
| File                                                  | Role                                                                 |
|-------------------------------------------------------|----------------------------------------------------------------------|
| `src/app/products/page.tsx`                           | NEW — `/products` index (async server component)                      |
| `src/app/products/[slug]/page.tsx`                    | NEW — `/products/[slug]` detail + `generateStaticParams` + `generateMetadata` |
| `src/app/products/__tests__/page.test.tsx`            | NEW                                                                   |
| `src/app/products/[slug]/__tests__/page.test.tsx`     | NEW                                                                   |
| `src/components/products/ProductCard.tsx`             | NEW — used by the index                                                |
| `src/components/products/BuyButton.tsx`               | NEW — client component, disabled in Phase 1, wired live in Phase 3.1  |

**Persistence + auth (Phase 2)**
| File                                                  | Role                                                                 |
|-------------------------------------------------------|----------------------------------------------------------------------|
| `src/db/client.ts`                                    | NEW — `postgres` client singleton + Drizzle wrapper                   |
| `src/db/schema.ts`                                    | NEW — Drizzle Postgres tables + relations                             |
| `src/db/migrations/0000_init.sql`                     | NEW — generated by `drizzle-kit`                                      |
| `src/db/migrations/meta/*`                            | NEW — migration metadata (generated)                                  |
| `src/db/__tests__/schema.test.ts`                     | NEW — insert/select + constraint coverage against a disposable DB     |
| `drizzle.config.ts`                                   | NEW — `dialect: 'postgresql'`, schema path, migrations path            |
| `docker-compose.yml`                                  | NEW — local dev Postgres 16 on `localhost:5432`, named volume, `.env.local`-driven credentials |
| `src/auth.ts`                                         | NEW — Auth.js v5 config: `handlers`, `auth`, `signIn`, `signOut` exports |
| `src/app/api/auth/[...nextauth]/route.ts`             | NEW — re-exports `handlers.GET` + `handlers.POST`                      |
| `middleware.ts` (project root)                        | NEW — Edge-runtime matcher + session check via `request.cookies`       |
| `src/app/login/page.tsx`                              | NEW — login form                                                       |
| `src/app/login/verify/page.tsx`                       | NEW — "check your email" confirmation                                   |
| `src/components/auth/SignInForm.tsx`                  | NEW — client component, uses `useActionState` around `signIn('resend', ...)` |
| `src/__tests__/middleware.test.ts`                    | NEW — verifies the matcher + redirect behavior                         |

**Payments + fulfillment (Phase 3)**
| File                                                                 | Role                                                       |
|----------------------------------------------------------------------|------------------------------------------------------------|
| `src/lib/stripe/client.ts`                                           | NEW — `stripe` SDK singleton with `apiVersion` pinned      |
| `src/lib/stripe/price-map.ts`                                        | NEW — `resolveStripePriceId(productSlug)` helper           |
| `src/lib/stripe/checkout.ts`                                         | NEW — `createCheckoutSession()` server action              |
| `src/app/api/stripe/webhook/route.ts`                                | NEW — POST handler, signature verification, purchase upsert |
| `src/app/api/products/downloads/[purchaseId]/route.ts`               | NEW — GET handler, streams asset after ownership check     |
| `src/lib/email/purchase-confirmation.ts`                             | NEW — Resend email template + send helper                  |
| `src/lib/stripe/__tests__/checkout.test.ts`                          | NEW                                                        |
| `src/app/api/stripe/webhook/__tests__/route.test.ts`                 | NEW                                                        |
| `src/app/api/products/downloads/[purchaseId]/__tests__/route.test.ts`| NEW                                                        |
| `private/products/workflow-templates.zip`                            | NEW — placeholder binary (stub content; committed for dev) |
| `private/products/discovery-toolkit.zip`                             | NEW — placeholder binary                                   |
| `.gitignore`                                                         | MODIFY — leave placeholders tracked, ignore future real assets via a documented rule |

**Customer account (Phase 4)**
| File                                                  | Role                                                                 |
|-------------------------------------------------------|----------------------------------------------------------------------|
| `src/app/products/account/page.tsx`                   | NEW — purchases overview                                              |
| `src/app/products/account/purchases/[id]/page.tsx`    | NEW — purchase detail + download link                                 |
| `src/components/account/PurchaseList.tsx`             | NEW                                                                   |
| `src/components/account/SignOutButton.tsx`            | NEW — client component, calls `signOut()` server action               |
| `src/app/products/account/__tests__/page.test.tsx`    | NEW                                                                   |

**SEO + global (Phases 1 & 4)**
| File                                                  | Role                                                                 |
|-------------------------------------------------------|----------------------------------------------------------------------|
| `src/app/sitemap.ts`                                  | MODIFY — append `/products` + per-product URLs, never gated routes    |
| `src/app/robots.ts`                                   | MODIFY — disallow `/products/account`, `/products/downloads`, `/login`, `/login/verify` |
| `src/components/site/Header.tsx`                      | MODIFY — add `{ href: '/products', label: 'Products' }` to `NAV_ITEMS` |
| `public/llms.txt`                                     | MODIFY — mention `/products` as a public catalog, note gated account routes are intentionally excluded |

### Reference-only files (read, don't modify)
- `src/content/schemas/case.ts` — shape to mirror for `Product`
- `src/content/schemas/validators.ts` — `CaseSchema` is the template for `ProductSchema`
- `src/lib/content/loader.ts` — core `loadContent<T>()` helper called by the product loader
- `src/lib/content/episodes.ts` + `src/lib/content/cases.ts` — loader API to mirror in `products.ts`
- `src/app/episodes/[slug]/page.tsx` + `src/app/cases/[slug]/page.tsx` — detail page pattern (`async`, `params: Promise<{ slug: string }>`, `generateStaticParams`, `dynamicParams = false`, JSON-LD inline)
- `src/components/capture/EmailCapture.tsx` — `useActionState` + server action shape for `<SignInForm>`
- `src/app/sitemap.ts` (before modification) — existing dynamic sitemap pattern
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md` — Next.js 16 guidance on middleware, cookies, sessions
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` — async `cookies()` API
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — Route Handler signatures
- `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` — `params: Promise<...>` breaking change

## Verification Plan

| Phase | Verification |
|-------|--------------|
| 1     | `npm run lint` clean. `npm test` — `ProductSchema` validator unit tests green, product loader test loads both seed MDX files. `npm run build` clean with new static params for both product slugs. Manual `/products` renders two cards under `npm run dev`. `/products/workflow-templates` and `/products/discovery-toolkit` detail pages render MDX body, price, category, and a visually disabled Buy button (no click handler yet). `/products/bogus` 404s at build time via `dynamicParams = false`. |
| 2     | `docker compose up -d postgres` spins up local Postgres 16. `npm run db:generate` + `npm run db:migrate` apply the init migration cleanly. `npm test` — schema tests insert/select/constraint checks pass against the dev DB. Auth.js sign-in end-to-end: submit email at `/login` → receive magic-link via Resend (live `RESEND_API_KEY` required) → clicking link sets `authjs.session-token` cookie → `/products/account` accessible. Middleware smoke: anonymous GET `/products/account` → 307 to `/login`; anonymous GET `/products` → 200 (public). Public routes `/`, `/episodes`, `/cases`, `/about`, `/tools`, `/products`, `/products/[slug]` all render without a session. |
| 3     | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`. From `/products/workflow-templates`, clicking Buy (now enabled) → server action creates a Stripe Checkout Session → redirect to the hosted Stripe page → test-card purchase → return URL hits `/products/account?purchased=workflow-templates`. Stripe CLI `stripe listen --forward-to localhost:3000/api/stripe/webhook` forwards the event; the webhook writes a `purchases` row with the correct `userId`, `productSlug`, `amountCents`, `stripeSessionId`. Second delivery of the same event (replayed via `stripe events resend`) does NOT create a duplicate row. Resend delivers a purchase confirmation email with a "View your purchase" link pointing at `/products/account`. Download handler: logged-in purchaser GET `/api/products/downloads/{id}` streams the correct zip; different logged-in user gets 403; anonymous gets 401. |
| 4     | `/products/account` renders the authenticated user's purchases list (sorted by `purchasedAt` desc) with a "Download" button per row. `/products/account/purchases/{id}` renders purchase detail (receipt-style) + download button. `<SignOutButton>` clears the session cookie and redirects to `/`. `/sitemap.xml` contains `/`, `/episodes/*`, `/cases/*`, `/products`, `/products/workflow-templates`, `/products/discovery-toolkit` — does NOT contain any `/products/account*`, `/products/downloads*`, `/login*`. `/robots.txt` disallows those gated paths. Per-product `<title>` and `<meta description>` are unique; `Product` + `Offer` JSON-LD blocks present on detail pages and validate at https://validator.schema.org. Lighthouse local run on `/products` and `/products/workflow-templates`: a11y ≥ 95, perf ≥ 90, SEO ≥ 95, best practices ≥ 90. Keyboard-only walkthrough of the full buy → account → download flow reaches every interactive element. |
| All   | `npm run lint` clean. `npm test` green + coverage ≥ thresholds (70/80/80/80). `npm run build` clean. Manual smoke against `npm run start`: `/` (home), `/episodes`, `/cases`, `/about`, `/tools`, `/products`, `/products/workflow-templates` (Buy button live), end-to-end Stripe test-card purchase, post-purchase `/products/account`, `/products/account/purchases/[id]`, download streams correct file, sign out clears session, `/sitemap.xml`, `/robots.txt`, `/llms.txt`. |

## Phase Documentation

- [Phase 1: Catalog](./phase-1-catalog.md) — `Product` schema, validator, loader, `/products` index, `/products/[slug]` detail
- [Phase 2: Auth + Persistence](./phase-2-auth-persistence.md) — Postgres+Drizzle, Auth.js v5, middleware, login pages
- [Phase 3: Payments + Fulfillment](./phase-3-payments.md) — Stripe client, checkout session, webhook, download handler, confirmation email
- [Phase 4: Account + SEO](./phase-4-account-seo.md) — account pages, sign-out, SEO/JSON-LD/sitemap/nav/robots, polish

## Dependencies to Add

Installed at the start of each phase that needs them:

- Phase 2.1: `postgres`, `drizzle-orm`, `drizzle-kit` (devDep)
- Phase 2.2: `next-auth@5`, `@auth/drizzle-adapter`
- Phase 3.1: `stripe`

Already installed by `wf` and reused: `zod`, `resend`, `@testing-library/*`, `vitest`, Tailwind, React 19.

## Environment Variables

Required before the matching phase can be verified end-to-end. All are server-only (no `NEXT_PUBLIC_` prefix) except the Stripe publishable key.

| Variable                             | Phase | Purpose                                                                |
|--------------------------------------|-------|------------------------------------------------------------------------|
| `DATABASE_URL`                       | 2.1   | Postgres connection string, e.g. `postgres://travisgautier:dev@localhost:5432/travisgautier` |
| `POSTGRES_USER`                      | 2.1   | Consumed by `docker-compose.yml` for local dev                         |
| `POSTGRES_PASSWORD`                  | 2.1   | Consumed by `docker-compose.yml`                                       |
| `POSTGRES_DB`                        | 2.1   | Consumed by `docker-compose.yml`                                       |
| `AUTH_SECRET`                        | 2.2   | Random 32-byte secret for Auth.js — generate via `openssl rand -base64 32` |
| `AUTH_URL`                           | 2.2   | Absolute URL, e.g. `http://localhost:3000` in dev, `https://travisgautier.com` in prod |
| `RESEND_API_KEY`                     | 2.2   | Magic-link email sender — already required by `wf` 4.1                 |
| `AUTH_RESEND_FROM`                   | 2.2   | e.g. `no-reply@travisgautier.com`                                          |
| `STRIPE_SECRET_KEY`                  | 3.1   | Stripe API secret key                                                   |
| `STRIPE_WEBHOOK_SECRET`              | 3.2   | Webhook signature verification                                          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 3.1   | Client-visible key — currently unused (Checkout redirect), kept for Phase 2 of Elements |

## Open Items (Resolve During Implementation)

- **Product seed copy** — 1.1 ships two stub MDX files with placeholder title / summary / price. Real product content is a separate concern and not part of this job.
- **Stripe product/price provisioning** — user must create Stripe `Product` + `Price` objects in the Stripe dashboard and map the resulting `price_xxx` IDs to product slugs via the `stripePriceId` field in each MDX `meta` export. Phase 3.1's `resolveStripePriceId()` helper reads from the loaded `Product` record.
- **Production DB hosting** — `docker-compose.yml` covers local dev. Production hosting decision (same VPS via docker/systemd vs managed Postgres via Neon/Supabase/Render) is deferred; the app only needs `DATABASE_URL`. Document the decision in `docs/deployment-notes.md` (new, as a follow-up) before the first deploy.
- **License-model scaling** — `PRODUCT_LICENSE_TYPES` tuple ships with `'single-user' | 'team' | 'agency'` to leave room for future expansion, but only `'single-user'` appears in seed data and is handled by the checkout flow. Team/agency pricing + seat management is a future job.
- **Asset hosting migration** — Phase 3.3 streams files from `private/products/` on the VPS filesystem. Migrating to S3-compatible object storage with signed URLs is a future polish.

## Section IDs for TDD Workflow

Each feature maps to one section ID used by `/discovery`, `/red`, `/green`, `/refactor`. Section IDs use the canonical slug `storefront-auth`, not the alias `sa`.

| Section ID              | Feature                                                              |
|-------------------------|----------------------------------------------------------------------|
| `storefront-auth-1.1`   | Product content pipeline (schema + validator + loader + seed MDX)    |
| `storefront-auth-1.2`   | Products catalog routes (index + detail)                              |
| `storefront-auth-2.1`   | Postgres + Drizzle setup                                              |
| `storefront-auth-2.2`   | Auth.js v5 + Resend magic-link                                        |
| `storefront-auth-2.3`   | Middleware + login pages + SignInForm                                 |
| `storefront-auth-3.1`   | Stripe client + checkout action + BuyButton live                     |
| `storefront-auth-3.2`   | Stripe webhook + purchase confirmation email                          |
| `storefront-auth-3.3`   | Download route handler                                                |
| `storefront-auth-4.1`   | Account UI (overview + purchase detail + sign-out)                    |
| `storefront-auth-4.2`   | SEO + error boundaries + Lighthouse sweep                             |

These IDs are consumed by `pipeline/active/session.yaml` and used as directory names under `pipeline/active/`.
