# Short-form Teaser — 45-60 seconds

For YouTube Shorts, Reels, TikTok, X video posts. Vertical 9:16 or square 1:1. Single hook, one stat, one link-out to the full video.

---

## Version A — Pure data hook (45s, recommended)

**[0:00–0:04] COLD HOOK (on-screen text + voiceover)**

> "I almost installed a Claude Code plugin that compresses assistant responses to save tokens."

[ON SCREEN: the caveman-style plugin's README header, briefly]

**[0:04–0:12] THE TWIST**

> "Then I measured my actual conversation. 850 turns. 152,000 tokens."

[ON SCREEN: terminal showing `wc -l session.jsonl` → `850`]

**[0:12–0:25] THE REVEAL**

> "Here's what it compresses."

[ON SCREEN: bar chart — the 1.0% sliver highlighted in red, dwarfed by the other bars]

> "One percent. Of the entire conversation."

**[0:25–0:38] WHERE THE FAT ACTUALLY LIVES**

> "The real weight is tool results, skill body injections, code being written. That's 99% of your bill. Compressing assistant prose saves you three-quarters of one percent."

[ON SCREEN: the breakdown table, with the 1.0% row glowing red]

**[0:38–0:50] THE PIVOT**

> "The lever that actually works? Stop reading files you don't need. Grep before Read. Limit output ranges. Delegate scans to sub-agents. Fifteen to twenty-five percent savings. Zero quality loss."

[ON SCREEN: before/after code comparison — `Read large-file.ts` vs `Grep → Read offset=420 limit=30`]

**[0:50–0:60] CTA**

> "Full autopsy on my channel — link in bio. Tell me what YOUR session distribution looks like."

[END CARD: "travisgautier" handle, video thumbnail preview]

---

## Version B — Contrarian framing (50s, alternative)

**[0:00–0:05]**

> "Everyone is wrong about Claude Code token costs."

**[0:05–0:15]**

> "The advice you've seen — tell the model to be brief, install compression plugins, prune responses — only touches one percent of your conversation."

[ON SCREEN: terminal pulling apart a real JSONL session]

**[0:15–0:35]**

> "The actual distribution of a 152K-token pipeline run: tool calls, 38 percent. Tool results, 33 percent. Skill body re-injections, 28 percent. Assistant prose? One percent."

[ON SCREEN: bar chart reveals progressively, 1.0% sliver last and highlighted]

**[0:35–0:50]**

> "Optimize for the 99. Grep before Read. Limit your ranges. Stop reading files you don't need. Fifteen to twenty-five percent savings, measurable, reproducible."

**[0:50–0:60]**

> "Full breakdown on the channel. Script's in the description. Go measure yours."

[END CARD]

---

## Production notes

- **Vertical framing (9:16):** the bar chart MUST show all four bars stacked with the 1.0% one clearly at the bottom — don't let the chart get cropped
- **Text overlays > voice-only:** platforms auto-mute; every key stat needs to appear as on-screen text
- **Pacing:** quick cuts, 2–3 seconds per visual. No lingering on full-screen prose
- **Music:** low, sparse, no build-up beats — keep it forensic. Think Jon Bois "Chart Party" calm, not MrBeast energy
- **Do not clickbait the 1.0% stat.** No "YOU WON'T BELIEVE," no "the truth about Claude Code." Let the data do the work
- **Export two aspect ratios:** 9:16 for Shorts/Reels/TikTok, 1:1 for X/LinkedIn

## Caption/description boilerplate

```
Full 9-min breakdown on the channel.
Script + Python analysis tool linked below.

Measure before you optimize.
Ground truth lives in ~/.claude/projects/

#ClaudeCode #AIEngineering #TokenOptimization
```
