# Video: Opus 4.7 Intro

Working folder for the travisgautier video **"Opus 4.7 Just Dropped. Here's What Actually Changed."**

Video framing: six-weeks-of-pain opener (rate-limit crisis, Opus 4.6 quality collapse) → Opus 4.7 as the first real reason for hope in weeks. Benchmarks + vibes comparison of Claude Opus 4.7 vs 4.6 vs GPT-5.4 vs Gemini 3.1 Pro. Tokenizer caveat threaded in, not the thesis. Close on Mythos.

Time-sensitive: model dropped April 16, 2026. Window for relevance is ~1 week.

## Contents

| File | Purpose |
|---|---|
| `script.md` | Full video script (3-act structure, ~5-7 min). Source of truth for voiceover + timing. |
| `gamma-slides-prompt.md` | Prompt to paste into gamma.ai to generate companion slides. Includes post-generation checklist. |
| `thumbnail-prompt.md` | Image-gen prompts (Midjourney, DALL-E, Gamma) for the thumbnail. |
| `short-teaser.md` | 45-60s short-form script for YouTube Shorts / Reels / TikTok / X. Two framing variants. |
| `blog-post.md` | Long-form companion article for search indexing and LLL crosslink. |
| `social-thread.md` | X thread (8-10 posts) + LinkedIn post for launch day. |

## Production order

1. **Record the video** (script.md) — screen-recording with voiceover; benchmark tables and terminal demos as the visual
2. **Generate slides** (paste `gamma-slides-prompt.md` into gamma.ai) — composite over screen-recording during data beats
3. **Generate thumbnail** (run one of the prompts in `thumbnail-prompt.md`) — iterate until the benchmark table reads at small size
4. **Edit final cut** — target 5-7 min tight
5. **Record short-form teaser** from key moments (`short-teaser.md`)
6. **Publish blog-post.md** same day as video — include YouTube embed
7. **Post social thread** (`social-thread.md`) 30-60 min after video goes live
8. **Pin main X post** for 48 hours

## Production decisions (resolved)

1. **Length:** 7:00-7:30. Cold open grew to ~0:55 to land the six-weeks-of-pain setup before pivoting to hope.
2. **Format:** Screen-recording with voiceover. Benchmark tables, terminal output, Claude Code demos as the visual. Face-cam optional for intro/outro only.
3. **Angle:** Six-weeks-of-pain → hope pivot. Pessimism is the internet's default mood toward Claude right now. This video pushes against that without overclaiming. Release is hours old — we only have hope, not vindication.
4. **Tone:** Travis's casual/profane spoken voice. Em-dashes fine. Profanity lands naturally where it lands. Avoid AI vocab (delve, navigate, leverage, framework, paradigm, robust, groundbreaking, "testament to," "it's worth noting"). See `feedback_travisgautier_voice.md` in memory.
5. **Mythos angle:** Include as the closing narrative hook. Anthropic shipped 4.7 while conceding it doesn't match their unreleased model. The gap between what they'll sell you and what they have is the story.
6. **Test-coverage evidence (04-16 partymasters):** 4.6-era sections averaged ~30 tests, 4.7-era ~69. Permission matrix went 8 → 30 on comparable CRUD (ad-6.2 vs ad-7.1). STRIDE density also up. Use in blog, social post, slides. State n=1 caveat honestly.
7. **LLL crosslink:** Optional. If the durable principle (model benchmarks converge on reasoning, diverge on agentic tasks) generalizes, it could be an LLL entry.

## Gitignore status

This folder is under `docs/`, which is gitignored at the repo root. Nothing here will be committed.
