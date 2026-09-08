#!/usr/bin/env python3
"""Generate an image with Grok Imagine (xAI) for a media candidate.

    XAI_API_KEY=... python3 scripts/social/imagine.py "prompt" out.jpg [--ratio 4:5]

Model grok-imagine-image-quality (the one the sibling operation's 2026-09
candidates used). Writes the image only; the prompt is recorded beside it
as <out>.prompt.txt so the candidate has provenance. The key is read from
the environment and never written anywhere.
"""
import argparse, base64, json, os, sys, urllib.request

API = "https://api.x.ai/v1/images/generations"
MODEL = "grok-imagine-image-quality"


def call(payload, key):
    req = urllib.request.Request(API, data=json.dumps(payload).encode(),
                                 headers={"Authorization": f"Bearer {key}",
                                          "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("prompt"); ap.add_argument("out")
    ap.add_argument("--ratio", default="4:5")
    a = ap.parse_args()
    key = os.environ.get("XAI_API_KEY")
    if not key:
        sys.exit("XAI_API_KEY not set")
    payload = {"model": MODEL, "prompt": a.prompt, "n": 1,
               "response_format": "b64_json", "aspect_ratio": a.ratio}
    try:
        data = call(payload, key)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        if e.code == 400 and "aspect_ratio" in body:
            payload.pop("aspect_ratio"); data = call(payload, key)
        else:
            sys.exit(f"HTTP {e.code}: {body[:300]}")
    item = data["data"][0]
    if "b64_json" in item:
        raw = base64.b64decode(item["b64_json"])
    else:
        raw = urllib.request.urlopen(item["url"], timeout=120).read()
    open(a.out, "wb").write(raw)
    open(a.out + ".prompt.txt", "w").write(a.prompt + "\n")
    print(f"{a.out}  {len(raw)} bytes")


if __name__ == "__main__":
    main()
