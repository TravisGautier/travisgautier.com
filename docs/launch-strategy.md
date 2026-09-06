# Fabled10X — Launch Strategy & Growth Plan

**Document Version:** 1.0
**Created:** March 2026
**Purpose:** Pre-launch through month 12 execution plan

---

## PHASE 0: PRE-LAUNCH FOUNDATION (4-6 Weeks Before First Video)

### Brand Asset Lockdown
- [ ] Secure @Fabled10X handle on: YouTube, X, TikTok, Instagram, GitHub, LinkedIn
- [x] Secure domain: fabled10x.com (live). fabled10x.dev remains an optional future alias.
- [ ] Channel banner, profile image, consistent bio across all platforms
- [ ] YouTube "About" section written and polished
- [ ] Channel trailer: not needed at launch (bad one is worse than none)

### Build in Public on X (Primary Pre-Launch Platform)
Start posting 4-6 weeks before first YouTube video. Share real artifacts from Party Masters project with minimal context — let curiosity do the work.

**Post examples (daily, pull from project files):**
- Screenshot of interactive HTML proposal + "I used an AI agent team to build a full CRM for a client. $34,500 project. No traditional dev team."
- Screenshot of feedback action report + "My client gave me 25 pieces of feedback. I triaged, built 21 in one sprint."
- Screenshot of folder structure + "This is the folder structure that runs a $30K+ consulting engagement."
- Market analysis snippet + "There are 3,000 businesses in this niche and only 2 real competitors."
- Text-only hook: "The 10x developer isn't a myth. It just doesn't look like what anyone expected."

**Engagement strategy:** Reply on other people's posts about AI, freelancing, building with agents. Be specific — share concrete things, not generic takes.

### Community Seeding
Become a known, contributing member BEFORE dropping YouTube links.

**Key communities:**
- Indie Hackers (forum and community)
- r/SaaS and r/freelance on Reddit
- AI builder Discord servers
- Hacker News (for technical content)
- LinkedIn (consulting/agency angle)

**Approach:** Share real insights, be genuinely helpful, build reputation. Answer questions with actual methodology (e.g., pricing framework, milestone payments) and mention documenting the process. Don't drop YouTube links — earn the right first.

### Email List (Optional But High-Leverage)
Simple landing page at fabled10x.com:
- Channel name + tagline
- Brief description of what's coming
- Email signup for launch notification
- Direct line to most interested early audience for launch day

**Current status:** Landing page is live as a minimal placeholder (Next.js 16 + Tailwind v4 on VPS standalone). Email capture is not yet wired up — no ESP (ConvertKit / Resend / Buttondown / etc.) chosen, no form component built. This remains Phase 0 work but is not blocking launch; can land any time before the first video drops.

### Pre-Produce Launch Batch
5-7 videos fully produced and ready before publishing anything:
- Episodes 1-3 of flagship series
- 2 standalone Playbook episodes
- Buffer prevents scrambling while building momentum
- Consistent schedule from day one (algorithm rewards this)

---

## PHASE 1: LAUNCH WEEK (Days 1-7)

### Day 1 — The Anchor Drop
**Publish:** Episode 1 (The Market Nobody's Watching)
- Strongest hook: real business opportunity in niche nobody's considered, discovered with AI agents

**Simultaneously on X:** Launch thread (8-12 posts) — compressed version of the full story ending with Episode 1 link. Pin to profile.

**Community posts:** Share in every seeded community. Not as promotion — as genuine share from someone they've seen contributing.

**Email list:** Send launch email. Short: "The channel is live. Episode 1 is here."

### Day 3 — Episode 2
Landing the client and selling the discovery phase.
- Rapid follow-up reinforces subscriptions
- Signals to YouTube that content retains viewers
- X post: standalone insight from episode (email template, discovery-as-product framing)

### Day 5 — Playbook Episode 1
"How I Price Custom Software — Real Numbers, Real Project"
- Designed to be SEARCHABLE (people search "how to price software projects")
- Brings in new viewers who haven't seen the series
- Introduces Fabled10X world to search-driven audience

### Day 7 — Episode 3
Discovery call deep-dive closes week 1.
- 4 videos in 7 days: market opportunity, client acquisition, pricing methodology, discovery call
- Algorithm has enough data to start identifying audience

---

## PHASE 2: MOMENTUM BUILDING (Weeks 2-4)

### Content Cadence
- 1 flagship episode per week (Episodes 4-7: discovery toolkit, current-system audit, database design, feature specs)
- 1 Playbook/Tactics episode every 2 weeks
- 3-4 Shorts per week (sharpest clips from long-form)

### Shorts Growth Engine
- Every long-form video yields 2-3 Shorts minimum
- Quote builder demo, folder structure walkthrough, pricing breakdown, market opportunity
- Purpose: DISCOVERY — someone sees clip, gets curious, finds full series
- Volume and variety: not every one hits, but ones that do drive thousands of profile visits

### Cross-Platform Amplification
- Every long-form video → companion X post (standalone insight, not just link)
- Every Short → TikTok + Instagram Reels simultaneously
- LinkedIn → longer, professional version of narrative (consulting/agency audience)
- Not separate content — same core material reformatted for different contexts

### Guest Appearances & Collaborations
Start outreach to podcast hosts and YouTubers in adjacent spaces.

**Pitch:** "I'm a non-developer who used AI agent teams to deliver a $34,500 CRM for a real client. I'm documenting the entire process. Happy to share the full story."

**Target:** Podcasts and channels focused on freelancing, AI tools, indie hacking, small agency operations. One mid-size podcast appearance (5,000-20,000 listeners) can drive meaningful subscriber bump.

---

## PHASE 3: INFLECTION PUSH (Weeks 5-8)

### Build Episodes Land
Flagship series enters Act 3 — actually building the CRM. Episodes 10-14 cover foundation, lead management, calendar, quote builder, payment processing.

Most clippable content: screen recordings of working features, before/after comparisons, real-time prompting sessions.

### First Digital Product Launch (Week 6-8)
**"The AI Consulting Discovery Toolkit" — $49-$97**
- Folder structure, templates, interview scripts, questionnaire, current-state assessment, proposal frameworks
- Everything demonstrated throughout Season 1, packaged for download
- Natural mention in videos: "I've packaged the toolkit I showed in this series — link in description"

### Community Building
Launch community space (Discord, Skool, or email newsletter).
- Viewers tell you what they want to see next
- Content ideas from community
- Engaged members become organic evangelists

---

## PHASE 4: SEASON 1 FINALE & BEYOND (Weeks 9-24)

### Strong Finish
Episodes 15-24: staff portal, integrations, milestone demo, feedback loop (25-item sprint), action report, reflection, SaaS opportunity, network advantage, partnership proposal.

**Feedback loop episodes (18-21) = highest engagement content.** Real client pushback, real iteration, real professional delivery. Promote heavily.

### Season 2 Tease
Finale teases what's next:
- If SaaS partnership proceeds → multi-tenant conversion, go-to-market, beta customers
- If it doesn't → equally compelling pivot story

### Scale Product Line
By Season 1 end, audience data informs next products:
- Full course on AI-powered consulting
- Premium toolkit with advanced templates
- Cohort program
- Consulting packages for viewers who'd rather hire than DIY

---

## NIGHT BUILD LIVESTREAM INTEGRATION

### Launch Timing
Begin Night Builds in week 3-4 of launch (after initial video momentum established).

### Technical Setup (Hyprland + OBS)
- PipeWire + xdg-desktop-portal-hyprland for screen capture
- Separate "Screen Capture (PipeWire)" source per monitor in OBS
- Verify no bitdepth,10 conflicts in Hyprland monitor config
- OBS scenes: "Full Code," "Split View," "Zoom In," "Break"
- Lo-fi/ambient audio, dark mode aesthetic, minimal overlay

### Stream-to-Content Pipeline
Each 3-4 hour stream produces:
- 3-5 Shorts from highlights
- Highlight segments for standalone videos
- Teachable moments referenced in flagship episodes
- VOD replay for passive watch hours and ad revenue

### Community Functions
- Super Chat Q&A during builds
- Member-only post-stream sessions
- Community votes on what gets built next
- Co-working atmosphere: viewers build alongside

---

## METRICS TO WATCH

### Early Signal Metrics (Month 1-3)
- **Click-through rate (CTR):** Above 5-6% = titles/thumbnails working. Below 3% = needs change.
- **Average view duration:** 40%+ of long-form = content holds attention. Below 25% = losing people.
- **Subscriber conversion rate:** % of viewers who subscribe. Measures compelling content.
- **Shorts-to-channel pipeline:** Do Shorts drive long-form views?

### Growth Metrics (Month 4-12)
- Subscriber trajectory (compare week to week, month to month)
- Monthly channel views
- Email list growth rate
- Digital product conversion rate
- Community engagement (Discord/newsletter activity)

### Revenue Metrics (Once Monetized)
- RPM by video type (flagship vs playbook vs shorts)
- Digital product revenue per month
- Affiliate clicks and conversions
- Sponsorship deal pipeline
- Consulting inbound inquiry volume

**Don't compare to established channels. Compare week 1 to week 4, week 4 to week 8. Trajectory matters more than absolute numbers.**

---

## REALISTIC TIMELINE EXPECTATIONS

Most channels with this strategy see meaningful traction (1,000-5,000 subscribers) within 3-6 months with strong content quality and consistent cadence.

The niche (AI-powered consulting, real project documentation) has high per-viewer value even at small scale. 3,000 engaged subscribers in this niche is worth more than 50,000 in generic content because viewers are buyers, not just watchers.

**Goal for first 90 days:** Proof of concept — enough signal that content resonates, audience exists, and the flywheel is starting to turn.
