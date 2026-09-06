# Gamma.ai Prompt — Companion Slides for Auto Mode vs Allowlist Video

Paste the block below into gamma.ai to generate the deck. Edit the scan numbers only if you re-run the skill on a different repo; the structure is tuned to match the video beats.

---

## PROMPT (paste this into gamma.ai)

Create a 12-slide presentation titled **"Two Ways to Reduce Claude Code Permission Prompts"** that serves as on-screen companion slides for a ~5-minute YouTube video on the travisgautier channel (audience: engineers using Claude Code, AI agent workflows, and security-conscious devs).

**Tone and style:**
- Data-first, no hype language ("amazing," "game-changing," "mind-blowing" — none of it)
- Arc: define the problem → introduce both features in parallel → lay out the tradeoff → recommend the hybrid → close on "if you only use one, use the static one"
- Minimalist layout, plenty of whitespace, one core idea per slide
- Dark theme, monospace for numbers and code
- Visual priority: tables, code blocks, comparison diagrams over decorative imagery
- No stock photos of robots, brains, locks, or shields
- **Color coding:** green (#22c55e) = allowlist / zero-cost path; blue (#3b82f6) = auto mode / classifier path; orange/amber (#f59e0b) = caveat or "this costs you"; gray (#6b7280) = neutral labels

**Deck structure:**

**Slide 1 — Title**
- Title: "Two Ways to Reduce Claude Code Permission Prompts"
- Subtitle: "One uses an AI classifier. The other uses a list. Here's the tradeoff."
- Tag line at bottom: "travisgautier — building with AI, openly"
- Date: April 2026

**Slide 2 — The Problem**
- Heading: "Click yes. Click yes. Click yes."
- Large stat centered: **~707 tool calls in 50 sessions**
- Subtext: "Six hot-path commands, every one triggering a permission check. This is the problem both features are trying to solve."
- Footer: "Prompt fatigue defeats the prompts."
- Neutral gray accent, no color signal yet

**Slide 3 — Two Shipping Answers**
- Heading: "Opus 4.7 shipped two approaches"
- Two-column layout, equal weight:
  - **Left (blue #3b82f6):** "Auto Mode — `defaultMode: \"auto\"` — an LLM classifier decides per call"
  - **Right (green #22c55e):** "`/fewer-permission-prompts` — scans your transcripts, writes a static allowlist"
- Footer: "Same problem. Opposite philosophies."

**Slide 4 — What Auto Mode Is**
- Heading: "Auto mode: the classifier"
- Code block (centered, monospace):
```json
{
  "permissions": {
    "defaultMode": "auto"
  },
  "autoMode": {
    "allow": [...],
    "soft_deny": [...],
    "environment": [...]
  }
}
```
- Body: "Every uncertain tool call fires an LLM decision. Safe, prompt, or block. The three rule lists give you editorial control. The final call is made by a language model, per invocation."
- Blue (#3b82f6) accent

**Slide 5 — What Auto Mode Costs**
- Heading: "The bill nobody prints on the box"
- Three-stat punch, stacked vertically:
  - **Tokens** — "Classifier call per uncertain tool use. Billed in the same account as your main conversation."
  - **Latency** — "LLM round trip added to every tool call that hits the classifier."
  - **Drift** — "Classifier judgment can change between model releases. Your rules don't."
- Orange/amber (#f59e0b) accent — this is the cost slide, not a win

**Slide 6 — What the Allowlist Skill Does**
- Heading: "`/fewer-permission-prompts`: the cache"
- Numbered flow (4 steps), vertically stacked:
  1. Scans your last 50 session transcripts
  2. Drops auto-allowed commands (head, tail, grep, git status, etc.)
  3. Drops mutations (rm, git push) and arbitrary-code wildcards (npx *, bash *)
  4. Writes top patterns to `.claude/settings.json` as `permissions.allow` rules
- Footer: "Committed to git. Team-shareable. Zero tokens at runtime."
- Green (#22c55e) accent

**Slide 7 — Real Scan Output**
- Heading: "What it surfaced on my repo"
- Table (monospace, six rows, highlight count column):

| Pattern | Count |
|---|---|
| `Bash(npm test *)` | 262 |
| `Bash(npx jest *)` | 171 |
| `Bash(npx tsc *)` | 112 |
| `Bash(npm run lint)` | 100 |
| `Bash(npm run build)` | 51 |
| `Bash(git fetch *)` | 11 |
| **Total** | **707** |

- Footer: "707 tool calls. Six allowlist entries. Zero classifier invocations for any of these from now on."
- Green (#22c55e) accent on total row

**Slide 8 — The Tradeoff**
- Heading: "The real comparison"
- Full comparison table, 8 rows:

| | Auto Mode | Allowlist |
|---|---|---|
| Cost per tool call | Classifier tokens | **Zero** |
| Latency per call | Added | **Zero** |
| Auditable | "LLM judged it" | **git diff** |
| Team-shareable | Per-session, per-user | **Committed** |
| Unknown / long-tail | **Strong** | Weak |
| Hot-path commands | Weak | **Strong** |
| Setup effort | **One toggle** | Run skill occasionally |
| Durability | Classifier drift | **Rules stay as you left them** |

- Bold the winner in each row. Use blue (#3b82f6) for auto-mode wins, green (#22c55e) for allowlist wins.

**Slide 9 — When Auto Mode Wins**
- Heading: "Use the classifier when…"
- Three bullets, blue (#3b82f6) accent:
  1. **Long tail** — one-off commands, Stack Overflow pipelines, unfamiliar codebases
  2. **New users** — no settings to maintain, no rules to write
  3. **Dynamic environments** — CI variance, short-lived branches, changing tool sets

**Slide 10 — When the Allowlist Wins**
- Heading: "Use the static list when…"
- Four bullets, green (#22c55e) accent:
  1. **Hot path** — the 6 commands you run 700 times a week
  2. **Teams** — committed rules, shared config, reviewable in PRs
  3. **Cost control** — API / agentic workflows at volume
  4. **Audit and compliance** — "the LLM allowed it" is not a reviewable audit trail

**Slide 11 — The Hybrid**
- Heading: "Run both. Order matters."
- Flow diagram, left to right:
  - **Tool call** → (green box) **Static allowlist check** → MATCH: Run (no classifier, no tokens, green)
  - Fall through → (blue box) **Auto mode classifier** → JUDGE: Allow / Prompt / Block (tokens spent, blue)
- Caption: "Allowlist absorbs the hot path. Classifier handles what it doesn't cover. Minimizes cost without sacrificing safety."

**Slide 12 — The Take**
- Three-line summary:
  1. **Auto mode** is elegant for the long tail. Token tax on the hot path.
  2. **`/fewer-permission-prompts`** is boring but free, auditable, team-shareable.
  3. **If you only use one, use the allowlist.** A classifier that costs tokens to decide if `ls` is safe is a tax you pay forever.
- Channel handle bottom-right: "travisgautier — building with AI, openly"

**Strict rules for Gamma:**
- Preserve the exact numeric values above (707, 262, 171, 112, 100, 51, 11). Do not round or paraphrase.
- Preserve the exact pattern strings (`Bash(npm test *)` etc.) — these are code; render them in monospace.
- No illustrative images unless they are actual diagrams or data visualizations.
- Use green (#22c55e) for allowlist wins, blue (#3b82f6) for auto-mode, orange (#f59e0b) for cost/caveat, gray for neutral.
- Each slide readable at a glance — assume 2-4 seconds on-screen time for most, longer for slides 7 and 8 (the data slides).
- No emoji. No stock imagery of brains, robots, padlocks, shields, or AI-cliche visuals.

---

## Post-generation checklist (after Gamma gives you the deck)

- [ ] Confirm slide 7 table preserves all six patterns with exact counts and correct monospace rendering
- [ ] Confirm slide 8 comparison table bolds the correct winner in each row (blue for auto-mode, green for allowlist)
- [ ] Confirm slide 5 uses orange/amber (#f59e0b), not blue — this is the "cost" slide
- [ ] Confirm slide 11 flow diagram has visible green-to-blue color transition — this is the hybrid visualization
- [ ] Replace any stock images Gamma inserts with terminal screenshots or clean diagrams
- [ ] Export slide 2 (the 707-call stat) as standalone PNG — cold-open visual candidate
- [ ] Export slide 7 (scan output table) as PNG for social thread post (X post #5)
- [ ] Export slide 8 (tradeoff table) as PNG for social thread post (X post #6) and short-form teaser
- [ ] Export slide 11 (hybrid flow) as PNG — this is the second-best thumbnail candidate after the primary split-screen
- [ ] Verify total slide count is 12 — if Gamma added a transition slide or section divider, the numbering in the video script may need adjustment
