# Claude Ships an AI Classifier for Permissions. You Should Still Write an Allowlist.

## Premise

Opus 4.7 ships a new permission mode called `auto`. It's an LLM classifier that looks at every tool call Claude tries to make and decides whether to prompt you or just let it run. No allowlist to maintain. No rules to write. Just on.

Meanwhile, Anthropic also ships a skill called `/fewer-permission-prompts` — it scans your recent transcripts, finds the read-only commands you run constantly, and writes them into your `settings.json` as static allowlist entries.

Same problem. Two shipping answers. Very different bills.

**Angle:** Not a dunk on either. Auto mode is genuinely good for the long tail — stuff you've never run before, stuff you only run once. But a classifier that fires an LLM call every time it sees `ls` is a tax you pay forever. The allowlist skill is free at runtime, auditable in code review, and committable to git so your teammates inherit it. Use both. If you only use one, write the allowlist.

## Title candidates

1. "Claude Ships an AI Classifier for Permissions. You Should Still Write an Allowlist."
2. "Two Ways to Stop Claude From Asking Permission. One Costs Tokens."
3. "Claude 4.7's Auto Mode is Great. Here's Why I Still Use the Allowlist."
4. "The AI That Decides If Claude Can Run `ls` Costs You Real Money"

Recommend #1 for channel voice — it's the thesis, plain. #2 is the click variant. #4 is the spicy one for X.

## Thumbnail concept

Split-screen. Left side: Claude Code's auto-mode dialog with a spinner — "Deciding if this is safe…". Right side: a plain `settings.json` with a clean `"permissions": { "allow": [...] }` block, six entries, no spinner. Top overlay: "TWO WAYS." Bottom tag: "one costs tokens."

---

## Script

### Cold Open (0:00-0:30)

Here's a question Claude Code has to answer like six times a minute: is it okay if I run this command.

You've seen the prompt. `Allow Bash(npm test)?`. `Allow Bash(git fetch origin)?`. You click yes. You click yes. You click yes. By the end of a long session you've clicked yes so many times your thumb is sore and you don't even read the commands anymore — which is, funny enough, exactly what permission prompts are supposed to prevent.

Opus 4.7 shipped two answers to this. One of them is new and fancy. One of them is a shell script that greps your logs. Guess which one I like better.

### What Auto Mode Is (0:30-1:30)

New feature. Opus 4.7. You turn it on by setting `defaultMode: "auto"` in `settings.json`, or you click through the opt-in dialog on first launch.

Here's what it actually does. Every time Claude wants to use a tool — bash, MCP, whatever — a classifier runs. An LLM. It looks at the command, looks at the context, checks three lists you can customize in your settings — allow, soft_deny, environment — and decides: safe, prompt, or block.

[ON SCREEN: the `autoMode: { allow: [...], soft_deny: [...], environment: [...] }` block from the settings schema]

Don't skim past that. *A language model is making a judgment call about each tool invocation.* That's the feature. That's also the bill. Every classifier call costs tokens. Every classifier call adds latency. For a session that fires hundreds of tool calls, you are running hundreds of tiny LLM decisions on top of the model you came here for.

Anthropic's pitch is basically: you don't have to write rules anymore. The classifier figures it out. For a lot of people, that's a fair trade. Fewer prompts, smarter judgment, no allowlist maintenance — worth some tokens.

But there's a second shipping answer, and it's the opposite philosophy.

### What /fewer-permission-prompts Does (1:30-2:30)

This one's a skill. You type `/fewer-permission-prompts` in Claude Code and it does something boring in the best way.

[ON SCREEN: real terminal output — the skill scanning 50 recent transcripts]

It reads your last fifty session transcripts. Extracts every bash and MCP tool call you made. Counts them. Drops the stuff Claude Code already auto-allows — turns out `head`, `tail`, `grep`, `ls`, `jq`, and all the git read-only subcommands never prompted in the first place. Drops anything mutating — `rm`, `git push`, `npm install`. Drops anything that's basically arbitrary code execution — wildcard npx, wildcard bash, wildcard python. And what's left is ranked by frequency.

[ON SCREEN: the actual table from my run — 262 npm test, 171 npx jest, 112 npx tsc, 100 npm run lint, 51 npm run build, 11 git fetch origin]

Six patterns. Seven hundred occurrences across my recent work. The skill writes them into `.claude/settings.json` — committed to git, visible in code review, durable — and those six commands never prompt again for me or anyone on the team after they pull.

Zero tokens at runtime. Zero latency. Zero classifier. Just a list.

### The Real Tradeoff (2:30-4:00)

Both of these reduce prompts. That's the only thing they have in common.

Auto mode wins when:

**One.** You're running in an unfamiliar codebase with commands you've never run before. The classifier has judgment. A static allowlist has none.

**Two.** You're a new user and you don't want to think about settings files. You flip a switch. It works.

**Three.** You hit the long tail — the one-off commands you'll never run again, the weird pipe chains from a Stack Overflow answer. Writing an allowlist entry for those is overhead you'll never recover.

The allowlist skill wins when:

**One.** You're doing the same thing a lot. My last week was seven hundred tool calls across six commands. Running a classifier seven hundred times to decide "can npm test run" is a tax that compounds.

**Two.** You care about auditability. A `settings.json` diff in a pull request is readable. "The classifier judged it safe" is not. If your org does change review on what tools CI agents are allowed to run, static wins by default.

**Three.** You share the project. Allowlist rules in `settings.json` get committed. Your teammates pull the repo and inherit the rules. Auto mode is a classifier running in each person's session — everyone pays the bill independently.

**Four.** You're cost-sensitive on the API. The whole point of 4.7 is coding agents, which fire lots of tool calls per session. Every call that triggers the auto-mode classifier is spending tokens you're also paying for in the main conversation. It adds up quietly.

[ON SCREEN: comparison table — tokens, latency, auditability, team-sharing, long-tail, onboarding]

| | Auto Mode | `/fewer-permission-prompts` |
|---|---|---|
| Cost per tool call | Classifier tokens | Zero |
| Latency | Added | Zero |
| Auditable | "LLM judged" | Diff in `settings.json` |
| Team-shareable | No (per-session) | Yes (committed) |
| Long-tail unknown commands | Strong | Must add rule |
| Setup effort | One toggle | Run the skill occasionally |

### The Hybrid Answer (4:00-4:45)

The real move is run both.

Set `defaultMode: "auto"` if you want the classifier as your safety net. Then periodically run `/fewer-permission-prompts` to bake the hot-path commands into `settings.json`. Every rule you add to the static allowlist is one more thing the classifier never has to think about — those tool calls short-circuit before the LLM decision fires.

Claude Code checks the static allowlist first. If there's a match, the command runs. No classifier. No tokens. No latency. The classifier only fires on the stuff you haven't allowlisted yet — which is exactly where a classifier should fire. Long tail, not hot path.

That's the design the two features probably want you to use together. Nobody's going to say it in the marketing though, because "use the classifier we built *and also* this shell script that obsoletes most of it" is not a great launch line.

### Close (4:45-5:15)

Here's the take.

Auto mode is a good feature. I'm not telling you to turn it off. It solves a real problem — the long tail — elegantly.

But if you've been skipping the allowlist skill because auto mode makes it feel redundant — don't. They're not competing. One is a judgment layer. One is a cache. The classifier without the cache is expensive. The cache without the classifier is brittle.

Static rules for the hot path. Classifier for the long tail.

Run `/fewer-permission-prompts` every couple of weeks. Keep the allowlist honest. Let auto mode handle the weird stuff. Stop paying an LLM to decide if `ls` is safe.

[END CARD: travisgautier handle, link to parallel-agents video if relevant]

---

## B-roll / on-screen elements

- **Cold open prompt fatigue:** real screen recording of a Claude Code session with ten permission prompts in a row. Speed it up, let the viewer feel the fatigue.
- **Auto mode opt-in dialog:** the first-run screen where the user toggles auto mode on. If this doesn't record cleanly, a clean mock is fine.
- **`autoMode` settings block (0:30-1:30):** the real JSON schema excerpt showing `allow`, `soft_deny`, `environment` keys. Highlight `soft_deny`.
- **`/fewer-permission-prompts` scan (1:30-2:30):** the actual run from the partymasters repo. The table output with the six patterns and counts is the money visual. Let it sit on screen for 10 seconds.
- **Comparison table (2:30-4:00):** the six-row tradeoff table. Animate rows in one at a time. This is the thesis beat visually.
- **Hybrid diagram (4:00-4:45):** simple flowchart — tool call enters, hits static allowlist first, either matches (green, zero cost) or falls through to classifier (orange, token cost). Four boxes, one path. Don't overdesign.
- **Close over-the-shoulder:** `git diff` showing the actual six-line addition to `.claude/settings.json`. Tangible proof.

## Tone/brand notes

- Tools-comparison, not a rant. Less profanity than opus-4-7-intro. Don't force f-bombs — let them land if they land.
- Do not sell auto mode short. It's a legitimately good feature. The video's thesis is "use both," not "auto mode bad."
- The "classifier decides if `ls` is safe" line is the hook. Use it twice — once in the middle, once in the close.
- Avoid AI vocabulary: delve, navigate, leverage, framework, paradigm, robust, groundbreaking, "testament to," "it's worth noting." Em-dashes fine.
- Hard-cap at 5:30. If you're over, cut the "why it's not in the marketing" beat from the hybrid section — it's droppable.
- The token-tax framing is the editorial angle. Most auto-mode content will say "it's amazing, turn it on" and leave it there. This video says "it's amazing, here's what it costs, here's when you still want the boring tool."

## Release considerations

- Window: 2-3 weeks from auto mode launch (April 16, 2026). After that the novelty fades and this becomes evergreen "here are the permission options" content — fine, but loses the news hook.
- Cross-link: opus-4-7-intro video (the launch overview) if it's already out. This is the "operationalize one specific 4.7 feature" follow-up.
- Pin a comment with the `/fewer-permission-prompts` skill name and a screenshot of the six rules that got added in my real run.
- Consider a follow-up in 60 days: "I ran auto mode for two months — here's the actual token cost." That's the empirical close.
