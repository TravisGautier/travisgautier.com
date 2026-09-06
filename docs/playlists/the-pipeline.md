# The Pipeline — Playlist Plan

**Series:** Playbook (Tier 2)
**Primary Pillar:** Workflow — "How do you manage AI agents on complex projects?"
**Crossover Pillars:** Delivery (P2, P13), Future (P15)
**Episodes:** 15
**Target Length:** 10–20 min per episode (skill episodes shorter, pipeline reveal and honesty episodes longer)
**Status:** Planning

---

## Positioning

AI development is the wild west. There are no standards, no certifications, no agreed-upon best practices. Everyone with an API key is a "developer" now — and most of them are shipping code that would fail the first real user interaction. Meanwhile, experienced engineers are skeptical of AI tooling because what they've seen is toy demos and hype threads.

This playlist sits in the gap. It's for people who sense that AI-assisted development is real but know that what they're seeing online isn't the whole picture. It's the channel's definitive answer to "how should this actually work?" — honest about costs, honest about failures, backed by verifiable output.

### Target Audience

- Developers who've tried AI coding tools and hit the wall — "it works for small things but falls apart on real projects"
- Technical founders and solopreneurs who want to build with AI but don't trust the hype
- Engineers from traditional backgrounds who are skeptical but curious
- Self-taught developers who learned through AI and want to level up their process
- People who feel the "left behind" anxiety and want a real answer, not a sales pitch

### What This Playlist Is NOT

- Not a Claude Code tutorial (it uses Claude Code, but the principles are tool-agnostic)
- Not a "look how fast AI codes" flex (speed without process is the problem, not the solution)
- Not theoretical — every claim is backed by a git commit, a test count, or a live demo

### Pedagogical Structure

**The critical design choice:** each skill is introduced as a standalone tool the viewer can adopt in isolation *before* the pipeline is ever shown as a whole. The pipeline reveal is the payoff, not the introduction. This mirrors real adoption — nobody runs a 105-beat orchestrator on day one. They start with discovery, add red, and build up.

---

## Playlist Arc

| Act | Episodes | Purpose |
|-----|----------|---------|
| 1: The Problem | P1–P3 | Name the chaos. 3 practices anyone can start today. |
| 2: The Skills | P4–P9 | Each phase as a standalone tool — adopt one, adopt all, your choice. |
| 3: The Orchestration | P10 | Reveal: chain the skills. Origin story. The full pipeline. |
| 4: The Truth | P11–P13 | Failures, costs, limitations. Verifiable proof. |
| 5: The Path Forward | P14–P15 | How to start. Where this is heading. |

---

## Episode Plans

### ACT 1: THE PROBLEM

---

### P1 — "AI Development Is the Wild West"

**Runtime target:** 15–18 min
**Pillar:** Workflow
**Search intent:** "AI coding best practices," "AI development workflow," "how to use AI for coding"

#### Thesis
Constraint produces better output than freedom. Structure is the 10x multiplier. The gap between "AI can write code" and "AI can engineer software" is the gap between a demo and a product.

#### Outline
1. **Cold open** (60–90s) — Montage of AI coding hype: Twitter threads, "I built an app in 10 minutes" videos, "$0 to SaaS in a weekend." Then: cut to a bug report, a security vulnerability, a production outage. "This is what happens next. Nobody posts this part."
2. **The spectrum** (3–4 min) — What people are actually doing with AI in 2026:
   - Copy-paste from ChatGPT (works for snippets, doesn't scale)
   - Copilot autocomplete (faster typing, same architecture decisions)
   - Vibecoding full features (produces working demos, fragile products)
   - Autonomous agents (impressive, unverifiable, terrifying in production)
   - Each level shown with real examples — where it works, where it breaks
3. **The core problem** (3–4 min) — AI is confident, not correct. It will produce syntactically valid code that:
   - Calls APIs that don't exist (hallucinated methods)
   - Handles the happy path and silently drops edge cases
   - Ignores security entirely unless explicitly prompted
   - Drifts from your codebase's patterns toward its training data
   - Passes a quick review but fails the first real user
4. **Side-by-side demo** (4–5 min) — Same feature, same AI, two approaches:
   - Approach A: "Build me an episode listing page with filtering and search"
   - Approach B: Same request, but with a 10-bullet discovery doc first
   - Show the output, the test coverage, the edge case handling
   - The AI isn't smarter in approach B. It has better input.
5. **The thesis** (2–3 min) — "The 10x developer isn't faster at typing. They're better at specifying. AI makes that leverage 100x because the execution is nearly free — but only if the specification is right."
6. **Close** (60s) — "If you're watching this and thinking 'I don't have a process for this,' you're not behind. Nobody does. The entire industry is figuring this out right now. This playlist is how I figured it out. And it starts with three practices anyone can adopt today — then I'll give you each skill individually, and at the end I'll show you how I chain them all together."

#### Key visuals
- Split-screen code comparison (vibecoded vs spec-built)
- Terminal recordings of AI producing wrong code confidently
- The spectrum graphic (copy-paste → autocomplete → vibecode → agents → pipeline)

#### Source materials
- pipeline/README.md
- pipeline/TECH-DECISIONS.md
- Before/after code recordings (need to capture)
- Screenshots of AI hype tweets/posts (fair use commentary)

#### Shorts potential
- "Everyone's vibecoding. I'm running a TDD pipeline." (the split-screen moment)
- "AI is confident, not correct. That's the sentence that changed how I build."
- "Nobody's teaching AI engineering. Everybody's teaching AI prompting."

---

### P2 — "I Let AI Build a Feature With No Rules. Here's What Happened."

**Runtime target:** 12–15 min
**Pillar:** Delivery
**Search intent:** "AI coding without structure," "vibecoding results," "does AI code actually work"

#### Thesis
Unconstrained AI produces impressive-looking code that fails under real conditions. The failures aren't random — they're predictable categories that a process can catch.

#### Outline
1. **Setup** (2 min) — "I'm going to give my AI agent a real feature request with zero structure. No spec, no tests, no constraints. Just a prompt. Then I'm going to stress-test what it produces. No edits, no cherry-picking."
2. **The build** (4–5 min) — Screen recording of AI building a feature from a one-line prompt. Show the speed, the impressiveness, the "wow it works" moment. Let the viewer feel what vibecoding feels like — because it genuinely feels great.
3. **The audit** (4–5 min) — Now test it:
   - Empty state: what happens with no data?
   - Error state: what happens when the API fails?
   - Edge cases: special characters, long strings, concurrent access
   - Accessibility: keyboard navigation, screen reader
   - Security: injection, XSS, auth bypass
   - Performance: 1,000 items instead of 10
   - Document each failure. No commentary about AI being bad — just facts.
4. **The comparison** (3–4 min) — Same feature, same AI, but with a discovery doc written first (the 10-bullet spec from P3's methodology). Show what changes. Not everything — but the categories of failure from the audit are mostly gone.
5. **Close** (60s) — "The AI didn't get smarter. I got clearer. The difference between those two builds isn't intelligence — it's input quality. And input quality is a skill you can learn."

#### Key visuals
- Full-screen terminal recording, no cuts during the "build" phase
- Red/green audit checklist overlay as failures are discovered
- Side-by-side final comparison

#### Source materials
- Live screen recordings (need to capture — two takes, same feature)
- Audit checklist template

#### Shorts potential
- "I let AI build a feature with zero rules. Then I tested it." (audit montage)
- "The AI didn't get smarter. I got clearer."

---

### P3 — "3 Practices That Fix 90% of AI Development"

**Runtime target:** 12–15 min
**Pillar:** Workflow
**Search intent:** "AI coding tips," "how to use AI for development," "AI coding best practices 2026"

**GATEWAY EPISODE — designed for maximum shareability and search discovery. The viewer leaves with something they can do immediately, no skills required, no pipeline required.**

#### Thesis
You don't need a 105-beat pipeline to be good at AI-assisted development. You need three habits. Everything else in this playlist builds on these three.

#### Outline
1. **Hook** (60s) — "I'm going to give you three practices that will make every AI coding session better. They take five minutes each. They cost nothing. And they work regardless of which AI tool you use."
2. **Practice 1: Write a discovery doc before you prompt** (3–4 min)
   - What it is: 10 bullet points before you start. What you're building. What the inputs and outputs are. What could go wrong. What existing code it needs to match.
   - Live demo: write one in 5 minutes for a real feature
   - Before/after comparison of AI output with and without the doc
   - Template provided (link in description)
   - "This is the cheapest 5 minutes you will ever spend. And I built an entire skill around this — we'll cover it in episode 4."
3. **Practice 2: Make AI write tests first** (3–4 min)
   - What it is: before any implementation, prompt: "Write tests for this feature based on the spec. Include edge cases and error scenarios. Do not write any implementation code."
   - Why it works: AI writes to pass when tests exist. Without tests, it writes to impress.
   - Live demo: show tests catching a bug that would have shipped
   - "If the AI can't write a test for the feature, it doesn't understand the feature. You'll find out now instead of after you've built on top of it. Episode 5 goes deep on this one."
4. **Practice 3: Capture what you learned** (3–4 min)
   - What it is: after each feature, write one pattern ("this worked") and one gotcha ("this broke"). Feed them into the next session's context.
   - Live demo: show a knowledge note from a real session, then show it preventing a bug in the next session
   - "Most people treat every AI session as a blank slate. Your second session should be smarter than your first. Episode 9 shows how this compounds across months of work."
5. **Tying it together** (2 min) — "These three practices — specify, verify, remember — are the seeds of the six skills I'll show you in the next six episodes. Each skill automates and deepens one of these practices. But you don't need any of the skills to start. You need the three habits. Start there."
6. **Close** (30s) — CTA: "Try all three on your next feature. Drop a comment telling me what changed."

#### Key visuals
- Practice number cards (clean, branded, screenshot-worthy for sharing)
- Live terminal demos for each practice
- Discovery doc template on screen

#### Source materials
- Template discovery doc (create and link)
- Example knowledge.md entries from real sessions
- Live coding demos (need to capture)

#### Shorts potential
- "3 habits. 5 minutes each. Your AI output will never be the same."
- "Write 10 bullet points before you prompt. That's the whole trick."
- "If AI can't write a test for the feature, it doesn't understand the feature."

---

### ACT 2: THE SKILLS

*Each episode in this act follows a consistent template:*
1. *What the skill does (the prompt, the behavior)*
2. *Why it exists as a standalone tool — the problem it solves even if you don't chain it*
3. *Live demo using it in isolation on a real feature*
4. *SKILL.md walkthrough — the actual file, the actual prompt*
5. *When to use it, when not to*
6. *How it changes your workflow even without the full pipeline*

---

### P4 — "Discovery: The Specification Skill"

**Runtime target:** 12–15 min
**Pillar:** Workflow
**Search intent:** "AI specification prompt," "AI requirements doc," "AI planning skill," "how to spec for AI"

#### Thesis
Discovery is 20% of the work and 80% of the value. Even using this skill *alone* — with no other phase, no pipeline — will 5x the quality of every prompt that follows it.

#### Outline
1. **The pitch** (90s) — "If you adopt only one skill from this playlist, adopt this one. It's the cheapest, the fastest to set up, and it makes every subsequent AI interaction better. Even if you never chain it to anything else."
2. **What the skill does** (2–3 min) — `/discovery` takes a planning doc or feature request and produces 5 YAML files:
   - discovery.yaml: what to build (checklist items, complexity, implementation order)
   - dependencies.yaml: what it needs (packages, internal modules, missing pieces)
   - interfaces.yaml: data shapes, API contracts, security surface
   - patterns.yaml: how existing code works (so AI matches the codebase, not training data)
   - test-cases.yaml: how to verify it (complete test specs across 10 categories)
3. **SKILL.md walkthrough** (2–3 min) — Open `.claude/skills/discovery/SKILL.md`, walk through the actual prompt structure. This isn't code — it's markdown with instructions. Two-phase pattern: research (read-only) → plan → execute.
4. **Standalone live demo** (4–5 min) — Run `/discovery` on a real feature from the fabled10x project. Show what it reads (planning doc + codebase), show what it produces (the 5 YAMLs). Then: take those YAMLs and feed them into a plain ChatGPT prompt to build the feature. Show that even without the rest of the pipeline, the output is dramatically better.
5. **STRIDE threat modeling** (2 min) — The hidden weapon. Every endpoint gets six questions: spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege. Even when the answer is "n/a with reason." Show what this catches on a simple-looking feature.
6. **When to use / when to skip** (1 min)
   - Use it: any feature bigger than 30 minutes of work, anything with user input, anything touching data
   - Skip it: one-liner scripts, throwaway experiments
7. **Close** (60s) — "Discovery is the episode I'd tell someone to start with. Tomorrow. Whether you build out the rest of the pipeline or not, this skill alone earns back the time it costs you, every single time."

#### Key visuals
- Open SKILL.md in editor, scroll through the structure
- YAML files appearing on screen as the skill runs
- STRIDE matrix graphic
- Before/after: prompt without YAMLs vs prompt with YAMLs

#### Source materials
- .claude/skills/discovery/SKILL.md
- pipeline/active/website-foundation-2.1/*.yaml (all 5 files)
- Live recording of `/discovery` running

#### Shorts potential
- "If you adopt one AI skill from this playlist, make it this one."
- "This YAML file is the difference between AI that codes and AI that engineers."
- "6 security questions on every endpoint. Not optional. Not skipped."

---

### P5 — "Red: The Test-Writing Skill"

**Runtime target:** 12–15 min
**Pillar:** Workflow
**Search intent:** "AI test generation," "AI TDD," "AI write tests first," "TDD with AI"

#### Thesis
Tests are the verification layer AI can't provide for itself. Writing them *first* — before any implementation — is the single biggest quality leap available to anyone using AI to code.

#### Outline
1. **The pitch** (90s) — "If discovery is the spec, red is the contract. This skill takes a specification and produces failing tests across 10 categories before anyone writes a line of implementation. Even used alone, it catches bugs you'd have shipped."
2. **What the skill does** (2–3 min) — `/red` reads a test specification (from discovery, or from your own notes) and writes failing test files. It verifies they fail for the right reasons. Categories: unit, integration, security, accessibility, edge case, error recovery, data integrity, permission, contract, infrastructure.
3. **The psychology argument** (2–3 min) — Why this matters MORE with AI than without:
   - When AI writes tests and code in the same pass, the tests validate the assumptions — including the wrong ones
   - When tests are written against a spec and code is written to pass them, the assumptions get challenged
   - Demonstrate with a real example: AI writes a function and its tests together, both agree, both are wrong
4. **SKILL.md walkthrough** (2 min) — The prompt structure, how it reads test-cases.yaml (or a plain markdown spec if you don't have the full discovery), how it batches test writing.
5. **Standalone live demo** (3–4 min) — Run `/red` with a hand-written test spec (no discovery.yaml required). Show it producing failing tests. Run `npm test` — watch them all fail. Then: write the implementation manually or with another AI. Watch the tests go green. This is red alone — no green skill, no pipeline.
6. **The TDD pushback** (2 min) — "Isn't TDD dead? Isn't it slow?"
   - It was slow when humans wrote tests. AI removed that bottleneck.
   - The argument flips entirely when test writing is nearly free.
   - Show the time numbers: hand-writing tests vs red skill generating them
7. **When to use / when to skip** (1 min)
   - Use it: any feature you plan to keep, anything with non-trivial logic
   - Skip it: prototypes meant to be thrown away
8. **Close** (60s) — "The fastest way to level up AI-assisted development isn't a better model. It's making the model prove its work before you accept it."

#### Key visuals
- Split-screen: tests-with-code vs tests-then-code
- Red terminal output (failing tests), satisfying transition to green
- The 10 categories as a checklist graphic
- SKILL.md on screen

#### Source materials
- .claude/skills/red/SKILL.md
- test-cases.yaml from completed sections
- Red phase test files from website-foundation-1.x
- Live recording of `/red` running standalone

#### Shorts potential
- "I don't let AI write code until it's written every test first."
- "AI writes tests that confirm what it coded. Not what you asked for."
- "TDD was slow when humans wrote tests. That's not the bottleneck anymore."

---

### P6 — "Green: The Implementation Skill"

**Runtime target:** 10–12 min
**Pillar:** Workflow
**Search intent:** "AI implement code from tests," "AI TDD green phase," "make AI pass tests"

#### Thesis
Implementation against a failing test suite is fundamentally different from implementation against a prompt. The AI writes to pass, not to impress. You get smaller, more focused, more correct code.

#### Outline
1. **The pitch** (90s) — "Most AI coding tools implement features from prompts. This skill implements from tests. The difference is enormous — and it's the difference between code that works in the demo and code that works in production."
2. **What the skill does** (2 min) — `/green` reads failing tests and implements the minimum code to make them pass. Nothing more. No speculative features, no over-engineering, no "while I'm here" additions.
3. **The "minimum code" principle** (2 min) — Why less is more:
   - Every line of code is a liability. AI generates code cheaply, so the temptation is to add more.
   - Green phase enforces discipline: if a test doesn't require it, don't build it.
   - Show a real example: prompt-driven implementation (bloated, extra features, untested code paths) vs test-driven (lean, exactly what's needed)
4. **SKILL.md walkthrough** (2 min) — The prompt, how it reads tests + interfaces.yaml + patterns.yaml, how it batches implementation by dependency order.
5. **Standalone live demo** (3–4 min) — Take the failing tests from P5's demo. Run `/green` on them. Watch the implementation appear. Watch the tests go from red to green. This is green alone — no refactor skill, no pipeline, no orchestration.
6. **When to use / when to skip** (1 min)
   - Use it: any feature where you have tests written (your own, AI-generated, or from red)
   - Skip it: if you don't have tests, go back to red first
7. **Close** (60s) — "AI implementing from a spec is good. AI implementing from a failing test suite is excellent. The test isn't just verification — it's the specification in its most precise form."

#### Key visuals
- Terminal showing tests go from red to green as green runs
- Side-by-side: prompt-implementation vs test-implementation, file sizes highlighted
- SKILL.md on screen

#### Source materials
- .claude/skills/green/SKILL.md
- Before/after code from real sections
- Live recording of `/green` running standalone

#### Shorts potential
- "AI implementing from a prompt is fine. AI implementing from failing tests is a different thing entirely."
- "Every line of AI code is a liability. The green skill writes the minimum."
- "Watch red turn to green. That's the whole point of the workflow."

---

### P7 — "Refactor: The Quality Skill"

**Runtime target:** 10–12 min
**Pillar:** Workflow
**Search intent:** "AI refactor code," "AI code quality," "AI improve code," "refactor with AI"

#### Thesis
Refactor is the phase where code stops being "it passes" and starts being "it's good." Standalone, this skill can improve any existing codebase — not just pipeline output.

#### Outline
1. **The pitch** (90s) — "Green phase makes tests pass. That's not the finish line. Refactor is where you separate code that works from code that works *and is good to maintain*. And this skill runs on any codebase — you don't need to have generated it with AI to benefit."
2. **What the skill does** (2 min) — `/refactor` improves code quality while keeping all tests green. Checks for:
   - DRY violations (duplication within a file, across files, across sections)
   - Type safety (zero `any`, `as`, `@ts-ignore` in new code)
   - Error consistency (response shapes, error codes)
   - Performance red flags (sequential awaits that should be parallel, N+1 queries)
   - Naming and readability (function length, nesting depth)
3. **SKILL.md walkthrough** (2 min) — The prompt, how it uses patterns.yaml to know what "good" looks like in this codebase, the mandatory "tests still green" verification loop.
4. **Standalone live demo** (3–4 min) — Take a messy file — not from the pipeline, from a real codebase with some technical debt. Run `/refactor` with the constraint "do not break any existing tests." Show before/after. Show tests still green. This is refactor alone — could be used on any project.
5. **The constraint that matters** (1–2 min) — The test-green constraint is what makes this safe. Without it, AI refactoring is a roulette wheel. With it, AI refactoring is a regression-free quality pass. Demonstrate what happens without the constraint: show AI refactoring breaking subtle behavior that had no test coverage.
6. **When to use / when to skip** (1 min)
   - Use it: any time you've added features and the code is messier than when you started
   - Skip it: code you plan to delete, prototypes
7. **Close** (60s) — "Refactor is the cheap insurance policy. Five minutes of running this skill saves hours of future debugging. And you don't need the rest of the pipeline to use it."

#### Key visuals
- Before/after code diffs
- Tests staying green throughout refactor
- SKILL.md on screen
- Specific improvements called out (type safety, DRY, etc.)

#### Source materials
- .claude/skills/refactor/SKILL.md
- Before/after code from real sections
- Live recording of `/refactor` running standalone

#### Shorts potential
- "AI refactoring is dangerous without tests. With tests, it's free quality."
- "This one skill runs on any codebase. You don't need the full pipeline."
- "Refactor is the cheapest insurance policy in software."

---

### P8 — "Finish: The Commit Skill"

**Runtime target:** 10–12 min
**Pillar:** Workflow
**Search intent:** "AI git commit," "AI cleanup code," "AI commit workflow," "finish feature with AI"

#### Thesis
Finish is the most overlooked phase. Everyone writes code. Almost nobody wraps it properly — cleanup, documentation, clean commits, captured knowledge. This skill makes the wrap-up phase mechanical instead of willpower-dependent.

#### Outline
1. **The pitch** (90s) — "The end of a feature is where most developers — and every AI — get sloppy. Debug comments left in, commit messages that say 'stuff,' knowledge from the session lost forever. This skill turns the wrap phase from something you skip into something that happens automatically."
2. **What the skill does** (2 min) — `/finish` handles the five things that should happen at the end of every feature:
   - Cleanup: remove debug comments, dead code, stale TODOs
   - Update planning docs: mark the feature complete
   - Knowledge capture: one pattern that worked, one gotcha that broke — add to knowledge.md
   - Commit: stage the right files, write a clean commit message
   - Postflight: verify tests still pass, build still clean, git clean
3. **SKILL.md walkthrough** (2 min) — The prompt structure, the beats it enforces, the mandatory gates before commit.
4. **Standalone live demo** (3–4 min) — Take an uncommitted feature (any feature, not just pipeline output). Run `/finish`. Show the cleanup, show the knowledge capture, show the commit message being drafted, show the actual commit. Result: a clean working tree, a well-described commit, a knowledge note added to the project.
5. **Why commit messages matter for AI** (1–2 min) — A weird but real benefit: clean commit messages become training data for YOUR knowledge base. When you `git log` later, or when an AI reads the history, good messages make the project navigable. Show a before/after of `git log --oneline` on a messy vs a finish-skill project.
6. **When to use / when to skip** (1 min)
   - Use it: any feature you plan to keep and revisit
   - Skip it: pure experimentation, branches you plan to delete
7. **Close** (60s) — "The wrap phase is where discipline dies. This skill keeps it alive by making it mechanical. Five minutes at the end of every feature is what separates a project you can come back to from a project you can't."

#### Key visuals
- Before/after: messy working tree vs clean commit
- git log showing clean commit message history
- SKILL.md on screen
- knowledge.md entry being added

#### Source materials
- .claude/skills/finish/SKILL.md
- Live recording of `/finish` running
- git log from fabled10x project

#### Shorts potential
- "The end of a feature is where most developers get sloppy. This skill fixes that."
- "One pattern that worked. One gotcha that broke. Every feature. That's the system."
- "Clean commit messages aren't vanity. They're training data for your next session."

---

### P9 — "Knowledge: The Memory That Makes It All Compound"

**Runtime target:** 12–15 min
**Pillar:** Workflow
**Search intent:** "AI memory," "AI context between sessions," "AI learning from past work," "AI project knowledge"

#### Thesis
The moat isn't the AI — everyone has access to the same models. The moat is accumulated project knowledge that makes the 50th feature better than the 5th. This is cross-cutting: knowledge feeds into every skill you just learned.

#### Outline
1. **The blank slate problem** (2 min) — Every AI session starts from zero. The model doesn't remember what worked, what broke, or how your codebase is structured. Most people accept this. It's the single biggest source of wasted effort in AI-assisted development.
2. **What knowledge.yaml contains** (2–3 min) — Walk through real entries:
   - `content_type_module` pattern (from section 1.1) — four-part structure, reused in every subsequent section
   - `css_token_testing` pattern (from 1.3) — fs.readFileSync to test CSS in Vitest, mocking next/font/google — AI would never figure this out without prior context
   - `barrel_integrity` gotcha — commit barrel exports and their siblings together or get broken imports
3. **How knowledge feeds each skill** (3–4 min) — This is the cross-cutting part. Show how knowledge enters:
   - Discovery phase: patterns.yaml references existing knowledge — "use the content_type_module pattern here"
   - Red phase: gotchas inform edge case tests
   - Green phase: patterns guide implementation — match existing style, not training-data defaults
   - Refactor phase: knowledge informs what "good" looks like in this codebase
   - Finish phase: new learnings get captured back into knowledge
   - This is why knowledge is an Act 2 episode, not an Act 3 episode — it's not *added* to the skills, it *powers* them.
4. **The compound interest** (2–3 min) — Show the progression:
   - Section 1.1: 14 tests. First section. Everything from scratch.
   - Section 1.4: 34 tests. Fourth section. Patterns from 1.1–1.3 fed forward.
   - The AI wasn't smarter. It had better context. Same model, better input, better output.
5. **How to start your own** (2 min) — You don't need YAML. A single markdown file works. After each feature: one pattern ("this worked"), one gotcha ("this broke"). Feed it into every future session's context. Five minutes of capture saves hours of rediscovery.
6. **Close** (60s) — "Anyone can prompt AI. Accumulated project knowledge is what makes the difference between a tool and a teammate. Your AI should get smarter the more you use it. If it isn't, you're leaving the most valuable output on the floor."

#### Key visuals
- knowledge.yaml on screen with highlighted entries
- Timeline graphic showing sections 1.1 → 1.4 with expanding knowledge base
- Diagram: knowledge.yaml at center, arrows to all 5 skill episodes
- Before/after: AI without context vs AI with three knowledge entries

#### Source materials
- pipeline/active/knowledge.yaml
- patterns.yaml from multiple completed sections
- git log showing test count progression across sections

#### Shorts potential
- "My AI agents get smarter every feature. Here's the knowledge base that makes it happen."
- "Section 1: 14 tests. Section 4: 34 tests. Same AI. Better context."
- "After every feature, write one pattern and one gotcha. That's the whole system."

---

### ACT 3: THE ORCHESTRATION

---

### P10 — "I Smashed Them All Together — The Pipeline Reveal"

**Runtime target:** 20–25 min
**Pillar:** Workflow
**Search intent:** "AI development pipeline," "automated AI workflow," "Claude Code pipeline," "chain AI skills"

**CENTERPIECE EPISODE — the payoff for the entire playlist. Everything before this built the foundation for this reveal.**

#### Thesis
Six skills, each useful alone, become something fundamentally different when chained. The Fabled10X Pipeline is 105 beats of mechanical discipline — an orchestrator that runs the full engineering cycle without human intervention between phases.

#### Outline
1. **Recap** (2–3 min) — "Over the last six episodes you've seen discovery, red, green, refactor, finish, and knowledge. Each one is useful on its own. Now I'm going to show you what happens when you chain them into a single command."
2. **The origin story** (3–4 min) — *This is where the 1M-context history lands.* "I didn't build this pipeline from scratch. I built six individual skills, each for a specific problem. Then Claude's context window went from 200k to 1M, and I had a weird amount of new headroom. I could hold the entire project state in memory at once — all the YAMLs, the full codebase, the test results, the knowledge base — and still have room for the working context. So I did the obvious-in-hindsight thing: I chained them. I smashed them all together into one command. The pipeline you're about to see only exists because context stopped being a constraint."
3. **The architecture** (4–5 min) — How six skills become a pipeline:
   - `/jobbuild` → `/discovery` → `/red` → `/green` → `/refactor` → `/finish`
   - Each skill reads the output of the previous phase through shared YAML state
   - Loose coupling, strong contracts — the same principle behind good microservice design, applied to AI orchestration
   - `/pipeline` is the thin wrapper that runs all six with preflight and postflight gates
4. **beats.yaml** (3–4 min) — 105 checkpoints per section. Why 105?
   - Because at 1M context, you can afford to track every work item individually
   - Every beat is `done`, `pending`, or `na-with-reason`
   - Before any phase completes, all beats must be accounted for
   - Show a real beats.yaml from a completed section. "What gets measured gets built correctly."
5. **session.yaml** (2–3 min) — Resumable state. The pipeline can be interrupted mid-run — new session, new day, new week. `resume_point` tells the next session exactly where to pick up. Show: "Last action: section 1.4 completed. Next action: /pipeline wf 2.1."
6. **Live demo** (5–6 min) — Run `/pipeline` on a real section. Compressed to key moments but showing real terminal output:
   - Preflight checks
   - Discovery running — YAMLs being produced
   - Red running — tests being written and failing
   - Green running — implementation passing tests
   - Refactor running — quality pass
   - Finish running — commit
   - Postflight checks
   - This is the money shot of the playlist. Nothing else in the series has this level of payoff.
7. **The analogy** (1–2 min) — "The closest analogy isn't other AI tools. It's CI/CD pipelines — Concourse, Tekton, GitHub Actions. Those run build-test-deploy in containers. This runs discover-test-implement-refactor-commit inside an LLM. Same mental model, different execution environment."
8. **What you just saw** (1–2 min) — "You can use any one of the six skills alone. You've seen them alone. The pipeline is what happens when you trust the chain enough to let it run unattended. That trust has to be earned — by understanding each skill. Which is why this episode is tenth in the playlist, not first."
9. **Close** (60s) — "105 beats is what I need for production software built by AI. You might need 30, or 50, or 200. The number isn't the point. The point is that the pipeline exists, it's explicit, and it's verifiable. Coming up in the next three episodes: where this fails, what it really costs, and the proof that it works."

#### Key visuals
- Callback montage from P4–P9 (each skill shown briefly, then arrows chaining them)
- Pipeline flow diagram (the 6 stages with arrows)
- Timeline overlay showing the 200k → 1M context expansion
- beats.yaml on screen, beats updating from pending → done in real time
- Terminal recording of `/pipeline` running (long shot with chapter markers)
- session.yaml showing resume state

#### Source materials
- .claude/skills/pipeline/SKILL.md
- pipeline/active/session.yaml
- beats.yaml from website-foundation-1.4 (completed, 34 tests)
- Live recording of `/pipeline` running (need to capture — this is the key production asset)
- Clips from P4–P9 for callback montage

#### Shorts potential
- "AI development is the wild west. I built 105 checkpoints so my agents can't cut corners."
- "I built six skills. Then Claude got 1M context and I chained them. Here's what happened."
- "Most people prompt AI to 'build a feature.' I prompt it to discover, test, implement, refactor, and commit — in that order."
- "This pipeline isn't code. It's markdown files. And it's the most important thing I've built."

---

### ACT 4: THE TRUTH

---

### P11 — "Where AI Fails — What the Pipeline Catches and What It Doesn't"

**Runtime target:** 15–18 min
**Pillar:** Workflow
**Search intent:** "AI coding failures," "AI code quality problems," "when AI coding goes wrong"

**CREDIBILITY EPISODE — honesty about limitations is what separates education from marketing.**

#### Thesis
The pipeline catches predictable, mechanical failures. It doesn't catch judgment failures. The human role shifts from writing code to making judgment calls — and that role isn't going away.

#### Outline
1. **What the pipeline catches** (5–6 min) — Real examples from the fabled10x build:
   - Hallucinated APIs: red phase tests import a function, it doesn't exist, test fails — caught before implementation
   - Logic bugs in edge cases: edge_case test category fires on empty arrays, null values, boundary conditions — caught before merge
   - Security oversights: STRIDE modeling during discovery forces security thinking even on "simple" features
   - Style drift: patterns.yaml gives AI real codebase examples, refactor phase catches deviations
   - For each: show the actual test, the actual failure, the actual fix
2. **What the pipeline does NOT catch** (5–6 min) — Equally real examples:
   - Wrong abstraction choices: AI can pass all tests with an over-engineered design. Tests verify behavior, not architecture.
   - Performance at scale: unit tests don't simulate 10,000 concurrent users. A function can be correct and slow.
   - UX quality: accessibility tests check keyboard navigation and screen reader labels. They don't check whether the design is intuitive.
   - Business logic correctness: if the spec is wrong, the tests are wrong, the code is wrong, and everything passes. Garbage in, garbage out.
   - The OOM incident: tsc --noEmit killed the process. Had to skip the beat with a documented reason. The pipeline tracked the skip, didn't pretend it passed.
3. **Where human judgment is irreplaceable** (3–4 min) — Reviewing the spec. Choosing what to build. Evaluating trade-offs. Saying "this is wrong even though the tests pass." The pipeline doesn't eliminate oversight — it focuses it. Instead of reviewing every line of code, you review the spec and the test results.
4. **Close** (60s) — "If someone tells you AI can replace engineers, they're selling something. If someone tells you AI can't help engineers, they haven't tried the right process. The truth is in the middle, and this pipeline is how I found it."

#### Key visuals
- Green checkmarks / red X's on failure categories
- Real terminal output showing caught failures
- beats.yaml with na-with-reason entries highlighted
- The OOM skip documented in beats.yaml

#### Source materials
- beats.yaml showing na-with-reason entries (tsc OOM)
- knowledge.yaml gotchas section
- git log with actual bug fixes
- Test files that caught real bugs

#### Shorts potential
- "The pipeline caught 4 bugs that would have shipped. It missed one that I had to find myself."
- "If your AI workflow never fails, you're not testing it hard enough."
- "AI can pass every test and still be wrong. Here's what that looks like."

---

### P12 — "The Real Cost — Tokens, Time, and When It's Not Worth It"

**Runtime target:** 12–15 min
**Pillar:** Workflow + Business
**Search intent:** "AI coding cost," "is AI coding worth it," "AI development ROI"

**TRANSPARENCY EPISODE — real numbers, no hedging.**

#### Thesis
The pipeline costs more per feature than vibecoding. It costs less per shipped, working, maintainable feature. Which number you optimize for depends on what you're building.

#### Outline
1. **Token cost** (3–4 min) — Real numbers from pipeline runs:
   - Discovery phase: X tokens (reading codebase, producing 5 YAMLs)
   - Red phase: X tokens (writing tests across 10 categories)
   - Green phase: X tokens (implementing to pass)
   - Refactor phase: X tokens (quality improvements)
   - Finish phase: X tokens (cleanup, commit)
   - Total per section vs "just build it" approach
   - Convert to dollars at current API pricing
   - Call out the 1M-context cost structure: the pipeline reads a lot of context per phase because it can. That was a cheaper trade when I designed it than it would be today without caching.
2. **Time investment** (3–4 min) — Pipeline vs no-pipeline on comparable features. Be honest:
   - Where the pipeline is slower: initial setup, discovery phase, the first few sections
   - Where the pipeline is faster: fewer rework cycles, fewer "it's broken in production" moments, knowledge compounds so later sections go faster
   - Break-even point: approximately how many sections before the pipeline pays for itself in time
3. **The spectrum** (3–4 min) — Where each approach belongs:
   - No process (vibecoding): prototypes, learning, throwaway experiments, weekend projects
   - Lightweight (3 practices from P3): small-to-medium features, experienced devs, fast iteration
   - Individual skills (any from P4–P9, used alone): single-phase discipline — specification OR testing OR cleanup
   - Full pipeline: production software, solo operators, regulated/auditable work, content about the process itself
   - Traditional engineering (human review, CI/CD, QA): team environments, safety-critical, regulated industries
   - "The right answer is 'it depends.' The wrong answer is 'always vibecode' or 'always pipeline.'"
4. **The "better AI" question** (2 min) — "Won't GPT-5/Claude 5/whatever make this unnecessary?" No. Better AI makes the constraint layer more important, not less. A model that writes 10,000 lines per session without guardrails produces 10,000 lines of confidently wrong code faster. A faster car needs better brakes.
5. **Close** (60s) — "I can't tell you whether this pipeline is worth it for your project. I can tell you the real cost and let you decide. What I won't do is pretend it's free."

#### Key visuals
- Cost breakdown table (tokens, dollars, time)
- The spectrum graphic (from P1, expanded with cost data and individual-skill tier)
- "Break-even" chart showing per-section cost declining over time

#### Source materials
- Token usage logs from real pipeline runs (need to capture/calculate)
- Time tracking data across sections
- API pricing as of recording date

#### Shorts potential
- "Here's what my AI pipeline actually costs per feature. Real numbers."
- "Better AI doesn't mean you need less process. It means you need better brakes."
- "Vibecoding is cheaper per feature. My pipeline is cheaper per shipped feature."

---

### P13 — "This Pipeline Built This Website — The Proof"

**Runtime target:** 12–15 min
**Pillar:** Delivery
**Search intent:** "AI built website," "AI development results," "proof AI coding works"

**META EPISODE — the strongest credibility play on the channel. Every claim is verifiable.**

#### Thesis
This pipeline built the website you're watching this video on. Every commit hash is on GitHub. Every test count is real. The difference between "trust me" content and verifiable content is a git log.

#### Outline
1. **The claim** (60s) — "Everything I've shown you in this playlist — the six skills, the pipeline, the tests, the knowledge base — built a real website. The one hosting this video. I'm going to walk you through the git history and show you every section, every test, every commit."
2. **The walkthrough** (6–8 min) — Section by section through the fabled10x repo:
   - website-foundation-1.1: Case Content Schema — 14 tests, commit dea757a
     - Show the actual commit, the actual test files, the actual schema
   - website-foundation-1.2: Zod Validators — 22 tests, commit 0f822fb
     - Show how patterns from 1.1 informed 1.2
   - website-foundation-1.3: Brand Design System — 14 tests, commit 5449969
     - Show the css_token_testing pattern being discovered and captured
   - website-foundation-1.4: Site Shell — 34 tests, commit 4cc308b
     - Show the compound knowledge effect — more tests, cleaner code
   - Total: 84 tests across 4 sections, all verifiable on GitHub
3. **The meta layer** (2–3 min) — "The pipeline built the website. The website hosts the content about the pipeline. The content is the proof the pipeline works. This is what verifiable content looks like. Compare it to every other 'AI workflow' video on YouTube: slides, theory, cherry-picked demos. This is a git history."
4. **Open-source angle** (2 min) — The skill files, the YAML schemas, the pipeline architecture — all visible in the repo. Not a product pitch. Not behind a paywall. Check the code yourself.
5. **Close** (60s) — "If your AI workflow can't show you the commit log, it's a demo, not a process. Everything I've built is here. Verify it, fork it, improve it."

#### Key visuals
- GitHub repo on screen, navigating through commits
- Test output for each section (green terminal output)
- session.yaml completed_sections showing the full history
- The website itself — live, running, built by the pipeline

#### Source materials
- Full git log (git log --oneline)
- GitHub repo (public)
- session.yaml completed_sections
- Test output recordings from each section
- The live website

#### Shorts potential
- "Every commit hash in this video is on GitHub. Every test count is real. Check me."
- "The pipeline that built this website is also the content on this website."
- "4 sections. 84 tests. Every one verifiable. That's the difference."

---

### ACT 5: THE PATH FORWARD

---

### P14 — "How to Build Your Own Pipeline Today"

**Runtime target:** 15–18 min
**Pillar:** Workflow
**Search intent:** "AI development setup," "Claude Code pipeline," "AI coding workflow setup," "build AI skills"

**PRACTICAL EPISODE — the viewer leaves with something they can use.**

#### Thesis
Start lightweight, scale up as needed. The three practices from P3 are the foundation. Individual skills are the next step. The full pipeline is the destination. Meet yourself where you are.

#### Outline
1. **Four tiers of adoption** (2 min) — Overview of the path, mapped to the playlist:
   - Tier 1: Today (30 min) — adopt the three practices from P3
   - Tier 2: This week (2–3 hours) — build your first individual skill from P4–P9
   - Tier 3: This month — build out additional skills one at a time
   - Tier 4: Eventually — chain them into a pipeline (P10)
2. **Tier 1: Start today** (3–4 min) — Create two files:
   - A discovery doc template (10 bullet points, reusable for every feature)
   - A knowledge.md file (patterns and gotchas, grows over time)
   - Live demo: create both, use them on a feature, show the difference
3. **Tier 2: Build your first skill** (4–5 min) — Write a single SKILL.md:
   - Recommended starting skill: discovery (P4) or red (P5), because they produce the most visible improvement
   - Walkthrough: open the fabled10x repo's `.claude/skills/discovery/SKILL.md`, explain each section, show how to adapt it to your project
   - Live demo: create a simpler version of the discovery skill in front of the camera, test it
4. **Tier 3: Add more skills** (2–3 min) — Each skill added as you feel the gap:
   - Wrote tests manually and hated it? Add red.
   - Implementation got messy? Add green.
   - Code quality slipping? Add refactor.
   - Commits becoming chaotic? Add finish.
   - Forgetting what you learned across sessions? Add knowledge (this is actually worth doing early).
5. **Tier 4: Chain them into a pipeline** (2–3 min) — Only after you trust each individual skill. The pipeline orchestrator is the thin layer on top of skills that already work. Don't build it first; build it last.
6. **What to customize vs what to keep** (1–2 min):
   - Customize: number of beats, test categories, YAML schema, skill prompts — match your project
   - Keep: the phase order (discover → test → implement → refactor → commit) — this sequence isn't arbitrary
7. **Tool portability** (1–2 min) — "This playlist shows Claude Code because that's what I use. The principles work with any AI tool. If you use Cursor, Copilot, or Aider, the three practices from P3 still apply, and most of the skill logic transfers — you'll just orchestrate them differently."
8. **Close** (60s) — "Start with the three practices. If they click, build one skill. If the skill clicks, build another. If six skills click, chain them. The goal isn't to copy my setup — it's to find the level of structure your projects need."

#### Key visuals
- Four-tier graphic (today / this week / this month / eventually)
- Live terminal: creating a SKILL.md, running it
- Template files on screen
- Fabled10X repo as reference

#### Source materials
- Template discovery doc (create and provide)
- Simplified SKILL.md templates for each phase (create and provide)
- Starter repo or gist with minimal pipeline files

#### Shorts potential
- "30 minutes. Two files. Your AI development will never be the same."
- "You don't need my pipeline. You need the three practices underneath it."
- "Build one skill first. Then another. The pipeline is what you build last, not first."

---

### P15 — "The Future of AI Engineering"

**Runtime target:** 12–15 min
**Pillar:** Future
**Search intent:** "future of AI coding," "AI replacing developers," "AI engineering 2026"

**VISION EPISODE — address the fear directly, end on a clear trajectory.**

#### Thesis
The wild west doesn't last forever. Standards emerge. The people who learn process now will lead teams of AI agents later. The people who learn to vibecode will be replaced by people with pipelines.

#### Outline
1. **The fear** (2 min) — Name it directly: "Am I going to be replaced?" "Am I already behind?" "Is this all hype or is it real?" These are legitimate questions. Every developer is asking them. Most of the answers online are either panic ("engineers are done") or denial ("AI can't really code"). Both are wrong.
2. **The trajectory** (3–4 min) — What's actually happening:
   - Models are getting more capable AND more dangerous without constraints
   - The value of writing code is declining. The value of specifying, verifying, and reviewing code is increasing.
   - Prompt engineering was wave 1. AI engineering is wave 2. We're at the beginning of wave 2.
   - The people building methodology now are building the foundation for the next decade of software development.
3. **The role shift** (3–4 min) — The developer role is evolving from:
   - Writing code → writing specifications
   - Debugging → reviewing test results
   - Code review → spec review
   - Individual contribution → engineering management of AI agents
   - This isn't a demotion. It's a leverage amplifier. The skills transfer — you're still reasoning about systems, you're just doing it at a higher level of abstraction.
4. **The "left behind" answer** (2–3 min) — "You are not behind. The entire industry is figuring this out in real time. There are no certifications. There are no standards. There are no 'AI engineering' degrees. The fact that you're watching this playlist means you're ahead of most people. The window to build these habits is open now. It won't be open forever."
5. **What the channel is building toward** (1–2 min) — A methodology that's documented, verifiable, and reproducible. Not a personality cult. Not a product pitch. A body of work that says: "This is how AI-assisted development can work when you take it seriously. Here's the proof."
6. **Close** (60s) — "The wild west doesn't last forever. Standards emerge. The question is whether you're the one setting them or scrambling to catch up. I know which side I'm on. And if you've made it to the end of this playlist, I know which side you're on too."

#### Key visuals
- Timeline graphic: prompt engineering era → AI engineering era
- Role evolution diagram (writing code → writing specs → managing agents)
- Channel roadmap teaser
- Callback montage from earlier episodes

#### Source materials
- Industry trends and model capability data
- Channel roadmap / future content plans
- Clips from earlier episodes in the playlist (callback montage)

#### Shorts potential
- "You're not behind. The entire industry is figuring this out right now."
- "The wild west doesn't last forever. Standards emerge. Be the one setting them."
- "Prompt engineering was wave 1. AI engineering is wave 2. We're at the beginning."
- "The people who learn process now will lead teams of AI agents later."

---

## Cross-Playlist Integration

### Night Build tie-ins
- Run individual skills live on stream for community-requested features → clips for P4–P9
- Run `/pipeline` live on a real section start-to-finish → centerpiece clip for P10
- Spec-writing live with community suggestions → clip for P4

### Flagship Series crossover
- Building Party Masters episodes (ACT 3) can reference individual skill episodes for methodology deep-dives
- "For how I actually build this, see The Fabled10X Pipeline playlist — individual skill episodes in the description"

### Shorts strategy
- Each episode produces 2–3 Shorts (mapped per episode above)
- Total: ~35–40 Shorts from the playlist — enough for 2.5+ months of daily Shorts
- Highest-performing Shorts drive discovery back to the playlist
- P3 (gateway) and P10 (pipeline reveal) should produce the most Shorts — highest replay value

### Community & Ecosystem (Tier 5)
- "Roast My Skill" — community members share their skill definitions, compare to fabled10x approach
- "Pipeline Office Hours" — live Q&A about methodology, troubleshooting viewer setups
- "Fork My Pipeline" — showcase viewers who adopted and adapted the skill files

---

## Production Notes

### Recording order vs playlist order

The episodes don't need to be recorded in playlist order. The structure naturally supports batched production:

**Batch 1 — The foundation episodes (record first):**
1. **P3** — gateway episode, highest-priority SEO, drives playlist discovery
2. **P1** — thesis episode, sets the frame
3. **P4** — discovery, most adoptable skill, most referenced by later episodes

**Batch 2 — The remaining skill episodes (parallel-producible):**
Record P5–P9 in any order. They share a format (the skill-episode template), so batching production is efficient:
- Shared intro/outro structure
- Shared visual style (SKILL.md walkthrough, live demo, before/after)
- Same recording setup, same B-roll requirements
- Can be written as a batch, recorded in a block, edited in a block

**Batch 3 — The centerpiece (requires prior episodes):**
4. **P10** — the pipeline reveal. Needs:
   - Clips from P4–P9 for the callback montage
   - A full `/pipeline` run captured (production-priority asset)
   - Origin story script well-rehearsed

**Batch 4 — The truth episodes (require real data):**
5. **P2** — honesty build, needs the vibecode-vs-spec recording
6. **P11** — failure analysis, needs categorized failure examples
7. **P12** — cost analysis, needs token usage logs and time tracking data
8. **P13** — proof, needs the git history walkthrough captured

**Batch 5 — The closers:**
9. **P14** — practical setup, references earlier episodes
10. **P15** — vision, best recorded last when the arc is clear

### Data to capture before recording
- [ ] Token usage logs for full pipeline runs (P12)
- [ ] Time tracking: pipeline vs no-pipeline on comparable features (P12)
- [ ] Screen recordings: vibecoded feature vs spec-built feature (P1, P2)
- [ ] Screen recording: full `/pipeline` run on a real section (P10)
- [ ] Screen recordings: each of the 6 skills running standalone (P4–P9, one per episode)
- [ ] Screen recordings: 3 practices live demos (P3)
- [ ] List of real bugs caught by the pipeline (P11)
- [ ] List of real failures the pipeline missed (P11)
- [ ] git log walkthrough recording (P13)

### Template assets to create
- [ ] Discovery doc template (P3, P14)
- [ ] Simplified SKILL.md for each of the 6 skills (P14)
- [ ] Knowledge.md starter template (P3, P9, P14)
- [ ] Spectrum graphic (P1, P12)
- [ ] Pipeline flow diagram (P10)
- [ ] Practice cards (P3) — branded, screenshot-worthy
- [ ] Skill card template (P4–P9) — consistent visual identity per skill
- [ ] Timeline graphic: 200k → 1M context expansion (P10, P12)
- [ ] Four-tier adoption graphic (P14)
