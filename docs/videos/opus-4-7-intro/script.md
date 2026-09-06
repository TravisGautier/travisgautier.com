# Opus 4.7 Just Dropped. Here's What Actually Changed.

## Premise

Anthropic released Claude Opus 4.7 on April 16, 2026, into the worst PR cycle the company has had. Six weeks of rate-limit complaints. Quality-degradation claims backed by real data. A viral GitHub issue from an AMD senior director. The default mood around Claude right now is pessimism.

**Angle:** this release is a few hours old. Nobody knows yet if the vibes match the benchmarks. But on paper, it's the first reason for hope in weeks. Lead with why that hope is warranted, flag what's worth testing before migrating, stop short of claiming anything the release hasn't earned yet.

## Title candidates

1. "Opus 4.7 Just Dropped. Here's What Actually Changed."
2. "Claude Opus 4.7 vs GPT-5.4 vs Gemini 3.1 Pro: Benchmarks + Vibes"
3. "The Opus 4.7 Gotcha Nobody's Talking About (It's the Tokenizer)"
4. "Opus 4.7 Retakes #1 From GPT-5.4. But Check the Tokenizer."

Recommend #1 for broad appeal or #4 for click-through. #3 is the most Travis Gautier but narrower audience.

## Thumbnail concept

Dark background. Four-column benchmark comparison with Opus 4.7's SWE-bench Pro score (64.3%) highlighted in accent color, GPT-5.4 (57.7%) visibly behind. Bold overlay: "CODING CROWN BACK." Small tag: "but check the tokenizer."

---

## Script

### Cold Open (0:00-0:55)

The last six weeks have been absolute DOG if you pay for Claude.

Five-hour coding sessions dying after ninety minutes. Max-tier subscribers watching one prompt blow through their entire limit. Anthropic themselves admitted people are hitting rate limits way faster than they expected. Top priority, they said. Cool.

Then the quality tanked. Some AMD senior director dumped a GitHub issue with 7 thousand Claude Code sessions. Median thinking length on Opus 4.6 collapsed 73%. Files it actually read before editing dropped from 6.6 to 2.0. Third-party benchmarks backed it up. SWE-bench lost six points in six weeks.

Everyone's mood around Claude right now is pure pessimism. People are tired.

Yesterday, April 16, 2026 — a few hours ago — Anthropic dropped Opus 4.7.

I'm not gonna sit here and tell you it fixed everything. Nobody's used it long enough to know if the vibes actually match the numbers. The rate limiting seems to still be there.

But on paper? This is the first reason for hope in weeks.

SWE-bench Pro jumping from 53 to 64 percent. Vision accuracy from 54 to 98. New effort level. Multi-agent review. And a brand new tokenizer.

That tokenizer is the one thing you need to pay attention to before you switch. Price per token didn't change — still five bucks in, twenty-five out. But the new tokenizer counts differently. Same prompt, same code, same files can suddenly cost you 1.0 to 1.35 times more tokens. Same price per token doesn't mean same price per prompt. Measure your context first.

Here's what actually changed.

### The Numbers (0:55-3:00)

Let's look at the head-to-head.

| Benchmark | Opus 4.7 | Opus 4.6 | GPT-5.4 | Gemini 3.1 Pro |
|---|---|---|---|---|
| SWE-bench Pro | 64.3% | 53.4% | 57.7% | 54.2% |
| SWE-bench Verified | 87.6% | 80.8% | — | 80.6% |
| CursorBench | 70% | 58% | — | — |
| GPQA Diamond | 94.2% | 91.3% | 94.4% | 94.3% |
| Terminal-Bench | 69.4% | 65.4% | — | — |

Three things actually matter.

**One:** Coding is where it wins. SWE-bench Pro is the real one — actual GitHub issues, not cherry-picked crap. Opus 4.7 beats GPT-5.4 by 6.6 points and Gemini by ten. CursorBench jumped twelve points. If you're doing real agentic coding, this is the number that counts.

**Two:** Reasoning is basically a tie now. GPQA Diamond is 94.2 vs 94.4 vs 94.3. Everyone hit the same wall.

**Three:** Vision got stupidly better. Accuracy from 54.5% to 98.5%. Resolution tripled. If Claude used to butcher your screenshots and diagrams, this is actually different.

It does lose on BrowseComp though — agentic web search. GPT-5.4 is at 89.3, Opus is at 79.3. If your workflow needs the model to actually browse and summarize the web, GPT still has the edge.

### The Vibes (3:00-5:30)

Benchmarks are one thing. Here's what it actually feels like.

**The tokenizer** is the gotcha nobody's yelling about loud enough. Same five-in/twenty-five-out pricing, but the new one can inflate your prompts by up to 35%. Same code, same files, suddenly more tokens. If you're running serious volume through the API, test your actual payloads before you migrate or your bill might quietly fuck you.

**New "xhigh" effort level.** Sits between high and max. Default in Claude Code now. Supposed to give better quality on complex stuff without the full max slowdown.

**Instruction following** is way more literal. Good if your prompts are tight. Bad if you were relying on the model reading between the lines like it used to on 4.6.

**Ultrareview** looks promising — it spins up multiple agents to review your code in parallel. Early noise says it catches shit that single-pass review misses.

They also claim 3x more production-grade tasks solved without babysitting. Take the multiplier with salt, but the direction is real. Better at long agentic runs.

### Honest Take (5:30-7:00)

Who should switch?

**If you live in Claude Code or run agentic workflows:** switch. Same price, clearly better at the things you actually do.

**If you're heavy on the API at scale:** measure the tokenizer first. Run your real prompts. If you land on the high end of that 1.35x, your costs go up even if performance is better.

**If you need strong agentic search:** stick with GPT-5.4 for now.

**If price is the main thing:** Gemini 3.1 Pro is half the cost and still competitive on reasoning.

One last thing: Anthropic dropped this while openly admitting it doesn't match their unreleased Mythos model — the one they call "by far the most powerful" they've ever made. Mythos is locked behind safety review and only available to eleven companies for cyber work. Opus 4.7 is the best you can actually buy from them. It's not the best they have.

That gap between what they sell and what they're hiding is the real story of AI in 2026.

### Close (7:00-7:30)

Opus 4.7 takes back the coding crown. The SWE-bench Pro gap is real.

Check the tokenizer before you go all-in at scale. "Same price per token" isn't the same as "same price per prompt."

The vision jump from 54.5 to 98.5 percent is the most slept-on change here.

Migration guide in the description. Drop in the comments what you're switching from and whether the tokenizer fucks your numbers.

---

## B-roll / on-screen elements

- Anthropic blog post announcement scrolling
- Benchmark comparison table (the money visual, keep it on screen for 15+ seconds)
- Terminal: Claude Code session showing model version
- Side-by-side tokenizer comparison (same input, different counts)
- `/ultrareview` running in a terminal (if available before recording)
- SWE-bench Pro leaderboard with Opus 4.7 at top
- Vision comparison: same screenshot processed by 4.6 vs 4.7 (if feasible)
- Mythos articles from CNBC, Axios as the closing visual
- Cold open montage: rate-limit complaints, GitHub issue screenshots, red benchmark lines

## Tone/brand notes

- Punchy, casual, profane where it lands. "Here's what I found" attitude, not a recap show.
- Screen-recording with voiceover beats face-cam for this one. The data is the visual.
- Don't fanboy Anthropic. Explicitly call out where GPT-5.4 and Gemini win.
- The tokenizer gotcha is the editorial angle. It's what makes this a Travis Gautier video instead of a recap.
- The Mythos close is the narrative hook that elevates this beyond "new model dropped."
- Target under 7:30 total. News-cycle video, not a deep dive. Respect the viewer's time.
- Vocab to avoid (from Timewave2 voice doc, AI-vocab section only): delve, navigate, leverage, framework, paradigm, robust, groundbreaking, "testament to," "it's worth noting." Em-dashes, profanity, and rhetorical questions are fine — this is a spoken script, not a novel chapter.
