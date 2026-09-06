# email-funnel — Implementation Plan

**Alias:** `ef` — invoke as `/pipeline ef <section>` or `/discovery ef <section>`. Section IDs in YAML + commits still use the canonical slug `email-funnel`.

## Context

This job *was* a heavyweight self-hosted Resend nurture funnel (3 Postgres tables, React Email templates, send orchestrator, cron scheduler, Resend webhooks, HMAC-signed unsubscribe tokens, admin dashboard). On **2026-06-07** the operator chose to supersede it with **Substack** — Substack delivers ~95% of that out of the box (sending, templates, list management, RFC 8058 unsubscribe, deliverability, basic analytics) and removes a year of operational surface area.

The shipped capture in `website-foundation` Phase 4.1 (`src/components/capture/EmailCapture.tsx` + `actions.ts`) is therefore migrated, not extended: the native form + Resend server-action path is replaced by a Substack embed iframe wrapped in the same brand `Bone` surface. Source taxonomy survives as a UTM dimension (`utm_campaign=pillar:{pillar}`, `utm_content={source}`) so Substack publication analytics can still break signups down by surface and pillar.

## What changed vs. the prior plan

**Removed (Substack handles natively):**
- Postgres tables `email_subscribers`, `email_sends_queue`, `email_events`
- React Email + 9 templates
- `sendEmail()`, orchestrator, suppression rules, protected cron route, operator runbook
- HMAC-signed unsubscribe tokens, `/unsubscribe` page, RFC 8058 List-Unsubscribe header
- Resend webhook handler, admin dashboard, engagement flagging

**What we lose:**
- **Per-subscriber tagging at signup.** Substack free-tier embeds do not accept arbitrary tags. UTM params give us source breakdown in Substack analytics but not per-subscriber tags.
- **Branching welcome sequences by pillar.** Workaround: operator creates 4 Substack *sections* (one per pillar) and subscribers self-select. Manual operator step in Substack admin, not code.
- **Conversion attribution from specific pages** without manual UTM cross-referencing.
- **Suppression by purchase status.** Old plan suppressed product-pitch emails to users who already bought; Substack has no API for this.

**What we keep:**
- `source` taxonomy lives on as a UTM dimension.
- `ContentPillar` (`delivery | workflow | business | future`) remains the segmentation vocabulary (via UTM campaign string + Substack sections).
- Brand-styled `Bone` surface around the capture.

## Substack publication assumption

The operator must supply the publication's embed URL via `NEXT_PUBLIC_SUBSTACK_EMBED_URL` (full URL including `/embed`). The component falls back to a link to `https://substack.com/@travisgautier` when the env var is unset — never renders an empty iframe.

`https://substack.com/@travisgautier` is the operator's *profile* URL. The actual embed URL needs a publication subdomain like `https://travisgautier.substack.com/embed`. Confirm a publication exists (or create one) before the green phase.

## Feature overview

| #   | Feature                                                      | Phase             | Size | Status |
|-----|--------------------------------------------------------------|-------------------|------|--------|
| 1.1 | Delete server-action capture path (`actions.ts` + tests)     | 1 - Substack swap | S    | Shipped (bundled) |
| 1.2 | Replace `EmailCapture.tsx` body with Substack iframe         | 1 - Substack swap | M    | Shipped (bundled) |
| 1.3 | `sourceToPillar` helper + tests                              | 1 - Substack swap | S    | Shipped (bundled) |
| 1.4 | Rewrite `EmailCapture.test.tsx` for iframe assertions        | 1 - Substack swap | M    | Shipped (bundled) |
| 1.5 | Add `NEXT_PUBLIC_SUBSTACK_EMBED_URL` to `.env.example`       | 1 - Substack swap | S    | Shipped |
| 1.6 | Rewrite `docs/future-jobs.md` §4                             | 1 - Substack swap | S    | Shipped |

1.1–1.4 shipped as one atomic section under section-id `email-funnel-1.1`. Deleting `actions.ts` alone (strict 1.1) would break the build because `EmailCapture.tsx` imported `./actions`; bundling the four code-touching items keeps the build/test gates clean. 1.5 (.env.example) and 1.6 (docs/future-jobs.md) remain separately runnable.

## Critical files

| Action     | File                                                                |
|------------|---------------------------------------------------------------------|
| REPLACE    | `src/components/capture/EmailCapture.tsx`                           |
| DELETE     | `src/components/capture/actions.ts`                                 |
| DELETE     | `src/components/capture/__tests__/actions.test.ts`                  |
| REWRITE    | `src/components/capture/__tests__/EmailCapture.test.tsx`            |
| NEW        | `src/components/capture/sourceToPillar.ts`                          |
| NEW        | `src/components/capture/__tests__/sourceToPillar.test.ts`           |
| MODIFY     | `.env.example`                                                      |
| MODIFY     | `docs/future-jobs.md` (§4 + sizing table)                           |

## Reuse references

- `ContentPillar` type — `src/content/schemas/content-pillar.ts` (do not redefine)
- `Bone` brand surface — `src/components/brand/Bone.tsx` (wraps the iframe; preserves styling-overhaul brand-surface tests)
- `CONTENT_PILLARS` constant — used in `sourceToPillar.test.ts` to assert output type membership
- Source-prop call sites (unchanged): `src/app/page.tsx:70`, `src/app/episodes/[slug]/page.tsx:131`, `src/app/cases/[slug]/page.tsx:135`

## Env vars

- ADD `NEXT_PUBLIC_SUBSTACK_EMBED_URL` to `.env.example` (operator supplies real value in `.env.local`)
- DO NOT remove `RESEND_API_KEY` / `AUTH_RESEND_FROM` — still used by `sa` purchase-confirmation
- DO NOT remove `RESEND_COHORT_WAITLIST_AUDIENCE_ID` / `RESEND_FROM_COHORTS` — `cohort-enrollment` job
- `RESEND_AUDIENCE_ID` was read by deleted `actions.ts` but never declared in `.env.example`. Operator should remove it from their `.env.local` and deploy secrets — it is now dead.

## Verification

End-to-end:
1. Populate `NEXT_PUBLIC_SUBSTACK_EMBED_URL` in `.env.local`.
2. `npm run dev`; load `/`, `/episodes/<seed-slug>`, `/cases/<seed-slug>`; confirm the Substack iframe renders inside the Bone wrapper on each.
3. View page source / network tab: iframe `src` includes `utm_source=travisgautier.com`, `utm_medium=embed`, `utm_campaign=pillar:{delivery|business}`, `utm_content={source}`.
4. Submit a test email through the embed → confirm arrival in Substack's subscribers panel.
5. Unset `NEXT_PUBLIC_SUBSTACK_EMBED_URL` and reload — confirm graceful fallback link to `https://substack.com/@travisgautier`.

Test suites:
- `npm test src/components/capture` — new iframe + helper tests green
- `npm test` — full suite green
- `npm run lint` — clean
- `npm run build` — clean

## Operator action items (out of TDD scope)

1. **Confirm publication URL.** Provide the actual embed URL before populating `.env.local`.
2. **Migrate existing Resend audience.** `wf` Phase 4.1 has been live and captured subscribers into a Resend audience. Either: export as CSV → import to Substack (free tier supports this), OR email existing subscribers from Resend asking them to re-subscribe on Substack. The code-side delete of `actions.ts` does not migrate the list.
3. **Create Substack "sections".** One per pillar (`delivery`, `workflow`, `business`, `future`) so subscribers can self-select. This is the closest native segmentation primitive Substack offers on free tier.
4. **Remove dead env vars.** Drop `RESEND_AUDIENCE_ID` from `.env.local` and deploy platform secrets.

## Section IDs

- `email-funnel-1.1` — Delete server-action capture path
- `email-funnel-1.2` — Replace `EmailCapture.tsx` body with Substack iframe
- `email-funnel-1.3` — `sourceToPillar` helper + tests
- `email-funnel-1.4` — Rewrite `EmailCapture.test.tsx`
- `email-funnel-1.5` — Add `NEXT_PUBLIC_SUBSTACK_EMBED_URL` to `.env.example`
- `email-funnel-1.6` — Rewrite `docs/future-jobs.md` §4
