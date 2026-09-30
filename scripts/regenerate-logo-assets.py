#!/usr/bin/env python3
"""Regenerate every ChapterPrep brand asset from the master mark.

Source of truth: scripts/logo-mark.svg. Rasterize it to public/logo-mark.png
first, then run this script:
  node -e "require('sharp')('scripts/logo-mark.svg',{density:600}).resize(512,512).png().toFile('public/logo-mark.png')"
  python3 scripts/regenerate-logo-assets.py

This produces all favicons, PWA icons, apple-touch-icon, and the og-image so they
never drift. It does NOT delete the source.
"""
from PIL import Image, ImageDraw, ImageFont
import os

os.chdir(os.path.join(os.path.dirname(__file__), ".."))
SRC = "public/logo-mark.png"
PAPER = (245, 241, 232, 255)  # --bg on the paper theme

master = Image.open(SRC).convert("RGBA")
logo = master.crop(master.getbbox())  # trim any transparent margin


def square(size, pad_ratio, bg=None):
    canvas = Image.new("RGBA", (size, size), bg if bg else (0, 0, 0, 0))
    inner = int(size * (1 - 2 * pad_ratio))
    lw, lh = logo.size
    scale = min(inner / lw, inner / lh)
    nw, nh = max(1, int(lw * scale)), max(1, int(lh * scale))
    rim = logo.resize((nw, nh), Image.LANCZOS)
    canvas.paste(rim, ((size - nw) // 2, (size - nh) // 2), rim)
    return canvas


# Keep the in-app transparent mark normalized (re-trim + pad to a clean square)
square(512, 0.04).save("public/logo-mark.png")

# Favicons on paper, so the red mark reads on any browser chrome
square(32, 0.06, PAPER).convert("RGB").save("public/favicon-16x16.png")
square(32, 0.06, PAPER).convert("RGB").save("public/favicon-32x32.png")
# IMPORTANT: the favicon that browsers actually serve at /favicon.ico is the
# Next.js App Router file convention app/favicon.ico - it shadows public/. Write
# THERE (a public/favicon.ico would be ignored and just cause confusion).
# Keep it RGBA (no .convert("RGB")): Next/Turbopack's .ico decoder rejects a
# non-RGBA embedded PNG with "The PNG is not in RGBA format!" and fails the build.
square(64, 0.06, PAPER).save("app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

# iOS + PWA maskable (opaque + safe-zone padding)
square(180, 0.14, PAPER).convert("RGB").save("public/apple-touch-icon.png")
square(192, 0.18, PAPER).convert("RGB").save("public/icon-192.png")
square(512, 0.18, PAPER).convert("RGB").save("public/icon-512.png")

# OG card: 1200x630 paper, red-pen rule, mark + serif wordmark in ink + tagline
W, H = 1200, 630
og = Image.new("RGB", (W, H), (245, 241, 232))
d = ImageDraw.Draw(og)
d.rectangle([0, 0, W, 6], fill=(184, 54, 42))
lg = square(300, 0.02)
og.paste(lg, (150, (H - 300) // 2), lg)
try:
    f_bold = ImageFont.truetype("/System/Library/Fonts/Supplemental/Georgia Bold.ttf", 92)
    f_ital = ImageFont.truetype("/System/Library/Fonts/Supplemental/Georgia Italic.ttf", 92)
    f_tag = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
except Exception:
    f_bold = f_ital = f_tag = ImageFont.load_default()
tx = 500
INK = (23, 24, 28)
d.text((tx, 240), "Chapter", font=f_bold, fill=INK)
d.text((tx + d.textlength("Chapter", font=f_bold), 240), "Prep", font=f_ital, fill=INK)
d.text((tx, 350), "Practice tests for every competitive event", font=f_tag, fill=(92, 94, 101))
og.save("public/og-image.png")

print("Regenerated all brand assets from", SRC)
