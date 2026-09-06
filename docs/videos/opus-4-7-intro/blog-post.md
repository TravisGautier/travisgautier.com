# Opus 4.7 Just Dropped. Here's What Actually Changed.

*Companion piece to the travisgautier video of the same name. This is the text version for search indexing and anyone who'd rather read than watch.*

---

The last six weeks paying for Claude have been absolute dogshit.

Five-hour Claude Code sessions burning out in ninety minutes. Max-tier subscribers watching a single prompt blow through their entire limit. Anthropic themselves admitted people are hitting rate limits way faster than expected and called it the top priority for the team. Cool.

Then the quality tanked. An AMD senior director dumped a GitHub issue with 6,852 Claude Code session files showing Opus 4.6's median thinking length collapsed 73% since January. Files the model actually read before editing dropped from 6.6 to fucking 2.0. Third-party benchmarks backed it up — SWE-bench lost six points in six weeks. Everyone's mood around Claude right now is pure pessimism.

Today, April 16, 2026 — a few hours ago — Anthropic dropped Opus 4.7.

I'm not going to sit here and tell you it fixed everything. Nobody's used it long enough to know if the vibes actually match the numbers, and the rate limit bullshit is still there. But on paper? This is the first reason for hope in weeks.

## The benchmarks

Head-to-head on the numbers that actually matter:

| Benchmark | Opus 4.7 | Opus 4.6 | GPT-5.4 | Gemini 3.1 Pro |
|---|---|---|---|---|
| SWE-bench Pro | **64.3%** | 53.4% | 57.7% | 54.2% |
| SWE-bench Verified | **87.6%** | 80.8% | — | 80.6% |
| CursorBench | **70%** | 58% | — | — |
| GPQA Diamond | 94.2% | 91.3% | **94.4%** | 94.3% |
| Terminal-Bench 2.0 | **69.4%** | 65.4% | — | — |
| BrowseComp | 79.3% | — | **89.3%** | — |

Three things actually matter here.

**Coding is where it wins.** SWE-bench Pro is the real one — actual GitHub issues, not cherry-picked crap. Opus 4.7 beats GPT-5.4 by 6.6 points and Gemini by ten. CursorBench, which measures autonomous coding inside an IDE, jumped 12 points from 4.6. If you're doing real agentic coding, this is the number that counts.

**Reasoning is basically a tie now.** GPQA Diamond is 94.2 vs 94.4 vs 94.3. Everyone hit the same wall.

**GPT-5.4 still wins agentic web search.** BrowseComp goes to OpenAI 89.3 to 79.3. If your workflow depends on the model browsing and summarizing the web, GPT still has the edge.

## Vision: the sleeper upgrade

This one is getting buried. Vision accuracy went from 54.5% on Opus 4.6 to 98.5% on Opus 4.7. Resolution tripled to 3.75 megapixels, up from about 1.1. If you've ever had Claude butcher a screenshot or diagram or whiteboard photo, this is a fundamentally different model for visual input.

## The tokenizer — one thing to sit with before you migrate

Opus 4.7 ships with a new tokenizer. The API price is unchanged: $5 per million input tokens, $25 per million output tokens. Same as 4.6. But the new tokenizer can convert the same text into 1.0 to 1.35x as many tokens. Same prompt, same code, same files, up to 35% more tokens.

Net effect: same price per token does not mean same price per prompt. If you're running production workloads through the API, measure before you migrate. Run your actual payloads through both tokenizers and compare counts. The migration guide acknowledges this; most of the headlines don't.

For Claude Code subscribers, this is invisible — you're on a subscription, not per-token billing. For API users at scale, it's the one thing worth pausing on before you commit.

## What it feels like to use

Beyond the benchmarks:

**xhigh effort level.** A new setting between high and max, now the default in Claude Code. The idea: high was leaving quality on the table for agentic coding, but max was slow and expensive for routine tasks. xhigh splits the difference. More thinking on complex turns, less overhead on simple ones.

**Literal instruction following.** Opus 4.7 does what you said, not what you meant. If your prompts are precise, you get exactly what you asked for. If they relied on the model interpreting your intent generously, they may break. Test your existing prompts before migrating production systems.

**/ultrareview.** The new Claude Code feature I'm most interested in. It spawns multiple specialized agents to review code in parallel — not a single pass, a parallel multi-agent review. Early reports say it catches cross-file logic errors and security patterns that single-pass review consistently misses. I haven't stress-tested it yet, but the architecture is right.

**Autonomous reliability.** Anthropic claims 3x more production-grade tasks solved without human intervention compared to 4.6. That's a marketing number. Take the multiplier with salt. But the direction is real: the model is better at long-running agentic tasks and verifies its own outputs before reporting back.

## The evidence from my own code

Here's what I can actually show you from one day on one of my own projects.

On April 16, I happened to ship ten TDD sections on partymasters — six of them in the morning before 4.7 dropped, four of them in the evening after. The ones before 4.7 released averaged around 30 tests per section. The ones after averaged 69. That's a scope difference as much as a model difference, so I went looking for a cleaner comparison.

The cleanest one is ad-6.2 vs ad-7.1. Both are backend CRUD API sections — Prisma model plus REST endpoints plus Zod validation plus serializers. Same day, same engineer, roughly comparable scope, different model on each side of the release.

| Category | ad-6.2 Data Import API (4.6) | ad-7.1 CustomField CRUD (4.7) | Delta |
|---|---|---|---|
| Unit | 15 | 17 | +13% |
| Integration | 10 | 14 | +40% |
| Security (STRIDE) | 7 | 11 | +57% |
| **Permission matrix** | **8** | **30** | **+275%** |
| Contract | 4 | 8 | +100% |
| Edge case | 6 | 8 | +33% |
| Error recovery | 4 | 3 | -25% |
| Data integrity | 2 | 3 | +50% |
| Infrastructure | 2 | 3 | +50% |
| **TOTAL** | **58** | **94** | **+62%** |

The headline is the permission matrix: 8 tests on the 4.6 section, 30 on the 4.7 section. Nearly 4x more permission coverage on the same kind of CRUD work. Security/STRIDE went from 7 to 11. Contract tests doubled.

The n=1 caveat is honest and worth stating out loud: one day, one repo, one engineer, one section on each side of a single release boundary. This is an anecdote, not a benchmark. But if your day job involves TDD'ing admin APIs, the per-category density shift is the kind of thing you'll feel immediately.

## Who should switch

**Claude Code or agentic workflows:** switch now. Same price, strictly better at coding. The benchmarks aren't marginal. This is a real jump.

**API at scale:** measure the tokenizer first. Run your actual payloads through both tokenizers. If your content falls at the high end of that 1.35x range, your bill goes up 35% for the same work. The performance gains might justify it. They might not. Know your numbers.

**Agentic search workflows:** GPT-5.4 still leads on BrowseComp. If your system depends on the model browsing and summarizing web content, that's still OpenAI's game.

**Price-sensitive:** Gemini 3.1 Pro at $2/$12 per million tokens is less than half of Opus 4.7 and competitive on reasoning benchmarks. The gap is in coding and agentic tasks.

## The Mythos shadow

Anthropic released Opus 4.7 while publicly conceding it doesn't match Claude Mythos — an unreleased model they've described as "by far the most powerful AI model we've ever developed." Mythos is locked behind a safety review, available to eleven companies for cybersecurity work. Opus 4.7 is the best model Anthropic will sell you. It is not the best model Anthropic has.

That gap between what's commercially available and what exists behind closed doors is the defining dynamic of AI in 2026. Today's release just made it more visible.

## Summary

1. **Opus 4.7 retakes the coding crown.** The SWE-bench Pro gap over GPT-5.4 is real at 6.6 points.
2. **Check the tokenizer before migrating at scale.** Same price per token is not same price per prompt.
3. **Vision from 54.5% to 98.5% is the most underreported change.** 3.3x resolution. If you work with screenshots, this is the upgrade that stands out.
4. **Per-category test coverage on my own repo jumped 62% on comparable scope.** Permission matrix went 8 → 30. n=1 caveat applies, but the signal is there.

## Resources

- Anthropic announcement: [anthropic.com/news/claude-opus-4-7](https://www.anthropic.com/news/claude-opus-4-7)
- Migration guide: [platform.claude.com/docs/en/about-claude/models/migration-guide](https://platform.claude.com/docs/en/about-claude/models/migration-guide)
- Full video: [YouTube link]
- travisgautier channel: [channel link]

---

*If you've already migrated, I'm curious what the tokenizer impact looks like on your workloads. Drop a comment or reply on X. And whether your own section-level test coverage shifted the way mine did.*
