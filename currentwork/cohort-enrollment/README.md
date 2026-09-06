# cohort-enrollment — Implementation Plan

**Alias:** `ce` — invoke as `/pipeline ce <section>` or `/discovery ce <section>`. Section IDs in YAML + commits still use the canonical slug `cohort-enrollment`.

## Context

`cohort-enrollment` is job #7 in `docs/future-jobs.md` and maps to the single
"Cohort enrollment integration" bullet in Phase 3 of
`docs/website-implementation-plan.md` (line 209). It delivers the
full applicant funnel for a paid cohort: a public catalog of upcoming
cohorts, a waitlist form for pre-announce interest capture, an authenticated
application form, an editorial review dashboard, acceptance emails with
single-use payment links, Stripe-backed enrollment, and an enrolled-student
view inside the existing `/products/account`.

This job explicitly does **not** build the cohort delivery platform itself —
no lessons, no video player, no Zoom integration, no chat, no automated
application scoring, no calendar integration. Those are out of scope per
`docs/future-jobs.md` §7. This job's job is "the site-side half of running a
cohort": surface it, capture interest, take applications, decide who's in,
take payment, and show a student their enrollment. Everything after payment
is handled out-of-band by the operator emailing logistics manually — a
future `cohort-delivery` job adds the rest.

The job depends entirely on two prior jobs having shipped through the full
TDD pipeline:

- **`website-foundation`** (alias `wf`) — site shell, design tokens, MDX
  pipeline, content loader core, Zod validators, email capture pattern,
  dynamic sitemap/robots.
- **`storefront-auth`** (alias `sa`) — Postgres + Drizzle stack, Auth.js v5
  magic-link, `users`/`sessions`/`purchases` tables, `middleware.ts` route
  protection, Stripe client singleton, Stripe webhook route, `/products/account`
  overview page.

Neither job has shipped yet (`pipeline/active/session.yaml` shows zero
completed sections as of 2026-04-11) — every contract in this plan is drawn
from `currentwork/{website-foundation,storefront-auth}/phase-*.md`, not from
live code. `email-funnel` is a peer of this job (job #4 in future-jobs.md)
and ships `src/db/migrations/0001_email_funnel.sql`; this job's migration is
`0002_cohort_enrollment.sql`. If the two ship in reverse order, `drizzle-kit
generate` advances the numbers automatically and the tables don't conflict.

Four strategic decisions resolved with the user at jobbuild time:

1. **Payment mechanism** — Pre-provisioned Stripe Price IDs per cohort.
   Each `Cohort` MDX carries a `stripePriceId` field; operator creates the
   Stripe Price in the dashboard and pastes the `price_xxx` ID. Acceptance
   emails carry a signed one-time token that redirects to a Checkout Session
   against that price. Mirrors sa's `Product.stripePriceId` pattern exactly.
2. **Application auth** — Magic-link sign-in required on
   `/cohorts/[slug]/apply`. sa's Auth.js v5 middleware matcher is extended to
   cover the route. `cohort_applications.userId` is a non-nullable fk to
   `users.id`.
3. **Review UI** — Gated admin dashboard at `/admin/cohorts/applications`.
   An `ADMIN_EMAILS` env allowlist is enforced by a new shared
   `src/app/admin/layout.tsx`. Mirrors the `/admin/email-funnel` pattern
   planned in `currentwork/email-funnel/README.md`; the same env var is
   shared across both jobs.
4. **Enrollee view** — Extend sa's `/products/account` with a Cohorts
   section. Adds a new `/products/account/cohorts` subroute plus a "My
   cohorts" card on the existing overview. No parallel `/cohorts/account`
   tree — reuses sa's layout, sign-out button, and auth gate.

Out of scope (explicit non-goals): cohort delivery platform, automated
application scoring, calendar integration, recurring/subscription billing
for cohorts, payment plans, partial refunds, waitlist auto-promotion when a
seat opens up, A/B-tested acceptance email copy, public application-status
pages, and SMS notifications. Decline and waitlist-decision emails ship with
generic fixed copy; per-cohort template variants are a future job.

## What Already Exists

### Already in the repo today (2026-04-11)
- **Next.js 16.2.3 App Router scaffold** — React 19.2.4, Tailwind 4, strict TS, `@/` → `src/`. (`package.json`, `tsconfig.json`, `next.config.ts`)
- **Content schemas** — `src/content/schemas/{content-tier,content-pillar,episode,source-material,index.ts}`
- **Test infra** — Vitest 2.1.8 + jsdom, `@testing-library/jest-dom/vitest` via `src/__tests__/setup.ts`, MSW 2.7 installed, coverage thresholds 70/80/80/80 (`vitest.config.ts`)
- **Source docs** — `docs/website-implementation-plan.md`, `docs/future-jobs.md`, `docs/brand-identity.md`, `docs/launch-strategy.md`, `docs/revenue-projections.md`

### Delivered by `website-foundation` (prereq — NOT YET SHIPPED when this plan is written)
This job reuses these `wf` outputs and cannot start until they exist.

- **Brand design tokens** (`src/app/globals.css` from wf 1.3) — `--color-{ink,parchment,ember,steel,mist,signal}` + semantic aliases `--color-{background,foreground,muted,accent,link}`. Tailwind surface: `bg-accent`, `text-muted`, `border-mist`, `text-link`, `bg-parchment`, `font-display`.
- **`<Container>` layout primitive** (`src/components/site/Container.tsx` from wf 1.4) — `mx-auto w-full max-w-5xl px-6 md:px-10`, `as` prop (`div`/`section`/`main`/`article`).
- **`<Header>` + `NAV_ITEMS`** (`src/components/site/Header.tsx` from wf 1.4) — this job MODIFIES `NAV_ITEMS` to insert `/cohorts` between `/cases` and `/products`.
- **`<Footer>`** (`src/components/site/Footer.tsx` from wf 1.4) — reused unchanged.
- **`<EmailCapture>` + `captureEmail` server action** (`src/components/capture/*` from wf 4.1) — shape reference for `<WaitlistForm>`. Not reused directly because the waitlist writes to a dedicated Resend audience (`RESEND_COHORT_WAITLIST_AUDIENCE_ID`) + a `cohort_waitlist` DB row, not the main newsletter audience.
- **Content loader core** (`src/lib/content/loader.ts` from wf 2.2) — `loadContent<T>({directory, schema})` helper. `src/lib/content/cohorts.ts` is a thin wrapper.
- **MDX pipeline** (`next.config.ts` wrapped with `createMDX()`, `mdx-components.tsx` at project root, wf 2.1) — reused unchanged; cohort MDX files slot in at `src/content/cohorts/*.mdx`.
- **Zod validators** (`src/content/schemas/validators.ts` from wf 1.2) — MODIFY to append `CohortSchema` + `CohortApplicationInputSchema`.
- **Episode / Case schema shape** (`src/content/schemas/{episode,case}.ts` from wf) — reference for the `Cohort` interface shape + `as const` tuple + `z.enum(TUPLE)` pattern.
- **`generateStaticParams` + `dynamicParams = false`** (wf 3.3/3.5) — same pattern for `/cohorts/[slug]` and `/cohorts/[slug]/apply`.
- **JSON-LD via `dangerouslySetInnerHTML`** (wf 4.3) — same pattern for `Course` + `Offer` structured data on cohort detail pages.
- **Dynamic sitemap** (`src/app/sitemap.ts` from wf 4.4) — MODIFY to append public cohort URLs. Gated routes (`/cohorts/*/apply`, `/cohorts/*/checkout`, `/admin/*`, `/products/account/cohorts`) NEVER appear in the sitemap.
- **`robots.ts`** (`src/app/robots.ts` from wf 4.4) — MODIFY to disallow `/admin/*` + cohort gated subroutes.
- **`resend` dependency** (installed by wf 4.1) — reused for waitlist + applicant + decision emails.
- **`zod` dependency** (installed by wf 1.2) — reused throughout.

### Delivered by `storefront-auth` (prereq — NOT YET SHIPPED when this plan is written)
This job also depends on `sa` having shipped.

- **Postgres + Drizzle stack** (sa 2.1) — `src/db/schema.ts`, `src/db/client.ts`, `drizzle.config.ts`, `docker-compose.yml`, migrations under `src/db/migrations/`. This job adds `0002_cohort_enrollment.sql` alongside `sa`'s `0000_init.sql`.
- **`users` table** (sa 2.1) — `id` (uuid pk), `email` (text unique), `createdAt`, `lastSignInAt`. The fk target for `cohort_applications.userId`, `cohort_admissions.userId`, `cohort_enrollments.userId`.
- **`purchases` table** (sa 2.1) — REFERENCE. The cohort Stripe flow intentionally does NOT insert into `purchases` — a cohort seat lives in its own `cohort_enrollments` row so the `/products/account` purchases list and the cohorts list are independent queries. The webhook branch distinguishes them by `metadata.kind: 'cohort' | 'product'`.
- **Auth.js v5 config** (sa 2.2, `src/auth.ts`) — `auth()` server helper + `signIn` + `signOut` actions. Reused verbatim.
- **Middleware** (`middleware.ts` from sa 2.3) — MODIFY. Extend the matcher to include `/cohorts/:slug/apply`, `/cohorts/:slug/checkout`, `/admin/:path*`, `/products/account/cohorts`.
- **`<SignInForm>` + `/login` + `/login/verify`** (sa 2.4) — reused unchanged as the redirect target for gated cohort routes.
- **Stripe client singleton** (`src/lib/stripe/client.ts` from sa 3.1) — reused by `src/lib/cohorts/checkout.ts`.
- **`resolveStripePriceId()`** (`src/lib/stripe/price-map.ts` from sa 3.1) — REFERENCE only. The cohort checkout resolver lives at `src/lib/cohorts/checkout.ts` and reads `stripePriceId` from the `Cohort` record directly; it does NOT reuse `resolveStripePriceId` because that helper is product-specific.
- **Stripe webhook route** (`src/app/api/stripe/webhook/route.ts` from sa 3.3) — MODIFY. The handler already verifies signatures and parses `checkout.session.completed` events; this job adds a branch that inspects `metadata.kind` and routes cohort events to a new `handleCohortCheckout()` helper instead of the existing product-purchase insert.
- **`runtime = 'nodejs'`** on the webhook route — reused.
- **`/products/account/page.tsx`** (sa 4.1) — MODIFY. Append a "My cohorts" card above the existing purchases list.
- **`<SignOutButton>`** (sa 4.3) — reused unchanged in `/products/account/cohorts`.
- **Email helper pattern** (`src/lib/email/purchase-confirmation.ts` from sa 3.5) — shape reference for every email this job ships. Direct `new Resend(...)` per helper, inline HTML string template, `AUTH_RESEND_FROM` for transactional, separate `RESEND_FROM_COHORTS` for this job's marketing-adjacent sends.

### Gaps (must build fresh — `wf`/`sa` provide zero coverage)
- Cohort content schema + loader + catalog routes
- Cohort-specific DB tables (waitlist, applications, admissions, enrollments)
- Waitlist form + dedicated Resend audience wiring
- Application form + multi-step validation
- Admin allowlist gate + cohort review dashboard
- HMAC-signed one-time checkout token utility
- Cohort-branch webhook handler
- `/products/account/cohorts` extension

## Feature Overview (10 Features, 4 Phases — condensed from 18)

Condensed 2026-04-12 via `/condense ce` — 8 pipeline runs saved. Each merged feature ships as one TDD pipeline section; sub-parts are documented inline in the phase files under `#### ...` headings.

| #   | Feature                                                                                                                               | Phase                           | Size | Merges Old | Status  |
|-----|---------------------------------------------------------------------------------------------------------------------------------------|---------------------------------|------|------------|---------|
| 1.1 | `Cohort` schema + `COHORT_STATUSES` tuple + label maps + `CohortSchema` Zod validator + unit tests                                    | 1 - Catalog                     | S    | 1.1 + 1.2  | Shipped |
| 1.2 | Cohort loader (`getAllCohorts`, `getCohortBySlug`, `getCohortBuckets`) + 2 seed MDX files                                             | 1 - Catalog                     | M    | 1.3        | Shipped |
| 1.3 | `/cohorts` index + `/cohorts/[slug]` detail pages (status-aware CTA + `CohortCard` + `CohortStatusBadge` + `CohortDetailHero`)        | 1 - Catalog                     | M    | 1.4 + 1.5  | Shipped |
| 2.1 | Drizzle migration — `cohort_waitlist`, `cohort_applications`, `cohort_admissions`, `cohort_enrollments` + indexes                     | 2 - Waitlist + Persistence      | M    | 2.1        | Shipped |
| 2.2 | `<WaitlistForm>` + `submitWaitlist` server action + waitlist confirmation email + env (`RESEND_COHORT_WAITLIST_AUDIENCE_ID`, `RESEND_FROM_COHORTS`) | 2 - Waitlist + Persistence      | M    | 2.2 + 2.3  | Shipped |
| 3.1 | `CohortApplicationInputSchema` Zod validator (background, goals, commitment hours, timezone)                                          | 3 - Application Flow            | S    | 3.1        | Shipped |
| 3.2 | `/cohorts/[slug]/apply` auth-gated page + proxy matcher + `<ApplicationForm>` + `submitApplication` server action + applicant confirmation email | 3 - Application Flow            | L    | 3.2 + 3.3 + 3.4 | Shipped |
| 4.1 | Admin layout + `ADMIN_EMAILS` allowlist + applications list + application detail + `decideApplication` server action (accept / waitlist / decline) | 4 - Review + Payment + Account  | L    | 4.1 + 4.2  | Shipped |
| 4.2 | Decision email (accept/waitlist/decline) + HMAC checkout-token utility + `/cohorts/[slug]/checkout` GET route + Stripe webhook cohort branch + `cohort_enrollments` idempotent insert | 4 - Review + Payment + Account  | L    | 4.3 + 4.4  | Shipped |
| 4.3 | `/products/account/cohorts` + "My cohorts" card + SEO / sitemap / robots / nav / middleware polish + JSON-LD                          | 4 - Review + Payment + Account  | M    | 4.5 + 4.6  | Shipped |

**Size guide**: S = few hours, single file. M = half day, 2–3 files. L = full day, 4+ files. XL = multi-day, new content type + DB + UI + external integration.

Total rough job size: **L** — matches `docs/future-jobs.md` §7 sizing.
Smaller than `storefront-auth` (XL) because every payments + auth primitive
already exists and this job only extends them. Larger than
`testimonials-results` (M) because it introduces persistence, an admin UI,
an HMAC-signed token flow, and a Stripe webhook branch.

## Dependency Graph (condensed)

```
Phase 1: Catalog (public)
│
│   1.1 → 1.2 → 1.3               ← sequential, shared loader
│
v
Phase 2: Waitlist + Persistence
│
│   2.1 → 2.2                     ← sequential (form+action+email merged)
│
v
Phase 3: Application Flow
│
│   3.1 → 3.2                     ← sequential (page+form+action+email merged)
│
v
Phase 4: Review + Payment + Account
│
    4.1 → 4.2 → 4.3               ← sequential (list+detail merged, Stripe half merged, account+SEO merged)
```

Hard dependencies (post-condense):
- **new 1.1 → new 1.2** — loader validates loaded MDX entries against `CohortSchema` (merged from old 1.1+1.2).
- **new 1.2 → new 1.3** — both index and detail pages call `getAllCohorts()` / `getCohortBySlug()` / `getCohortBuckets()`.
- **Phase 1 → Phase 2** — `<WaitlistForm>` is rendered inside `/cohorts/[slug]` from new 1.3.
- **new 2.1 → new 2.2** — server action inserts into `cohort_waitlist` (table from new 2.1); submit action calls the confirmation email helper (merged from old 2.2+2.3).
- **Phase 2 → Phase 3** — application submit writes to `cohort_applications` and checks `cohort_waitlist` for upgrades.
- **new 3.1 → new 3.2** — server action validates FormData against `CohortApplicationInputSchema`; page renders form; action calls applicant email (merged from old 3.2+3.3+3.4).
- **Phase 3 → Phase 4** — admin dashboard queries `cohort_applications` rows.
- **new 4.1 → new 4.2** — decide action triggers decision email, which carries the signed checkout token; webhook branch reads `metadata.applicationId` + `metadata.cohortSlug` set by the checkout redirect handler (merged from old 4.1+4.2 and 4.3+4.4).
- **new 4.2 → new 4.3** — the account cohorts list queries `cohort_enrollments` rows; SEO polish adds nav + sitemap + JSON-LD (merged from old 4.5+4.6).

## New Content Types Required

| Type                      | Phase | Purpose                                                                                                                                                 |
|---------------------------|-------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Cohort`                  | 1     | Cohort record — slug, title, series ("AI Delivery Cohort"), start/end dates, capacity, priceCents, currency, stripePriceId, status, pillar, description, reading list, LLL crosslinks |
| `CohortApplicationInput`  | 3     | Shape of the application FormData: background, goals, commitment hours, timezone, pillar interest, referral source. Not a content record — lives next to validators for input-schema convention. |

`Cohort` lives at `src/content/schemas/cohort.ts` and is re-exported from
`src/content/schemas/index.ts` alongside `Episode`, `Case`, `Product`,
`SourceMaterial`. Content files at `src/content/cohorts/*.mdx` follow the
same `export const meta = {...}` + MDX body convention from wf/sa.

`CohortApplicationInput` lives at `src/content/schemas/cohort-application.ts`.
It is NOT a content type that ships MDX files — it's the server-side input
type consumed by the submit action. Same file houses the `APPLICATION_COMMITMENT_LEVELS`
tuple used by the form's select.

## New DB Tables (Drizzle schemas, Postgres dialect)

| Table                 | Phase | Fields (abridged)                                                                                                                                                                                                                                                          |
|-----------------------|-------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `cohort_waitlist`     | 2.1   | `id` (uuid pk, default `gen_random_uuid()`), `email` (text), `cohortSlug` (text), `sourceTag` (text, nullable — which page the signup came from), `userId` (uuid fk → `users.id`, nullable, on delete set null), `createdAt` (timestamptz, default `now()`). UNIQUE `(email, cohortSlug)` for dedupe. |
| `cohort_applications` | 2.1   | `id` (uuid pk), `cohortSlug` (text), `userId` (uuid fk → `users.id` cascade, non-nullable), `background` (text), `goals` (text), `commitmentLevel` (text, `check` constrained to `APPLICATION_COMMITMENT_LEVELS`), `commitmentHours` (integer), `timezone` (text), `pillarInterest` (text, `check` constrained to `ContentPillar`), `referralSource` (text, nullable), `waitlistId` (uuid fk → `cohort_waitlist.id` on delete set null), `decision` (text, default `'pending'`, `check` constrained to `['pending','accepted','waitlisted','declined']`), `submittedAt` (timestamptz, default `now()`). UNIQUE `(cohortSlug, userId)` — one application per user per cohort. |
| `cohort_admissions`   | 2.1   | `id` (uuid pk), `applicationId` (uuid fk → `cohort_applications.id` cascade, UNIQUE), `decidedBy` (text — admin email from session), `decision` (text, `check` constrained to `['accepted','waitlisted','declined']`), `decisionNote` (text, nullable — internal reviewer notes, never shown to applicant), `acceptedUntil` (timestamptz, nullable — only set for `accepted` decisions), `decidedAt` (timestamptz, default `now()`). |
| `cohort_enrollments`  | 2.1   | `id` (uuid pk), `applicationId` (uuid fk → `cohort_applications.id` cascade, UNIQUE), `cohortSlug` (text), `userId` (uuid fk → `users.id` cascade), `stripeSessionId` (text, UNIQUE), `stripePaymentIntentId` (text), `amountCents` (integer), `currency` (text, default `'usd'`), `paidAt` (timestamptz, default `now()`). |

Indexes:
- `cohort_waitlist(cohort_slug)` — waitlist admin filter + upgrade-lookup on application submit
- `cohort_applications(cohort_slug, decision)` — admin dashboard filter
- `cohort_applications(user_id)` — `/products/account/cohorts` list query
- `cohort_admissions(application_id)` — UNIQUE (implicit index)
- `cohort_enrollments(user_id)` — `/products/account/cohorts` list query
- `cohort_enrollments(stripe_session_id)` — UNIQUE, webhook idempotency

No changes to sa's existing `users` / `sessions` / `verificationTokens` /
`purchases` tables.

## Critical Files Reference

### New files

**Content schema + catalog (Phase 1)**
| File                                                   | Role                                                                 |
|--------------------------------------------------------|----------------------------------------------------------------------|
| `src/content/schemas/cohort.ts`                        | NEW — `Cohort` interface, `COHORT_STATUSES` + `COHORT_STATUS_LABELS` |
| `src/content/schemas/cohort-application.ts`            | NEW — `CohortApplicationInput`, `APPLICATION_COMMITMENT_LEVELS` tuple |
| `src/content/schemas/index.ts`                         | MODIFY — `export * from './cohort'` + `./cohort-application`          |
| `src/content/schemas/validators.ts`                    | MODIFY — append `CohortSchema`, `CohortApplicationInputSchema`        |
| `src/content/schemas/__tests__/validators.test.ts`     | MODIFY — extend with `CohortSchema` + `CohortApplicationInputSchema` cases |
| `src/content/cohorts/ai-delivery-2026-q3.mdx`          | NEW — seed cohort #1 (stub copy, `announced` status)                  |
| `src/content/cohorts/workflow-mastery-2026-q4.mdx`     | NEW — seed cohort #2 (stub copy, `open` status)                       |
| `src/lib/content/cohorts.ts`                           | NEW — `getAllCohorts()`, `getCohortBySlug()`, built on wf's `loadContent()` |
| `src/lib/content/__tests__/cohorts.test.ts`            | NEW                                                                   |

**Public catalog routes (Phase 1)**
| File                                                   | Role                                                                 |
|--------------------------------------------------------|----------------------------------------------------------------------|
| `src/app/cohorts/page.tsx`                             | NEW — `/cohorts` index (async server component, status-filtered)      |
| `src/app/cohorts/[slug]/page.tsx`                      | NEW — `/cohorts/[slug]` detail + `generateStaticParams` + `generateMetadata` |
| `src/app/cohorts/__tests__/page.test.tsx`              | NEW                                                                   |
| `src/app/cohorts/[slug]/__tests__/page.test.tsx`       | NEW                                                                   |
| `src/components/cohorts/CohortCard.tsx`                | NEW — used by the index                                                |
| `src/components/cohorts/CohortStatusBadge.tsx`         | NEW — renders the colored status pill                                  |
| `src/components/cohorts/CohortDetailHero.tsx`          | NEW — hero section on the detail page (title, dates, price, CTA slot) |

**Persistence + waitlist (Phase 2)**
| File                                                   | Role                                                                 |
|--------------------------------------------------------|----------------------------------------------------------------------|
| `src/db/schema.ts`                                     | MODIFY — append 4 new table builders + `type` exports                |
| `src/db/migrations/0002_cohort_enrollment.sql`         | NEW — generated by `drizzle-kit generate`                             |
| `src/db/migrations/meta/*`                             | NEW — migration metadata (generated; do not hand-edit)                |
| `src/db/__tests__/cohort-tables.test.ts`               | NEW — insert/select + constraint coverage                             |
| `src/components/cohorts/WaitlistForm.tsx`              | NEW — client component, `useActionState` wraps `submitWaitlist`       |
| `src/components/cohorts/actions.ts`                    | NEW — `submitWaitlist` server action (Phase 2.2), `submitApplication` appended in Phase 3.3 |
| `src/components/cohorts/__tests__/WaitlistForm.test.tsx` | NEW                                                                 |
| `src/lib/email/cohort-waitlist-confirmation.ts`        | NEW — Resend email helper for waitlist opt-in confirmation            |
| `src/lib/email/__tests__/cohort-waitlist-confirmation.test.ts` | NEW                                                           |

**Application flow (Phase 3)**
| File                                                   | Role                                                                 |
|--------------------------------------------------------|----------------------------------------------------------------------|
| `src/app/cohorts/[slug]/apply/page.tsx`                | NEW — auth-gated server component, hydrates session, renders form    |
| `src/app/cohorts/[slug]/apply/__tests__/page.test.tsx` | NEW                                                                   |
| `src/components/cohorts/ApplicationForm.tsx`           | NEW — client component, `useActionState` wraps `submitApplication`    |
| `src/components/cohorts/__tests__/ApplicationForm.test.tsx` | NEW                                                              |
| `src/lib/email/cohort-application-received.ts`         | NEW — Resend helper for applicant confirmation                        |
| `src/lib/email/__tests__/cohort-application-received.test.ts` | NEW                                                            |

**Review + payment + account (Phase 4)**
| File                                                              | Role                                                                 |
|-------------------------------------------------------------------|----------------------------------------------------------------------|
| `src/app/admin/layout.tsx`                                        | NEW — `ADMIN_EMAILS` allowlist gate, wraps all admin routes          |
| `src/app/admin/cohorts/applications/page.tsx`                     | NEW — list of applications grouped by status                         |
| `src/app/admin/cohorts/applications/[id]/page.tsx`                | NEW — application detail + accept/waitlist/decline forms             |
| `src/app/admin/cohorts/applications/__tests__/page.test.tsx`      | NEW                                                                  |
| `src/app/admin/cohorts/applications/[id]/__tests__/page.test.tsx` | NEW                                                                  |
| `src/lib/cohorts/admin.ts`                                        | NEW — `listApplications`, `getApplication`, `decideApplication` helpers |
| `src/lib/cohorts/__tests__/admin.test.ts`                         | NEW                                                                  |
| `src/lib/cohorts/checkout-token.ts`                               | NEW — HMAC `sign/verify` one-time token utility                      |
| `src/lib/cohorts/__tests__/checkout-token.test.ts`                | NEW                                                                  |
| `src/lib/cohorts/checkout.ts`                                     | NEW — `createCohortCheckoutSession()` wraps Stripe client            |
| `src/lib/cohorts/__tests__/checkout.test.ts`                      | NEW                                                                  |
| `src/lib/cohorts/constants.ts`                                    | NEW — `ACCEPTANCE_WINDOW_DAYS = 14`, metadata keys                   |
| `src/lib/email/cohort-decision.ts`                                | NEW — accept / waitlist / decline email render helper                |
| `src/lib/email/__tests__/cohort-decision.test.ts`                 | NEW                                                                  |
| `src/app/cohorts/[slug]/checkout/route.ts`                        | NEW — GET handler, verifies token, redirects to Stripe               |
| `src/app/cohorts/[slug]/checkout/__tests__/route.test.ts`         | NEW                                                                  |
| `src/app/products/account/cohorts/page.tsx`                       | NEW — full list of the user's applications + enrollments             |
| `src/app/products/account/cohorts/__tests__/page.test.tsx`        | NEW                                                                  |
| `src/components/account/CohortList.tsx`                           | NEW — used by the account cohorts page + the overview card          |

### Modified files
| File                                                   | Role                                                                 |
|--------------------------------------------------------|----------------------------------------------------------------------|
| `src/content/schemas/index.ts`                         | Add `Cohort` + `CohortApplicationInput` barrel exports               |
| `src/content/schemas/validators.ts`                    | Append `CohortSchema` + `CohortApplicationInputSchema`                |
| `src/db/schema.ts`                                     | Append 4 new table builders + type exports                           |
| `src/app/api/stripe/webhook/route.ts`                  | Branch on `metadata.kind: 'cohort'` → `handleCohortCheckout()`        |
| `src/app/products/account/page.tsx`                    | Add "My cohorts" card above the purchases list                       |
| `src/app/sitemap.ts`                                   | Append public cohort URLs; exclude gated routes                      |
| `src/app/robots.ts`                                    | Disallow `/admin/*` + cohort gated subroutes                         |
| `src/components/site/Header.tsx`                       | Add `{ href: '/cohorts', label: 'Cohorts' }` to `NAV_ITEMS`          |
| `middleware.ts` (project root)                         | Extend matcher to `/cohorts/:slug/apply`, `/cohorts/:slug/checkout`, `/admin/:path*`, `/products/account/cohorts` |
| `public/llms.txt`                                      | Mention `/cohorts` as a public catalog; note gated subroutes          |
| `.env.example` (if wf ships it; otherwise new)         | Document new env vars                                                 |
| `package.json`                                         | No new deps — everything reused from wf + sa                         |

### Reference-only files (read, don't modify)
- `src/content/schemas/{episode,case,product}.ts` — shape to mirror for `Cohort`
- `src/content/schemas/validators.ts` — `CaseSchema` / `ProductSchema` are the templates for `CohortSchema`
- `src/lib/content/loader.ts` — core `loadContent<T>()` helper called by the cohort loader
- `src/lib/content/{episodes,cases,products}.ts` — loader API to mirror
- `src/app/products/[slug]/page.tsx` — detail page pattern (async, `params: Promise<{slug: string}>`, `generateStaticParams`, `dynamicParams = false`, JSON-LD inline)
- `src/components/capture/EmailCapture.tsx` — `useActionState` + server action shape for `<WaitlistForm>` + `<ApplicationForm>`
- `src/lib/stripe/client.ts` — Stripe SDK singleton
- `src/lib/stripe/checkout.ts` — `createCheckoutSession` pattern for `createCohortCheckoutSession`
- `src/app/api/stripe/webhook/route.ts` — webhook signature verification + idempotent insert pattern
- `src/lib/email/purchase-confirmation.ts` — inline HTML string email helper pattern
- `src/auth.ts` — `auth()` server helper
- `middleware.ts` — existing matcher (before modification)
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md` — Next.js 16 auth guidance
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — Route Handler signatures
- `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` — `params: Promise<...>` breaking change

## Verification Plan

| Phase | Verification |
|-------|--------------|
| 1     | `npm run lint` clean. `npm test` — `CohortSchema` + `CohortApplicationInputSchema` validator unit tests green, loader test loads both seed MDX files. `npm run build` clean with new static params for both cohort slugs. Manual `/cohorts` renders two cards under `npm run dev`. `/cohorts/ai-delivery-2026-q3` (status `announced`) renders the hero, description, and a disabled "Join waitlist" button placeholder (wired in Phase 2). `/cohorts/workflow-mastery-2026-q4` (status `open`) renders with a disabled "Apply now" button placeholder (wired in Phase 3). `/cohorts/bogus` 404s via `dynamicParams = false`. Unknown slug in search/URL → 404 page. |
| 2     | `docker compose up -d postgres` + `npm run db:generate` + `npm run db:migrate` apply `0002_cohort_enrollment.sql` cleanly. `npm test` — schema tests insert/select/constraint checks pass, UNIQUE `(email, cohort_slug)` dedupe enforced, fk cascades working. `<WaitlistForm>` submit on `/cohorts/ai-delivery-2026-q3` writes a `cohort_waitlist` row and adds the email to the cohort waitlist Resend audience (live `RESEND_API_KEY` + `RESEND_COHORT_WAITLIST_AUDIENCE_ID` required). Confirmation email delivered. Duplicate submit is idempotent (UNIQUE catches it, form shows "You're already on the waitlist" without a duplicate email send). Invalid email → inline form error, no DB row, no Resend call. |
| 3     | Anonymous GET `/cohorts/workflow-mastery-2026-q4/apply` → 307 to `/login?callbackUrl=...`. After sign-in, the page renders the `<ApplicationForm>` with the user's email pre-filled (from session, read-only). Submitting a valid application writes a `cohort_applications` row with `decision: 'pending'`, `userId` from session, matching `cohortSlug`, and (if the user was on the waitlist) `waitlistId` set. Applicant confirmation email delivered. Duplicate submit for the same cohort → UNIQUE catches it, form shows "You've already applied to this cohort". Form validation rejects too-short `background` / `goals` / out-of-range `commitmentHours` / missing `pillarInterest` with actionable error messages. |
| 4     | Anonymous GET `/admin/cohorts/applications` → 307 to `/login`. Signed-in non-admin GET → 403 via the admin layout gate (email not in `ADMIN_EMAILS`). Admin GET → renders pending applications grouped by cohort + decision status. Clicking "Accept" on an application → writes a `cohort_admissions` row with `decision: 'accepted'` + `acceptedUntil` 14 days out + `decidedBy` = admin email, sends the acceptance email containing a signed one-time checkout URL. Clicking the URL → `/cohorts/[slug]/checkout?token=...` verifies the token via HMAC, calls `createCohortCheckoutSession` against the cohort's `stripePriceId`, redirects to Stripe Checkout. Test-card purchase → return to `/products/account/cohorts?enrolled=...`. Stripe CLI `stripe listen --forward-to localhost:3000/api/stripe/webhook` forwards the event; the cohort branch inserts a `cohort_enrollments` row with the correct `applicationId` + `userId` + `stripeSessionId`. Second delivery of the same event is a no-op (UNIQUE constraint + `onConflictDoNothing`). `/products/account` renders the "My cohorts" card above the purchases list. `/products/account/cohorts` renders the full list of applications + enrollments. `/sitemap.xml` contains `/cohorts` + per-cohort URLs — never `/cohorts/*/apply`, `/cohorts/*/checkout`, `/admin/*`, `/products/account/cohorts`. `/robots.txt` disallows those gated paths. `Course` + `Offer` JSON-LD validates at https://validator.schema.org. A second-delivery webhook replayed via `stripe events resend` is still a no-op. Token verification rejects expired / malformed / wrong-signature tokens with a user-facing error page. Keyboard-only walkthrough of the apply → accept → pay → account flow reaches every interactive element. |
| All   | `npm run lint` clean. `npm test` green + coverage ≥ thresholds (70/80/80/80). `npm run build` clean. Manual smoke against `npm run start`: `/` (home), `/episodes`, `/cases`, `/products`, `/cohorts`, `/cohorts/workflow-mastery-2026-q4`, end-to-end apply → admin accept → pay → account flow with Stripe test card, `/sitemap.xml`, `/robots.txt`, `/llms.txt`. |

## Phase Documentation

- [Phase 1: Catalog](./phase-1-catalog.md) — `Cohort` schema, validator, loader, `/cohorts` index, `/cohorts/[slug]` detail
- [Phase 2: Waitlist + Persistence](./phase-2-waitlist-persistence.md) — Drizzle migration, `<WaitlistForm>`, waitlist confirmation email
- [Phase 3: Application Flow](./phase-3-application-flow.md) — application input schema, auth-gated apply page, `<ApplicationForm>`, applicant confirmation email
- [Phase 4: Review + Payment + Account](./phase-4-review-payment-account.md) — admin dashboard, decision actions, HMAC checkout token, Stripe webhook branch, account cohorts view, SEO polish

## Dependencies to Add

**None.** Every dependency this job uses is already installed by prior jobs:

- `zod`, `resend` — from wf 1.2 / wf 4.1
- `postgres`, `drizzle-orm`, `drizzle-kit` — from sa 2.1
- `next-auth@5`, `@auth/drizzle-adapter` — from sa 2.2
- `stripe` — from sa 3.1
- `vitest`, `@testing-library/*` — from the Next.js scaffold

If `email-funnel` ships first and introduces `react-email` + `@react-email/components`,
the decision email in Phase 4.3 MAY migrate to React Email as a follow-up
polish. This is NOT a blocking dependency — the phase file ships inline
HTML strings and flags the possible upgrade in its Open Items.

## Environment Variables

Required before the matching phase can be verified end-to-end. All are
server-only (no `NEXT_PUBLIC_` prefix).

| Variable                              | Phase | Purpose                                                                                   |
|---------------------------------------|-------|-------------------------------------------------------------------------------------------|
| `DATABASE_URL`                        | 2.1   | Reused from sa 2.1 — Postgres connection string                                           |
| `RESEND_API_KEY`                      | 2.2   | Reused from wf 4.1 — used for every email this job sends                                  |
| `RESEND_COHORT_WAITLIST_AUDIENCE_ID`  | 2.2   | Resend Audience ID for the cohort waitlist — kept separate from the main newsletter audience so the two lists can evolve independently |
| `RESEND_FROM_COHORTS`                 | 2.2   | Sender identity for cohort-related emails, e.g. `cohorts@travisgautier.com`. Kept distinct from `AUTH_RESEND_FROM` so marketing + transactional reputations don't contaminate each other |
| `AUTH_URL`                            | 3.2   | Reused from sa 2.2 — absolute origin for building links inside emails                     |
| `ADMIN_EMAILS`                        | 4.1   | Comma-separated email allowlist for `/admin/*` routes — shared with `email-funnel` 4.4    |
| `COHORT_CHECKOUT_SECRET`              | 4.3   | HMAC signing secret for the acceptance-email one-time checkout token. Generate via `openssl rand -base64 32`. Rotating this secret invalidates all outstanding acceptance links, which is the intended escape hatch if a secret leaks. |
| `STRIPE_SECRET_KEY`                   | 4.3   | Reused from sa 3.1 — same key, used by `createCohortCheckoutSession`                      |
| `STRIPE_WEBHOOK_SECRET`               | 4.4   | Reused from sa 3.3 — signature verification on the (modified) webhook route             |

All new variables are added to a new root `.env.example` if one doesn't
exist yet, or appended to the existing one from wf/sa. The Phase-2 / Phase-4
red tests fail loudly if any required variable is missing.

## Open Items (Resolve During Implementation)

- **Cohort capacity enforcement** — `Cohort.capacity` is a frontmatter field
  and `/cohorts/[slug]` derives `isFull = enrolledCount >= capacity` at
  render time. If a cohort sells out between acceptance and payment, the
  checkout route still lets the accepted applicant pay (since they were
  promised a seat). Enforcing "reject if oversold" would require a DB-level
  check in `handleCohortCheckout()` — noted as a follow-up, NOT part of v1.
- **Decision email format** — phase 4.3 ships inline HTML strings (matches
  sa 3.5's purchase-confirmation pattern). If `email-funnel` 2.1 has shipped
  `src/lib/email/funnel/render.tsx` first, the phase file flags "migrate to
  React Email in a follow-up" but does NOT block on it.
- **Acceptance window length** — `ACCEPTANCE_WINDOW_DAYS = 14` in
  `src/lib/cohorts/constants.ts`. Not an env var — changing it requires a
  redeploy, which is the right friction level for a policy knob.
- **Waitlist-to-application upgrade** — the application submit action
  queries `cohort_waitlist` for a row matching `(email, cohortSlug)` and, if
  present, sets `cohort_applications.waitlistId`. This is the only
  relationship between the two tables; no automatic waitlist-to-application
  promotion happens.
- **Admin allowlist source** — phase 4.1 reads `ADMIN_EMAILS` as a
  comma-separated env var. A DB-backed `admins` table is deferred;
  `email-funnel` plans the same choice, so both jobs share the env var. If
  either job later adds a DB-backed admin model, both jobs migrate together.
- **Cohort seed copy** — 1.3 ships two stub MDX files with placeholder
  title / summary / dates / price / `stripePriceId: 'price_REPLACE_ME_…'`.
  Real cohort content + real Stripe Price IDs are a separate concern and
  not part of this job.
- **`full` status** — listed in `docs/future-jobs.md` §7 but collapsed into
  the combination of manual `enrolled` status flag + the derived `isFull`
  check. The operator flips to `enrolled` once applications close so the
  index page filters correctly.
- **Refund handling** — refunds are manual (operator issues refund in
  Stripe dashboard, manually deletes the `cohort_enrollments` row). Automated
  refund webhook handling is a future job.
- **Cohort delivery handoff** — after enrollment, logistics (Zoom links,
  Slack invites, calendar invites) are sent manually by the operator. A
  future `cohort-delivery` job adds automation.

## Section IDs for TDD Workflow (condensed)

Each feature maps to one section ID used by `/discovery`, `/red`, `/green`,
`/refactor`. Section IDs use the canonical slug `cohort-enrollment`, not
the alias `ce`. **Condensed 2026-04-12 from 18 sections to 10** — see the
Feature Overview table for which old IDs each new ID merges.

| Section ID                  | Feature                                                       | Merges Old IDs    |
|-----------------------------|---------------------------------------------------------------|-------------------|
| `cohort-enrollment-1.1`     | `Cohort` schema + Zod validator                                | 1.1 + 1.2         |
| `cohort-enrollment-1.2`     | Cohort loader + seed MDX                                       | 1.3               |
| `cohort-enrollment-1.3`     | `/cohorts` index + `/cohorts/[slug]` detail pages             | 1.4 + 1.5         |
| `cohort-enrollment-2.1`     | Drizzle migration + 4 new tables                               | 2.1               |
| `cohort-enrollment-2.2`     | Waitlist form + `submitWaitlist` + confirmation email          | 2.2 + 2.3         |
| `cohort-enrollment-3.1` ✅  | Application input schema + validator                           | 3.1               |
| `cohort-enrollment-3.2`     | Apply page + middleware + `<ApplicationForm>` + `submitApplication` + applicant email | 3.2 + 3.3 + 3.4   |
| `cohort-enrollment-4.1` ✅  | Admin layout + allowlist + list + detail + `decideApplication` | 4.1 + 4.2         |
| `cohort-enrollment-4.2` ✅  | Decision email + HMAC token + checkout route + Stripe webhook branch | 4.3 + 4.4         |
| `cohort-enrollment-4.3` ✅  | `/products/account/cohorts` + account card + SEO/sitemap/robots/nav/middleware polish | 4.5 + 4.6         |

These IDs are consumed by `pipeline/active/session.yaml` and used as
directory names under `pipeline/active/`.
