# Fabled10X — Content Architecture

**Document Version:** 1.0
**Created:** March 2026
**Purpose:** Complete content structure, pillars, series formats, and episode planning

---

## Content Pillars

Every piece of content maps to one of four questions:

1. **What can an AI agent team actually deliver?** (The Party Masters series — proof it works)
2. **How do you manage AI agents on complex projects?** (Tactical workflow content)
3. **How do you run this as a business?** (The consulting playbook — clients, pricing, delivery)
4. **What's the future of this model?** (SaaS expansion, scaling, industry shift)

---

## Content Tiers

### Tier 1: Flagship Series (Documentary)
Long-running narrative series following real project lifecycles. This is what people subscribe for, binge watch, and share. Establishes credibility.

### Tier 2: Playbook Series (Standalone)
Independent episodes on business mechanics and AI workflows. More searchable, more shareable. Brings new viewers into the ecosystem.

### Tier 3: Short-Form & Hooks
YouTube Shorts, TikToks, clips. Purpose: stop the scroll and drive discovery. 30-90 seconds, one sharp insight, strong opening line.

### Tier 4: Night Build Livestreams
Vibecoding livestreams. Late-night sessions building with AI agents in real time. Builds community, generates content for all other tiers, drives memberships and Super Chats.

### Tier 5: Community & Ecosystem Content
Office Hours, "Roast My Scope" community episodes, Stack Reviews, case study breakdowns from viewers who replicate the process.

---

## FLAGSHIP SERIES: "Building Party Masters" — Season 1

### Season Arc (24 Episodes)

#### ACT 1: "THE OPPORTUNITY" (Episodes 1-4)
*Answers: How do I find a client and scope a real project?*

**Episode 1 — The Market Nobody's Watching**
- 3,000 dual DJ/rental businesses, only 2 dedicated competitors
- eWebmin stagnating on 2009 architecture, DJ Intelligence aging after 23 years
- Competitive research using AI agents (eWebmin analysis, Goodshuffle Pro pricing breakdown at $99 advertised but $217 with add-ons, DJEP migration patterns)
- Key insight: The first thing a Fabled10X does isn't code — it's research
- Source materials: ewebmin-crm-industry-analysis.md, event-management-software-alternatives-2025.md, dj-intelligence-platform-analysis.md

**Episode 2 — Landing the Client**
- How the opportunity was approached and positioned
- The discovery-phase-as-paid-product framing ($8-12K standalone value)
- Actual email template used
- Source materials: email-template-discovery-call-1.txt, call-strategy-guide.md, party-masters-business-intelligence-crm-sales.md

**Episode 3 — The Discovery Call**
- Call strategy guide and question prioritization framework
- Andy's 5 critical priorities: calendar, Wix integration, lead-to-booking workflow, quote automation, payment processing
- 13 categories of requirements from a single conversation
- What professional requirements gathering looks like
- Source materials: party-masters-discovery-call-1-summary-client.md, interview-question-templates.md

**Episode 4 — Building the Discovery Machine**
- Full discovery toolkit: 12 subfolders, templates, 15-day project plan
- Business profile template, pain points matrix, current-state workflows, future-state workflows
- Using AI to build an entire consulting methodology
- Source materials: discovery-phase-folder-structure-guide.md, discovery-phase-project-plan.md, DISCOVERY-TOOLKIT-SUMMARY.md, discovery-toolkit-guide.md

#### ACT 2: "THE BLUEPRINT" (Episodes 5-9)
*The technical planning before any code is written.*

**Episode 5 — Tearing Down the Current System**
- DJ Intelligence and eWebmin audit using AI-assisted analysis
- Platform analysis: pricing tiers, feature gaps, user migration patterns
- Mapping Andy's current workflow: 20-30 min manual quotes, double-booking risks, no Wix integration
- Source materials: dj-intelligence-platform-analysis.md, ewebmin-crm-industry-analysis.md, 02-Current-System-Audit-COMPLETE.md

**Episode 6 — Designing the Database**
- Data dictionary walkthrough, entity-relationship decisions
- Table specifications: clients, leads, bookings, quotes, invoices, payments, equipment, staff, assignments, playlists, event timelines
- Prompting AI agents for schema design
- Source materials: PartyMastersDataDictionary.xlsx, day-2-data-export-guide.md

**Episode 7 — Feature Specifications**
- Feature Specifications doc, API Endpoints Specification, Technical Architecture Specification
- Must-Have vs Should-Have vs Nice-to-Have prioritization
- User stories, acceptance criteria, technical requirements per feature
- AI producing enterprise-grade documentation
- Source materials: Feature-Specifications.docx, Technical-Architecture-Specification.docx, API-Endpoints-Specification.docx

**Episode 8 — Wireframes & UI Design**
- 15-25 screen designs, user journey maps
- Andy and Jayme's daily workflow mapping, client journey from lead to event
- Interactive HTML mockups that look like working product before any backend code
- Source materials: complete-mvp-demonstration-guide.md, party-masters-complete-dashboard.html, mobile-demo.html

**Episode 9 — The $34,500 Proposal**
- POTENTIAL VIRAL EPISODE — real dollar amounts shown
- Dual-path proposal: Path 1 at $34,500 (Custom CRM), Path 2 at $125,000 (SaaS Partnership)
- Interactive HTML proposal with tabs, ROI analysis, milestone payment structure
- $100/hour rate, 345-hour estimate vs industry benchmarks (300-500 hours typical)
- Source materials: party-masters-complete-proposal.html, party-masters-investment-overview.html, pricing-quick-reference.md, proposal-optimization-analysis.md

#### ACT 3: "THE BUILD" (Episodes 10-17)
*AI agent team building real features.*

**Episode 10 — Foundation Sprint**
- React/Node.js scaffolding, database schema implementation, authentication, hosting, CI/CD
- OWASP Top 10 security hardening
- Milestone: working login deployed to real URL

**Episode 11 — Leads & Contacts Come Alive**
- CRUD operations, contact models, relationship mapping
- Wix webhook integration for automatic lead capture
- Lead → Quote Sent → Pending → Booked → Completed workflow

**Episode 12 — The Calendar (Andy's #1 Priority)**
- Calendar build, conflict detection logic, multi-service scheduling
- Daily overview panel
- Real complexity managed by agent team

**Episode 13 — The Quote Builder (The Killer Feature)**
- 20-30 minutes per quote → under 10 minutes
- Step-by-step wizard, DJ package selection, equipment add-ons
- Automatic pricing calculations, combo discounts

**Episode 14 — Payment Processing**
- Stripe integration, deposit calculations, payment schedules, invoice generation
- PCI compliance considerations
- Hidden complexity inside "just add payments"

**Episode 15 — The Staff Portal**
- Self-service login, availability management, assignment views
- Mobile optimization (PWA)
- Multiple user roles: admin vs staff permissions and visibility rules

**Episode 16 — Wiring It All Together**
- Wix webhooks, email/SMS notifications, reporting dashboard
- External system integrations and gotchas

**Episode 17 — Milestone 1 Demo Day**
- Actual deliverable demonstration
- Walkthrough with Andy
- Milestone payment trigger — payoff episode

#### ACT 4: "THE FEEDBACK LOOP" (Episodes 18-21)
*What separates Fabled10X from every other AI build channel.*

**Episode 18 — 25 Items of Raw Feedback**
- Andy's actual feedback document
- Triage process: Milestone 2 sprint items vs Milestone 3 deferred items
- Priority assessment (HIGH/MEDIUM/LOW)
- Questions needing Andy's input before proceeding
- Source materials: ANDY-FEEDBACK-TRIAGE-V1.md

**Episode 19 — The Iteration Sprint**
- Building 21 completed items: status-based color coding, service type indicators, calendar filters, global search with predictive autocomplete, daily overview panel, phone field formatting, venue autocomplete, staff notes separation, W9/COI quick send, auto-status changes
- Real sprint backlog execution with agent team

**Episode 20 — The Action Report**
- Professional deliverable documenting every change
- Structure: "Your feedback" → "What we built" → "How it works"
- 4 items deferred to payment processing, 3 to staff management
- Managing client expectations around scope
- Source materials: ANDY-FEEDBACK-ACTION-REPORT.md

**Episode 21 — What I'd Do Differently**
- Honest reflection: what went right, what was harder than expected
- Where AI struggled, where process saved the day
- Judgment calls no amount of prompting could solve

#### ACT 5: "THE BIGGER PLAY" (Episodes 22-24)
*From custom CRM to SaaS company.*

**Episode 22 — The SaaS Opportunity**
- Market sizing: 3,000 addressable businesses, only 2 real competitors
- Competitive positioning: purpose-built for dual DJ + rental operators
- Source materials: event-management-software-alternatives-2025.md

**Episode 23 — The $400K Network Advantage**
- MBA-LEVEL CONTENT — Andy's 200+ industry contacts change the entire financial model
- Conservative expected value: $238K → $709K
- Break-even: 30 months → 12-15 months
- CAC: $1,000-2,000 → $100-300
- Source materials: updated-scenarios-with-network.md, network-advantage-comparison.md

**Episode 24 — The Partnership Proposal (Season Finale)**
- 60/40 equity split, $125K investment thesis
- Go-to-market: network outreach → beta → expansion → beyond network
- CLIFFHANGER: Did Andy say yes? Season 2 tease
- Source materials: party-masters-complete-proposal.html (Path 2), proposal-optimization-analysis.md

---

## FLAGSHIP SERIES: "Building Large Language Library" — Season 1

*16-episode documentary following the real build of the Large Language Library (largelanguagelibrary.ai) — the open, AI-governed knowledge repository. Five competing AI models govern every submission. Built on camera, from first commit to first community contribution.*

*Full playlist plan with outlines, shot notes, and production checklist: [docs/playlists/building-large-language-library.md](../playlists/building-large-language-library.md)*

#### PLAYLIST ARC

**ACT 1: THE PROBLEM (L1–L3)** — Why AI knowledge is disappearing. The case for LLL. The five-model governance council as the hook.

**ACT 2: THE ARCHITECTURE (L4–L6)** — Schema design, governance mechanics, cost defense. Design before code.

**ACT 3: THE BUILD (L7–L11)** — Foundation through launch. Five API integrations, three contribution paths, 50 seed entries, launch day.

**ACT 4: THE PROOF (L12–L14)** — First community submission, council disagreements, real cost accounting.

**ACT 5: THE PROTOCOL (L15–L16)** — Plugin ecosystem, field expansion, LLL as public infrastructure.

- L1 — "Knowledge Dies in the Context Window"
- L2 — "What If We Built the Solution?"
- L3 — "Five AIs Walk Into a Library" *(gateway episode)*
- L4 — "A Schema for Everything Humans Know"
- L5 — "Designing the Jury"
- L6 — "The Seven-Layer Cost Defense" *(transparency episode)*
- L7 — "Day One: Five API Keys and a Database"
- L8 — "The Council Is Live" *(centerpiece)*
- L9 — "The Three Doors"
- L10 — "50 Problems Nobody's Solved (In Public)"
- L11 — "Launch Day"
- L12 — "The First Outsider" *(credibility episode)*
- L13 — "When the Council Disagrees"
- L14 — "The Real Cost of Free" *(transparency episode)*
- L15 — "Teaching AI to Contribute"
- L16 — "What Survives the Context Window" *(vision episode / season finale)*

---

## FLAGSHIP CURRICULUM: "Zero to 10X" — The Complete AI Developer Curriculum

*40-episode Professor Messer style curriculum. Takes someone from zero coding experience to a proficient AI developer. Sequential, free forever on YouTube, no paywall, no gatekeeping. Act 5 is the specific anchor point for the "judgment layer" skills AI can't replace — the diagnosis given in Agent Team Tactics T8 is treated here.*

*Full playlist plan with outlines, shot notes, and production checklist: [docs/playlists/zero-to-10x.md](../playlists/zero-to-10x.md)*

#### PLAYLIST ARC

**ACT 1: ORIENTATION (Z1–Z5)** — What coding is. What AI changed. Mental models. Environment setup.

**ACT 2: THE TOOLS (Z6–Z10)** — Terminal, editor, git, browser devtools, AI coding tools.

**ACT 3: THE FUNDAMENTALS (Z11–Z18)** — Core programming concepts with AI as learning partner and critical review as discipline.

**ACT 4: YOUR FIRST APP (Z19–Z26)** — End-to-end web app: frontend, backend, database, deploy.

**ACT 5: THE JUDGMENT LAYER (Z27–Z34)** — Human-level skills AI can't provide. *The T8 anchor.*

**ACT 6: THE 10X MOMENT (Z35–Z40)** — Shipping as a professional. Managing AI agents. The Fabled10X Pipeline as graduation project.

Full 40-episode list and cross-playlist integration in the linked playlist doc.

---

## TIER 2: PLAYBOOK SERIES

### "The Consulting Playbook" (Business Mechanics)
- "How to Run a Discovery Call That Closes $30K Projects"
- "The Folder Structure That Runs My Entire Consulting Business"
- "How I Price Custom Software — Real Numbers, Real Project"
- "Writing Proposals That Close: The Dual-Path Strategy"
- "Handling Client Feedback Like a Pro — 25 Items in One Sprint"
- "Why I Charge for Discovery (And How I Sell It)"
- "The Milestone Payment Structure That Protects Both Sides"
- "How to Audit a Client's Current System Before You Replace It"

### "Agent Team Tactics" (AI Workflow Methodology)

*8-episode tactical toolbox. Discrete techniques for managing AI agents as a team, reviewing their output, and producing specific artifact types (schemas, specs, proposals, features). Sister playlist to The Fabled10X Pipeline — Pipeline is the integrated system, this is the tactical building blocks.*

*Full playlist plan with outlines, shot notes, and production checklist: [docs/playlists/agent-team-tactics.md](../playlists/agent-team-tactics.md)*

#### PLAYLIST ARC

**ACT 1: THE MINDSET (T1–T2)** — How to think about AI agents as a team. How to review their output.

**ACT 2: THE CRAFT (T3–T7)** — Specific tactical patterns for specific artifact types — schemas, docs, specs, proposals, features.

**ACT 3: THE HONEST TRUTH (T8)** — Where AI fails on complex projects. What stays a human problem.

- T1 — "How I Manage AI Agents Like a Dev Team Lead" *(gateway episode)*
- T2 — "Quality Control: How I Review AI Output on Complex Projects"
- T3 — "Prompting for Database Design — Schema, Relationships, Indexes"
- T4 — "Why I Make AI Write Documentation Before Code"
- T5 — "Building a 40-Page Technical Specification With AI Agents" *(centerpiece)*
- T6 — "Building Interactive Proposals With AI (HTML, Not Slides)"
- T7 — "From Wireframe to Working Feature in One Session"
- T8 — "When AI Fails — The Parts I Had to Fix Myself" *(credibility episode)*

### "The Fabled10X Pipeline" (AI Engineering Methodology)

*15-episode playlist. AI development is the wild west — no standards, no methodology. This is the channel's definitive answer to "how should this actually work?"*

*Pedagogical structure: each skill is introduced as a standalone tool before the pipeline is ever shown as a whole. The pipeline reveal is the payoff, not the introduction.*

*Full playlist plan with outlines, shot notes, and production checklist: [docs/playlists/the-pipeline.md](../playlists/the-pipeline.md)*

#### PLAYLIST ARC

**ACT 1: THE PROBLEM (P1–P3)** — Name the chaos. Three practices anyone can start today.

**ACT 2: THE SKILLS (P4–P9)** — Each phase as a standalone tool. Adopt one, adopt all.

**ACT 3: THE ORCHESTRATION (P10)** — Reveal: chain the skills. Origin story. The full pipeline.

**ACT 4: THE TRUTH (P11–P13)** — Failures, costs, limitations. Verifiable proof.

**ACT 5: THE PATH FORWARD (P14–P15)** — How to start. Where this is heading.

- P1 — "AI Development Is the Wild West"
- P2 — "I Let AI Build a Feature With No Rules. Here's What Happened."
- P3 — "3 Practices That Fix 90% of AI Development" *(gateway)*
- P4 — "Discovery: The Specification Skill"
- P5 — "Red: The Test-Writing Skill"
- P6 — "Green: The Implementation Skill"
- P7 — "Refactor: The Quality Skill"
- P8 — "Finish: The Commit Skill"
- P9 — "Knowledge: The Memory That Makes It All Compound"
- P10 — "I Smashed Them All Together — The Pipeline Reveal" *(centerpiece)*
- P11 — "Where AI Fails — What the Pipeline Catches and What It Doesn't"
- P12 — "The Real Cost — Tokens, Time, and When It's Not Worth It"
- P13 — "This Pipeline Built This Website — The Proof" *(meta episode)*
- P14 — "How to Build Your Own Pipeline Today"
- P15 — "The Future of AI Engineering"

---

## TIER 3: SHORT-FORM HOOKS

30-90 seconds, one sharp insight, strong opening line. Clipped from long-form or created standalone.

#### Building Party Masters / Consulting
- "My client's quote process took 30 minutes. My AI agents built a system that does it in 10."
- "I charged $34,500 for software I didn't code. Let me show you the proposal."
- "25 pieces of client feedback. 21 built in one sprint. Here's the action report."
- "This is the folder structure that runs a $30K consulting engagement."
- "There are 3,000 businesses in this niche and only 2 competitors. That's how I found my client."
- "The 10x developer isn't a myth. It just doesn't look like what you thought."
- "My client's network of 200 contacts is worth $400K in customer acquisition value."
- "This single feature — the quote builder — justifies the entire $34K investment."

#### The Fabled10X Pipeline
- "AI development is the wild west. I built 105 checkpoints so my agents can't cut corners." (→ P6)
- "Everyone's vibecoding. I'm running a TDD pipeline. Here's why my code ships and theirs doesn't." (→ P1)
- "This YAML file is the difference between AI that codes and AI that engineers." (→ P5)
- "I don't let AI write code until it's written every test first. Every. Single. Time." (→ P4)
- "Most people prompt AI to 'build a feature.' I prompt it to discover, specify, test, implement, refactor, and commit — in that order." (→ P6)
- "My AI agents get smarter every feature. Here's the knowledge base that makes it happen." (→ P7)
- "Nobody's teaching AI engineering. Everybody's teaching AI prompting. That's the problem." (→ P1)
- "The pipeline that built this website is also the content on this website. Let me show you." (→ P10)
- "I let AI build a feature with zero rules. Then I built the same feature with a spec. Watch." (→ P2)
- "3 habits. 5 minutes each. Your AI output will never be the same." (→ P3)
- "Better AI doesn't mean you need less process. It means you need better brakes." (→ P9, P12)
- "Every commit hash in this video is on GitHub. Every test count is real. Check me." (→ P10)
- "You're not behind. The entire industry is figuring this out right now. The window is open." (→ P12)
- "AI is confident, not correct. That's the sentence that changed how I build." (→ P1, P4)

---

## TIER 4: NIGHT BUILD LIVESTREAMS

### Format
- **Schedule:** 1-2 nights per week (e.g., Tuesday/Thursday at 9-10 PM)
- **Duration:** 3-4 hours per session
- **Visual:** Dark mode everything, minimal clean overlay, small optional facecam, Fabled10X branding widget
- **Audio:** Lo-fi/ambient background music, calm conversational commentary, thinking-out-loud style
- **Pace:** Slow and real. Not performative. Working with company.
- **Series name:** "Night Builds" or "Late Night Agents"

### What Gets Built on Stream
1. **Real client project features** — connects directly to flagship series
2. **Community-requested tools** — engagement loop
3. **Fabled10X internal tools** — digital products being built live
4. **Pipeline runs** — run `/pipeline` on a real section start-to-finish, audience watches discovery → red → green → refactor → finish in real time. Clip highlights for Pipeline sub-series episodes and Shorts

### Stream Layout (OBS Scenes)
- **"Full Code"** — main coding monitor only (75% of time)
- **"Split View"** — both monitors visible
- **"Zoom In"** — cropped to specific window for detail
- **"Break"** — holding screen with music and branding

### Revenue Functions
- Drives Super Chat engagement ($200-$5,000/month depending on scale)
- Primary activation mechanism for channel memberships
- Generates 3-5 Shorts per stream from highlights
- VOD replays add significant watch hours
- Stream sponsorships are separate from video sponsorships

---

## CONTENT CADENCE

### Launch Month
- 4-5 long-form videos in first 2 weeks (Episodes 1-3 + 2 Playbook standalones)
- 3-4 Shorts per week
- Night Builds begin in week 3-4

### Ongoing (Post-Launch)
- 1 flagship episode per week
- 1 Playbook/Tactics episode every 2 weeks
- 3-4 Shorts per week (clipped from long-form + streams)
- 1-2 Night Build streams per week

### Monthly Output
- ~6 long-form videos
- ~12-16 Shorts
- ~4-8 Night Build VODs

### Season 1 Timeline
At 1 flagship episode per week, 24 episodes = ~6 months.
