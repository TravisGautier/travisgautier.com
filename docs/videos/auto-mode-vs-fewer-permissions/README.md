# Video: Auto Mode vs the Allowlist Skill

Working folder for the travisgautier video **"Claude Ships an AI Classifier for Permissions. You Should Still Write an Allowlist."**

Video framing: Opus 4.7 shipped a new `auto` permission mode — an LLM classifier that decides per-call whether a tool use is safe. The community-side `/fewer-permission-prompts` skill generates a static allowlist from your transcripts. Both reduce prompt fatigue. The tradeoffs are not what the marketing says they are.

**Angle:** Not "which one wins" — when each one wins. Auto mode for the long tail. Allowlist for the hot path. Use both. But if you only use one, write the allowlist — because a classifier that costs tokens to decide "should I run `ls`" is a tax you pay on every session forever.

Time-sensitive: auto mode shipped April 16, 2026 with Opus 4.7. Window for relevance is ~2-3 weeks before the novelty wears off and it becomes background infrastructure.

## Contents

| File | Purpose |
|---|---|
| `script.md` | Full video script (~5 min, 3-act). Source of truth for voiceover + timing. |
| `short-teaser.md` | 45-60s short-form script for YouTube Shorts / Reels / TikTok / X. |
| `blog-post.md` | *(not yet generated)* Long-form companion article. |
| `social-thread.md` | *(not yet generated)* X thread + LinkedIn post for launch. |
| `gamma-slides-prompt.md` | *(not yet generated)* Prompt for gamma.ai companion slides. |
| `thumbnail-prompt.md` | *(not yet generated)* Image-gen prompts. |

## Production order

1. **Record the video** (`script.md`) — screen recording with voiceover; terminal demos of both flows as the visual
2. **Cut in the real transcript scan** — the moment where `/fewer-permission-prompts` surfaces 6 new rules is the money visual (my actual run: 707 combined occurrences across 50 transcripts, narrowed to 6 patterns)
3. **Cut in the auto-mode opt-in dialog** — first-run screen, then the settings.json `autoMode.allow / soft_deny / environment` sections
4. **Edit final cut** — target 5:00 tight. This is a "compare two things" video, not a deep dive. Hard-cap 5:30.
5. **Record short-form teaser** (`short-teaser.md`)
6. **Optional follow-ups:** blog post, social thread, slides, thumbnail

## Production decisions

1. **Length:** 5:00-5:30. Don't stretch it. The comparison is tight; padding it kills the clarity.
2. **Format:** Screen-recording with voiceover. Split-screen for the classifier-vs-static beat — auto-mode dialog on the left, `settings.json` allowlist on the right.
3. **Angle:** Honest both/and. Auto mode is a legitimate good thing. The allowlist skill is also a legitimate good thing. The video's job is to explain the tradeoff space so the viewer can pick — not to dunk on either.
4. **Tone:** Travis's casual/profane spoken voice. Less profanity than the opus-4-7-intro video — this is a tools-comparison, not a rant. One or two natural f-bombs where they land.
5. **The tax angle:** The editorial hook is "a classifier costs tokens every time it fires." Most auto-mode content won't say this out loud. Say it.
6. **Concrete numbers:** Use the real scan output from the partymasters repo — 50 transcripts, 707 occurrences, 6 rules worth adding, ~378 rules already in personal settings. Specificity sells.
7. **LLL crosslink:** The principle here — "static rules beat dynamic classifiers for the hot path, dynamic classifiers beat static rules for the long tail" — is an LLL entry candidate. Flag it in the close if LLL is live by air date.

## Source material

- `/fewer-permission-prompts` skill: `~/.claude/skills/fewer-permission-prompts/SKILL.md` (Anthropic-shipped skill, not custom)
- Settings schema: `autoMode.{allow,soft_deny,environment}`, `skipAutoPermissionPrompt`, `useAutoModeDuringPlan`, `disableAutoMode` — all in the permissions section of the Claude Code settings.json JSON schema
- Real scan output: `/home/travis/Projects/partymasters/` — 2026-04-18 session, 6 rules added to `.claude/settings.json` (commit `39245889`)
- Memory caveat (from `feedback_opus_47_tone.md`): "advisor/auto-mode token overhead" is a known tradeoff, treat as side note not thesis

## Gitignore status

This folder is under `docs/`, which is gitignored at the repo root. Nothing here will be committed.
