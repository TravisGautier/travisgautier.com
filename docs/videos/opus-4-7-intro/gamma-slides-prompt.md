# Gamma.ai Prompt — Companion Slides for Opus 4.7 Intro Video

Paste the block below into gamma.ai to generate the deck. Edit the numbers only if benchmarks get updated post-release; the structure is tuned to match the video beats.

---

## PROMPT (paste this into gamma.ai)

Create a 14-slide presentation titled **"Opus 4.7 Just Dropped. Here's What Actually Changed."** that serves as on-screen companion slides for a 7-minute YouTube video on the travisgautier channel (audience: engineers using Claude Code and AI agent workflows).

**Tone and style:**
- Data-first, no hype language ("amazing," "game-changing," "mind-blowing" — none of it)
- Arc: open with the six-weeks-of-pain context, pivot to the 4.7 release as the first real reason for hope in weeks, honest about caveats, close on the Mythos gap
- Minimalist layout, plenty of whitespace, one core idea per slide
- Dark theme, monospace for numbers and benchmarks
- Visual priority: charts and tables over decorative imagery
- No stock photos of robots, brains, or handshakes
- Green (#22c55e) for Opus 4.7 data wins, muted gray for competitors, orange/amber (#f59e0b) for caution/caveat slides (tokenizer, six-weeks-of-pain)

**Deck structure:**

**Slide 1 — Title**
- Title: "Opus 4.7 Just Dropped"
- Subtitle: "Six weeks of pain. First reason for hope."
- Tag line at bottom: "travisgautier — building with AI, openly"
- Date: April 16, 2026

**Slide 2 — The Last Six Weeks (NEW)**
- Heading: "The backdrop"
- Three-stat punch, vertically stacked, orange/amber accent:
  - **Rate limit crisis** — "Five-hour sessions burning out in 90 minutes. Anthropic confirmed: hitting limits way faster than expected."
  - **Opus 4.6 quality collapse** — "AMD senior director, 6,852 Claude Code sessions analyzed. Median thinking length: 73% collapse since January."
  - **Benchmark degradation** — "Third-party SWE-bench: 6-point drop in 6 weeks."
- Footer: "The mood around Claude right now is pessimism. People are tired."
- Use orange/amber (#f59e0b) accent to signal pain/caution — NOT green

**Slide 3 — The Hook (was Slide 2)**
- Single statistic, centered huge: **64.3%**
- Label below: "SWE-bench Pro — retaking #1 from GPT-5.4"
- Small footnote: "Up from 53.4% on Opus 4.6. First reason for hope in weeks."

**Slide 4 — Head-to-Head Benchmarks**
- Heading: "The numbers"
- Table with exact values:

| Benchmark | Opus 4.7 | Opus 4.6 | GPT-5.4 | Gemini 3.1 Pro |
|---|---|---|---|---|
| SWE-bench Pro | **64.3%** | 53.4% | 57.7% | 54.2% |
| SWE-bench Verified | **87.6%** | 80.8% | — | 80.6% |
| CursorBench | **70%** | 58% | — | — |
| GPQA Diamond | 94.2% | 91.3% | **94.4%** | 94.3% |
| Terminal-Bench 2.0 | **69.4%** | 65.4% | — | — |
| BrowseComp | 79.3% | — | **89.3%** | — |

- Bold the leader in each row. Highlight Opus 4.7 cells in green accent when it leads.

**Slide 5 — Three Takeaways**
- Heading: "What the benchmarks say"
- Three bullets:
  1. **Coding: clear #1.** 6.6-point gap over GPT-5.4 on SWE-bench Pro. 12-point jump on CursorBench from 4.6.
  2. **Reasoning: converged.** GPQA Diamond is a three-way tie at ~94%. Nobody wins on reasoning anymore.
  3. **GPT-5.4 wins BrowseComp.** Agentic web search is still OpenAI's game (89.3% vs 79.3%).

**Slide 6 — Vision: The Sleeper Upgrade**
- Heading: "Vision accuracy: 54.5% to 98.5%"
- Two-column before/after:
  - **Opus 4.6:** ~1.1 megapixel max, 54.5% accuracy
  - **Opus 4.7:** 3.75 megapixels (3.3x), 98.5% accuracy
- Caption: "If Claude ever misread your screenshots, this is a different model for visual input."

**Slide 7 — The Tokenizer Caveat**
- Heading: "Same price per token. Not the same price per prompt."
- Key stat centered: **1.0-1.35x token inflation**
- Body: "New tokenizer. Same input text can produce up to 35% more tokens. API pricing unchanged ($5/$25 per million), but identical workloads may cost more."
- Callout box: "Measure before you migrate. Run your actual prompts through both tokenizers."
- Orange/amber (#f59e0b) accent — caveat, not win

**Slide 8 — Evidence From My Own Code (NEW)**
- Heading: "Same-scope CRUD section, 4.6 era vs 4.7 era"
- Two-column comparison:
  - **ad-6.2 Data Import API (Opus 4.6, 04-16 morning):** 58 tests — 15 unit, 10 integration, 7 security, **8 permission**, 4 contract, 6 edge, 4 error, 2 data, 2 infra
  - **ad-7.1 CustomField CRUD (Opus 4.7, 04-16 evening):** 94 tests — 17 unit, 14 integration, 11 security, **30 permission**, 8 contract, 8 edge, 3 error, 3 data, 3 infra
- Key delta callout: **Permission matrix: 8 → 30 tests**. Security: 7 → 11.
- Footer: "n=1 day, one repo, one engineer. Not a benchmark. But the per-category density shift is visible."

**Slide 9 — xhigh Effort Level**
- Heading: "New effort level: xhigh"
- Diagram or spectrum: low → medium → high → **xhigh** → max
- Body: "Default in Claude Code. High was leaving quality on the table. Max was too slow for routine tasks. xhigh splits the difference for agentic coding."

**Slide 10 — Instruction Following**
- Heading: "4.7 does what you said, not what you meant"
- Two-column:
  - **Good:** precise prompts get precise results
  - **Bad:** vague prompts that relied on generous interpretation may break
- Caption: "If your instructions 'mostly worked' on 4.6, test them on 4.7 before migrating."

**Slide 11 — /ultrareview**
- Heading: "/ultrareview — multi-agent code review"
- Body: "Spawns multiple specialized agents to review code in parallel. Not one pass — a parallel multi-agent review."
- Bullet: "Early reports: catches cross-file logic errors and security patterns that single-pass review misses."

**Slide 12 — Who Should Switch**
- Heading: "The honest take"
- Four rows:
  - **Claude Code / agentic workflows** → Switch now. Same price, strictly better. ✓
  - **API at scale** → Measure tokenizer impact first. The 1.35x ceiling matters. ⚠
  - **Agentic search workflows** → GPT-5.4 still wins BrowseComp. ✗
  - **Price-sensitive** → Gemini 3.1 Pro at $2/$12 is less than half. ✗

**Slide 13 — The Mythos Shadow**
- Heading: "The best model Anthropic will sell you is not the best model Anthropic has."
- Body: "Claude Mythos — unreleased, available to 11 companies for cybersecurity. Anthropic publicly concedes Opus 4.7 doesn't match it."
- Caption: "The gap between commercially available and actually existing is the story of 2026."

**Slide 14 — Outro**
- Three-line summary:
  1. Opus 4.7 retakes the coding crown. The SWE-bench Pro gap is real.
  2. Check the tokenizer before migrating at scale.
  3. Vision upgrade from 54.5% to 98.5% is the most underreported change.
- Channel handle bottom-right: "travisgautier — building with AI, openly"

**Strict rules for Gamma:**
- Preserve the exact numeric values above. Do not paraphrase 64.3% as "about 64%" or round any figure.
- No illustrative images unless they are actual data visualizations.
- Use green (#22c55e) for Opus 4.7 wins, gray for competitors, orange (#f59e0b) for caution/caveat slides (Slides 2, 7).
- Each slide must be readable at a glance — assume 2-4 seconds of on-screen time for most, longer for the data slides.
- No emoji.

---

## Post-generation checklist (after Gamma gives you the deck)

- [ ] Confirm slide 4 table preserves all exact benchmark values (Gamma sometimes rounds)
- [ ] Confirm slides 2 and 7 use orange/amber accent, not green — those are caveat slides
- [ ] Confirm slide 8 test-coverage numbers match the canonical numbers in `script.md`: ad-6.2 = 58 tests, ad-7.1 = 94 tests, permission 8 → 30
- [ ] Replace any stock images Gamma inserts with screen-recording frames or pure data viz
- [ ] Tighten any slide that ended up wordier than the prompt specified
- [ ] Export slide 3 (the 64.3% stat) as standalone PNG — thumbnail candidate
- [ ] Export slide 4 (benchmark table) as PNG for cold-open B-roll
- [ ] Export slide 7 (tokenizer caveat) as PNG for the short-form teaser
- [ ] Export slide 8 (test-coverage evidence) as PNG for social thread post
