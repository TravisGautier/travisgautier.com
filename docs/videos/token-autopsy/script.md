# travisgautier Video: "Where Your Claude Code Tokens Actually Go"

## Premise

Most advice about cutting Claude Code costs targets the wrong thing. People install output-compression plugins, tell Claude to "be brief," prune prose. This video shows — with real data from a 850-turn session — that assistant prose is **1%** of the conversation. The fat lives somewhere most people never measure.

**Angle:** not a hot take. A forensic breakdown with numbers.

## Title candidates

1. "I pulled apart a 152K-token Claude Code session. Only 1% was the assistant talking."
2. "Why 'tell Claude to be terse' barely saves tokens (I measured)"
3. "The real shape of a Claude Code pipeline: a token autopsy"
4. "Stop optimizing the wrong 1% of your Claude Code bill"

Recommend #1 or #4 — concrete numbers in the title beat generic framing.

## Thumbnail concept

Pie chart with "assistant prose: 1.0%" sliver highlighted in red. Headline overlay: "This is what token plugins compress."

---

## Script

### COLD OPEN (0:00–0:20)

> There's a Claude Code plugin going around that compresses assistant responses into caveman speech to save tokens. It claims 75% reduction. I was about to install it. Then I measured my actual conversation.

> Here's the problem. This is a real pipeline run — 850 turns, 152,000 tokens. And this [highlight 1% slice] is the part caveman-style compression touches.

> We've been optimizing the wrong thing.

### ACT 1 — SETUP (0:20–1:30)

> I run a TDD pipeline with Claude Code. One `/pipeline` command, one context window, roughly 800–900 turns, and the model works through preflight → discovery → red → green → refactor → finish → postflight.

> Cost adds up. So I wanted to cut it.

> First instinct: the assistant is writing too much prose. Tell it to be terse. Install a plugin. Except when I ran `/context` after a pipeline finished, it showed "Messages" as the biggest bucket by far — and "Messages" isn't just prose. It's everything: tool calls, tool results, prose, user prompts, system injections. All of it.

> I needed to break that down to know where to aim.

### ACT 2 — THE DATA (1:30–4:00)

> Claude Code logs every session locally as JSONL. On Linux it's at `~/.claude/projects/<escaped-project-path>/`. Each file is one session with full turn-by-turn content.

> I grabbed the most recent completed pipeline run and wrote a 40-line Python script to bucket every message by type. Here's what came out.

[ON SCREEN: table]

| Bucket | Share |
|---|---|
| tool_use_input | 38.4% |
| tool_result | 32.8% |
| user_prompt | 27.8% |
| **assistant_text** | **1.0%** |
| assistant_thinking | 0% (not persisted) |

> tool_use_input is the stuff the assistant sends INTO tools. Mostly code being written via Edit and Write. You can't compress code without breaking it.

> tool_result is what tools send back. File reads echoed into the conversation. Bash output. Grep output. This is where file dumps live.

> user_prompt is 28%, and — this is the sneaky one — I only typed once. That entire bucket is mostly Claude Code re-injecting the slash command's skill body every time I invoke a sub-skill. My pipeline calls `/discovery`, `/red`, `/green`, `/refactor`, `/finish`, so those skill bodies flood in sequentially.

> Assistant prose? [pause] One percent.

> A plugin that compresses my prose by 75%? That saves me three quarters of a percent on the total bill.

### ACT 3 — WHERE TO ACTUALLY AIM (4:00–7:00)

> Once you know the shape, the levers are obvious. Ranked by savings:

**1. tool_result hygiene — biggest win**
> My skills were reading whole files when a slice would do. Grep first to find the target, then Read with `offset` and `limit`. Run bash with terse output on success, full output only on failure. Delegate codebase-wide scans to sub-agents so the raw output never enters the main context — only a summary comes back.

> Estimated savings: 10–20% of total conversation tokens. Real money.

**2. Memory and always-loaded files**
> Your CLAUDE.md, your MEMORY.md, your AGENTS.md — those load every single turn. Every line you don't need, you pay for, on every turn, forever. Mine was bloated. Trim aggressively.

> Estimated: 3–8%.

**3. Skill body pruning**
> Skill bodies have prose that doesn't steer the model. Motivational framing. Rationale for decisions. Re-statements of the step above. Kill the decorative, keep the load-bearing. Test each sentence: "if I delete this, would the behavior change?" No → gone.

> Estimated: 2–5%.

**4. Consolidate Edit patterns**
> One Write call is cheaper than five sequential Edits. Skip read-after-write patterns. Every tool call is tokens.

> Estimated: 2–5%.

**Combined realistic target: 15–30% per run.**

### ACT 4 — THE TRAP (7:00–8:30)

> Here's where I almost made a mistake.

> One idea I had was to inline all my sub-skill bodies into the top of `/pipeline`. Reason: skill bodies injected mid-run sit *after* section-specific content, so they can't be cached across runs. Move them above the section-arg divergence point and they join the stable cacheable prefix. Cleaner cache shape, cost savings on back-to-back runs.

> But that means every phase's directives are visible to the model from turn zero. Discovery content during the green phase. Green content during discovery.

> Experienced Claude users know: the model reads ahead. Even with giant blocking rules and phase gates, content that's in context influences generation. Subtly, persistently. You don't always catch it — you just get slightly worse discovery output because the red phase's test structure already colored the research.

> I almost shipped this. The savings were real but small. The quality risk was real and compounding.

> Lesson: the obvious optimization sometimes has quality costs you won't see until it's too late. If the upside is modest and the downside is corrupting the thing you're optimizing, don't do it.

### CLOSE (8:30–9:30)

> Three takeaways:

> **One.** Measure before you optimize. `/context` is a start. The JSONL session logs at `~/.claude/projects/` are the ground truth.

> **Two.** Output compression is a non-solution if your workflow is tool-heavy. The fat is in what the tools echo back, not in what the assistant says.

> **Three.** The cleanest lever is always "stop reading things you don't need." Grep before Read. Limit ranges. Summarize early in sub-agents. That's where the 15–25% lives.

> Links in the description: the Python script I used to break down the session, and the raw data from my run. Let me know in the comments what shape YOUR conversations end up being — I'd bet the distribution looks similar for anyone running a real workflow.

[END CARD]

---

## B-roll / on-screen elements

- `/context` output in a terminal, zooming on the "Messages" line
- `ls ~/.claude/projects/...` showing JSONL files with sizes
- The 40-line Python analysis script scrolling past
- The pie chart / bar chart of bucket distribution
- A side-by-side of verbose Read (whole file) vs Grep-then-targeted-Read
- Split screen showing "what caveman compresses" (tiny sliver) vs "where the tokens live" (the rest)

## Companion artifacts (for description or LLL crosslink)

- Python script (40 lines) to bucket any `~/.claude/projects/*.jsonl` session
- One-page reference: "Tool-result hygiene patterns for Claude Code skills"
- Raw redacted session data (if shareable) — lets viewers reproduce

## Tone/brand notes

- No AI-generated enthusiasm. Flat, forensic, "here's what I found" tone.
- Screen-recording with voiceover beats face-cam for this one — the data IS the visual.
- Don't name-shame caveman. It's a real tool with real uses (conversational workflows). It's just mismatched to tool-heavy pipeline workflows. Frame as "wrong tool for this job" not "bad tool."
- Travis Gautier audience cares about AI-building-AI workflows — this fits the "delivery" pillar: how we build with Claude.

## Open questions before production

1. Length target — 8–10 min flagship or tighter 5-min playbook?
2. Face-cam intro + screen-recording body, or pure screen-recording?
3. Include the caveman detour (currently Act 1) or cut that framing for a cleaner "here's the data" structure?
4. LLL crosslink: does a "Claude Code session token autopsy" entry exist/belong in the LLL? If yes, reference it in the description.
