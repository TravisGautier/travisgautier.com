# Fabled10X — Production Workflow & Technical Setup

**Document Version:** 1.0
**Created:** March 2026
**Purpose:** Video production pipeline, editing workflow, livestream technical setup, and time management

---

## VIDEO PRODUCTION PIPELINE

### Recording Principles
- **Record with the edit in mind.** Pause briefly between sections. Say verbal markers ("okay, new section — now covering database schema"). Clap or snap before key segments.
- **If you lose your train of thought, stop and restart the sentence cleanly.** This saves more editing time than any tool.
- **Maintain consistent screen recording setup:** Same layout, resolution, font sizes in IDE every session. Zoom levels, crop positions, and callout placements stay consistent video to video.

---

## EDITING WORKFLOW (PREMIERE PRO)

### Time Estimates by Content Type

#### Flagship Series Episodes (15-25 min final)
- Raw footage: 45-90 minutes recorded → 20 min final
- **Starting out:** 6-10 hours per episode
- **Practiced (after 10-15 episodes):** 4-7 hours per episode

Breakdown:
| Task | Starting Out | Practiced |
|------|-------------|-----------|
| Review/log raw footage | 1-2 hrs | 0.5-1 hr |
| Assembly cut | 1-2 hrs | 0.5-1 hr |
| Fine cut (pacing, trimming) | 2-3 hrs | 1.5-2.5 hrs |
| Graphics & callouts | 1-2 hrs | 0.5-1 hr |
| Audio (leveling, noise, music) | 0.5-1 hr | 0.5 hr |
| Thumbnail & export | 0.5 hr | 0.5 hr |

#### Playbook / Standalone Episodes (10-15 min final)
- **Starting out:** 3-5 hours
- **Practiced:** 2-4 hours
- Simpler structure, fewer source types, less footage to review

#### Shorts (30-90 seconds)
- **From existing footage:** 20-45 minutes per Short
- **From scratch:** 45-90 minutes per Short
- Batch after finishing a long-form edit (already in the project file, know the material)

#### Livestream VODs (Post-Processing)
- **Light pass:** 30-60 minutes (trim setup dead air, add chapter markers)
- **Can skip entirely** — many successful streamers archive raw VODs

### Weekly Editing Time Budget
| Task | Starting Out | Practiced |
|------|-------------|-----------|
| 1 Flagship episode | 6-10 hrs | 4-7 hrs |
| 1 Standalone (biweekly avg) | 1.5-2.5 hrs | 1-2 hrs |
| 3-4 Shorts | 1.5-4 hrs | 1-2.5 hrs |
| Livestream cleanup | 0.5-1 hr | 0.5-1 hr |
| **Total editing/week** | **9.5-17.5 hrs** | **6.5-12.5 hrs** |

---

## AUTOMATED DEAD AIR REMOVAL

This is the single biggest time saver. Cuts 1-2 hours per video.

### Recommended Tools
- **Timebolt** — Standalone app. Drag in raw footage, detects silence, visual map of speech vs silence, export edited file or XML timeline for Premiere. Processes 1 hour in 2-3 minutes.
- **Auto Pod** (Premiere Pro plugin) — Runs inside Premiere. Analyzes audio, cuts silence based on threshold. 45-minute timeline processed in 30-60 seconds.
- **DaVinci Resolve** — Free built-in silence detection (if switching editors)
- **Premiere Pro auto-transcription** — Built-in, no extra cost. Transcribes audio, select pauses in transcript panel, ripple delete. More manual but functional.

### Two-Pass Workflow (25-35 minutes total vs 1.5-2.5 hours manual)

**Pass 1 (Automated, ~5 minutes):**
Run raw footage through Timebolt or Auto Pod.
- Silence threshold: 0.3-0.5 seconds
- Padding: 50-80ms on each side
- Instantly removes thinking pauses, reading time, gaps between sections

**Pass 2 (Manual QC, 15-30 minutes):**
Scrub auto-cut timeline at 1.5-2x speed. Fix three things:
1. Spots where breath got clipped (sounds unnatural)
2. Deliberate pauses that should stay (before key points)
3. Distinct topics jammed together (need beat of silence or transition)

**Result:** 45-minute raw recording → tight 18-22 minute rough assembly in ~30 minutes.

### For Livestream Highlights
3-hour stream through Timebolt → visual map of speech vs silence → cherry-pick interesting segments → export for Shorts/highlights without watching 3 hours.

---

## PREMIERE PRO EFFICIENCY SETUP

### Build a Template Project
Master project file with pre-built:
- Intro sequence
- Outro sequence
- Lower third graphics
- Callout/annotation graphics
- Text styles (title, subtitle, callout, code)
- Color grade preset
- Audio track layout (voice, music, SFX)
- Timeline structure markers

Every new video starts as a copy of this template. Saves 1-2 hours per video.

### Key Shortcuts to Master
- Ripple delete (removes clip AND gap)
- Razor tool (quick cuts)
- J-K-L playback (variable speed scrubbing)
- Mark In/Out for subclips
- Nest sequences (for reusable segments)

### Auto-Transcription for Jump Cuts
Premiere's built-in speech-to-text generates captions and editable transcript. Visually spot filler words, repeated phrases, dead space in text. Select, delete — faster than scrubbing audio.

### Batch Shorts After Main Edit
After completing flagship episode edit, immediately pull 3-4 Short clips from same project file. Already know the material, already in the timeline. One focused hour = week's worth of Shorts.

---

## OUTSOURCING TIMELINE

### Edit Yourself: First 20-30 Videos
- Develops editing voice (pacing, graphics style, energy)
- Teaches full production pipeline
- Necessary to give clear direction when delegating

### Transition Point: Month 4-6
Once you have:
- Clear style guide
- Template project
- 10+ example episodes as reference
- Channel generating revenue

### Editor Cost
- Skilled freelance video editor (tech/tutorial content): $30-$60/hour or $150-$400/finished video
- At $200-$350 per outsourced episode, saving 5-8 hours
- Math works when your time is worth >$40-$70/hour (consulting revenue makes this obvious)

### Hybrid Approach (Recommended Transition)
You do: Assembly cut, pacing decisions, story structure (2-3 hours)
Editor does: Graphics, callouts, audio mixing, color, intro/outro, export (2-3 hours)
Cuts your editing time ~50% while keeping creative fingerprint on every video.

---

## NIGHT BUILD LIVESTREAM — TECHNICAL SETUP

### Platform: Hyprland + OBS Studio on Linux

#### Required Packages
```bash
# Core screen capture stack
sudo pacman -S pipewire wireplumber xdg-desktop-portal-hyprland obs-studio

# Optional fallback plugin (AUR)
yay -S wlrobs
```

#### Hyprland Configuration
In `~/.config/hypr/hyprland.conf`:
```conf
# Required for PipeWire screen capture
exec-once = dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP
exec-once = systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP
```

#### Verify Services Running
```bash
systemctl --user status pipewire        # Must be active
systemctl --user status wireplumber      # Must be active
systemctl --user status xdg-desktop-portal-hyprland  # Must be active
```

#### Common Gotchas
1. **Bitdepth conflict:** If monitor config has `bitdepth, 10`, screen capture may show black. Remove `bitdepth, 10` from monitor config and test.
2. **Portal conflicts:** If previously used GNOME/KDE, check `~/.config/xdg-desktop-portal/portals.conf` — may point to wrong portal. Delete or update.
3. **OBS running XWayland:** Must have `QT_QPA_PLATFORM=wayland` in environment. Launch with: `QT_QPA_PLATFORM=wayland obs`

### Multi-Monitor OBS Setup

Add separate "Screen Capture (PipeWire)" source per monitor:
1. Add Source → "Screen Capture (PipeWire)" → select Monitor 1 (coding screen)
2. Add Source → "Screen Capture (PipeWire)" → select Monitor 2 (reference/docs)
3. Arrange on OBS canvas: main + inset, side-by-side, or picture-in-picture

#### Alternative: wlrobs Plugin
If PipeWire capture fails, wlrobs provides "Wayland output (dmabuf)" source:
1. Select "Wayland output (dmabuf)" as source
2. Disable main window preview
3. Right-click preview area → select monitor under "Fullscreen Projector"
4. One dmabuf source per monitor

### OBS Scene Layout for Night Builds

**Scene 1: "Full Code" (75% of stream time)**
- Main coding monitor fills canvas
- Small Fabled10X branded overlay (stream title, now-playing widget)
- Optional small facecam corner

**Scene 2: "Split View"**
- Both monitors visible (coding + reference)
- Used when referencing docs, client feedback, project files

**Scene 3: "Zoom In"**
- Cropped into specific window for detail
- Code blocks, specific UI elements, error messages

**Scene 4: "Break"**
- Holding screen with Fabled10X branding
- Lo-fi music continues
- "Be right back" message

**Scene transitions:** Bind to hotkeys for smooth switching without mouse.

### Stream Aesthetic
- **Visual:** Dark mode everything. Clean minimal overlay. Subtle branding.
- **Audio:** Lo-fi/ambient music (not overpowering). Calm conversational commentary. Thinking-out-loud style.
- **Pace:** Slow and real. Not performative. The lack of manufactured energy is the point.
- **Schedule:** 1-2 nights/week, 9-10 PM start, 3-4 hour sessions

### Stream Audio Setup
- Voice on separate audio track from music
- Gate/noise reduction on mic input
- Lo-fi music at -20dB to -25dB (audible but not competing)
- OBS audio mixer: voice track + music track + optional alert sounds

---

## CONTENT PRODUCTION CALENDAR (WEEKLY)

### Example Week
| Day | Activity | Time |
|-----|----------|------|
| Monday | Script/outline next flagship episode | 1-2 hrs |
| Tuesday | Record flagship episode + Night Build stream | 2-3 hrs record + 3-4 hrs stream |
| Wednesday | Edit flagship (assembly + fine cut) | 3-5 hrs |
| Thursday | Finish flagship edit + Night Build stream | 2-3 hrs edit + 3-4 hrs stream |
| Friday | Batch Shorts from week's content | 1-2 hrs |
| Saturday | Record/edit Playbook episode (biweekly) | 3-5 hrs |
| Sunday | Schedule uploads, write descriptions, community engagement | 1-2 hrs |

### Total Weekly Time Investment
| Activity | Hours/Week |
|----------|-----------|
| Planning/scripting | 2-3 |
| Recording | 3-5 |
| Editing | 6.5-12.5 |
| Livestreaming | 6-8 |
| Admin/community | 2-3 |
| **Total** | **19.5-31.5** |

This is essentially a full-time commitment. Plan accordingly.
