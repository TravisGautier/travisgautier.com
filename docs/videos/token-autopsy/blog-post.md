# Where Your Claude Code Tokens Actually Go — A Session Autopsy

*Companion piece to the travisgautier video of the same name. This is the text version for search indexing, LLL crosslink, and anyone who'd rather read than watch.*

---

There's a Claude Code plugin going around that compresses assistant responses into caveman-style terse language. It claims 75% output reduction. I was about to install it.

Then I measured my actual conversation.

## The setup

I run a TDD pipeline with Claude Code. One `/pipeline` command at the start of a context window kicks off the full loop: preflight → discovery → red → green → refactor → finish → postflight. A typical run is 800–900 turns and burns roughly 150,000 tokens.

Tokens add up. I wanted to cut them.

First instinct: the model is writing too much prose. Install a compression plugin. Except `/context` after a finished pipeline run showed "Messages" as by far the largest bucket — and "Messages" is an umbrella. It includes tool calls, tool results, assistant prose, and all the system injections that fire with every user turn. I couldn't aim until I knew the breakdown.

## Parsing the session log

Claude Code writes every session as newline-delimited JSON to `~/.claude/projects/<escaped-project-path>/<session-id>.jsonl`. Each line is one turn with full content: role, message type, tool calls, tool results, assistant text blocks.

I grabbed the most recent completed pipeline session (2.4 MB, 850 turns) and wrote a ~40-line Python script to bucket every byte by message type. The full script is linked at the bottom of this post.

## The distribution

For a single full pipeline run on a real section:

| Bucket | Share |
|---|---|
| tool_use_input (args sent TO tools — mostly code being Written/Edited) | **38.4%** |
| tool_result (what tools return — file reads, bash output, grep output) | **32.8%** |
| user_prompt (your typed message + skill-body injections on every slash command) | **27.8%** |
| **assistant_text (the model's prose)** | **1.0%** |
| assistant_thinking | 0% (not persisted in the transcript) |

Total: ~152,000 tokens.

**Assistant prose — the part compression plugins target — is one percent.**

A plugin that compresses it by 75% saves roughly three-quarters of one percent of the total bill. That's not worthless, but it's not what's draining your account.

## What actually uses tokens

**tool_use_input (38%)** is dominated by the content you pass to `Edit` and `Write`. That's code. You can't compress code without breaking it.

**tool_result (33%)** is the big hidden tax. Every `Read` echoes the file's content into your context. Every `Bash` dumps stdout. Every `Grep` returns matches with context. If your skills read whole files when a slice would do, this bucket balloons.

**user_prompt (28%)** is the most surprising one for me. I only typed twice during a full pipeline run — once to invoke `/pipeline`, once when something interrupted. But the bucket was huge. The reason: every time a slash command fires (including all the sub-skills the pipeline auto-invokes), the skill's full markdown body is injected as user-role content. Seven phase skills × 3–30KB each = a lot of user-role content with zero human typing.

## The levers that actually move tokens

Ranked by expected savings on a typical pipeline run:

### 1. Tool-result hygiene — 10–20% of total

Rewrite your skills to read less:

- **Grep first, Read second.** `files_with_matches` to identify the target file; then `Read` with `offset` and `limit` around the match. You end up with the same load-bearing content without dumping 1,200 irrelevant lines into context.
- **Bash with exit-code awareness.** Pipe through `head` or use `--quiet`/`--reporter=dot` on success. Full output only when the command fails (non-zero exit). This is the safe pattern — you still see failure detail when it matters.
- **Delegate codebase scans to sub-agents.** An `Explore` or custom sub-agent can survey 20 files and return a paragraph. The raw 20-file dump never enters your main context. Not safe for implementation decisions (summaries drop nuance) but excellent for exploration.
- **Make skills summarize, not echo.** If `/discovery` runs a grep and then reports "found 14 candidate files," you don't need those 14 full contents in the transcript.

### 2. Trim always-loaded files — 3–8%

`CLAUDE.md`, `MEMORY.md`, `AGENTS.md`, and every other memory/instruction file load on every turn. Every line you don't need is a line you pay for, forever, across every turn of every session. Be aggressive:

- Test each sentence: would the model's behavior change if this line were gone?
- Move historical context and rationale into a commit message or decision log — not into the always-loaded instruction file
- Consolidate overlapping rules

### 3. Prune decorative prose from skill bodies — 2–5%

Skill bodies often contain prose that doesn't steer the model: motivational framing ("this phase is critical because..."), rationale for past decisions, re-statements of the step above. Kill the decorative, keep the load-bearing.

Test: "if I deleted this sentence, would the model behave differently?" No → gone.

What to keep: non-obvious constraints, edge-case branches, failure-mode handling, a single tight example when the format isn't self-evident.

### 4. Consolidate Edit patterns — 2–5%

One `Write` call beats five sequential `Edit`s when you're rewriting most of a file. Skip read-after-write cycles — the harness already confirms writes. Every tool call is tokens in both directions.

**Combined realistic target: 15–30% per run** without any quality loss.

## The optimization I almost shipped (and didn't)

One idea I found attractive: inline all sub-skill bodies into the top of `/pipeline`'s skill body. The reasoning was cache-shape — when sub-skill bodies inject mid-run, they land *after* section-specific content in the conversation. That means they can't be cached across different pipeline runs (different sections → different bytes before the skill body → cache-key mismatch). If I moved the sub-skill bodies upfront into `/pipeline`, they'd join the stable cacheable prefix and subsequent pipeline runs within Anthropic's cache TTL would hit cache on that chunk.

Estimated savings: $0.05–$0.15 per run on back-to-back pipelines. Real, but modest.

The problem: with all five phase directives visible to the model from turn zero, the model can read ahead. Discovery-phase content shouldn't know what green-phase implementation will look like. Red-phase test structure shouldn't color discovery research. Even with explicit phase gates ("do not execute this phase until beats.yaml shows prior phase done"), experienced Claude users know the model is influenced by any content in context. Subtly, persistently. You don't get catastrophic failures — you get slightly biased discovery output, slightly leaky phase boundaries, compounding over many runs.

Modest savings. Compounding quality risk. I didn't ship it.

## Takeaways

1. **Measure before you optimize.** `/context` is a start; the raw JSONL session logs at `~/.claude/projects/` are the ground truth.
2. **Output compression is a non-solution for tool-heavy workflows.** The fat is in what the tools echo back, not in what the assistant says.
3. **The cleanest lever is always "stop reading things you don't need."** Grep before Read. Limit ranges. Delegate scans. That's where the real savings live.
4. **Modest wins with real quality risk are not good trades.** If an optimization corrupts the thing it's optimizing, skip it — even if the numbers look OK.

## Resources

- Python analysis script (40 lines) — `analyze-session.py` in the repo linked below. Works on any `~/.claude/projects/*.jsonl` file.
- Full video: [YouTube link]
- travisgautier channel: [channel link]
- Related LLL entry: [LLL URL if/when published]

---

*If you run this on your own session, drop your distribution in the comments — I'm curious whether the shape holds across different workflows.*
