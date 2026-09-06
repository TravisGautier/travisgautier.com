# Claude Ships an AI Classifier for Permissions. You Should Still Write an Allowlist.

*Companion piece to the travisgautier video of the same name. This is the text version for search indexing and anyone who'd rather read than watch.*

---

Claude Code asks for permission every time it wants to use a tool. Run bash. Call an MCP server. Hit the filesystem. You see a prompt. You click yes. By the end of a long session you've clicked yes so many times your thumb is sore and you don't even read the commands anymore — which is, funny enough, exactly what permission prompts are supposed to prevent.

Opus 4.7 shipped two answers to this problem. One of them is a new permission mode with an LLM classifier behind it. The other is a shell script that greps your session logs. This post is about why both shipped, where each one wins, and why — if you only use one — you probably want the boring one.

## What auto mode is

Setting: `permissions.defaultMode: "auto"` in `settings.json`, or flip the switch in the opt-in dialog on first launch.

What happens when it's on: every time Claude tries to use a tool, a classifier runs. An LLM. It looks at the command and its context, checks three customizable sections in your settings (`autoMode.allow`, `autoMode.soft_deny`, `autoMode.environment`), and decides: safe, prompt, or block.

The three sections give you soft editorial control — "always allow anything matching this pattern," "always prompt for this category," "treat this kind of environment specially." But the defining property of auto mode is that the final decision on anything that doesn't hit a hard rule is made by a language model. Per call. Every call.

That's the feature. It's also the bill.

## What the allowlist skill does

Skill name: `/fewer-permission-prompts`. Anthropic ships it in Claude Code.

When you run it, it reads your last fifty session transcripts from `~/.claude/projects/<sanitized-cwd>/*.jsonl`. Extracts every bash and MCP tool call. Counts them. Drops three categories:

1. Commands Claude Code already auto-allows (`head`, `tail`, `grep`, `ls`, `jq`, `cut`, `sort`, and all git read-only subcommands — these never prompted in the first place).
2. Mutating commands (`rm`, `git push`, `git commit`, `npm install`, `chmod`, `mv`).
3. Arbitrary-code-execution wildcards (`npx *`, `bash *`, `python *`, `npm run *` — specific exact forms are fine, wildcards are not).

What's left gets ranked by frequency and written into `.claude/settings.json` as `permissions.allow` entries. That file is committed to your repo. Your teammates pull and inherit the rules. Every command in the list short-circuits permission checks from there on.

## The real scan output

I ran this on my partymasters CRM repo on April 18. Fifty recent transcripts, pulled from a mix of main-repo and worktree sessions. The raw signal:

| # | Pattern | Count | Notes |
|---|---------|-------|-------|
| 1 | `Bash(npm test *)` | 262 | Jest suite runs |
| 2 | `Bash(npx jest *)` | 171 | Direct Jest invocations |
| 3 | `Bash(npx tsc *)` | 112 | TypeScript typecheck |
| 4 | `Bash(npm run lint)` | 100 | ESLint diagnostic (exact form) |
| 5 | `Bash(npm run build)` | 51 | Next.js build (exact form) |
| 6 | `Bash(git fetch *)` | 11 | Remote-ref sync |

Seven hundred and seven combined tool calls across those six patterns. Every one of them would have triggered the auto-mode classifier if I'd been running it instead of an allowlist. That's seven hundred classifier invocations — seven hundred small LLM calls — to decide, over and over, that `npm test` is okay.

The skill skipped a lot more than it surfaced. High-count commands that never prompt in the first place (`head` at 1,040 uses, `tail` at 1,090, `grep` at 841, `git status` at 100) got dropped because Claude Code auto-allows them. High-count mutations (`git push` at 32, `git commit` at 41, `rm` at 24) got dropped because they shouldn't be blanket-allowed. Exact count skipped: most of the top-twenty bash commands in my recent logs, all for correct reasons.

Result: six allowlist entries covering ~707 tool calls. Committed to git. Zero tokens at runtime. Zero latency. Team-shareable. Auditable in a pull request.

## The tradeoffs

Both features reduce prompts. That's the only thing they share. The tradeoff shapes are different enough to matter.

| | Auto Mode | `/fewer-permission-prompts` |
|---|---|---|
| Cost per tool call | Classifier tokens | Zero |
| Latency per call | Added (LLM round trip) | Zero |
| Auditable | "LLM judged it" | `git diff` on `settings.json` |
| Team-shareable | Per-session, per-user | Committed, repo-wide |
| Unknown / long-tail commands | Handles gracefully | Requires new rule |
| Setup effort | One toggle | Run skill occasionally |
| Durability | Classifier drift per release | Rules stay as you left them |
| Review surface | None (decision is internal) | Reviewable in PRs |

The pattern is clear once you lay it out: auto mode is a judgment layer, the allowlist skill is a cache. They operate on different parts of the problem.

## Where auto mode actually wins

**Long-tail, one-off commands.** You're pair-programming through an unfamiliar codebase, you run a weird grep pipeline, a one-off `jq` incantation from Stack Overflow, a curl to an internal service you'll never hit again. Writing an allowlist entry for each of these is overhead you'll never recover. The classifier judges them per-case and moves on.

**New users.** You open Claude Code for the first time. You don't want to edit settings files. You flip a switch. It works. For solo developers in small personal projects, that's often the right answer.

**Dynamic environments.** CI runners where commands vary per job. Short-lived branches where the tool set changes. Anything where a static allowlist would be constantly out of date.

## Where the allowlist wins

**Hot-path commands.** If you run the same six commands 707 times a week, running a classifier 707 times to decide is pure overhead. Every classifier call spends tokens in the same billing account as your main conversation. It adds up quietly.

**Audit and review.** A `settings.json` diff in a pull request is human-readable. Security-conscious teams can require that tool permissions be explicit and reviewable. "The classifier allowed it" is not a reviewable audit trail.

**Teams.** Allowlist rules in `.claude/settings.json` get committed to the repo. A teammate clones, runs Claude Code, and inherits the rules. Auto mode is a per-user, per-session feature — every person on the team pays the classifier bill independently, and rules defined in one person's config don't propagate.

**Cost control.** If you're paying per token — Console billing, API-based agentic workflows, anything where your session burns tokens at volume — the classifier is a tax that scales with usage. Every tool call that falls through to classification spends tokens you're also paying for in the main model turn.

**Durability.** A classifier's judgment can drift between model releases. A pattern in a JSON file means the same thing tomorrow that it did six months ago.

## The hybrid answer

Set `permissions.defaultMode: "auto"` if the classifier as a safety net appeals to you. Then periodically run `/fewer-permission-prompts` to bake your hot-path commands into `settings.json`.

The order matters. Claude Code checks the static allowlist first. If a tool call matches, it runs — no classifier invocation, no tokens, no latency. Only the misses fall through to auto mode. That's the design: allowlist absorbs the hot path, classifier handles the long tail.

I don't think the marketing will ever say this explicitly, because "use our new feature and also the shell script that obsoletes most of its work" isn't great launch copy. But that's the shape that actually minimizes cost and maximizes safety at the same time.

## Practical recommendations

**Every Claude Code project, solo or team:** run `/fewer-permission-prompts` every couple of weeks. Low effort. Big reduction in classifier invocations if auto mode is on, or in prompt clicks if it isn't. The six-rule output from my repo took thirty seconds to review and commit.

**Teams:** treat `.claude/settings.json` as code. Commit it. Review permission additions in PRs the same way you review dependency additions. If you ever turn auto mode on for the team, the allowlist is still the source of truth for "what do we definitely want to auto-run without asking an LLM."

**Solo devs on small projects:** auto mode alone is often fine. The classifier cost is real but manageable at low volumes. Run `/fewer-permission-prompts` once a quarter if you want to optimize; skip it if you don't.

**High-volume API / agentic workflows:** the allowlist matters a lot. You're paying for every classifier call, and the hot path is heavy enough that the savings compound fast. Run the skill weekly.

**Security-sensitive environments:** auditability is the deciding factor. Static rules in committed config. Auto mode off or heavily gated via `autoMode.soft_deny`. The LLM judging your permissions might be right every time, but "might be" isn't a compliance story.

## Summary

1. **Auto mode is a classifier.** It runs an LLM per uncertain tool call. Tokens, latency, per-call. Great for long-tail commands.
2. **`/fewer-permission-prompts` is a cache.** It writes static rules to `settings.json` from your actual usage. Zero runtime cost. Great for hot-path commands.
3. **They're complementary.** Allowlist catches the hot path before the classifier fires. Classifier handles what the allowlist doesn't cover.
4. **If you only use one, use the allowlist.** A classifier that costs tokens to decide "is `ls` safe" is a tax you pay forever. A static allowlist costs you thirty seconds a quarter.

## Resources

- Claude Code docs — permission modes: [docs.claude.com/claude-code](https://docs.claude.com/en/docs/claude-code)
- `/fewer-permission-prompts` skill (ships in Claude Code by default)
- Full video: [YouTube link]
- travisgautier channel: [channel link]

---

*If you've turned auto mode on, I'm curious what your classifier token overhead looks like in practice. Drop a comment or reply on X with before/after numbers if you've measured. And if the allowlist skill surfaces something weird in your logs — the kind of command you didn't realize you were running 500 times a week — post it. Those are the interesting findings.*
