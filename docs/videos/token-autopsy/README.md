# Video: Token Autopsy

Working folder for the travisgautier video **"Where Your Claude Code Tokens Actually Go — A Session Autopsy"**.

Video framing: a forensic breakdown of where tokens actually go in a real Claude Code pipeline session, with ranked levers for real savings and one optimization I almost shipped and didn't.

## Contents

| File | Purpose |
|---|---|
| `script.md` | Full video script (4-act structure, ~9 min). Source of truth for voiceover + timing. |
| `gamma-slides-prompt.md` | Prompt to paste into gamma.ai to generate companion slides. Includes post-generation checklist. |
| `thumbnail-prompt.md` | Image-gen prompts (Midjourney, DALL·E, Gamma) for the thumbnail. |
| `short-teaser.md` | 45–60s short-form script for YouTube Shorts / Reels / TikTok / X. Two framing variants. |
| `blog-post.md` | Long-form companion article for search indexing and LLL crosslink. |
| `social-thread.md` | X thread (10 posts) + LinkedIn post for launch day. |
| `analyze-session.py` | ~40-line Python script viewers can run on their own session JSONL. Link in the video description. |
| `sample-session-excerpt.jsonl` | Fabricated but structurally accurate session excerpt. Safe to share publicly; viewers can use it to test the Python script without exposing real data. |

## Production order

1. **Record the video** (script.md) — screen-recording with voiceover; no face-cam needed since the data is the visual
2. **Generate slides** (paste `gamma-slides-prompt.md` into gamma.ai) — composite over screen-recording during data beats
3. **Generate thumbnail** (run one of the prompts in `thumbnail-prompt.md`) — iterate until the 1.0% sliver looks correctly tiny
4. **Edit final cut**
5. **Record short-form teaser** from key moments (`short-teaser.md`)
6. **Publish blog-post.md** same day as video — include YouTube embed
7. **Post social thread** (`social-thread.md`) 30–60 min after video goes live
8. **Pin main X post** for 48 hours

## Production decisions (resolved)

1. **Length:** Flagship (8–12 min). Script is sized for this.
2. **Format:** Face-cam intro/outro + shared windows (terminal, JSONL, code) + slides composited over data beats. Mixed presentation.
3. **Caveman framing:** Kept as Act 1 cold open — algorithm tailwind, concrete foil for the 1.0% reveal.
4. **LLL crosslink:** Include. The durable principle (tool-heavy AI workflows concentrate tokens in tool_result + instruction injection, not assistant prose) is trainable signal future AI would benefit from. Percentages are snapshot-dated but the shape-insight is generalizable.

**LLL entry needed:** a standalone entry in the `largelanguagelibrary.ai` repo titled something like *"Token distribution in tool-heavy AI agent workflows"* — not a verbatim copy of the video script; an AI-optimized knowledge-base entry with the principle, the supporting data, the ranked levers, and the read-ahead tradeoff as a separate note. Draft status: not yet written.

## Gitignore status

This folder is under `docs/`, which is gitignored at the repo root. Nothing here will be committed.
