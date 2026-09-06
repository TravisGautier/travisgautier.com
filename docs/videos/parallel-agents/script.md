# I'm Running Four Claude Code Agents at Once. Here's the Three Hundred Lines of Git Plumbing That Makes It Safe.

## Premise

Most "multi-agent AI" content on the internet reinvents distributed systems badly. People reach for orchestrators, queues, MCP servers, dedicated daemons. They skip past the fact that the problem — multiple workers on shared mutable state — is forty years old and has a boring answer: a registry, a lockfile, and a discipline.

This video is a practitioner report on gluing that boring answer onto Claude Code so I can run four agents in parallel on one repo without them stepping on each other. The artifact is three hundred lines of skill files. The primitives are git worktrees, a JSON file, and `flock`. That's it.

**Angle:** the trick is *git*, not AI. If you know how to run background workers against shared data, you already know how to run parallel agents. The agent part is boring. The coordination part is just work.

## Title candidates

1. "I'm Running Four Claude Code Agents at Once. Here's the Git Plumbing."
2. "Parallel AI Agents Don't Need an Orchestrator. They Need a Lockfile."
3. "Git Worktrees + Flock: The Cheapest Multi-Agent Primitive You're Not Using"
4. "Three Hundred Lines Between Me and Four Agents Eating Each Other"

Recommend #1 for channel voice and clickthrough. #2 is the stronger thesis for the blog title. #3 is search-friendlier. #4 is the hook variant for X.

## Thumbnail concept

Four-pane terminal grid. Each pane showing a different `section/*` branch working (different section-id, different file being edited, different phase showing in the status line). Center overlay: a single `claims.json` excerpt with four entries. Tag: "no orchestrator."

---

## Script

### Cold Open (0:00-0:30)

I've got four Claude Code agents writing code in this repo right now.

[ON SCREEN: four-pane terminal grid. Each pane: a different `/pipeline` run on a different section. Different branches visible in each status line. Let it play for a beat — typing, tool calls, different section IDs.]

Different sections. Different branches. Parallel commits. They don't know about each other. They don't need to.

[BEAT — cut to single terminal]

The thing keeping them from stepping on each other is a JSON file and a lockfile. Three hundred lines of skill files. No daemon. No queue. No MCP server.

Let me show you how it works.

### The Problem (0:30-1:10)

[ON SCREEN: single terminal, `git worktree list` showing the main repo at master plus a couple of pre-existing worktrees]

If you try to run two Claude Code agents on the same repo at once, here's what breaks. First — git refuses to check out the same branch in two worktrees. So if both agents try to commit to master, one crashes. Second — I have session state in one shared file. Both agents write to it, they corrupt each other. Third — if both agents finish at the same second and both push to master, the second one gets rejected or overwrites work. Fourth — say one finishes cleanly and pushes to master. The other three are now on branches forked from a stale master. They drift.

[ON SCREEN: quick bullet list of those four failures — crash, corrupt, collision, drift]

Four failure modes. The fix for all four fits in two skill files.

### The Primitives (1:10-2:30)

Git gives you worktrees. Multiple working directories, same repo, different branches. That's the isolation boundary.

[ON SCREEN: `git worktree add .claude/worktrees/section-ad-10.2 -b section/ad-10.2 origin/master` — let it run, then `git worktree list` showing the new entry]

Each agent gets its own worktree. Its own branch. `section/ad-10.2`. `section/ad-11.1`. Whatever. Unique name per section, so git never has two worktrees fighting over the same branch. That kills failure number one.

Now — you need to know which worktrees are in use. That's a registry.

[ON SCREEN: `cat .claude/pipeline-state/claims.json` — show an empty one, then show one with four live entries]

Plain JSON file. Each entry has a worktree path, branch name, section ID, PID, heartbeat timestamp. Before an agent picks a worktree, it reads this file. After it picks one, it writes itself in.

Two agents hitting the registry at the same time would race each other. That's where the lockfile comes in.

[ON SCREEN: the `flock -x 9 ... 9> claims.lock` pattern from the skill file, highlighted]

`flock`. POSIX 1988. Exclusive advisory lock on a file descriptor. The entire claim sequence — read registry, find slot, write claim — runs inside that lock. Second agent waits. No races.

That's the claim primitive. Seven beats. Runs in under a second.

### The Non-Trivial Part: Fan-Out (2:30-3:40)

So four agents are running in parallel, each on its own `section/*` branch. Agent A finishes first. Runs `/finish`. What happens?

[ON SCREEN: the `/worktree-release` beat list — FIN-15 through FIN-22]

Eight beats. Push section branch, rebase onto latest master, re-run test and build — because the rebase could have pulled in a change that breaks the section's work — then force-push with lease, then fast-forward merge into master. That last step, the ff-merge, runs inside the same flock the claim registry uses. Only one agent merges to master at a time. Failure number three: solved.

[BEAT]

But B, C, and D are still working on branches forked from an *older* master. A just moved master. They're drifting.

[ON SCREEN: visualization — master advanced, three worktree branches still pointing at old base]

So the last thing A does before releasing its claim — it iterates the registry. For every other live claim, it runs `git fetch && git rebase origin/master` inside that worktree.

[ON SCREEN: actual log of the fan-out loop running — one worktree rebases cleanly, one gets skipped as dirty, one conflicts and gets flagged]

Dirty worktree? Skip it. That agent is actively editing files — it'll rebase itself at its own `/finish`. Rebase conflicts? Flag it in the registry. That agent's next heartbeat — which runs on every phase transition — sees the flag and halts with instructions.

[BEAT]

This is the beat that matters. Without it, you have four agents that each think they're on master, racing to discover otherwise. With it, they stay in sync automatically, and the one time something actually conflicts, the system tells you instead of silently shipping something wrong.

### Staleness, Heartbeats, Eviction (3:40-4:15)

One more thing. Agents crash.

[ON SCREEN: `kill -9` on one of the four panes; the process dies silently, claims.json still has its entry]

If an agent goes down mid-section, its claim sits there forever. Next `/pipeline` invocation that wants a slot — it checks liveness first. `kill -0 <pid>`. If the process is gone, the claim is evicted. Also: every claim has a heartbeat timestamp. Phase transitions update it. If heartbeat is older than thirty minutes, evicted regardless of PID.

[ON SCREEN: the next `/pipeline` run detecting and evicting the dead claim, then reusing the slot]

Slot reused. Dead agent's branch force-reset to master. Work resumes.

### The Takeaway (4:15-4:45)

Here's what I want you to take from this.

[ON SCREEN: abstract — the four primitives listed: worktree, registry, flock, heartbeat]

Parallel AI agents are not a special problem. They're workers. The coordination patterns that work for background jobs — a claim registry, atomic slot acquisition via flock, fan-out on completion, liveness via heartbeat plus PID — those same patterns work for agents. You don't need a new category of tool.

[BEAT]

If you've built anything with Celery, Sidekiq, BullMQ, or a plain Python `concurrent.futures` pool — you already know how to orchestrate AI agents. The prompts change. The primitives don't.

Git worktrees in particular — they're the cheapest isolation boundary in software and almost nobody uses them. They're free. They're fast. They work right now in every repo you already have. And if you're running LLM agents that mutate files, they're basically the answer.

Three hundred lines of skill files. A JSON file. A lockfile.

Stop reaching for orchestrators. Start with the primitives.

### Close (4:45-5:00)

One caveat. This is week-one. I've run the happy path maybe twenty times. I have not watched an agent crash mid-section in production yet. I have not hit the four-slot cap under real pressure. The logic is sound — but the real test is staying up for a month.

If you want to steal this, the two skill files are on the blog. The whole thing is three hundred lines.

Go make your agents not eat each other.

[END CARD: travisgautier handle, link to pipeline intro video if one exists]

---

## B-roll / on-screen elements

- **Cold open four-pane grid:** real screen recording of four Claude Code panes in parallel. Each running `/pipeline` against a different section. Do this for real — don't fake it. It's the single strongest visual in the video.
- **`git worktree list` (0:30-1:10):** before and after claim. Before: main + 2 feature worktrees. After: main + 2 features + 4 section/* worktrees.
- **`claims.json` evolution (1:10-2:30):** four states — empty, one claim, four claims, three claims (post-first-finish). Let it animate.
- **`flock` pattern highlight (1:10-2:30):** the actual shell block from `/worktree-claim` SKILL.md showing the `exec 9> $LOCK` / `flock -x 9` pattern. Highlight the flock line specifically.
- **Fan-out loop log (2:30-3:40):** real `/finish` execution, captured. Showing "fanning out to section/ad-11.1 — clean rebase", "skipping section/ad-12.1 — dirty tree", "conflict on section/ad-10.4 — flagged". This is the money beat. Spend extra time on the capture.
- **Heartbeat + eviction (3:40-4:15):** real `kill -9` followed by the next claim run detecting the dead PID. The `claims.json` before-and-after is the proof.
- **Takeaway abstract (4:15-4:45):** not a terminal. Four words on screen: WORKTREE / REGISTRY / FLOCK / HEARTBEAT. Hold.

## Tone/brand notes

- Terminal-centric to the extreme. Almost every beat is on a terminal. The only non-terminal beat is the takeaway.
- Keep face-cam optional. If used: cold open line only, and the final "stop reaching for orchestrators" line.
- Profanity where it lands naturally — don't force it. This video has less room for it than the test-quality one. The architecture story carries its own weight.
- **Do not explain the pipeline in detail.** One sentence of context: "I have a TDD pipeline, each run is a worker, I needed multiple workers." Done.
- **Do not generalize beyond what the artifact proves.** This is a week-one implementation. Say so. The thesis — "primitives not frameworks" — is generalizable. The specific code maturity is not.
- **Do not sell Claude as special.** The agents could be anything. The coordination layer doesn't know or care.
- Avoid AI vocabulary: delve, navigate, leverage, framework, paradigm, robust, groundbreaking, "testament to," "it's worth noting." Em-dashes fine.
- Hard-cap at 5:00. If you're over, cut the staleness/eviction beat — it's the most droppable segment.

## Release considerations

- No time-pressure. Unlike the test-quality video, the idea here keeps. Publish when the four-pane cold open footage is tight.
- Cross-link: if the opus-4-7-intro or test-quality-shift videos are out, mention them. This is the "operationalize it" video in that series.
- Blog post should include the full claims.json schema, the CLAIM beat table, and the release sequence diagram. That's the artifact people will want to fork.
- Pin a comment with the link to the `/worktree-claim` and `/worktree-release` SKILL.md files (or a gist copy if the repo is private).
- Consider a follow-up video in 30-60 days: "I ran this for a month. Here's what broke." That's the honest empirical close to this one.
