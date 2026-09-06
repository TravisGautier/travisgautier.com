# Agent Team Tactics — Playlist Plan

**Series:** Playbook (Tier 2)
**Primary Pillar:** Workflow — "How do you manage AI agents on complex projects?"
**Crossover Pillars:** Delivery (T3, T5, T6, T7), Business (T6)
**Episodes:** 8
**Target Length:** 12–18 min per episode
**Status:** Planning

---

## Positioning

The Travis Gautier Pipeline playlist shows the integrated system — 105 beats, YAML contracts, skill chain, full orchestration. Not everyone needs the full system. Most people need tactical techniques they can apply to their next feature, their next prompt, their next review session.

This playlist is the tactical toolbox. Eight episodes, each a discrete technique pulled from real projects. How to review AI output the way a staff engineer reviews a junior's PR. How to prompt for a database schema that doesn't need three rewrites. How to turn a wireframe into a working feature in one session. How to produce a 40-page technical specification that clients actually read.

Each episode is standalone. Pick the ones that solve a problem you have today. No pipeline required. No ideology required. Just tactics that work, demonstrated on real artifacts from a real client project.

### Target Audience

- Developers who've started using AI for coding but feel like they're "winging it" on quality
- Technical founders who need enterprise-grade documentation but don't want to write it from scratch
- Freelancers and consultants who want to produce higher-quality client deliverables with AI
- Engineering managers curious about how "managing AI agents" compares to managing humans
- Anyone who watched The Travis Gautier Pipeline playlist and wants the bite-sized versions

### What This Playlist Is NOT

- Not the full Travis Gautier Pipeline methodology (see that playlist for the integrated system)
- Not a "prompt engineering" playlist — these are tactics grounded in real deliverables, not abstract prompt patterns
- Not theoretical — every episode is built around an actual artifact from the Party Masters client build

---

## Playlist Arc

| Act | Episodes | Purpose |
|-----|----------|---------|
| 1: The Mindset | T1–T2 | How to think about AI agents as a team. How to review their output. |
| 2: The Craft | T3–T7 | Specific tactical patterns for specific artifact types — schemas, docs, specs, proposals, features. |
| 3: The Honest Truth | T8 | Where AI fails on complex projects. What stays a human problem. |

---

## Episode Plans

### ACT 1: THE MINDSET

---

### T1 — "How I Manage AI Agents Like a Dev Team Lead"

**Runtime target:** 15–18 min
**Pillar:** Workflow
**Search intent:** "managing AI agents," "AI dev team management," "how to use AI like a team," "AI agent orchestration"

**GATEWAY EPISODE — designed for maximum discovery. The "team lead" frame is immediately intuitive and reframes AI work for everyone who watches.**

#### Thesis
The skills of engineering management transfer directly to managing AI agents. Delegation, context handoffs, quality standards, PR reviews, team norms. If you've ever led a dev team, you already know how to lead an agent team. You just have to recognize what you already know.

#### Outline
1. **Hook** (60–90s) — "I used to manage a team of six engineers. Now I manage a team of AI agents. The management playbook barely changed. Here's what transferred, what didn't, and why the comparison works better than 'AI as a tool.'"
2. **The mental model** (3–4 min) — Reframe the work:
   - "AI agent" is a colleague, not a tool — with specific strengths, blind spots, and context needs
   - Every prompt is a task assignment. Every review is a code review. Every knowledge doc is team documentation.
   - The shift: from "how do I get AI to produce X" to "how do I set my team up to ship X"
   - Four management responsibilities that transfer: delegation, context, review, standards
3. **Delegation** (3–4 min) — Task assignment the way a good lead does it:
   - Clear scope (the input)
   - Clear success criteria (the output)
   - Context about the surrounding system (the codebase, the patterns, the constraints)
   - Bad delegation: "build me a lead capture form"
   - Good delegation: "build a lead capture form that matches the existing form patterns in src/components/forms/, submits via the existing API at /api/leads, handles the same validation rules as the contact form, and includes tests for the three scenarios we discussed"
   - Same AI. Same model. Different output quality.
4. **Context management** (3–4 min) — The single biggest skill:
   - Every AI session has a context window. It's not infinite.
   - Prioritize what goes in: task description, relevant code, existing patterns, test examples
   - Exclude what doesn't need to be there: unrelated files, stale conversation history, boilerplate
   - Show real examples: a good context setup vs a bloated one, and the output quality difference
5. **Review practices** (3–4 min) — PR review translated:
   - First pass: does this solve the problem stated?
   - Second pass: does this follow the existing patterns?
   - Third pass: hallucinated APIs? Missing edge cases? Security oversights?
   - The review is focused on the specific failure modes AI has — not general code quality
   - (Preview of T2: the full AI-specific review checklist)
6. **Team norms** (2 min) — Standards enforcement:
   - Every team has norms (test coverage, commit message format, documentation standards)
   - With AI agents, norms live in prompt templates, skill files, or project CLAUDE.md files
   - "The norms that used to exist in your team's culture now live in your repo's config"
7. **Close** (60s) — "You're not 'using AI.' You're leading a team. The difference is that the team is always available, works in parallel, and has perfect recall of whatever you put in their context. The management skills are the same. They just matter more now."

#### Key visuals
- Team lead org chart diagram morphing into agent workflow diagram
- Side-by-side prompt comparison (weak delegation vs strong delegation)
- Context window visualization (what's in vs what's left out)
- AI-specific review checklist on screen

#### Source materials
- CLAUDE.md from travisgautier (project config as team norms)
- .claude/skills/ directory structure (skills as standard operating procedures)
- Real prompt examples — weak vs strong delegation
- Engineering management resources (The Manager's Path, Staff Engineer, etc. — brief citations)

#### Shorts potential
- "Stop thinking about AI as a tool. Start thinking about it as a junior dev who never sleeps. Your management playbook already works."
- "Bad prompt: 'build a lead form.' Good prompt: 'build a lead form matching src/components/forms/, using /api/leads, with these three tests.' Same AI. Better output."
- "Team norms used to live in your culture. Now they live in your repo."

---

### T2 — "Quality Control: How I Review AI Output on Complex Projects"

**Runtime target:** 15–18 min
**Pillar:** Workflow
**Search intent:** "AI code review," "reviewing AI-generated code," "AI output quality," "how to check AI code"

#### Thesis
Reviewing AI code is not the same as reviewing human code. Humans fail in one set of ways (logic errors, typos, misunderstandings). AI fails in a different set (hallucinated APIs, silent edge-case drops, pattern drift from codebase, confident wrongness). The review checklist needs to match the failure modes.

#### Outline
1. **The wrong review** (2 min) — What most people do:
   - Read the code, check if it "looks right," run it, ship it
   - This works when the author is a human who has their own internal consistency
   - AI has no internal consistency — every session starts blank and confident
2. **AI-specific failure modes** (4–5 min) — What to look for:
   - **Hallucinated APIs** — calls to methods that don't exist, props that don't exist, libraries that aren't imported. Show real examples from Party Masters build.
   - **Silent edge case drops** — happy path works perfectly; empty arrays, null values, concurrent access all break silently
   - **Pattern drift** — code that "works" but uses a different pattern than the rest of the codebase. Style drift from training data, not malice.
   - **Security by omission** — auth checks, input validation, sanitization — skipped entirely unless explicitly prompted
   - **Confident wrongness** — the code is syntactically perfect, runs without errors, and is wrong
3. **The review checklist** (4–5 min) — Six questions for every AI-generated change:
   1. Does this call anything that doesn't exist? (run tsc, check imports, grep for the method)
   2. What happens with empty/null input? (write one test for each edge)
   3. Does this match the existing patterns? (diff against similar code in the repo)
   4. Is authentication/authorization handled? (explicit check, not assumed)
   5. What does this silently fail on? (error states, network failures, malformed input)
   6. Would I ship this if a junior wrote it? (the bar stays the same)
4. **Review in practice** (3–4 min) — Live demo:
   - Open an AI-generated component from a real project
   - Run through the six questions on camera
   - Show what gets caught, what doesn't, what gets sent back for revision
5. **The judgment layer** (2 min) — What review can't catch:
   - Wrong abstraction choices (the code works, but the architecture is weird)
   - Business logic bugs that match the spec exactly (garbage in, garbage out)
   - These need a different review pass — reviewing the spec, not the code
6. **Close** (60s) — "AI doesn't need less review. It needs different review. The mental model shifts from 'did the human understand the problem?' to 'did the model produce something that matches reality?' Different failure modes. Different checklist. Same ship/no-ship decision."

#### Key visuals
- Six-question checklist graphic (branded, screenshot-worthy)
- Code samples showing each failure mode with red annotations
- Live terminal: running tsc and tests on AI output
- Diff view: AI output vs codebase patterns

#### Source materials
- Real AI output from Party Masters build with common failure modes
- Before/after: code that passed weak review vs the same code post-checklist
- tsc output showing hallucinated imports

#### Shorts potential
- "AI code doesn't need less review. It needs different review. Here's the six-question checklist."
- "The code runs. The tests pass. It's still wrong. That's the AI review problem."
- "Hallucinated APIs, silent edge case drops, pattern drift, security by omission. Four failure modes humans don't have."

---

### ACT 2: THE CRAFT

---

### T3 — "Prompting for Database Design — Schema, Relationships, Indexes"

**Runtime target:** 15–18 min
**Pillar:** Workflow (crosses into Delivery)
**Search intent:** "AI database schema," "AI Prisma schema generation," "AI database design," "prompting for data modeling"

#### Thesis
Database design is where unconstrained AI fails most visibly. Naive prompts produce junk schemas — missing relationships, no indexes, normalization errors, wrong data types. Constrained prompts produce enterprise-grade schemas. The difference is the structure of the prompt chain, not the model.

#### Outline
1. **The naive result** (2–3 min) — Show the failure:
   - Prompt: "Design me a database schema for an event management CRM"
   - AI produces: flat table with 30 columns, no relationships, no indexes, random data types
   - Run through what's wrong: missing entities, denormalized fields, no FK constraints, no performance considerations
   - "This is what happens when you ask AI to skip to the answer."
2. **The prompt chain** (5–6 min) — Four-stage schema design:
   - **Stage 1: Entity identification.** "List the entities this system needs to model. For each, describe its real-world purpose and lifecycle." Get entities before tables.
   - **Stage 2: Relationship mapping.** "For each entity pair, describe their relationship — one-to-one, one-to-many, many-to-many, optional, required. Identify which entity owns the relationship."
   - **Stage 3: Attribute specification.** "For each entity, list attributes with data types, nullability, defaults, and business rules. Flag anything that should be enumerated vs free-text."
   - **Stage 4: Schema generation.** Now produce the schema — Prisma, SQL, or whichever format. With every decision from stages 1-3 as context.
   - Show the prompts, the outputs of each stage, and the final schema quality
3. **Real example: Party Masters data dictionary** (4–5 min) — Walk through the actual artifact:
   - PartyMastersDataDictionary.xlsx — 11 core tables (clients, leads, bookings, quotes, invoices, payments, equipment, staff, assignments, playlists, event timelines)
   - Relationships: booking has many services, service has many assignments, assignment references staff
   - Domain-specific constraints: booking dates can't overlap for the same staff member
   - "This wasn't one prompt. It was a four-stage conversation that produced a schema I'd be proud to ship to production."
4. **Indexes and performance** (2–3 min) — The step most people skip:
   - Prompt: "For this schema, identify the top 10 queries the application will run. For each, recommend the indexes that would optimize it."
   - AI produces indexed schema with justifications
   - Show the difference in query plans (EXPLAIN output)
5. **Close** (60s) — "Database design is where AI goes from 'impressive demo' to 'shipping production software.' The prompt chain is the difference. Four stages. Same AI. Different world."

#### Key visuals
- Naive schema vs constrained schema side-by-side
- Four-stage prompt chain diagram
- Real Party Masters data dictionary on screen
- Prisma schema output with relationships visualized

#### Source materials
- PartyMastersDataDictionary.xlsx (real artifact from Party Masters)
- Four-stage prompt templates (create and link in description)
- Prisma schema output examples
- Query plan comparisons (EXPLAIN output before/after indexes)

#### Shorts potential
- "Asked AI for a database schema. Got a flat table with 30 columns. Asked again with four stages. Got something I'd ship to production."
- "Entities, then relationships, then attributes, then schema. In that order. Never skip to the answer."
- "The prompt that gets you indexes: 'List the top 10 queries this app will run. Recommend indexes for each.'"

---

### T4 — "Why I Make AI Write Documentation Before Code"

**Runtime target:** 12–15 min
**Pillar:** Workflow
**Search intent:** "AI documentation generation," "documentation driven development," "AI spec writing," "writing docs first"

#### Thesis
Making AI write documentation before code is a specification forcing function. Code that can't be clearly documented can't be clearly built. The documentation becomes the contract. The code has to match it. The review becomes dramatically easier.

#### Outline
1. **The backwards ritual** (2 min) — How most people work:
   - Build the feature first, document it after (if ever)
   - The docs describe what got built, not what should have been built
   - Post-hoc documentation rationalizes rather than specifies
2. **Documentation-first flipped** (3–4 min) — What changes:
   - Before any code: write the README section for this feature
   - What problem does it solve? What's the API? What are the usage examples? What are the edge cases?
   - If the AI can't produce clear docs, the feature isn't well-defined yet. Loop back.
   - "Code that can be clearly documented is code that's clearly specified."
3. **How this differs from test-first** (2–3 min) — The complementary principle:
   - Tests-first (Pipeline P4): prove behavior, catch regressions, verify edge cases
   - Docs-first: force specification, force user-facing clarity, force API design decisions
   - Docs-first runs before tests-first. Together, they cover design + verification.
4. **Live demo** (3–4 min) — A real feature, docs-first:
   - Pick a feature from Party Masters (e.g., quote builder, lead capture)
   - Prompt: "Write the README section for this feature before I build it. Include problem statement, API surface, usage examples, edge cases, and security considerations."
   - AI produces the docs. Walk through them. Flag anything unclear — those are the places the feature isn't specified yet.
   - Revise the docs until they're clear. Now build to match.
5. **The review dividend** (2 min) — Why this makes review faster:
   - With docs-first, code review becomes "does this match the docs?"
   - Without docs-first, code review becomes "is this doing the right thing?" which requires re-deriving the spec
   - A 15-minute doc up front saves 30 minutes of review
6. **Close** (60s) — "Documentation-first isn't about producing better docs. It's about producing better code. The docs are a forcing function for specification. Skip them and you'll debug the spec inside the code instead of fixing it in text."

#### Key visuals
- Timeline comparison: docs-after vs docs-first
- Live terminal: prompting for docs, producing unclear docs, revising
- Diff: before docs-first feature vs after docs-first feature

#### Source materials
- Real README sections from Party Masters features (before-code version)
- Feature-Specifications.docx (Party Masters)
- Prompt templates for docs-first workflows (create and link)

#### Shorts potential
- "Write the README before you write the code. If the AI can't document it clearly, it doesn't understand it clearly."
- "Docs-first is a specification forcing function. Not about better docs — about better code."
- "15 minutes of docs saves 30 minutes of code review. Every time."

---

### T5 — "Building a 40-Page Technical Specification With AI Agents"

**Runtime target:** 18–22 min
**Pillar:** Workflow (crosses into Delivery, Business)
**Search intent:** "AI technical specification," "AI enterprise documentation," "AI software architecture docs," "technical spec generation"

**CENTERPIECE EPISODE — the full Party Masters technical specification on screen. Concrete proof that AI can produce enterprise-grade docs that clients actually read and sign off on.**

#### Thesis
AI can produce enterprise-grade technical specifications — the kind that used to take a senior engineer two weeks — in a single afternoon. The quality difference between a junk spec and a client-signable spec is the structure of the document, not the intelligence of the model. Get the structure right and the AI fills it in.

#### Outline
1. **Setting the stakes** (2–3 min) — Why specs matter in consulting:
   - A technical specification is the contract between you and the client on what gets built
   - Without one: scope creep, misaligned expectations, "that's not what I meant"
   - With one: clear deliverables, clear acceptance criteria, clear milestone payments
   - The Party Masters spec was 40+ pages. Andy read it. Andy signed off. Andy paid.
2. **The three specs** (4–5 min) — Party Masters produced three linked documents:
   - **Feature Specifications** — what the system does, user stories, acceptance criteria
   - **Technical Architecture Specification** — how it's built, stack, deployment, integration points
   - **API Endpoints Specification** — every endpoint, request/response shape, auth, rate limits
   - Show the table of contents for each on screen
   - "Three documents. One consistent reality. Each reviewable on its own, each cross-referencing the others."
3. **The structure-first approach** (5–6 min) — How to produce them:
   - Start with the table of contents. Not the content. Just the TOC.
   - Prompt: "For a custom CRM system covering [scope], produce the table of contents for a feature specification document. Use industry-standard structure. Include sections for context, user personas, feature descriptions, user stories, acceptance criteria, out-of-scope items."
   - Review the TOC. Add sections that are missing. Remove sections that don't apply.
   - Now fill in each section, one at a time, with specific project context.
   - "Most people try to produce the whole spec in one prompt. It fails. Produce the skeleton, then fill the bones."
4. **Live demo** (5–6 min) — Build a mini spec on camera:
   - Pick a feature from Party Masters (e.g., the quote builder)
   - TOC generation: prompt produces the spec structure
   - Section by section: prompt for each, with context from previous sections
   - Watch the document take shape
   - Compare to the final Party Masters version — same structure, same quality
5. **The sign-off moment** (2–3 min) — The client reading the spec:
   - Andy read the 40-page spec. Not everyone would.
   - But the ones who do — that's where the trust forms. "This person knows what they're building."
   - Milestone payments attach to the spec. If what ships matches the spec, payment triggers. If it doesn't, there's a clear conversation.
6. **Close** (60s) — "A 40-page technical spec used to be a two-week deliverable. AI makes it an afternoon. The leverage isn't 'AI does the work.' It's 'AI makes enterprise-grade documentation cost-effective for projects that never could have afforded it.'"

#### Key visuals
- All three Party Masters specs on screen (tables of contents)
- Structure-first prompt chain diagram
- Time-lapse of spec being built section by section
- The signed proposal with the spec attached

#### Source materials
- Feature-Specifications.docx (Party Masters)
- Technical-Architecture-Specification.docx (Party Masters)
- API-Endpoints-Specification.docx (Party Masters)
- Structure-first prompt templates (create and link)

#### Shorts potential
- "A 40-page technical specification used to take two weeks. AI turns it into an afternoon. The client still reads every page."
- "TOC first. Sections second. Never the whole spec in one prompt. Never."
- "The spec is the contract. If what ships matches the spec, you get paid. The spec has to be buildable. AI makes that affordable."

---

### T6 — "Building Interactive Proposals With AI (HTML, Not Slides)"

**Runtime target:** 15–18 min
**Pillar:** Workflow (crosses into Business, Delivery)
**Search intent:** "AI proposal generation," "interactive HTML proposals," "AI client proposals," "sales proposals AI"

#### Thesis
Slide-deck proposals are a dying format for software sales. An interactive HTML proposal — tabs, ROI calculators, expandable sections, actual product mockups embedded — closes better because it feels like the product. AI can produce them. The Party Masters $34,500 proposal is the proof.

#### Outline
1. **Why slides lose** (2 min) — The problem with PowerPoint/Keynote:
   - Linear — one slide at a time, forced narrative
   - Can't embed interactive elements — no live calculators, no clickable mockups
   - Feels like a pitch, not a product preview
   - Decks get glanced at. HTML proposals get explored.
2. **What HTML proposals do differently** (3–4 min) — Walk through party-masters-complete-proposal.html:
   - Tabbed navigation — client jumps to what they care about
   - Embedded mockups — preview of the actual CRM inside the proposal
   - ROI calculator — client inputs their numbers, sees the payback period
   - Milestone breakdown — interactive timeline with deliverables
   - Dual-path structure — custom build vs SaaS partnership, side-by-side
   - "The client doesn't read the proposal. They explore it. Different verb. Different outcome."
3. **The prompt structure** (4–5 min) — How AI produces these:
   - Step 1: content outline (what goes in the proposal, organized by decision the client needs to make)
   - Step 2: component design (for each section, what interactive element would serve the decision)
   - Step 3: HTML generation (single-file HTML, inline CSS, inline JS — no build tools, opens in any browser)
   - Step 4: polish pass (branding, typography, spacing)
   - "Each step is a prompt. The AI doesn't do it all at once. It does it in layers that build on each other."
4. **Live demo** (4–5 min) — Build a proposal section on camera:
   - Take the Party Masters ROI calculator
   - Walk through how the prompt chain produced it
   - Show the final interactive version
5. **The sales impact** (2 min) — What the format changes:
   - Proposal shares are measurable — the client forwards HTML to their partners
   - Time-on-proposal is measurable — if there's analytics, you see what they actually explored
   - Close rate differs from slide decks — in Andy's case, the dual-path HTML closed the $34,500 path
6. **Close** (60s) — "Stop sending PDFs. Stop sending slide decks. Send a URL. Let the client explore. The interactive proposal is the new minimum for serious software sales."

#### Key visuals
- Side-by-side: slide deck proposal vs HTML proposal
- Screen recording: walking through party-masters-complete-proposal.html
- The ROI calculator in action
- The dual-path structure ($34,500 vs $125,000)

#### Source materials
- party-masters-complete-proposal.html (real artifact)
- party-masters-investment-overview.html (real artifact)
- proposal-optimization-analysis.md
- Prompt templates for HTML proposal generation (create and link)

#### Shorts potential
- "Stop sending PDF proposals. Send an HTML URL. The client explores instead of reading."
- "My client forwarded my HTML proposal to three partners. That's distribution a slide deck can't get."
- "The $34,500 proposal had an ROI calculator built in. The client ran their own numbers before the call."

---

### T7 — "From Wireframe to Working Feature in One Session"

**Runtime target:** 15–18 min
**Pillar:** Delivery (crosses into Workflow)
**Search intent:** "AI wireframe to code," "AI Figma to React," "AI UI implementation," "wireframe to production code"

#### Thesis
AI can turn a clear wireframe into a working, stylable, tested feature in a single session — if the wireframe is clear, the context is complete, and the prompt is structured. The gap between "AI generated a component" and "AI generated a shippable feature" is process, not model capability.

#### Outline
1. **The naive path** (2 min) — What doesn't work:
   - Screenshot of wireframe → "build this in React" → inconsistent output, wrong styling system, no tests, no integration
   - The wireframe alone isn't enough context
2. **What the wireframe needs to include** (3–4 min) — Clarity preconditions:
   - Every interactive element labeled with its behavior (not just "button" — "Submit button, POSTs to /api/quote, shows loading state, redirects on success")
   - Data dependencies called out (what populates this dropdown? what API does this form submit to?)
   - Responsive behavior shown (mobile and desktop variants, or explicit "desktop only")
   - States shown (empty, loading, error, success) — not just the happy path
   - "The wireframe is the spec. If the spec is ambiguous, the AI will confidently guess wrong."
3. **The context package** (3–4 min) — What goes into the prompt alongside the wireframe:
   - Existing component patterns from the codebase (point at src/components/ for style)
   - Existing form handling patterns (react-hook-form? Server actions? fetch?)
   - The design system tokens (colors, spacing, typography)
   - The API surface this feature integrates with
   - "The wireframe shows what. The context shows how. You need both."
4. **Live demo** (5–6 min) — Take a Party Masters wireframe and build it:
   - Show the wireframe first
   - Walk through the context package
   - Run the generation
   - Walk through the output: the component, the tests, the integration
   - Show it running in the actual app
5. **What this doesn't replace** (2 min) — Limits:
   - Design judgment — the wireframe has to be good. AI doesn't fix bad UX.
   - Novel interactions — new patterns the codebase hasn't seen need human thought first
   - Accessibility review — AI produces functional code, not always accessible code. Still needs audit.
6. **Close** (60s) — "Wireframe to working feature in one session is possible. It's also a specific discipline. The model didn't change. The inputs did. Better inputs, better feature."

#### Key visuals
- Wireframe on screen
- Context package assembly diagram
- Live terminal: generation running
- Final feature running in the app (side-by-side with wireframe)

#### Source materials
- Party Masters wireframes (complete-mvp-demonstration-guide.md, party-masters-complete-dashboard.html, mobile-demo.html)
- The actual implemented features that came from those wireframes
- Context package template (create and link)

#### Shorts potential
- "Wireframe to working feature in one session. Not a demo — a shippable feature. Here's what the wireframe needs to include."
- "Every button on your wireframe needs a label that describes behavior. 'Submit' isn't enough. 'POSTs to /api/quote, shows loading, redirects on success' is."
- "The wireframe shows what. The context shows how. You need both. AI can't guess the codebase."

---

### ACT 3: THE HONEST TRUTH

---

### T8 — "When AI Fails — The Parts I Had to Fix Myself"

**Runtime target:** 18–22 min
**Pillar:** Workflow (crosses into Delivery, Future)
**Search intent:** "AI coding failures," "when AI doesn't work," "AI limitations," "AI coding problems," "skills AI can't replace," "how to become a proficient AI developer"

**CREDIBILITY EPISODE — and the bridge to the Zero to 10X curriculum. This episode diagnoses the failure modes; the curriculum treats them. Where every other tactics episode sells a technique, this one sells a learning path.**

#### Thesis
Every Agent Team Tactics episode shows what works. This one shows what didn't — and then shows where to go next. There is a specific set of skills AI doesn't replace, won't replace with the next model release, and probably won't replace in this decade. They are teachable. The rest of the Travis Gautier ecosystem points at them, but the **Zero to 10X curriculum** is where they actually get taught, in sequence, for free, from the ground up.

If you watched the previous seven episodes and felt, "these tactics are great but I don't have the judgment underneath them" — this episode tells you why, and tells you where to go.

#### Outline
1. **Why this episode exists** (90s) — Set the honesty frame:
   - Every tactics playlist is selling a methodology. Every methodology has limits.
   - The limits are more valuable to share than the wins — the wins are already visible in the artifacts from the previous seven episodes
   - "If you walk away from this playlist thinking AI does everything, your next complex project will break your trust. Better you hear this from me than find out from a failed client engagement."
2. **The four failure modes** (7–8 min) — Real examples from the Party Masters build, each tagged with its curriculum anchor:

   **Failure 1: Judgment calls — architecture decisions** (2 min)
   - Real example: early in Party Masters, AI proposed a database schema with a specific normalization choice. Defensible, but wrong for this specific business — the queries that would actually run made denormalization the better call.
   - AI optimizes locally. Humans optimize globally. The context window doesn't contain enough business-domain information to close that gap.
   - *Curriculum anchor: Zero to 10X Z30 "Architecture Decisions — Why This And Not That"*

   **Failure 2: Debugging state-shaped bugs** (2 min)
   - Real example: a Wix webhook integration that worked in dev, failed intermittently in staging. AI hypothesized three causes, each plausible, each wrong. The actual cause was a race condition that required holding the full deployment environment in your head.
   - Some bugs can't live in a context window. You have to build the mental model, then find the bug.
   - *Curriculum anchor: Zero to 10X Z29 "Systems Thinking — Debugging What You Can't See"*

   **Failure 3: Novel patterns** (2 min)
   - Real example: the quote builder had a novel multi-service pricing interaction. AI's first attempt copied patterns from e-commerce checkout. Wrong mental model — the codebase hadn't seen this pattern, and the pattern didn't exist in training data.
   - Had to sketch the interaction on paper, then describe it precisely, before AI could produce the right component.
   - AI is pattern-matching at scale. When the pattern doesn't exist, AI can't invent it well. That's novelty work — and novelty work needs critical reading, not more prompting.
   - *Curriculum anchor: Zero to 10X Z28 "Reading Code Critically — Not Just Running It"*

   **Failure 4: Scope judgment** (2 min)
   - Real example: a feature where AI kept adding edge case handling. Technically correct, but added complexity the client didn't need and wouldn't pay for.
   - AI defaults to comprehensive. Proportionate is a human call.
   - *Curriculum anchor: Zero to 10X Z31 "Scope Discipline — Knowing When to Stop"*

3. **The pattern beneath the failures** (3 min) — Name it explicitly:
   - These four failures aren't random. They cluster. The cluster has a name: **the judgment layer.**
   - Every failure involves holding something the context window can't hold: business context, system state over time, novel intent, proportionate scope
   - The judgment layer is the part of being a developer that AI capability improvements don't erase
   - "Better models make better executors. They don't make better judges. Judgment is learned differently."
4. **Where the judgment layer gets taught** (3–4 min) — Introduce Zero to 10X:
   - "I keep pointing at curriculum episodes. Here's what I'm pointing at."
   - Zero to 10X is a 40-episode curriculum that takes someone from zero coding experience to a proficient AI developer. Professor Messer style — free, sequential, comprehensive.
   - Act 5 of the curriculum (Z27–Z34) is built specifically around the judgment layer. Every failure mode in this episode has a dedicated curriculum episode.
   - Show the Act 5 episode list on screen: Z27 "What AI Can't Do" → Z28 "Reading Code Critically" → Z29 "Systems Thinking" → Z30 "Architecture Decisions" → Z31 "Scope Discipline" → Z32 "Security Thinking" → Z33 "Performance Intuition" → Z34 "The Judgment Test"
   - "If you felt these failure modes as you watched this playlist, that act is for you. The tactics alone aren't enough if you don't have the judgment underneath. The curriculum builds the judgment."
5. **Two audiences, two paths** (2 min) — How to use the curriculum from here:
   - **If you're already building things:** Act 5 alone is valuable. You have the tools. You're missing the judgment layer. Watch Act 5, do the Z34 judgment test, come back.
   - **If you're earlier in the arc — or starting from zero:** the whole curriculum is for you. Z1 assumes zero experience. Z40 lands you at proficient. Sequential. Free. No gatekeeping.
   - "I'm not sending you to a paid bootcamp. I'm sending you to free YouTube episodes. The curriculum exists because the judgment layer should be teachable, not gated."
6. **Close** (60–90s) — "If someone tells you AI does the whole job, they're selling something. If someone tells you AI can't help, they haven't tried the right process. The truth is the judgment layer — it's real, it's teachable, and the Zero to 10X curriculum is how I teach it. Every tactics episode in this playlist assumed you already had that layer. This episode is the one that tells you what to do if you don't."

#### Key visuals
- Four failure modes as a clear graphic, each tagged with its curriculum Z-episode
- Real code/commits from each failure example (split-screen: AI's proposed solution vs the actual fix)
- The "judgment layer" diagram: what context windows can't hold
- Zero to 10X Act 5 episode list on screen — the full treatment sequence
- Curriculum card/end-screen CTA: "Start at Z1 or jump to Z27 — your call"

#### Source materials
- Real debugging sessions from Party Masters build
- Git commits showing human-corrected AI output
- ANDY-FEEDBACK-TRIAGE-V1.md (examples of scope judgment)
- The Wix webhook race condition debugging trail
- docs/playlists/zero-to-10x.md (curriculum reference — Act 5 specifically)

#### Shorts potential
- "AI optimized for a schema I had to reject. The local answer was right. The global answer was different. That's the judgment line."
- "Six hours debugging a Wix race condition. AI helped me validate the fix. Couldn't have found it alone. Some bugs don't fit in a context window."
- "AI defaults to comprehensive. Scope discipline is still human work."
- "If someone tells you AI does the whole job, they're selling something."
- "The judgment layer is real, it's teachable, and it's free. Zero to 10X on YouTube."
- "Watched a whole tactics playlist and felt like you were missing the fundamentals? That's the point of Act 5."

---

## Cross-Playlist Integration

### Zero to 10X curriculum crossover (primary — anchored by T8)
- **T8 is the diagnostic. Zero to 10X Act 5 (Z27–Z34) is the treatment.** T8 names four failure modes; Act 5 has a dedicated curriculum episode for each.
- Specifically: T8 judgment → Z30 "Architecture Decisions" · T8 debugging → Z29 "Systems Thinking" · T8 novel patterns → Z28 "Reading Code Critically" · T8 scope → Z31 "Scope Discipline"
- T1 "Dev Team Lead" frame previewed at graduation level in curriculum Z38
- T2 six-question review checklist is the foundation of curriculum Z28 and Z36
- T3 four-stage database design prompt chain introduced in curriculum Z25
- T5 structure-first spec approach used in curriculum Z25–Z26
- "The tactics in this playlist assume the judgment layer. The curriculum builds the judgment layer."

### The Travis Gautier Pipeline crossover
- T1 "Manage AI Agents Like a Dev Team Lead" is the mindset layer under Pipeline P6's 105-beat system
- T4 "Docs Before Code" is the tactical cousin of Pipeline P4 "Tests Before Code" — both are specification forcing functions
- T5 "40-Page Technical Specification" is the narrative version of Pipeline P5's YAML contracts — same principle, different output format
- T8 "When AI Fails" parallels Pipeline P8 "Where AI Fails — What the Pipeline Catches" — this one frames around human intervention, that one frames around system coverage
- "If you want the integrated system, watch The Travis Gautier Pipeline playlist. If you want discrete tactics, this playlist is your toolbox."

### Building Party Masters tie-ins
- T3 uses the real Party Masters data dictionary
- T5 walks through the real Party Masters technical specifications
- T6 walks through the real party-masters-complete-proposal.html
- T7 uses real Party Masters wireframes and their implementations
- T8 uses real debugging examples from the Party Masters build
- "Every tactic in this playlist was built on the Party Masters project. See Building Party Masters for the full context."

### Building Large Language Library tie-ins
- T8 references patterns that became candidate LLL entries (scope judgment, race condition debugging, novel UX patterns)
- "The problems AI couldn't solve in Party Masters became some of the first seed entries in the Large Language Library"

### Night Build tie-ins
- T3 database design prompting — run live on a community-requested schema → clip for T3
- T5 spec generation — build a spec on stream for a Night Build viewer project → clip for T5
- T7 wireframe-to-feature — take a viewer's wireframe and build it live → clip for T7

### Shorts strategy
- Each episode produces 2–4 Shorts (mapped above)
- Total: ~25 Shorts from the playlist
- Highest-performing will be T1 management frame, T5 40-page spec in an afternoon, T8 AI failure moments

### Community & Ecosystem (Tier 5)
- "Review My AI Output" — community submits AI-generated code, review on stream using T2 checklist
- "Sketch My Schema" — community submits database design problems, apply T3 four-stage prompt chain
- "Proposal Teardown" — community submits HTML proposals, apply T6 structure critique

---

## Production Notes

### Recording order vs playlist order
The episodes don't need to be recorded in order. Recommended priority:
1. **T1** first — gateway episode, the "dev team lead" frame is the most shareable concept
2. **T5** — centerpiece, requires the Party Masters specs on screen (highest production value)
3. **T2** — foundational, referenced by every other episode
4. **T6** — interactive proposal, highest narrative tie-in to sales content
5. **T3, T4, T7** — craft episodes, can be recorded in any order
6. **T8** — credibility episode AND curriculum bridge. Best recorded after (a) the craft episodes exist so "what this playlist doesn't show you" has contrast and (b) Zero to 10X Act 5 is at least outlined so T8's curriculum references point at real episodes

### Data to capture before recording
- [ ] Weak prompt vs strong prompt output comparisons for T1
- [ ] Real AI output from Party Masters with each failure mode from T2 (hallucinated APIs, silent edge case drops, pattern drift, security omission)
- [ ] Screen recordings of the four-stage prompt chain for T3
- [ ] Before/after README examples for T4
- [ ] All three Party Masters specs on screen for T5
- [ ] Full party-masters-complete-proposal.html walkthrough recording for T6
- [ ] Wireframe-to-feature session recording for T7
- [ ] Real debugging session trails for T8 failure examples

### Template assets to create
- [ ] Six-question AI code review checklist graphic (T2)
- [ ] Four-stage database design prompt chain diagram (T3)
- [ ] Docs-first prompt templates (T4)
- [ ] Spec structure-first prompt templates (T5)
- [ ] HTML proposal prompt chain templates (T6)
- [ ] Wireframe context package template (T7)
- [ ] AI's job / human's job boundary diagram (T8)
- [ ] "Agent Team Lead" visual identity — management-themed Shorts cards (T1)
