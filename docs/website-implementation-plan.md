# Fabled10X — Website Implementation Plan
**Document Version:** 1.0
**Created:** April 2026
**Domain:** fabled10x.com (secured)
**Purpose:** Full platform implementation plan for fabled10x.com

---

## STRATEGIC OVERVIEW

Fabled10X.com is the brand and marketing site for the Fabled10X YouTube channel and social media presence. It is the place the audience lands after seeing a video, a Short, a livestream, or a social post — and it is the primary asset for converting viewers into subscribers, email signups, and customers of the digital product line.

### What This Site Is
- The home page for the YouTube channel
- A browseable index of episodes with full show notes and the actual artifacts referenced in each video
- A library of project case studies (Party Masters first, more as new client projects roll through)
- A small set of free interactive tools that double as top-of-funnel SEO
- The storefront for the Fabled10X digital products (templates, toolkits, course/cohort)
- The promotional landing point for **The Large Language Library** — Fabled10X's sister project

### What This Site Is Not
- Not a knowledge base. The structured, AI-optimized knowledge repository is **The Large Language Library** (`largelanguagelibrary.ai`), a separate sister project with its own repo, domain, and identity. fabled10x links *out* to LLL — it does not host LLL content.
- Not a public JSON API surface for AI crawlers. That is also a LLL concern.
- Not a manufactured blog. Episode show notes and case studies are byproducts of real client work and channel content — not standalone written content.

### Relationship to LLL
LLL is the open knowledge infrastructure. fabled10x is the brand that built and champions it. Episodes and case studies cross-link out to LLL entries that were generated from the same client work. The connection is acknowledged on `/about` and surfaced in episode/case footers — not loud, not hidden.

---

## SITE ARCHITECTURE

### Top-Level Page Map

**Current build status:** Only `/` (minimal placeholder) and `/llms.txt` are live as of the initial scaffold. Everything below is the intended end-state; sections are built out incrementally. The auth-gated `/products` storefront is deferred to a later phase.

```
fabled10x.com/
├── /                    (Homepage)                              [live — placeholder]
├── /cases               (Project Case Studies)                  [planned]
├── /episodes            (YouTube Episode Index)                 [planned]
├── /tools               (Free Interactive Tools)                [planned]
├── /products            (Storefront — Auth Lives Here)          [planned — Phase 2]
├── /about               (Brand Story + LLL Relationship)        [planned]
└── /llms.txt            (Crawler-friendly site descriptor)      [live]
```

---

## PAGE SPECIFICATIONS

### `/` — Homepage
**Primary Job:** Communicate what Fabled10X is in one screen, drive viewers to the latest episode + storefront, capture email.

**Key Elements:**
- Brand statement front and center — one person, an agent team, full SaaS delivery
- Latest flagship episode embed/poster
- Entry points to each major section (`/episodes`, `/cases`, `/tools`, `/products`)
- A small "sister project" callout for The Large Language Library
- Primary email capture CTA
- No fluff — sharp, technical-but-accessible, irreverent toward hype

**Tone:** Confident. The site knows what it is. No over-explanation.

---

### `/cases` — Project Case Studies
**Primary Job:** Full documented project histories of real Fabled10X client work. The proof layer behind the channel narrative.

**Structure per case:**
- Project overview and client context
- Market research findings
- Discovery process documentation
- Technical decisions and rationale
- Deliverables
- Outcome and results
- **Crosslinks out to LLL entries** that were generated from this project (the structured "solved problems" live there, not here)

**Relationship to LLL:**
When a client project produces a solved problem worth indexing, that solution becomes a LLL entry. Case studies link out to those LLL entries by URL. The case is the narrative; LLL is the structured technical record.

**Launch Content:** Party Masters (Season 1)

---

### `/episodes` — YouTube Episode Index
**Primary Job:** Drive bidirectional traffic between YouTube and the site. Make every episode more valuable with supplementary material.

**Per episode:**
- Full show notes
- Source files / build artifacts referenced in the episode (rendered from `SourceMaterial`)
- Crosslinks out to LLL entries generated during the work shown (`Episode.lllEntryUrls`)
- Linked case study section
- Email CTA for toolkit/products referenced

**SEO value:** Episode titles + notes create long-tail search surface area around every topic covered on the channel.

---

### `/tools` — Free Interactive Tools
**Primary Job:** Free, no-auth, SEO-friendly utilities that attract developers and consultants. Top-of-funnel with email capture on output.

**Planned Tools:**
- Project scoping estimator
- Pricing calculator
- ROI calculator for AI agent workflows
- Discovery phase timeline generator

**No login required.** Tools are free. Email capture optional but prompted on result delivery.

---

### `/products` — Storefront
**Primary Job:** Monetization layer. Auth lives here and only here.

**Product Categories:**
- Workflow templates
- Discovery toolkit
- Proposal kit
- Complete playbook
- Course / cohort enrollment (Phase 3+)

**Auth Strategy:**
Authentication is scoped exclusively to the products section. The rest of the site remains open. Users arrive through episodes, case studies, or free tools, convert to email via contextual CTAs, and eventually hit the products layer for paid assets.

---

### `/about` — Brand Story + LLL Relationship
**Primary Job:** Tell the Fabled10X story. Who built this, why, and how.

**Key Elements:**
- The Fabled10X premise — one person, an agent team, full SaaS delivery
- The meta story — the channel and site are themselves built by the same agent workflow being documented on the channel
- **The LLL relationship** — Fabled10X built and champions The Large Language Library. Acknowledged openly, not loud. The DHH/Rails ↔ Basecamp framing: the tool is bigger than the brand that built it. Link out to `largelanguagelibrary.ai`.

---

### `/llms.txt` — Crawler-friendly site descriptor
**Primary Job:** Polite signal to AI crawlers describing what this site is and pointing them to the structured knowledge base.

This is a brand site. Crawlers and indexers are welcome — no rate limits, no disallows — but the structured, AI-training-grade knowledge entries live at `largelanguagelibrary.ai`. The `llms.txt` file makes that explicit so crawlers don't waste effort and so anyone reading it understands the relationship.

---

## TECHNICAL STACK

### Framework
**Next.js** — agents write it naturally, massive training data corpus, flexible enough to grow into every planned feature, supports both static and dynamic content patterns.

### Content Layer
**Markdown / MDX with structured YAML frontmatter** for episode show notes and case studies. Human-readable, machine-parseable, git-native.

### Workflow
**Git-based** — agentic harness commits content to `main`. Deploy pipeline (TBD — likely CI build + rsync/PM2 reload against the VPS) runs on merge. No GUI maintenance required.

### Hosting
**Self-hosted VPS.** Next.js is configured with `output: "standalone"` in `next.config.ts`, which produces a self-contained build (`.next/standalone/server.js` + required `node_modules`) that runs on a plain Node.js process — no Vercel lock-in. The final deploy mechanism (PM2 or systemd behind nginx, Docker image, or equivalent) is TBD; the standalone output is the foundation. Vercel was considered and explicitly rejected for this project: the goal is full control over infrastructure and the ability to host adjacent services (storefront backend, background workers, etc.) on the same machine.

### Search
**Algolia or built-in Next.js search** — useful for browsing episodes and case studies. Decision deferred to implementation phase, low priority at launch.

### Authentication
**Scoped to `/products` only.** NextAuth or Clerk. Decision deferred to Phase 2.

### CMS
**Flat file system to start** (markdown in git). Headless CMS considered if content management complexity grows.

---

## MAINTENANCE MODEL

The site is maintained by the agentic harness — the same system used to build it. This is:

1. **Operationally efficient** — no manual CMS updates
2. **On-brand** — the site demonstrates the Fabled10X methodology by existing
3. **Content for the channel** — the site build and maintenance is itself documented as part of the series

Update pipeline: New episode published on YouTube → agents create the matching `/episodes/[slug]` page with show notes and source-material artifacts → committed to git → auto-deployed. Same flow for case studies and storefront updates.

---

## PHASED ROLLOUT

### Phase 0 — Plant the Flag (This Week)
- [ ] Landing page live at fabled10x.com
- [ ] Email capture active
- [ ] `/llms.txt` in place from day one
- [ ] Handles locked across all platforms

**Deliverable:** A single, sharp page. Mission statement, email capture, something's coming.

### Phase 1 — Content Foundation (Launch through Month 3)
- [ ] Episode index begins populating as channel launches
- [ ] First episode pages live with show notes and source-material artifacts
- [ ] First lead magnet template available gated behind email
- [ ] Case study: Party Masters (Phase 1 — discovery and planning)
- [ ] LLL crosslinks live on episode and case pages
- [ ] SEO begins working immediately

### Phase 2 — Monetization Layer (Month 3-6)
- [ ] Products storefront live
- [ ] Auth implemented for product access
- [ ] Tools section: first 2-3 calculators
- [ ] Email sequence built out from capture to product funnel

### Phase 3 — Community & Social Proof (Month 6-12)
- [ ] "Built with Fabled10X" community showcase
- [ ] Results wall / testimonials
- [ ] Cohort enrollment integration

### Phase 4 — The Meta Play (Ongoing)
- [ ] Full documentation of site build process as Fabled10X content
- [ ] Deeper integration with LLL — featured-entry cards, "from the library" callouts

---

## SEO STRATEGY

### Why This Works
- YouTube creator brand sites get organic traffic from episode-title search and episode topic-area long-tail
- Free interactive tools (calculators, generators) attract their own search demand independently of the channel
- Case studies with real dollar figures and real client work attract high-intent searches from prospective clients
- Google rewards specific, technically accurate content tied to a real practitioner

### Content Format That Ranks
- Episode pages with full show notes, artifacts, and time-stamped highlights
- Case studies with concrete numbers, named tools, and decision rationale
- Tool pages with clear input/output and useful results

### Entry Points vs. Conversion Pages
- **SEO entry points:** `/episodes/[slug]`, `/cases/[slug]`, `/tools/[tool]`
- **Conversion pages:** Homepage, `/products`, email capture flows

---

## OPEN QUESTIONS (To Resolve in Implementation)

1. Search implementation — Algolia vs. built-in?
2. Auth provider — NextAuth vs. Clerk? (only matters once `/products` ships)
3. Which tools ship in Phase 1 vs Phase 2?
4. Email platform — ConvertKit, Beehiiv, or other?

---

## SUCCESS METRICS

### Phase 0-1
- Email capture rate on landing page
- Episode pages published per week (matching channel cadence)
- Organic search impressions (Google Search Console)

### Phase 2-3
- Organic traffic volume
- Email-to-product conversion rate
- Product storefront revenue
- Outbound clicks to LLL from episode/case pages

### Long Term
- Inbound links from developer content
- Channel subscriber growth attributable to site funnel
- LLL referral traffic share

---

*This document is a living implementation plan. It will be updated as phases complete and new requirements emerge.*
