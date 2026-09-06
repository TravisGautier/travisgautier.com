# Video: Parallel Agents (Git Worktree Concurrency)

Working folder for the travisgautier video **"I'm Running Four Claude Code Agents at Once. Here's the Three Hundred Lines of Git Plumbing That Makes It Safe."**

Video framing: practitioner report on a concurrency-coordination layer bolted onto an existing TDD pipeline. The story is not the pipeline itself (different video). The story is: git worktrees + a flocked JSON registry + section-scoped branches = the cheapest multi-agent isolation primitive that actually works. No Redis. No queue. No orchestrator daemon. A lockfile and a discipline.

Cold open: the `git worktree list` showing four `section/*` branches live at once, with four Claude Code terminal panes working on them in parallel. That's the whole pitch in one screenshot.

Thesis: AI agents aren't special concurrency primitives. They're workers. The coordination patterns that work for background jobs (claim registry, atomic slot acquisition, fan-out sync) work for agents. Most of the "multi-agent orchestration" content on the internet reinvents distributed systems badly. The POSIX-1988 solution is fine.

Time-sensitive: less than the other videos. The idea keeps. Publish when it's ready.

## Contents

| File | Purpose |
|---|---|
| `script.md` | Full video script (~4:30-5:00). Source of truth for voiceover + timing. |
| `short-teaser.md` | *(not yet written)* 45-60s vertical cut for Shorts/Reels/TikTok/X. |
| `social-thread.md` | *(not yet written)* X thread + LinkedIn long-form. |
| `blog-post.md` | *(not yet written)* Search-indexed long-form companion. Includes the full claims.json schema + beat tables. |
| `thumbnail-prompt.md` | *(not yet written)* Midjourney/DALL-E prompts. |
| `gamma-slides-prompt.md` | *(not yet written)* Gamma prompt for companion slides. |

## Production decisions (resolved)

1. **Length:** 4:30-5:00. Tighter than test-quality-shift. One architectural idea, one data point (four panes), one takeaway. The system has more surface area than the observation — resist touring it.
2. **Format:** Screen-recording with voiceover. The `git worktree list` and `cat .claude/pipeline-state/claims.json` are the A-roll. Four-pane terminal grid is the hook visual.
3. **Angle:** "I built a tiny coordination layer. The primitives it uses are forty years old." Not "here's my AI-agent framework." Keep agent-specific vocabulary minimal — the trick is *git*, not Claude.
4. **Pipeline mention:** Minimal. "I have a TDD pipeline. Each pipeline run is a worker. I needed multiple workers to not collide." Do not explain the 119 beats. Different video.
5. **Do not oversell.** This is a week-one implementation. Has not survived a crashed agent in production. Has not hit the CAP limit in anger. Call this out in the close.
6. **Tone:** Same casual/profane Travis voice as the other videos. Em-dashes, blunt language, punchy transitions. Avoid AI vocabulary (delve, navigate, leverage, framework, paradigm, robust, groundbreaking, "testament to," "it's worth noting").
7. **Do not re-use earlier cold opens.** Test-quality led with the guardrail deletion. Intro led with six weeks of pain. This one leads with the four-pane terminal grid.

## Production order

1. **Record the video** (`script.md`) — terminal-centric screen recording; four-pane grid is the establishing shot
2. **Capture `claims.json` evolution** over a real run — empty → one claim → four claims → three claims (post-finish) → two claims
3. **Capture the fan-out rebase** — a real `/finish` log showing the loop iterating over other worktrees
4. **Edit tight** — target 4:30, hard-cap 5:00
5. **Short teaser** — the four-pane visual + "one JSON file, one lockfile" reveal
6. **Blog post + social thread** — include the full claims.json schema, the CLAIM beat table, the release sequence diagram

## Data (source of truth)

### System shape (as implemented 2026-04-17)

- Claim registry: `.claude/pipeline-state/claims.json` (gitignored)
- Lock: `.claude/pipeline-state/claims.lock` (POSIX `flock -x`)
- Worktrees: `.claude/worktrees/section-{id}/`
- Branches: `section/{section-id}` per claim, created from `origin/master`
- CAP: 4 concurrent slots (adjustable)
- Staleness: PID-liveness (`kill -0`) + heartbeat age (30 min)
- Registry entry schema:

```json
{
  "worktree_path": "…",
  "branch": "section/ad-10.2",
  "section_id": "ad-10.2",
  "agent_id": "<uuid>",
  "pid": 12345,
  "claimed_at": "2026-04-17T09:30:00Z",
  "heartbeat_at": "2026-04-17T09:42:13Z",
  "phase": "green"
}
```

### Two skill files, two sequences

**`/worktree-claim` — 7 beats under a single flock:**
1. `git worktree prune`
2. Read registry
3. Evict stale claims
4. Select unclaimed slot or create new one
5. `git checkout -B section/{id} origin/master`
6. Write claim entry
7. `EnterWorktree`

**`/worktree-release` — 8 beats (FIN-15..22 in the pipeline):**
1. Push section branch for traceability
2. `git rebase origin/master`
3. Re-run `npm test && npm run build`
4. `git push --force-with-lease`
5. Flock-serialized `git merge --ff-only` in main repo
6. `git push origin master`
7. Fan-out: rebase every OTHER active worktree onto new master (skip dirty)
8. Release claim + delete branch + remove worktree

### Beat count

Pipeline expanded from **105 → 119 beats** to accommodate full beat-level tracking of both skills (7 CLAIM + 8 release = 15 new beats, minus the 1 old `finish.git_push` it replaces). Every beat appears upfront in TaskCreate. No silent work.

### Concrete failure modes handled

| Failure | Handling |
|---|---|
| Same branch in two worktrees | Fresh `section/{id}` names — guaranteed unique |
| Two `/finish` hitting master in the same second | flock serializes the ff-merge block |
| Agent crashes mid-section | PID + heartbeat staleness evicts after 30 min |
| Master moved during section work | Rebase catches it; re-run gates validates |
| Fan-out conflict in a dirty worktree | Skip it; owning agent rebases at their own /finish |
| User runs /pipeline inside an existing claim | Abort if different section; resume if same |

### The non-trivial part

The fan-out. When agent A's `/finish` merges to master, the other three agents are still working on branches that were forked from an older master. If A just walks away, they all drift. The fix: A's `/finish` iterates the registry and runs `git fetch && git rebase origin/master` in every live worktree. Dirty ones skipped. Conflicted ones flagged. B/C/D's next heartbeat reads the flag and halts.

That's the clever beat. It's also the one that's hardest to explain in a video. Spend time on it.

## Gitignore status

This folder is under `docs/`, gitignored at the repo root. Nothing here commits.
