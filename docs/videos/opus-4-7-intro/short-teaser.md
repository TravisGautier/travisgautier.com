# Short-form Teaser — 45-60 seconds

For YouTube Shorts, Reels, TikTok, X video posts. Vertical 9:16 or square 1:1. Single hook, one stat, one link-out to the full video.

---

## Version A — Hope-frame (60s, recommended)

**[0:00-0:06] SIX WEEKS OF PAIN (cold, fast cuts)**

> "The last six weeks paying for Claude have been absolute dogshit."

[ON SCREEN: rapid montage — rate-limit bar screenshots, GitHub issue headlines, red benchmark lines]

**[0:06-0:12] THE SETUP**

> "Rate limits burning out in ninety minutes. An AMD senior director filed a GitHub issue with six thousand eight hundred sessions showing Opus 4.6's thinking collapsed seventy-three percent."

[ON SCREEN: headline "6,852 sessions, 73% thinking collapse" animated]

**[0:12-0:18] THE PIVOT**

> "Then today. A few hours ago. Opus 4.7."

[ON SCREEN: Anthropic announcement card, brief beat]

**[0:18-0:28] THE NUMBERS**

> "SWE-bench Pro jumped from 53 to 64. Vision went from 54 to 98 percent. And in my own repo tonight, the same CRUD section that got 58 tests on 4.6 this morning got 94 on 4.7."

[ON SCREEN: three-bar chart with Opus 4.7 in green; then test-count comparison 58 → 94]

**[0:28-0:40] THE CAVEAT**

> "One thing to watch. New tokenizer. Same price per token, but same prompt can now cost you thirty-five percent more tokens. Same sticker, higher bill. Measure your shit first."

[ON SCREEN: side-by-side token count — same input, 4.6 vs 4.7]

**[0:40-0:50] MYTHOS GUT-PUNCH**

> "And Anthropic shipped this while saying it's still not their best model. That one's locked behind safety review. Opus 4.7 is the best they'll sell you. Not the best they have."

[ON SCREEN: Mythos headline clip]

**[0:50-0:60] CTA**

> "Full breakdown on the channel. First reason for hope in weeks."

[END CARD: "travisgautier" handle, video thumbnail preview]

---

## Version B — Skeptical cut / tokenizer-first (50s, alternative)

For audiences who've been burned and want the caveat up front before the wins.

**[0:00-0:06]**

> "Every headline about Opus 4.7 says same price. Technically true. Practically misleading."

[ON SCREEN: headline screenshots saying "same price"]

**[0:06-0:20]**

> "New tokenizer. Same five bucks in, twenty-five out. But the same text can produce up to thirty-five percent more tokens. Run the same prompt through both. More tokens, same rate, higher bill."

[ON SCREEN: tokenizer comparison with token counts visible]

**[0:20-0:32]**

> "That said, the benchmarks are real. Sixty-four on SWE-bench Pro, retaking number one from GPT-5.4. Vision accuracy nearly doubled. Twelve-point jump on CursorBench. On my own code tonight, test coverage per section damn near tripled."

[ON SCREEN: benchmark table, key numbers highlighted; then test-count delta]

**[0:32-0:44]**

> "If you're on Claude Code, switch. Strictly better at coding for the same subscription. If you're on the API at scale, measure the tokenizer on your actual payloads before you migrate. The upgrade might cost more than you think."

**[0:44-0:50]**

> "Full honest breakdown on the channel."

[END CARD]

---

## Production notes

- **Vertical framing (9:16):** the benchmark bars and tokenizer comparison must fit without cropping. Design for mobile.
- **Text overlays > voice-only:** platforms auto-mute. Every key stat needs to appear as on-screen text.
- **Pacing:** quick cuts, 2-3 seconds per visual. No lingering on full-screen prose.
- **Music:** low, sparse, no build-up beats. Not hype.
- **Profanity handling:** "dogshit" and "shit" on Version A will limit platform monetization on Shorts/Reels. Options: (a) accept the demonetization for authenticity, (b) use Version B for monetized cuts, (c) bleep/cut the profanity from Version A for TikTok if needed.
- **Export three aspect ratios:** 9:16 for Shorts/Reels/TikTok, 1:1 for X/LinkedIn, 4:5 for Instagram feed.

## Caption/description boilerplate

```
Full 7-min breakdown on the channel.
Six weeks of pain. First reason for hope.

Opus 4.7 dropped today. Here's what actually changed.

#ClaudeCode #Opus47 #AIEngineering #Benchmarks
```
