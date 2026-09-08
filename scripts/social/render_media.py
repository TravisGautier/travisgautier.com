#!/usr/bin/env python3
"""Render a command's output to a PNG receipt for an X queue `a` slot.

    python3 scripts/social/render_media.py 2026-09-14-a [--font-size 30]

Reads content/social/media/<id>.source.txt (lines: source:, cwd:,
command:, redaction:, optional display:), runs the command in that cwd, gates the captured
text through scripts/validation/check_post_text.sh (retired name, money,
em dash, unregistered numbers), then draws it in a monospace terminal look
and writes content/social/media/<id>.png (must stay under 5 MB, the X image
cap enforced by x_poster.py). The captured text is kept beside the PNG as
<id>.txt so the receipt can be re-gated at any time. A gate failure writes
nothing.
"""
import argparse
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MEDIA_DIR = REPO_ROOT / "content" / "social" / "media"
GATE = REPO_ROOT / "scripts" / "validation" / "check_post_text.sh"
FONTS = [
    "/usr/share/fonts/TTF/JetBrainsMonoNerdFontMono-Regular.ttf",
    "/usr/share/fonts/TTF/JetBrainsMonoNerdFontMono-Medium.ttf",
    "/usr/share/fonts/TTF/JetBrainsMonoNerdFontMono-Bold.ttf",
    "/usr/share/fonts/noto/NotoSansMono-Regular.ttf",
]
WIDTH = 1600
PAD = 56
BG = (28, 24, 20)
FG = (247, 244, 236)
DIM = (232, 220, 196)
MAX_BYTES = 5 * 1024 * 1024


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


def gate(text):
    r = subprocess.run(["bash", str(GATE)], input=text + "\n",
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"brand gate blocked the captured text:\n{r.stdout}")


def load_font(size):
    from PIL import ImageFont
    for path in FONTS:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def wrap_lines(lines, font):
    # monospace: wrap at the drawable width so nothing runs off the edge
    import textwrap
    cols = max(20, int((WIDTH - PAD * 2) / font.getlength("M")))
    out = []
    for line in lines:
        line = line.expandtabs(8)
        if len(line) <= cols:
            out.append(line)
        else:
            out.extend(textwrap.wrap(line, cols, subsequent_indent="    ",
                                     break_long_words=True,
                                     break_on_hyphens=False) or [""])
    return out


def render(sid, header, text, font_size):
    from PIL import Image, ImageDraw
    font = load_font(font_size)
    lines = wrap_lines([header, ""] + text.splitlines(), font)
    line_h = int(font_size * 1.4)
    height = PAD * 2 + line_h * len(lines)
    img = Image.new("RGB", (WIDTH, height), BG)
    draw = ImageDraw.Draw(img)
    y = PAD
    for i, line in enumerate(lines):
        draw.text((PAD, y), line, font=font, fill=DIM if i == 0 else FG)
        y += line_h
    out = MEDIA_DIR / f"{sid}.png"
    img.save(out, optimize=True)
    size = out.stat().st_size
    if size > MAX_BYTES:
        out.unlink()
        sys.exit(f"{out.name} is {size} bytes, over the 5 MB cap")
    return out, size, height


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("id")
    ap.add_argument("--font-size", type=int, default=30)
    args = ap.parse_args()
    meta = read_source(args.id)
    text = capture(meta)
    gate(text)
    (MEDIA_DIR / f"{args.id}.txt").write_text(text + "\n")
    # display: overrides the echoed command when the real one would show a
    # redaction pattern (a cropped host name, a retired token) in the image
    shown = meta.get("display") or meta["command"]
    header = f"$ {shown}" if len(shown) < 150 else f"$ {shown[:147]}..."
    out, size, height = render(args.id, header, text, args.font_size)
    print(f"{out.relative_to(REPO_ROOT)}  {size} bytes  {WIDTH}x{height}  "
          f"{len(text.splitlines())} lines")


if __name__ == "__main__":
    main()
