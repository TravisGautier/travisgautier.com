# Thumbnail Prompt — Auto Mode vs the Allowlist Skill

Use ONE of the three prompts below depending on which image tool you're using. All target the same visual: a dark, split-screen comparison with the cost asymmetry as the focal point.

---

## Visual intent (reference for any tool)

- **Dominant element:** a vertical split-screen. Left half = auto-mode side (blue, with a spinner or "deciding..." indicator). Right half = allowlist side (green, with a clean JSON code block showing six `Bash(...)` entries).
- **Background:** near-black (#0a0a0a or #111), subtle monospace-grid texture or fine noise
- **Typography:** monospace for code, high-contrast sans-serif for headline
- **Overlay text:** "TWO WAYS" — bold, top-center, spanning both halves. Small subtext centered bottom: "one costs tokens"
- **Left-side detail (auto mode):** a suggestion of a spinner, or the word "DECIDING..." in blue monospace, plus a small "tokens: +N" indicator. Conveys "active LLM computation."
- **Right-side detail (allowlist):** a small JSON snippet — three to four lines of `"Bash(npm test *)"` style entries, green, clearly static/durable. Conveys "written once, runs forever."
- **No faces, no stock robots, no brain imagery, no padlock/shield cliches, no sparkles, no gradients, no "AI vibes" decoration**
- **Feel:** technical documentation aesthetic, not a pitch deck. ESPN stat graphic, not Medium hero image.
- **YouTube safe zone:** keep the split line vertically centered; leave bottom-right clear for YouTube's duration overlay

---

## Prompt A — Midjourney v6+ / v7

```
Minimalist split-screen thumbnail for a technical YouTube video comparing two software features.
Near-black background (#0a0a0a), subtle monospace grid texture.
Vertical divider down the exact center.

LEFT HALF (blue #3b82f6 accent):
- Subtle circular spinner indicator, top-center of this half
- Below spinner, monospace text "DECIDING..."
- Small monospace label at bottom: "auto mode"
- Very subtle blue gradient to signal active/live computation

RIGHT HALF (green #22c55e accent):
- A clean JSON code snippet, three lines, monospace:
  "Bash(npm test *)"
  "Bash(npx jest *)"
  "Bash(git fetch *)"
- Small monospace label at bottom: "/fewer-permission-prompts"
- No motion indicators — flat and static to signal durability

OVERLAY:
- Top-center, spanning both halves: bold white sans-serif "TWO WAYS"
- Bottom-center: small white monospace "one costs tokens"

High contrast, flat design, no 3D effects, no gradients beyond the subtle left-side accent, no decorative elements, no human figures.
Negative prompt: glow effects, neon, cyberpunk, lens flare, human faces, hands, stock photography, robots, padlocks, shields, brain imagery, sparkles.
Aspect ratio: 16:9. --ar 16:9 --style raw --stylize 50
```

## Prompt B — DALL-E 3 / ChatGPT image gen

```
Create a YouTube thumbnail (16:9, 1280x720) for a technical comparison video between two software features.

Design requirements:
- Near-black background (#0a0a0a), with a very subtle monospace dot-grid pattern
- Vertical split down the center, dividing the composition into two equal halves

LEFT HALF:
- Color accent: blue (#3b82f6)
- Top-center: a subtle circular spinner / loading indicator
- Mid-center: the word "DECIDING..." in blue monospace font, all caps
- Bottom-center: small text "auto mode" in lighter blue
- Overall impression: something is actively computing

RIGHT HALF:
- Color accent: green (#22c55e)
- Center: a clean code block showing three lines of JSON in monospace green:
  "Bash(npm test *)"
  "Bash(npx jest *)"
  "Bash(git fetch *)"
- Bottom-center: small text "/fewer-permission-prompts" in lighter green
- Overall impression: static, durable, written-once

OVERLAY (spans both halves):
- Top-center: bold white sans-serif "TWO WAYS" — large, high contrast
- Bottom-center: smaller white monospace "one costs tokens"

Typography: IBM Plex Mono or Fira Code for all code. A clean sans-serif (Inter, Helvetica) for the "TWO WAYS" headline.
No illustrations, no humans, no robots, no padlocks, no shields, no brains, no sparkles, no gradients, no glow effects. Flat. Technical. Scoreboard aesthetic, not pitch deck.
```

## Prompt C — Gamma's "Generate Cover" (if using Gamma for everything)

```
Dark-themed split-screen cover for a technical comparison video.
Left half (blue accent): a "DECIDING..." label with a subtle spinner, representing an AI classifier in action.
Right half (green accent): a short JSON code snippet showing three static allowlist entries.
Monospace font for all code and labels. Background near-black. No decorative illustrations.
Top-center headline: "TWO WAYS". Bottom-center subtext: "one costs tokens".
```

---

## Alt-variant — inverted emphasis ("THE LLM DECIDES IF ls IS SAFE")

Secondary thumbnail option. Same split-screen layout, but the headline leans harder into the cost critique. Tests well for audiences who already know auto mode exists and are skeptical of the classifier approach — the tech-cynical X audience in particular.

```
Identical layout to Prompt A/B above (split-screen, blue left / green right, spinner + code snippet).
Top headline changes from "TWO WAYS" to "AN LLM DECIDES IF `ls` IS SAFE" in bold white sans-serif.
Bottom subtext changes from "one costs tokens" to "and bills you for it".
Same dark background, same monospace code typography, same discipline against decoration.
```

**When to use which:**
- **"TWO WAYS" (neutral):** higher click-through for general dev audiences, people unfamiliar with auto mode, readers of Anthropic's launch blog. Frames the video as a comparison, not a critique.
- **"AN LLM DECIDES IF ls IS SAFE" (spicy):** higher click-through for tech-cynical audiences, X engineering-meme community, people already worried about classifier cost. Frames the video as a takedown before they even click.
- A/B test both on the first 30-minute post window if YouTube Studio's thumbnail test feature is available.

---

## Alt-variant 2 — no split, just numbers ("707 TOOL CALLS. SIX RULES.")

Third option if the split-screen renders poorly at small sizes (which it sometimes does in AI image gens). Falls back to a pure data thumbnail — the "707 combined tool calls" and "6 allowlist rules" stats from the real scan.

```
Minimalist data-focused thumbnail.
Near-black background (#0a0a0a), subtle monospace grid.
Centered, very large: "707" in green monospace (#22c55e), huge.
Below it, smaller white monospace: "tool calls"
Below that, centered: "6 rules" in smaller green monospace.
Top-center headline: "ALLOWLIST > CLASSIFIER" in bold white sans-serif.
Bottom-right small monospace: "travisgautier".
No illustrations, no decoration. Flat. Data-forward.
```

**When to use this variant:**
- Platforms where tiny preview sizes are common (TikTok vertical preview, LinkedIn feed)
- A/B against Prompt A/B if the split-screen renders muddy in test shrinks
- Doesn't need the reader to decode the split — the number does all the work

---

## Post-generation checklist

- [ ] Split-screen divider is exactly vertical center — AI tools often shift it; regenerate until correct
- [ ] Blue half has a visible but subtle spinner or "DECIDING..." label — not absent, not dominating
- [ ] Green half has legible JSON code — if the `Bash(npm test *)` entries are illegible, try simpler content (three short words: "npm test", "npx jest", "git fetch")
- [ ] No stock imagery snuck in (robots, brains, glowing orbs, human figures, padlocks, shields)
- [ ] "TWO WAYS" reads instantly at 320x180 (YouTube's small preview size) — test by shrinking
- [ ] "one costs tokens" is legible but subordinate — it's the payoff, not the hook
- [ ] Title text is NOT baked into the image — YouTube overlays titles; leave space
- [ ] Accent colors (blue/green) consistent with slides (blue = auto mode, green = allowlist)
- [ ] Save both a "full split with code" version (for YouTube) and a simpler "707 tool calls" data version (for embeds and small previews)
- [ ] If the alt-variant "AN LLM DECIDES IF `ls` IS SAFE" goes out, confirm backticks render correctly — some image gens replace them with apostrophes
