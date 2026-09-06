# Gamma.ai Prompt — Companion Slides for travisgautier Video

Paste the block below into gamma.ai to generate the deck. Edit the numbers and quotes only if your data changes; the structure is tuned to match the video beats.

---

## PROMPT (paste this into gamma.ai)

Create a 14-slide presentation titled **"Where Your Claude Code Tokens Actually Go — A Session Autopsy"** that serves as on-screen companion slides for a 9–10 minute YouTube video on the travisgautier channel (audience: engineers using Claude Code for AI-assisted development).

**Tone and style:**
- Forensic, data-first, no hype language ("amazing," "insane," "mind-blowing" — none of it)
- Minimalist layout, plenty of whitespace, one core idea per slide
- Dark theme, monospace for numbers and file paths
- Visual priority: charts and tables over decorative imagery
- No stock photos of robots, brains, or handshakes — this is a technical teardown, not a pitch deck
- Use a single accent color (red or orange) for the critical data point on each slide

**Deck structure:**

**Slide 1 — Title**
- Title: "Where Your Claude Code Tokens Actually Go"
- Subtitle: "A 152K-token, 850-turn session autopsy"
- Tag line at bottom: "travisgautier — building with AI, openly"

**Slide 2 — The Hook**
- Single statistic, centered huge: **1.0%**
- Small label: "Share of a real pipeline conversation that is assistant prose"
- Footnote: "The part token-compression plugins target"

**Slide 3 — The Setup**
- Heading: "The workflow under test"
- Bullet list (short):
  - One `/pipeline` command per context window
  - Full TDD run: preflight → discovery → red → green → refactor → finish → postflight
  - ~800–900 turns per run
  - Claude Code with Opus 4.6

**Slide 4 — What `/context` doesn't tell you**
- Heading: "`/context` shows 'Messages' as biggest. But what IS Messages?"
- Four-item list, one per line:
  - Tool calls (assistant → tool)
  - Tool results (tool → assistant)
  - Assistant prose
  - User prompts + system injections
- Takeaway line: "All of it. You have to break it down yourself."

**Slide 5 — Method**
- Heading: "Method: parse the raw session log"
- Body: "Claude Code writes every session as JSONL to `~/.claude/projects/<project>/*.jsonl`. Full turn-by-turn content."
- Small code block showing a one-liner:
  ```
  python3 bucket.py ~/.claude/projects/-home-.../a4c7d290...jsonl
  ```
- Caption: "~40 lines of Python. Source in the description."

**Slide 6 — The Breakdown (THE MONEY SLIDE)**
- Heading: "Token distribution — one full pipeline run"
- Horizontal bar chart or table with these exact values:

  | Bucket | Share |
  |---|---|
  | tool_use_input | 38.4% |
  | tool_result | 32.8% |
  | user_prompt | 27.8% |
  | **assistant_text** | **1.0%** |

- Total annotation: "852K characters, ~152K tokens"
- Highlight the 1.0% row in the accent color

**Slide 7 — What each bucket actually is**
- Three-column layout:
  - **tool_use_input (38%)** — code being Written/Edited. Can't compress.
  - **tool_result (33%)** — files read, bash/grep output. Compressible with hygiene.
  - **user_prompt (28%)** — skill body re-injections. Compressible with trimming.
- Bottom: "assistant_text (1%) is the part output-compressors touch."

**Slide 8 — The hierarchy of levers**
- Heading: "Where the real savings live (ranked)"
- Numbered list with estimated savings:
  1. **Tool-result hygiene** — 10–20% of total
  2. **Trim always-loaded files** (CLAUDE.md, MEMORY.md) — 3–8%
  3. **Prune skill body prose** — 2–5%
  4. **Consolidate Edit patterns** — 2–5%
- Bottom-right callout: "**Realistic combined target: 15–30%**"

**Slide 9 — Lever 1 in practice**
- Heading: "Tool-result hygiene — concrete patterns"
- Two-column before/after:
  - **Before:** `Read /path/to/large-file.ts` (reads 1,200 lines)
  - **After:** `Grep files_with_matches` → `Read offset=420 limit=30`
- Other bullet pairs:
  - Bash: `--quiet` on success, full output on failure
  - Codebase scans: delegate to sub-agents (summary returns, not raw output)
  - Skills: summarize, don't echo

**Slide 10 — What NOT to optimize**
- Heading: "The 1% trap"
- Body: "Plugins that compress assistant prose save ~0.75% on a real tool-heavy workflow."
- Caption: "Not wrong. Just mismatched to this workload shape."

**Slide 11 — The cache-shape detour**
- Heading: "I almost inlined all sub-skills into one mega-pipeline"
- Two-column compare:
  - **Upside:** sub-skill bodies join the cacheable prefix → ~$0.05–0.15 saved per run on back-to-back pipelines
  - **Downside:** all phase directives visible to the model from turn 0

**Slide 12 — Why I didn't ship it**
- Single big quote, centered:
  > "The model reads ahead. Even with blocking rules and phase gates, content in context influences generation — subtly, persistently."
- Below: "Modest savings. Compounding quality risk. Don't ship."

**Slide 13 — Three takeaways**
- Three-bullet summary, short and declarative:
  1. **Measure before optimizing.** `/context` is a start; JSONL is ground truth.
  2. **Output compression is a non-solution for tool-heavy work.** The fat is in tool results.
  3. **"Stop reading things you don't need"** is the cleanest lever.

**Slide 14 — Outro**
- Heading: "Try it on your own session"
- Body: Path to JSONLs (`~/.claude/projects/`) + "Run the script, post your distribution in the comments."
- Channel handle bottom-right: "travisgautier — AI building AI, openly."

**Strict rules for Gamma:**
- Preserve the exact numeric values above. Do not paraphrase 38.4% → "about 40%"; leave the precision.
- No illustrative images unless they are actual data visualizations (bar chart on slide 6, optionally slide 7).
- Use the same accent color consistently on the 1.0% figure, the 15–30% target, and the "Don't ship" line.
- Each slide must be readable at a glance — assume 2–4 seconds of on-screen time for most, longer for the data slide.
- No emoji.

---

## Post-generation checklist (after Gamma gives you the deck)

- [ ] Confirm slide 6 chart shows the 1.0% sliver visibly (Gamma sometimes collapses very-small values — force a chart type that preserves them)
- [ ] Replace any stock images Gamma inserts with your own screen-recording frames (`/context` output, JSONL `ls`, etc.)
- [ ] Tighten any slide that ended up wordier than the prompt specified
- [ ] Export slide 2 (the **1.0%** slide) as a standalone PNG — this is your thumbnail candidate
- [ ] Export slide 6 as PNG for the cold-open B-roll
