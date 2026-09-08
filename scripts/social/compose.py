#!/usr/bin/env python3
"""Set a figure and one line over a generated image for an X card.

    python3 scripts/social/compose.py IN.jpg OUT.png --figure "20 hours" \
        --line "from shipped to reverted" --pos top|bottom --ink light|dark [--scrim]

Faces and palette per docs/design-system.md. The wordmark sits in the
opposite corner. --scrim lays a translucent brand-color wash under the type
(the one gradient-shaped thing the design system allows, for legibility).
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
CINZEL = ROOT / "public/fonts/Cinzel-Black.ttf"
INTER = ROOT / "public/fonts/Inter-SemiBold.ttf"
MARBLE = (247, 244, 236); INK = (28, 24, 20); OXBLOOD = (107, 32, 32); BONE = (232, 220, 196)
W, H = 1080, 1440
M = 64


def tracked(d, xy, text, f, fill, t):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill); x += f.getlength(ch) + t


def fit(text, path, start, floor, max_w):
    s = start; f = ImageFont.truetype(str(path), s)
    while f.getlength(text) > max_w and s > floor:
        s -= 6; f = ImageFont.truetype(str(path), s)
    return f, s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--figure", required=True); ap.add_argument("--line", required=True)
    ap.add_argument("--pos", default="bottom"); ap.add_argument("--ink", default="light")
    ap.add_argument("--scrim", action="store_true"); ap.add_argument("--accent", default="figure")
    a = ap.parse_args()
    img = Image.open(a.src).convert("RGB")
    # cover-crop to 1080x1440
    r = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    l = (img.width - W) // 2; t = (img.height - H) // 2
    img = img.crop((l, t, l + W, t + H))

    fig_fill = MARBLE if a.ink == "light" else OXBLOOD
    line_fill = BONE if a.ink == "light" else INK
    wm_fill = BONE if a.ink == "light" else OXBLOOD
    fig_f, fs = fit(a.figure.upper(), CINZEL, 190, 90, W - 2 * M)
    line_f, ls = fit(a.line, INTER, 48, 30, W - 2 * M)
    block_h = fs + 18 + ls
    y0 = M + 24 if a.pos == "top" else H - M - 90 - block_h

    if a.scrim:
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        base = (28, 24, 20) if a.ink == "light" else (247, 244, 236)
        y_a, y_b = (0, y0 + block_h + 120) if a.pos == "top" else (y0 - 140, H)
        for i, yy in enumerate(range(y_a, y_b)):
            k = (yy - y_a) / max(1, y_b - y_a)
            alpha = int(200 * (1 - k)) if a.pos == "top" else int(200 * k)
            od.line([(0, yy), (W, yy)], fill=base + (min(200, alpha),))
        img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")

    d = ImageDraw.Draw(img)
    d.text((M - 4, y0), a.figure.upper(), font=fig_f, fill=fig_fill)
    d.text((M, y0 + fs + 18), a.line, font=line_f, fill=line_fill)
    wm = ImageFont.truetype(str(CINZEL), 26)
    wy = H - M - 30 if a.pos == "top" else M + 10
    tracked(d, (M, wy), "TRAVIS GAUTIER", wm, wm_fill, 3)
    img.save(a.out, optimize=True)
    print(a.out, Path(a.out).stat().st_size, "bytes", f"{W}x{H}")


if __name__ == "__main__":
    main()
