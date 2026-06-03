#!/usr/bin/env python3
"""Regenerate every FBLA One brand asset from the master mark.

Source of truth: public/logo-mark.png (a transparent, trimmed square PNG of the
mark). To swap the logo: replace public/logo-mark.png with a new transparent PNG
(any size, square-ish), then run:  python3 scripts/regenerate-logo-assets.py

This produces all favicons, PWA icons, apple-touch-icon, and the og-image so they
never drift. It does NOT delete the source.
"""
from PIL import Image, ImageDraw, ImageFont
import os

os.chdir(os.path.join(os.path.dirname(__file__), ".."))
SRC = "public/logo-mark.png"
WHITE = (255, 255, 255, 255)

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
square(512, 0.04).save("public/logo.png")

# Favicons (white bg so the blue mark reads on any browser chrome)
square(32, 0.08, WHITE).convert("RGB").save("public/favicon-16x16.png")
square(32, 0.08, WHITE).convert("RGB").save("public/favicon-32x32.png")
square(64, 0.08, WHITE).convert("RGB").save(
    "public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
)

# iOS + PWA maskable (opaque + safe-zone padding)
square(180, 0.14, WHITE).convert("RGB").save("public/apple-touch-icon.png")
square(192, 0.18, WHITE).convert("RGB").save("public/icon-192.png")
square(512, 0.18, WHITE).convert("RGB").save("public/icon-512.png")

# OG card: 1200x630 light bg, logo + wordmark + tagline
W, H = 1200, 630
og = Image.new("RGB", (W, H), (247, 249, 252))
d = ImageDraw.Draw(og)
d.rectangle([0, 0, W, 6], fill=(200, 136, 26))
lg = square(300, 0.02)
og.paste(lg, (150, (H - 300) // 2), lg)
try:
    f_bold = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 92)
    f_tag = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
except Exception:
    f_bold = f_tag = ImageFont.load_default()
tx = 500
d.text((tx, 240), "FBLA", font=f_bold, fill=(0, 60, 126))
d.text((tx + d.textlength("FBLA ", font=f_bold), 240), "One", font=f_bold, fill=(200, 136, 26))
d.text((tx, 350), "AI-powered FBLA competition prep", font=f_tag, fill=(90, 107, 138))
og.save("public/og-image.png")

print("Regenerated all brand assets from", SRC)
