#!/usr/bin/env python3
"""Render a command's output as a good-looking terminal screenshot for X.

    python3 scripts/social/render_media.py 2026-09-14-a

A floating terminal window on the brand's marble ground: title bar with
the host and directory, a prompt line with the command, the real output
rows with numbers and paths coloured, a resting prompt at the bottom.
1080x1350 so it reads on a phone: mono type never below 38px, at most
10 rows, rows at most 38 characters.

content/social/media/<id>.source.txt:

    source:    provenance path (REDACTION.md)
    cwd:       directory the command runs in (also shown in the title bar)
    command:   shell command whose stdout is the rows
    redaction: what was cropped or excluded, or "none"
    display:   what to show as the typed command when the real one is a
               python one-liner nobody would type (optional)

Every rendered string is gated through scripts/validation/check_post_text.sh
first. A gate failure writes nothing. Palette per docs/design-system.md,
with lighter tints of Oxblood and Verdigris for legibility on the dark
window.
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MEDIA_DIR = REPO_ROOT / "content" / "social" / "media"
GATE = REPO_ROOT / "scripts" / "validation" / "check_post_text.sh"
FONT_DIR = REPO_ROOT / "public" / "fonts"
CINZEL = FONT_DIR / "Cinzel-Black.ttf"
INTER = FONT_DIR / "Inter-SemiBold.ttf"
MONO_CANDIDATES = [
    "/usr/share/fonts/TTF/JetBrainsMonoNerdFontMono-Regular.ttf",
    "/usr/share/fonts/TTF/JetBrainsMonoNerdFontMono-Medium.ttf",
    "/usr/share/fonts/noto/NotoSansMono-Regular.ttf",
]

MARBLE = (247, 244, 236)
BONE = (232, 220, 196)
INK = (28, 24, 20)
SHADOW = (42, 37, 32)
OXBLOOD = (107, 32, 32)
OX_LIGHT = (196, 87, 79)        # oxblood lifted for the dark window
VERD_LIGHT = (127, 179, 160)    # verdigris lifted for the dark window
MUTED = (150, 140, 128)

W = 1080                        # height follows the content
MARGIN = 28
PAD = 40
RADIUS = 18
TITLE_H = 68
MAX_ROWS = 12
MAX_COLS = 38
MAX_BYTES = 5 * 1024 * 1024
HOST = "travis@quivira"


def read_source(sid):
    meta = {}
    for line in (MEDIA_DIR / f"{sid}.source.txt").read_text().splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    for k in ("cwd", "command"):
        if k not in meta:
            sys.exit(f"{sid}.source.txt: missing '{k}:' line")
    return meta


def capture(meta):
    r = subprocess.run(meta["command"], shell=True, cwd=meta["cwd"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"command failed ({r.returncode}):\n{r.stderr}")
    return r.stdout.rstrip("\n")


def gate(text, label):
    r = subprocess.run(["bash", str(GATE)], input=text + "\n",
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"brand gate blocked the {label}:\n{r.stdout}")


def font(path, size):
    from PIL import ImageFont
    return ImageFont.truetype(str(path), size)


def mono(size):
    from PIL import ImageFont
    for p in MONO_CANDIDATES:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def marble_ground(w, h):
    from PIL import Image, ImageFilter
    base = Image.new("RGB", (w, h), MARBLE)
    noise = Image.effect_noise((w // 24, h // 24), 48).resize(
        (w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(10))
    veil = Image.new("RGB", (w, h), BONE)
    base.paste(veil, mask=noise.point(lambda v: int(max(0, v - 118) * 0.55)))
    return base


TOKEN = re.compile(r"(\[x\]|\[ \]|\d[\d,\.:%-]*[a-zA-Z]?|\S*/\S+|\S+\.(?:sh|md|json|yaml|ts|py)\b|\S+|\s+)")


def colour(tok, in_cmd):
    if tok.isspace():
        return MARBLE
    if in_cmd:
        if tok == "|" or tok == "&&":
            return OX_LIGHT
        if tok.startswith("-"):
            return BONE
        if "/" in tok or re.search(r"\.(sh|md|json|yaml|ts|py)$", tok):
            return VERD_LIGHT
        return MARBLE
    if tok == "[x]":
        return VERD_LIGHT
    if tok == "[ ]":
        return MUTED
    if re.match(r"^\d", tok):
        return BONE
    if "/" in tok or re.search(r"\.(sh|md|json|yaml|ts|py)$", tok):
        return VERD_LIGHT
    return MARBLE


def draw_coloured(d, xy, text, f, in_cmd=False):
    x, y = xy
    for tok in TOKEN.findall(text):
        d.text((x, y), tok, font=f, fill=colour(tok, in_cmd))
        x += f.getlength(tok)


def render(sid, meta, rows):
    from PIL import Image, ImageDraw, ImageFilter
    shown = meta.get("display") or meta["command"]
    # the window is the image: type as large as the width allows, canvas
    # height follows the rows
    inner_w = W - 2 * MARGIN - 2 * PAD
    n = len(rows) + 4                      # command line, blank, rows, blank, prompt
    size = 48
    while size > 38 and mono(size).getlength("M" * MAX_COLS) > inner_w:
        size -= 2
    f = mono(size)
    line_h = int(size * 1.55)
    body_h = 2 * PAD + line_h * n + 30     # room for the wordmark line
    win_h = TITLE_H + body_h
    H = 2 * MARGIN + win_h
    img = marble_ground(W, H)
    win_top = MARGIN
    win = [MARGIN, win_top, W - MARGIN, win_top + win_h]

    # soft warm shadow under the window
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [win[0] + 6, win[1] + 22, win[2] + 6, win[3] + 30], RADIUS, fill=(28, 24, 20, 110))
    sh = sh.filter(ImageFilter.GaussianBlur(22))
    img = Image.alpha_composite(img.convert("RGBA"), sh).convert("RGB")
    d = ImageDraw.Draw(img)

    # window body and title bar
    d.rounded_rectangle(win, RADIUS, fill=INK)
    d.rounded_rectangle([win[0], win[1], win[2], win[1] + TITLE_H + RADIUS], RADIUS, fill=SHADOW)
    d.rectangle([win[0], win[1] + TITLE_H - 2, win[2], win[1] + TITLE_H + RADIUS], fill=INK)
    d.rectangle([win[0], win[1] + TITLE_H - 2, win[2], win[1] + TITLE_H], fill=SHADOW)
    cx = win[0] + 30
    for c in (OX_LIGHT, BONE, VERD_LIGHT):
        d.ellipse([cx, win[1] + 24, cx + 20, win[1] + 44], fill=c)
        cx += 34
    rel = str(Path(meta['cwd']).relative_to('/home/travis'))
    title = f"{HOST}: ~" if rel == "." else f"{HOST}: ~/{rel}"
    tf = font(INTER, 24)
    d.text(((win[0] + win[2]) / 2 - tf.getlength(title) / 2, win[1] + 22), title, font=tf, fill=BONE)

    # command line, output, resting prompt
    x = win[0] + PAD
    y = win[1] + TITLE_H + PAD
    prompt = "❯ "
    d.text((x, y), prompt, font=f, fill=OX_LIGHT)
    draw_coloured(d, (x + f.getlength(prompt), y), shown, f, in_cmd=True)
    y += line_h * 2
    for row in rows:
        draw_coloured(d, (x, y), row, f)
        y += line_h
    y += line_h
    d.text((x, y), prompt, font=f, fill=OX_LIGHT)
    d.rectangle([x + f.getlength(prompt), y + 4, x + f.getlength(prompt) + size * 0.6, y + size + 2], fill=BONE)

    # wordmark inside the window, bottom right, quiet
    wm = font(CINZEL, 22)
    label = "TRAVIS GAUTIER"
    lw = sum(wm.getlength(ch) + 3 for ch in label)
    lx = win[2] - PAD - lw
    for ch in label:
        d.text((lx, win[3] - PAD - 6), ch, font=wm, fill=MUTED)
        lx += wm.getlength(ch) + 3

    out = MEDIA_DIR / f"{sid}.png"
    img.save(out, optimize=True)
    size_b = out.stat().st_size
    if size_b > MAX_BYTES:
        out.unlink()
        sys.exit(f"{out.name} over the 5 MB cap")
    return out, size_b, size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("id")
    a = ap.parse_args()
    meta = read_source(a.id)
    text = capture(meta)
    rows = [r.expandtabs(4).rstrip() for r in text.splitlines()]
    if len(rows) > MAX_ROWS:
        sys.exit(f"{len(rows)} rows; the window holds {MAX_ROWS}. Trim the command.")
    long = [r for r in rows if len(r) > MAX_COLS]
    if long:
        sys.exit(f"row over {MAX_COLS} chars: {long[0]!r}. Trim the command.")
    shown = meta.get("display") or meta["command"]
    if len(shown) > MAX_COLS - 2:
        sys.exit(f"shown command is {len(shown)} chars; add a display: line under {MAX_COLS - 2}.")
    gate(text, "rows")
    gate(shown, "command line")
    (MEDIA_DIR / f"{a.id}.txt").write_text(text + "\n")
    out, size_b, px = render(a.id, meta, rows)
    print(f"{out.relative_to(REPO_ROOT)}  {size_b} bytes  mono {px}px  {len(rows)} rows")


if __name__ == "__main__":
    main()
