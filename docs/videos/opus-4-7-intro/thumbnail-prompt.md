# Thumbnail Prompt — Opus 4.7 Intro Video

Use ONE of the three prompts below depending on which image tool you're using. All target the same visual: a dark, data-forward thumbnail with a benchmark comparison as the focal point.

---

## Visual intent (reference for any tool)

- **Dominant element:** a mini benchmark table or horizontal bars showing Opus 4.7 at 64.3% (highlighted) vs GPT-5.4 at 57.7% vs Gemini 3.1 Pro at 54.2%
- **Background:** near-black (#0a0a0a or #111), subtle monospace-grid texture or fine noise
- **Typography:** monospace, high contrast. "64.3%" large in accent color (green #22c55e or blue #3b82f6)
- **Overlay text:** "CODING CROWN BACK" — bold, upper area. Small subtext: "but check the tokenizer"
- **No faces, no stock robots, no brain imagery, no sparkles, no gradients, no "AI vibes" cliches**
- **Feel:** scoreboard / leaderboard aesthetic, not a pitch deck
- **YouTube safe zone:** keep the main comparison centered; leave bottom-right clear for YouTube's duration overlay

---

## Prompt A — Midjourney v6+ / v7

```
Minimalist leaderboard-style thumbnail for a technical YouTube video.
Near-black background (#0a0a0a), subtle fine monospace grid texture.
Three horizontal bars stacked vertically, representing benchmark scores:
- Top bar: bright green (#22c55e), 64.3% width, labeled "Opus 4.7 — 64.3%" in white monospace
- Middle bar: muted gray (#6b7280), 57.7% width, labeled "GPT-5.4 — 57.7%"
- Bottom bar: muted gray (#6b7280), 54.2% width, labeled "Gemini 3.1 — 54.2%"
Upper-left: bold white text "CODING CROWN BACK" in sans-serif.
Lower-right: small monospace text "SWE-bench Pro" as the benchmark label.
High contrast, flat design, no 3D effects, no gradients, no decorative elements, no human figures.
Negative prompt: glow effects, neon, cyberpunk, lens flare, human faces, hands, stock photography, robots.
Aspect ratio: 16:9. --ar 16:9 --style raw --stylize 50
```

## Prompt B — DALL-E 3 / ChatGPT image gen

```
Create a YouTube thumbnail (16:9, 1280x720) for a technical AI model comparison video.

Design requirements:
- Near-black background (#0a0a0a), with a very subtle monospace dot-grid pattern
- Three horizontal bar chart rows, centered and large:
  - Row 1: BRIGHT GREEN (#22c55e) bar at ~64% width, label "Opus 4.7  64.3%" in white monospace, bold
  - Row 2: muted gray (#6b7280) bar at ~58% width, label "GPT-5.4  57.7%" in light gray monospace
  - Row 3: muted gray (#6b7280) bar at ~54% width, label "Gemini 3.1 Pro  54.2%" in light gray monospace
- The Opus 4.7 bar should be clearly longer and brightly colored — the other two are desaturated
- Upper-left corner: bold white sans-serif text "CODING CROWN BACK"
- Lower-left: small gray monospace text "SWE-bench Pro (April 2026)"
- Lower-right: small text "travisgautier" in the same monospace font
- All data typography in a monospace font (IBM Plex Mono, Fira Code, or similar)
- No illustrations, no humans, no robots, no AI-cliche imagery, no gradients, no glow
- Flat, scoreboard aesthetic — ESPN stat graphic, not Medium hero image
```

## Prompt C — Gamma's "Generate Cover" (if using Gamma for everything)

```
Dark-themed leaderboard cover image for a model comparison video.
Three horizontal bars showing benchmark scores: Opus 4.7 at 64.3% (green, highlighted), GPT-5.4 at 57.7% (gray), Gemini 3.1 Pro at 54.2% (gray).
Monospace font for numbers. Background near-black. No decorative illustrations.
Top-left label: "CODING CROWN BACK". Bottom label: "SWE-bench Pro".
```

---

## Alt-variant — emotional hook ("FIRST HOPE IN WEEKS")

Secondary thumbnail option. Same benchmark-bar layout, different headline. Tests well for audiences frustrated with Claude's recent rough patch (rate-limit crisis + Opus 4.6 quality complaints). Lead with recovery framing instead of leaderboard framing.

```
Identical layout to Prompt A/B above (three horizontal bars: Opus 4.7 green-highlighted at 64.3%, GPT-5.4 and Gemini gray).
Upper-left headline changes from "CODING CROWN BACK" to "FIRST HOPE IN WEEKS" in bold white sans-serif.
Lower-right subtext changes from "but check the tokenizer" to "after a brutal six weeks".
Same dark background, same monospace data typography, same anti-hype discipline.
```

**When to use which:**
- **"CODING CROWN BACK"**: higher click-through for leaderboard-curious audiences, Anthropic superfans, GPT-vs-Claude debate viewers.
- **"FIRST HOPE IN WEEKS"**: higher click-through for frustrated current Claude users, people who've been tweeting complaints, audiences following the rate-limit/degradation drama.
- A/B test both on the first 30-minute post window if YouTube Studio's thumbnail test feature is available.

---

## Post-generation checklist

- [ ] The three bars have visibly different lengths (most tools will equalize them — regenerate until the gap is obvious)
- [ ] Opus 4.7 bar is clearly brighter/highlighted vs the muted competition bars
- [ ] No stock imagery snuck in (robots, brains, glowing orbs, human figures)
- [ ] Text is legible at 320x180 (YouTube's small preview size) — test by shrinking
- [ ] "CODING CROWN BACK" reads instantly — this is the scroll-stopper
- [ ] Title text is NOT baked into the image — YouTube overlays titles; leave space
- [ ] Accent color (green) is consistent with slides accent color
- [ ] Save both a "with headline text" version (for click-through testing) and a "bars-only" version (for embeds and LinkedIn)
