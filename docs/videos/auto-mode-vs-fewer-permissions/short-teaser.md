# Short-Form Teaser — Auto Mode vs the Allowlist Skill

Target: 45-60s. Formats: YouTube Shorts, Reels, TikTok, X video.
Two variants below. Pick one based on platform tone and what footage you actually captured.

---

## Variant A — The Token-Tax Hook (recommended for X / tech audience)

**Length target:** 50s

### Visual cold open (0:00-0:05)

[ON SCREEN: rapid-fire montage of five Claude Code permission prompts — `Allow Bash(ls)?`, `Allow Bash(git status)?`, `Allow Bash(npm test)?`, each one accepting in a flash. Cut.]

### Voiceover (0:05-0:15)

Claude 4.7 shipped a new feature called auto mode. It's an LLM classifier that decides whether each command Claude wants to run is safe.

Every time Claude tries to run `ls`, a classifier fires to decide if it's allowed.

### Beat (0:15-0:20)

You are paying tokens for a model to decide if `ls` is safe.

### Visual pivot (0:20-0:30)

[ON SCREEN: the `/fewer-permission-prompts` skill output — six patterns, counts visible]

### Voiceover (0:20-0:45)

Same release. Different skill. `/fewer-permission-prompts`. Scans your last fifty sessions, finds the commands you actually run, writes them into `settings.json` as a static allowlist. Zero tokens at runtime. Zero latency. Committed to git. Your teammates inherit it.

The classifier is great for unknown commands. For the hot path — the stuff you run every session — use the static list.

### Close (0:45-0:50)

Run them both. Stop paying an LLM to decide if `ls` is safe.

---

## Variant B — The "Two Ways" Hook (recommended for YouTube Shorts / general audience)

**Length target:** 45s

### Visual cold open (0:00-0:05)

[ON SCREEN: terminal, Claude Code session, permission prompt blinking. Viewer POV.]

### Voiceover (0:05-0:15)

Claude Code asks permission every time it wants to run a command. If you've been using it for a while, you click yes a hundred times a day.

Claude 4.7 shipped two ways to stop asking.

### Visual split (0:15-0:35)

[ON SCREEN: split-screen. Left: auto-mode opt-in dialog. Right: a clean `settings.json` allowlist block.]

### Voiceover (0:15-0:40)

On the left: auto mode. An AI classifier decides per command. One toggle, zero rules to write, token cost every call.

On the right: `/fewer-permission-prompts`. Scans your transcripts, writes a static allowlist. Zero tokens, zero latency, lives in your repo.

Auto mode for unknown commands. Allowlist for the ones you run all day.

### Close (0:40-0:45)

Running both is the answer. Full video linked.

---

## Capture notes

- The "prompt fatigue" cold open — record this real. Ten prompts in ninety seconds. Speed to 3x in post.
- The six-pattern table from the real scan — that's the single most convincing visual. Both variants should use it.
- Keep captions big and burned-in. Most shorts viewers watch muted.
- No face-cam. Terminal + settings file + captions is enough.
- End card: "Full comparison on travisgautier" or channel handle depending on platform.

## Tone notes

- A is spicier — the "paying tokens to decide if ls is safe" line is the hook. Use it on X where tech-cynical framing lands.
- B is more neutral — "two ways, here's the tradeoff" plays better on general Shorts/TikTok where the audience may not know what auto mode is.
- Don't shit on auto mode in either variant. The long-form video earns the hybrid take; the short has 50 seconds so it has to pick a side but stays fair.
- Profanity: skip for shorts. Different audience, different algorithm signals.
