# Video: Test-Quality Shift (Opus 4.6 → 4.7)

Working folder for the travisgautier video **"Opus 4.7 Made My Test-Quality Floor Obsolete."**

Video framing: practitioner-observed shift in how the model writes tests across a model swap. Same TDD scaffolding, same engineer, same kind of work — 4.6 averaged ~17 tests per section, 4.7 averages ~69. The qualitative shift (permission matrix, STRIDE breadth, contract exhaustiveness) is the story. Pipeline gets a one-line acknowledgment, not a tour.

Cold open is Travis deleting a 35-line test-count floor from his discovery skill today because 4.7 made it dead weight. That's the hook — the guardrail obituary, not the benchmark recap.

Time-sensitive: sits alongside `opus-4-7-intro`. Reuses the ad-6.2 vs ad-7.1 comparison but goes deeper on per-category meaning. Publish within ~1 week of intro video or the n=1 signal gets stale.

## Contents

| File | Purpose |
|---|---|
| `script.md` | Full video script (~5:30-6:00). Source of truth for voiceover + timing. |
| `short-teaser.md` | *(not yet written)* 45-60s vertical cut for Shorts/Reels/TikTok/X. |
| `social-thread.md` | *(not yet written)* X thread + LinkedIn long-form. |
| `blog-post.md` | *(not yet written)* Search-indexed long-form companion. |
| `thumbnail-prompt.md` | *(not yet written)* Midjourney/DALL-E prompts. |
| `gamma-slides-prompt.md` | *(not yet written)* Gamma prompt for companion slides. |

## Production decisions (resolved)

1. **Length:** 5:30-6:00. Narrower scope than the intro video — one observation, one data cut, one takeaway. Don't pad.
2. **Format:** Screen-recording with voiceover. The actual `git log --oneline` and the diff of the Step 7.5 deletion are the visuals.
3. **Angle:** Practitioner report, not benchmark recap. "Here's what changed in my actual work" beats "here's the SWE-bench number." The intro video covered benchmarks. This one is downstream of them.
4. **Pipeline mention:** One line, up front, as the control variable — "both models ran under identical TDD scaffolding." Do not tour the pipeline. Do not explain the 105 beats. That's a different video.
5. **n=1 caveat:** State it twice — once up front, once in the close. One engineer, one repo, one release boundary. Not a benchmark. The signal is clean enough to act on but not to generalize.
6. **Do not re-use the intro video's cold open.** That one leads with six weeks of pain. This one leads with the guardrail deletion. Different entry point, different intent.
7. **Tone:** Same casual/profane Travis voice as the intro. Em-dashes, profanity, punchy beats. Avoid AI vocabulary (delve, navigate, leverage, framework, paradigm, robust, groundbreaking, "testament to," "it's worth noting").

## Production order

1. **Record the video** (`script.md`) — terminal-centric screen recording
2. **Cut in data visualizations** during the numbers beat (bar chart, per-category table)
3. **Capture the SKILL.md diff** as B-roll (the actual git diff of today's deletion)
4. **Edit tight** — target 5:30, hard-cap 6:00
5. **Short teaser** — extract the "4.7 floor is higher than the 4.6 ceiling" beat
6. **Blog post + social thread** — same day, following the intro video's pattern

## Data (source of truth)

### Per-section test counts observed

**Opus 4.6 window — partymasters, prior 7 days, 25 TDD sections:**

Mean 16.8 tests/section. Min 5 (es-4.3). Max 59 (ad-6.2). Many sections clustered at 8 (ad-2.6 through ad-4.1) — right at the floor check.

**Opus 4.7 window — partymasters, last ~17 hours, 9 TDD sections:**

| Section | Tests |
|---|---:|
| ad-7.1 (CustomField CRUD) | 94 |
| ad-10.1 (Form Config) | 87 |
| ad-8.1 (Lead Statuses) | 87 |
| ad-9.1 (Notification Rules) | 69 |
| ad-7.3 (Custom Field Rendering) | 65 |
| ad-9.2 (Notification Engine) | 62 |
| ad-8.2 (Booking Statuses) | 58 |
| ad-6.3 (Data Import UI) | 49 |
| ad-7.2 (Custom Field Admin UI) | 48 |

Mean 68.8. Min 48. Max 94. **The 4.7 minimum (48) exceeds every 4.6 section except one (ad-6.2 at 59).**

### Per-category comparison — ad-6.2 vs ad-7.1 (cleanest apples-to-apples)

Both backend CRUD API sections. Same day, same engineer, across the release boundary.

| Category | ad-6.2 (4.6) | ad-7.1 (4.7) | Δ |
|---|---:|---:|---:|
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

### The guardrail I deleted today

`.claude/skills/discovery/SKILL.md` Step 7.5 previously held three tables of numeric minimums per test category:
- For API sections: unit ≥ 3, integration ≥ 2, security ≥ 2, permission ≥ roles × endpoints, contract ≥ endpoints, edge_case ≥ 2, error_recovery ≥ 1, data_integrity ≥ 1
- For UI sections: unit ≥ 3, integration ≥ 2, accessibility ≥ 2, edge_case ≥ 2, error_recovery ≥ 1
- Plus enforcement examples block

All removed. Kept: the "at least 5 of 10 categories must have ≥1 test" rule and the N/A justification requirement (different mechanism, still useful).

Commit this data in the blog post. The guardrail deletion is the cold open visual.

## Gitignore status

This folder is under `docs/`, gitignored at the repo root. Nothing here commits.
