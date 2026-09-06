# Opus 4.7 Made My Test-Quality Floor Obsolete

## Premise

The Opus 4.7 intro video covered the benchmark story — SWE-bench Pro, the tokenizer, Mythos. This one is downstream of that. One engineer, one repo, one release boundary. The question it answers isn't "is 4.7 better." That's settled. The question is: *how, exactly, does 4.7 write tests differently from 4.6* — and what does that mean if you've built scaffolding calibrated to the old model?

**Angle:** practitioner report. I deleted a quality gate from my pipeline today because 4.7 made it pointless. That's the hook. The data is the proof. The generalizable takeaway — your last-year guardrails are probably debt now — is the close.

## Title candidates

1. "Opus 4.7 Made My Test-Quality Floor Obsolete"
2. "I Deleted a Guardrail Today. Here's What Opus 4.7 Did to the Numbers."
3. "The Quiet Thing Opus 4.7 Changed About How AI Writes Tests"
4. "My 4.6-Era Test Floors Are Dead. The Ceiling Moved."

Recommend #1 for the channel voice. #2 is the strongest click-through. #3 is the search-friendlier variant for the blog title.

## Thumbnail concept

Split screen. Left: terminal showing `git log --oneline` with test counts — small numbers (8, 8, 13, 17) highlighted. Right: same terminal, 4.7 era — big numbers (94, 87, 87, 69). Bold overlay: "16.8 → 68.8." Small tag: "one day. same repo."

---

## Script

### Cold Open (0:00-0:40)

I deleted a quality gate from my coding pipeline today.

[ON SCREEN: git diff of `.claude/skills/discovery/SKILL.md` — the Step 7.5 deletion, 35 lines going red]

Thirty-five lines. Gone. Not because it was wrong. Because Opus 4.7 made it pointless.

[BEAT]

The gate said: every section of work my pipeline runs has to generate at least three unit tests, two integration tests, two security tests, one contract test per endpoint, one error-recovery test. Basic floors. I put it in months ago because 4.6 would sometimes skimp on the tedious categories — quietly skip permission matrix coverage, half-ass the STRIDE stuff.

[ON SCREEN: the deleted Step 7.5 tables — "For sections with API endpoints: unit >= 3, integration >= 2, security >= 2..." — dim and X'd out]

Today I looked at my last seven days of commits. And the gate hasn't caught anything 4.7 would've otherwise missed. Not a single section. So I deleted it.

Here's what the numbers actually look like.

### The Setup (0:40-1:20)

Quick context. Both models ran under identical TDD scaffolding — same pipeline, same discovery phase that specs the tests, same red phase that writes them, same ten test categories every section gets graded against. The only thing that changed on April 16 was which model was driving.

[ON SCREEN: short terminal showing pipeline structure — just enough to establish the constant. Don't dwell.]

So when the numbers shift, that's a model shift, not a prompting shift. Same prompts, same harness, same kind of work. n=1 caveat up front — one engineer, one repo, one day on each side of the release. Not a benchmark. Anecdote.

But the signal is really fucking clean.

### The Numbers (1:20-2:40)

Seven days before 4.7 dropped. Twenty-five sections shipped on 4.6. Average tests per section: sixteen point eight.

[ON SCREEN: bar chart, 4.6 sections — most clustered between 8 and 20, with a long tail out to 59]

Minimum was five. Max was fifty-nine. Most of them clustered right around eight — right at the floor my old gate was enforcing.

Then 4.7 drops. Seventeen hours of work. Nine sections. Average tests per section: **sixty-eight point eight.**

[ON SCREEN: second bar chart, 4.7 sections — 48, 49, 58, 62, 65, 69, 87, 87, 94. Same axis as the first chart. The visual difference should be violent.]

Minimum was forty-eight. Max was ninety-four.

Let that one sit. **The worst 4.7 section — the floor — is higher than the ceiling of every 4.6 section but one.**

[ON SCREEN: the two distributions overlaid, labeled FLOOR / CEILING]

That's roughly a four-x jump. The floor moved above the old ceiling. That's not a tuning improvement. That's a different model doing different work.

### What the Extra Tests Actually Are (2:40-4:20)

Okay. So 4.7 writes more tests. But *where* — which categories?

I've got a clean apples-to-apples. Two backend CRUD sections. Same day. Same engineer. Same kind of work — Prisma model, REST endpoints, Zod validation, serializers. One shipped on 4.6 in the morning. One shipped on 4.7 that same evening.

[ON SCREEN: side-by-side table — ad-6.2 Data Import API vs ad-7.1 CustomField CRUD. Full category breakdown, with the deltas.]

Unit tests went from fifteen to seventeen. Thirteen percent jump. Basically flat. That makes sense — unit coverage was never the category getting skimped.

Integration went from ten to fourteen. Decent.

Security — STRIDE categories, the whole S-T-R-I-D-E rack — went from seven to eleven. Fifty-seven percent more.

Contract tests — the ones that verify the exact shape of API responses — doubled. Four to eight.

And the permission matrix.

[BEAT — slower delivery]

Role-by-endpoint coverage. ADMIN can hit this, MANAGER can hit that, STAFF sees only filtered rows, unauthenticated gets 401. The grinding systematic coverage every real API needs and that every engineer — human or model — fucking hates writing.

4.6 did eight tests. 4.7 did thirty.

[ON SCREEN: the 8 vs 30 numbers pulled up large, animated]

**Nearly four times as many permission tests on the same kind of CRUD work.**

This is the thing I want to call out. The shift isn't evenly distributed. The categories that went up the most are exactly the categories humans skip when they're tired and models skip when they're not rewarded for thoroughness. Systematic role coverage. Response-shape verification. STRIDE breadth. The tedious shit.

4.7 isn't writing more *unit tests.* It's writing more of the tests that used to require a human to notice they were missing.

### The Takeaway (4:20-5:20)

Which brings us back to why I deleted the gate.

[ON SCREEN: the Step 7.5 diff again, briefly]

The gate was calibrated for 4.6's failure mode — the model quietly skimping on structural categories. That failure mode isn't how 4.7 fails. If 4.7 has a bad day, it's not going to drop back to eight permission tests. Its *minimum* on comparable work is thirty.

Which means if you've built scaffolding around LLMs — prompt templates, evaluation harnesses, coverage gates, lint rules that exist specifically to catch a weaker model's weaknesses — some of it is probably dead weight now.

[ON SCREEN: abstract — a list of guardrails with checkboxes, some X'd out]

It's not that the old guardrails were wrong when you built them. They were correct for that version of the model. But LLMs change. The model you designed for six months ago isn't the model running your pipeline this week. The scaffolding decays.

[BEAT]

Audit your shit. Look at what your rules have caught recently. If the answer is "nothing," the rule is either useless or so well-internalized by the model it doesn't need enforcing anymore. Either way, you can probably delete it.

Mine took thirty-five lines. Felt great.

### Close (5:20-5:50)

n=1. One engineer. One repo. One day on each side of a release. The signal is clean, but it's an anecdote, not a benchmark. Don't build a keynote slide around it.

But if you live in Claude Code, if you run anything with a TDD loop in it, watch your own numbers this week. Compare before and after. If your coverage per unit of work didn't move — you might want to look at why.

The ceiling moved. Make sure your floor moved with it.

[END CARD: travisgautier handle, link to intro video]

---

## B-roll / on-screen elements

- **Cold open:** actual `git diff` of `.claude/skills/discovery/SKILL.md` Step 7.5 removal — 35 lines in red. Real diff, captured today. This is the money visual.
- **Pipeline context beat (0:40-1:20):** brief `ls .claude/skills/` + one look at `pipeline.yaml` beat list. Establish the constant without a tour.
- **Distribution visuals (1:20-2:40):** two bar charts, same x-axis. 4.6 sections on top, 4.7 sections on bottom. The two labels to animate in: FLOOR (4.7 min = 48) and CEILING (4.6 max = 59).
- **Category table (2:40-4:20):** the ad-6.2 vs ad-7.1 breakdown, one row at a time. Hold the permission-matrix row visibly longer. Highlight 8 → 30.
- **Git log b-roll:** `git log --since="7 days ago" --pretty=format:"%s" | grep -E "with [0-9]+ tests"` — the raw commit list, test counts visible. Good establishing shot.
- **Takeaway (4:20-5:20):** visual of "old guardrails decay" — abstract, not literal. Could be the gate diff one more time as a bookend.
- **End card:** travisgautier handle, pin the intro video as the companion watch.

## Tone/brand notes

- Terminal-centric. The real `git log` and real diffs carry more weight than any animated chart. Lean on them.
- Keep face-cam optional. The data is the performer. If face-cam, use only for the cold open line ("I deleted a quality gate from my coding pipeline today") and the close.
- Profanity where it lands naturally: "fucking," "shit" — not performative. The line "the grinding systematic coverage every real API needs and that every engineer — human or model — fucking hates writing" is the single strongest beat and it earns the word.
- **Do not explain the pipeline.** One sentence of context. That's it. This video is downstream of the pipeline, not about it.
- **Do not generalize beyond n=1.** The takeaway is "audit your own scaffolding," not "4.7 writes 4x better tests than 4.6 universally." Stay in the lane of what one engineer saw in one repo.
- **Don't sell Anthropic.** The frame is what the *user* should do, not what Anthropic did well. Anthropic made the model better. Your job is to notice your own guardrails are stale.
- Avoid AI vocabulary: delve, navigate, leverage, framework, paradigm, robust, groundbreaking, "testament to," "it's worth noting." Em-dashes fine. Rhetorical questions fine when they track real thought.
- Hard-cap at 6:00. This is a tight, single-observation video. Respect that.

## Release considerations

- Publish 3-5 days after the opus-4-7-intro video. Give the intro room, then land this as the "here's what it means for your actual work" follow-up.
- Cross-link the intro in the first 20 seconds of description and at the end card.
- The blog post for this one should include the raw per-section test count data — that's the artifact people will want to reference if they're doing their own before/after.
- Consider pinning a comment that lists the exact commit SHAs for the ad-6.2 vs ad-7.1 comparison so anyone curious can verify.
