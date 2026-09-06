# Thumbnail Prompt — Token Autopsy Video

Use ONE of the three prompts below depending on which image tool you're using. All target the same visual: a dark, forensic-looking thumbnail with a single giant data point and no decorative fluff.

---

## Visual intent (reference for any tool)

- **Single dominant element:** a pie chart or horizontal bar chart with a tiny red/orange sliver labeled "1.0%"
- **Background:** near-black (#0a0a0a or #111), subtle monospace-grid texture or fine noise
- **Typography:** monospace, high contrast, one large number ("1.0%") in accent color (red #ef4444 or orange #f97316)
- **Secondary text:** "THIS IS WHAT TOKEN PLUGINS COMPRESS" — small, all-caps, upper-left or lower-right
- **No faces, no stock robots, no brain imagery, no sparkles, no gradients, no "AI vibes" clichés**
- **Feel:** NYT data-journalism visual, not Medium hero image
- **YouTube safe zone:** keep the 1.0% element centered; leave bottom-right clear for YouTube's duration overlay

---

## Prompt A — Midjourney v6+ / v7

```
Minimalist data-journalism thumbnail for a technical YouTube video.
Near-black background (#0a0a0a), subtle fine monospace grid texture.
Centered horizontal bar chart with four stacked bars: three large gray-on-dark bars (showing ~38%, ~33%, ~28% widths), and one tiny bright red-orange sliver (1%) at the bottom, dramatically smaller than the others.
The 1% sliver is glowing red-orange (#ef4444), clearly annotated with the label "1.0%" in a white monospace font.
Upper-left corner: all-caps small white monospace text reading "THIS IS WHAT TOKEN PLUGINS COMPRESS"
High contrast, flat design, no 3D effects, no gradients, no decorative elements, no human figures, no robots, no AI cliché imagery.
Negative prompt: glow effects, neon, cyberpunk, lens flare, human faces, hands, stock photography.
Aspect ratio: 16:9. --ar 16:9 --style raw --stylize 50
```

## Prompt B — DALL·E 3 / ChatGPT image gen

```
Create a YouTube thumbnail (16:9, 1280x720) for a technical data-analysis video.

Design requirements:
- Near-black background (#0a0a0a), with a very subtle monospace dot-grid pattern
- Horizontal bar chart, centered and large, with four rows:
  - Row 1: medium-gray bar at ~38% width, tiny label "tool_use_input  38.4%"
  - Row 2: medium-gray bar at ~33% width, tiny label "tool_result  32.8%"
  - Row 3: medium-gray bar at ~28% width, tiny label "user_prompt  27.8%"
  - Row 4: BRIGHT RED-ORANGE (#ef4444) tiny sliver at 1% width, bold label "assistant_text  1.0%"
- The 1% bar should look comically small next to the other three — this is the point
- Upper-left corner: all-caps small white text, monospace, reading "THIS IS WHAT TOKEN PLUGINS COMPRESS"
- Lower-right corner: small text "travisgautier" in the same monospace font
- All typography in a monospace font (IBM Plex Mono, Fira Code, or similar)
- No illustrations, no humans, no robots, no AI-cliché imagery, no gradients, no glow
- Flat, data-journalism aesthetic — NYT / FT / Bloomberg styled
```

## Prompt C — Gamma's "Generate Cover" (if using Gamma for everything)

```
Dark-themed data-journalism cover image.
Horizontal bar chart showing four values: 38.4%, 32.8%, 27.8%, and a dramatically tiny 1.0% highlighted in red-orange.
Monospace font throughout. Background near-black. No decorative illustrations.
Top-left label: "THIS IS WHAT TOKEN PLUGINS COMPRESS".
```

---

## Post-generation checklist

- [ ] The 1.0% bar is visibly smaller than the others (most tools will cheat and make it larger than reality — regenerate until it looks wrong-small)
- [ ] No stock imagery snuck in (robots, brains, glowing orbs, human figures)
- [ ] Text is legible at 320×180 (YouTube's small preview size) — test by shrinking
- [ ] Accent color is consistent across thumbnail, slides (slide 2, 6, 12), and end card
- [ ] Title text is NOT baked into the image — YouTube overlays titles; leave space
- [ ] Save both a "with headline text" version (for click-through testing) and a "data-only" version (for embeds and LinkedIn)
