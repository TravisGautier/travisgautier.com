# Future Jobs — fabled10x

**Purpose:** a self-contained catalogue of every `/jobbuild` target identified
from `docs/website-implementation-plan.md` that has **not yet** been
built. Drop this file into a new context window and use any entry below as a
self-sufficient brief for `/jobbuild`.

**Current state (2026-04-11):** one job has been planned — `website-foundation`
(alias `wf`, directory `currentwork/website-foundation/`). That job produces
the public content site MVP: homepage, `/episodes`, `/cases`, `/about`, Resend
email capture, LLL outbound crosslinks, SEO, sitemap/robots/llms.txt polish. It
is the prerequisite for every job below — nothing here is buildable until
`wf` has shipped through the TDD pipeline.

**How to use this doc:**
1. Pick a job from the table in "Ordering & dependencies".
2. In a fresh context window run `/jobbuild {job-description}` where the
   description is one or two sentences from that job's section below. Include
   the job slug explicitly (e.g. "build the `free-tools` job").
3. The jobbuild skill will read the project context and then ask clarifying
   questions. When it does, refer back to this doc for scope boundaries.
4. When planning is done, `/jobbuild` writes `currentwork/{slug}/README.md` +
   phase files. After that, use the alias (if one is listed) or the full slug
   with `/pipeline`.

**Alias registration:** if you want a short alias for a job (e.g. `st` for
`storefront-auth`), add it to the **Job Slug Aliases** table in `CLAUDE.md`
when the jobbuild runs, so every future context window auto-picks it up.

---

## Ordering & dependencies

| #  | Job slug              | Alias | Rough size | Hard prereqs                                    | Natural order |
|----|-----------------------|-------|------------|-------------------------------------------------|---------------|
| 1  | `website-foundation`  | `wf`  | L/XL       | —                                               | **already planned** |
| 2  | `free-tools`          | —     | L          | `wf`                                            | 2nd           |
| 3  | `storefront-auth`     | —     | XL         | `wf`                                            | 2nd or 3rd    |
| 4  | `email-funnel`        | `ef`  | S          | `wf`                                            | any time after `wf` |
| 5  | `community-showcase`  | —     | L          | `wf`                                            | parallel to #2/#3 |
| 6  | `testimonials-results`| —     | M          | `wf`                                            | parallel to #2/#3 |
| 7  | `cohort-enrollment`   | —     | L          | `wf`, `storefront-auth`                         | after #3      |
| 8  | `build-in-public-docs`| —     | M          | `wf`                                            | any time after `wf` |
| 9  | `lll-deep-integration`| —     | M          | `wf` (upgrade on Phase 4 crosslinks)            | any time after `wf` |
| 10 | `search`              | —     | M          | `wf` + enough content volume to justify         | low priority  |

Rule of thumb: once `wf` ships, the only hard dependency chain is
`wf → storefront-auth → cohort-enrollment`. Everything else (including the
rewritten Substack-based `email-funnel`) is independently schedulable based on
business priority.

---

## 2. `free-tools` — `/tools` section with calculator widgets

### Source
Phase 2 of `docs/website-implementation-plan.md` under "Free
Interactive Tools": "Free, no-auth, SEO-friendly utilities that attract
developers and consultants. Top-of-funnel with email capture on output."

### Scope
Build `/tools` index + four stateless calculator widgets, each with optional
email-capture-on-result prompting via the `<EmailCapture>` component that
`website-foundation` delivers.

**Planned tools (all stateless, client-side calculation):**
1. **Project scoping estimator** — inputs (project type, feature count,
   integration count, timeline pressure) → output (rough scope range in
   person-weeks, suggested breakdown).
2. **Pricing calculator** — inputs (hourly rate, estimated hours, complexity
   multiplier, agency margin) → output (recommended quote range).
3. **ROI calculator for AI agent workflows** — inputs (current hours/week on a
   task, hourly cost, agent automation percentage) → output (annual savings
   estimate).
4. **Discovery phase timeline generator** — inputs (client size, product
   complexity, stakeholder count) → output (week-by-week discovery schedule).

Each tool is its own route: `/tools/project-scoping`, `/tools/pricing`,
`/tools/roi`, `/tools/discovery-timeline`. `/tools` is the index page with a
short description of each.

### Out of scope
- Saving results server-side (tools are stateless)
- User accounts or login
- Result-sharing via URL (nice-to-have, not a v1 requirement)
- Payment integration
- Dynamic/AI-generated output (every calc is deterministic)

### Dependencies
- `website-foundation` must have shipped — relies on the brand design system,
  site shell, `<EmailCapture>` component, and Resend wiring.
- No new npm packages needed. React state + Tailwind is enough.

### Key design questions the jobbuild should ask
- Which tools are in this job? (All four, or start with 1–2?)
- Where does email capture trigger — automatic on first calculation, or
  optional behind a "send me the full breakdown" CTA?
- Should tool inputs persist in `localStorage` across sessions?
- Does each tool get its own OG image for shareability?

### Suggested jobbuild prompt
```
/jobbuild free-tools

Build the /tools section: an index page plus four stateless calculator widgets
(project scoping, pricing, ROI, discovery timeline) per Phase 2 of
docs/website-implementation-plan.md. Each tool is a client-side React
component under /tools/[tool-slug] with its own route. Tools reuse the
<EmailCapture> component from website-foundation for result-delivery CTAs. No
auth, no server-side state, no payments.
```

---

## 3. `storefront-auth` — `/products` tree with auth + checkout

### Source
Phase 2 of `docs/website-implementation-plan.md` under "Products —
Storefront": "Monetization layer. Auth lives here and only here."

### Scope
Build the complete `/products` route tree, a `Product` content schema and
loader (same MDX pattern as episodes/cases), an auth provider scoped
exclusively to `/products`, checkout integration, post-purchase delivery, and
a customer account page.

**Product categories (per the doc):**
- Workflow templates
- Discovery toolkit
- Proposal kit
- Complete playbook
- Course / cohort enrollment (Phase 3+ — likely deferred to `cohort-enrollment`)

**Decisions required at jobbuild time:**
- **Auth provider**: NextAuth vs. Clerk. The implementation doc lists this as
  an open question. Clerk is faster to integrate but adds a paid dependency.
  NextAuth is more work but fully self-hosted.
- **Payment provider**: Stripe Checkout (redirect) vs. Stripe Elements
  (embedded). Checkout is simpler; Elements gives a more branded experience.
- **Delivery mechanism**: downloadable files via signed S3 URLs, gated
  content behind account access, or a license key emailed on purchase?
- **License model**: single-user vs. team vs. agency licenses?

### Out of scope
- Subscription/recurring billing (this is one-time purchases only for v1)
- Course/cohort enrollment (separate job: `cohort-enrollment`)
- Affiliate program
- Refund automation

### Dependencies
- `website-foundation` (design system, shell, existing content loader pattern)
- New npm packages: auth provider (`next-auth` or `@clerk/nextjs`), `stripe`,
  possibly `@aws-sdk/client-s3` for signed downloads

### Suggested jobbuild prompt
```
/jobbuild storefront-auth

Build the /products storefront per Phase 2 of the implementation-plan doc.
Requires: Product content schema, /products index + /products/[slug] detail
pages, auth provider scoped to /products only (NextAuth vs Clerk — decide in
jobbuild), Stripe checkout integration, post-purchase delivery, and a customer
account page. The rest of the site stays open; auth only guards this section.
No subscriptions, no cohort flows in this job.
```

---

## 4. `email-funnel` — Substack embed swap

### Source
2026-06-07 decision: the self-hosted Resend nurture funnel originally scoped
for §4 is deferred indefinitely in favor of Substack. See
`currentwork/email-funnel/README.md` for the rewritten plan.

### Scope
Replace the native email capture form shipped in `wf` Phase 4.1 with a
brand-wrapped Substack embed iframe. Preserve the `source` prop on every call
site and forward it as UTM params on the iframe `src` so Substack publication
analytics can break signups down by pillar (delivery / workflow / business /
future) and by surface (homepage, episode, case).

**Concrete deliverables:**
- Delete `src/components/capture/actions.ts` and its tests
- Replace `src/components/capture/EmailCapture.tsx` body with a Substack
  iframe component (Bone-wrapped, UTM params encoding the pillar)
- Add `src/components/capture/sourceToPillar.ts` helper
- Add `NEXT_PUBLIC_SUBSTACK_EMBED_URL` env var

### Out of scope (handled by Substack itself)
- Email templates, sending, deliverability, list management
- RFC 8058 unsubscribe + List-Unsubscribe header
- Per-subscriber tagging at signup (Substack Pro feature; we use UTM + sections instead)
- HMAC tokens, webhooks, cron, admin dashboard, suppression vs purchases
- A/B testing, SMS/push, CRM integration

### Dependencies
- `website-foundation` Phase 4.1 (shipped)
- Operator creates a Substack publication and provides the embed URL

### Suggested jobbuild prompt
N/A — this job IS the rewrite. The plan already lives at
`currentwork/email-funnel/{README.md,phase-1-substack-swap.md}`; invoke
`/pipeline ef email-funnel-1.1` (or any 1.x section) directly.

---

## 5. `community-showcase` — "Built with Fabled10X" feature

### Source
Phase 3 of the implementation-plan doc: "Built with Fabled10X" community
showcase".

### Scope
Build a community showcase section where community members can submit their
own projects built using the Fabled10X methodology. Each submission becomes a
public page with project description, builder profile, screenshots, and
outbound links.

**Decisions required:**
- **Submission flow**: fully editorial (agents review + curate), public form
  with moderation queue, or GitHub PR-based intake?
- **Route**: `/community`, `/built-with`, or `/showcase`?
- **Schema**: new `Showcase` content type with fields for builder, project,
  stack, links, screenshots?
- **Moderation**: what gets rejected?

### Out of scope
- User accounts for submitters (editorial submission handles identity via
  GitHub handle or email)
- Commenting / upvoting
- Tagging / filtering (add later)

### Dependencies
- `website-foundation` (design system, shell, content loader pattern)
- No new npm packages for editorial intake; GitHub PR-based intake needs no
  infra at all

### Suggested jobbuild prompt
```
/jobbuild community-showcase

Build the "Built with Fabled10X" community showcase per Phase 3 of the
implementation-plan doc. New content type + loader + route tree + a submission
flow (editorial or PR-based — decide in jobbuild). Each showcase entry is a
public page documenting a community project built using the Fabled10X
methodology. No user accounts, no commenting, no upvoting.
```

---

## 6. `testimonials-results` — Results wall + testimonial components

### Source
Phase 3 of the implementation-plan doc: "Results wall / testimonials" under
Community & Social Proof.

### Scope
Testimonial content type + loader + a "results wall" page + reusable
`<Testimonial>` and `<ResultsWall>` components that can be dropped into the
homepage, `/products`, `/about`, and landing pages.

**Content structure per testimonial:**
- Author (name, title, company, photo URL)
- Quote
- Context (which product / case study / outcome it relates to)
- Metric (optional — "saved 50 hours/month", "delivered in 6 weeks", etc.)
- Date
- Verified (boolean — whether it's a real client with their permission)

### Out of scope
- Dynamic testimonial collection form (manual editorial intake for v1)
- Video testimonials (later — schema should leave room)
- Aggregate "star rating" display

### Dependencies
- `website-foundation` (design system + content loader pattern)
- No new npm packages

### Suggested jobbuild prompt
```
/jobbuild testimonials-results

Build a Testimonial content type + loader, a /results page that shows a
results wall, and reusable <Testimonial> + <ResultsWall> components that can
be dropped into the homepage, /about, and /products. Editorial intake only
for v1 — no public submission form. Include an optional metric field per
testimonial ("saved 50 hours/month" etc).
```

---

## 7. `cohort-enrollment` — Course / cohort waitlist + application flow

### Source
Phase 3 of the implementation-plan doc: "Cohort enrollment integration".

### Scope
Build cohort-specific pages, a waitlist form (captures interest before a
cohort is announced), an application form (captures details once a cohort is
live), and the scheduling layer that reveals cohort pages at announced times.

**Deliverables:**
- `Cohort` content schema (title, start date, capacity, price, status:
  announced / open / full / closed / shipped)
- `/cohorts` index + `/cohorts/[slug]` detail
- Waitlist form (emails go to a dedicated Resend audience)
- Application form (longer — captures background, goals, commitment level)
- Application review + acceptance flow (how? TBD during jobbuild)
- Integration with `storefront-auth` for payment collection after acceptance

### Out of scope
- Cohort platform itself (content delivery, Zoom integration, etc.)
- Automated application scoring
- Calendar integration

### Dependencies
- `website-foundation` (shell, capture component, content loader)
- `storefront-auth` (auth + payments for enrollment)
- Resend audience for cohort waitlist (separate from main newsletter audience)

### Suggested jobbuild prompt
```
/jobbuild cohort-enrollment

Build cohort enrollment per Phase 3 of the implementation-plan doc. Includes:
Cohort content schema, /cohorts index + detail routes, waitlist form, full
application form, application review flow (editorial — decide how in
jobbuild), and integration with storefront-auth for payment collection after
acceptance. Does not build the cohort delivery platform itself.
```

---

## 8. `build-in-public-docs` — Site that documents its own build process

### Source
Phase 4 of the implementation-plan doc: "Full documentation of site build
process as Fabled10X content" under The Meta Play.

### Scope
The fabled10x.com site itself is built by the same agent workflow being
documented on the channel. This job builds a section of the site that
surfaces that workflow: a live view of `currentwork/` job progress, the TDD
pipeline's beat status, and completed sections rendered as published content
(rather than internal plumbing).

**Deliverables:**
- A `/build-log` or `/inside-the-build` route tree
- Reader for `currentwork/*/README.md` + phase files → rendered as published
  content
- Reader for `pipeline/active/session.yaml` + `knowledge.yaml` → rendered as a
  live status board
- Optional: historical view of completed sections pulled from git log +
  `pipeline/archive/` (if that directory gets created by some cleanup process)
- Very meta: the site builds itself and documents the building as it goes

**Open question:** should this be public-by-default or gated behind email? The
brand doc's "show the work" principle argues for public.

### Out of scope
- Running pipeline operations from the site (read-only view of existing state)
- Editing `currentwork/` or `pipeline/` content from the site
- Real-time updates (static rebuild per content change is enough)

### Dependencies
- `website-foundation` (design system + content loader; this job writes a
  *different* loader that reads `currentwork/` and `pipeline/active/` instead
  of `src/content/`)
- No new npm packages

### Suggested jobbuild prompt
```
/jobbuild build-in-public-docs

Build a /build-log section of fabled10x.com that reads currentwork/ and
pipeline/active/ directly and renders them as published content — a live view
of the agent-driven build process that ships the site itself. Phase 4 of the
implementation-plan doc ("The Meta Play"). Read-only, no editing from the
site. Decide public-vs-gated during jobbuild.
```

---

## 9. `lll-deep-integration` — Featured LLL entries + inline callouts

### Source
Phase 4 of the implementation-plan doc: "Deeper integration with LLL —
featured-entry cards, 'from the library' callouts" under The Meta Play.

### Scope
Upgrade on the Phase 4.2 LLL crosslinks component from `website-foundation`.
Instead of just listing outbound URLs, fetch metadata from
`largelanguagelibrary.ai` and render rich entry cards with title, summary, tag
pills, and "from the library" inline callouts inside episode and case bodies.

**Deliverables:**
- LLL API client (or scraper, depending on what LLL exposes)
- Featured entry card component
- Inline "from the library" callout component consumable inside MDX
- Cache layer for LLL metadata (build-time fetch with fallback to cached JSON)
- Cross-domain referral tracking (so LLL knows where traffic came from)

### Out of scope
- Bidirectional integration (LLL linking back to fabled10x is LLL's concern)
- Editing LLL entries from fabled10x

### Dependencies
- `website-foundation` Phase 4.2 crosslink component
- LLL project must expose an API or stable data contract — depends on LLL's
  implementation state. Check `docs/large-language-library-implementation-plan.md`
  before starting.

### Suggested jobbuild prompt
```
/jobbuild lll-deep-integration

Upgrade the LLL crosslink component delivered in website-foundation Phase 4.2
with rich entry cards (title, summary, tags) fetched from largelanguagelibrary.ai
at build time, plus an inline "from the library" callout consumable from MDX
bodies, and cross-domain referral tracking. Requires LLL to expose a stable
data contract — check docs/large-language-library-implementation-plan.md
first. Phase 4 of the implementation-plan doc.
```

---

## 10. `search` — Browse/search across episodes + cases

### Source
Open question in the implementation-plan doc: "Search implementation — Algolia
vs. built-in Next.js search? Decision deferred to implementation phase, low
priority at launch."

### Scope
Add search across episodes and cases. Decision: Algolia (hosted, richer
ranking, costs money) vs. a built-in static index (free, simpler, less
powerful). The doc defers the call to implementation.

**Deliverables:**
- Search index build step (either push to Algolia or generate a static
  JSON index at build time)
- `/search` route with input, results list, and empty-state handling
- Keyboard-accessible search UI (cmd-k trigger optional)
- Result ranking that weights episode title > summary > body, case title >
  problem > body

### Out of scope
- Search analytics (later)
- Typo-tolerance beyond what the chosen engine offers out of the box
- Search across tools, products, or the storefront
- Scoped search (episodes-only, cases-only filters) — defer

### Dependencies
- `website-foundation` (content loader provides all records to index)
- Enough content volume to justify — skip this job until there are 10+
  episodes or 5+ cases. The placeholder seed content isn't worth indexing.
- Algolia account (if that path is chosen; user provisions)

### Suggested jobbuild prompt
```
/jobbuild search

Add search across /episodes and /cases. Decide between Algolia (hosted, richer
ranking) and a built-in static JSON index during jobbuild. Deliverables:
indexing build step, /search route with results, and keyboard-accessible
search UI. Skip until content volume (10+ episodes or 5+ cases) justifies.
Cites the "Search implementation" open question in
docs/website-implementation-plan.md.
```

---

## Things explicitly NOT on this list

These are captured in the implementation-plan doc but are not code work and do
not become jobs:

- **Handle-locking across platforms** — social account creation, one-time
  operational work, tracked elsewhere.
- **Domain secured** — already done (`fabled10x.com` live).
- **`/llms.txt`** — already live, polished as part of `website-foundation`
  Phase 4.4.
- **Email platform decision** — already decided: Resend.
- **Auth provider decision** — deferred until `storefront-auth` kicks off;
  that job will decide.
- **Search decision** — deferred until `search` kicks off.

---

## Maintenance

When a job in this doc is planned (via `/jobbuild`) but not yet shipped:
- Leave it in this doc so the context exists for future agents.
- Add a note at the top of that job's section: `**Status:** planned, see
  currentwork/{slug}/README.md`.

When a job ships (all phases complete, final commit made):
- Move the job's section to a new `## Completed` section at the bottom of
  this doc with a `**Shipped:** {date} — see commit {hash}` line.
- Remove the "Suggested jobbuild prompt" block (no longer actionable).

Do not delete shipped entries outright — future refactoring or related
jobbuild runs may need the original scope context.
