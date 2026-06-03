#!/usr/bin/env python3
"""Generate all FBLA One logo/favicon/icon assets from the new master PNG."""
from PIL import Image, ImageDraw, ImageFont
import os

os.chdir(os.path.expanduser("~/Downloads/fbla-one"))
SRC = "public/ChatGPT Image Jun 3, 2026, 11_58_26 AM.png"
WHITE = (255, 255, 255, 255)

master = Image.open(SRC).convert("RGBA")
logo = master.crop(master.getbbox())  # trim transparent margins
print("trimmed logo size:", logo.size)


def square(size, pad_ratio, bg=None):
    canvas = Image.new("RGBA", (size, size), bg if bg else (0, 0, 0, 0))
    inner = int(size * (1 - 2 * pad_ratio))
    lw, lh = logo.size
    scale = min(inner / lw, inner / lh)
    nw, nh = max(1, int(lw * scale)), max(1, int(lh * scale))
    rim = logo.resize((nw, nh), Image.LANCZOS)
    canvas.paste(rim, ((size - nw) // 2, (size - nh) // 2), rim)
    return canvas


# In-app mark (nav/footer/FABs): transparent, tight padding
square(512, 0.04).save("public/logo-mark.png")
square(512, 0.04).save("public/logo.png")  # back-compat alias

# Favicons: white bg so the blue mark reads on any browser chrome
square(32, 0.08, WHITE).convert("RGB").save("public/favicon-16x16.png")  # rendered small
square(32, 0.08, WHITE).convert("RGB").save("public/favicon-32x32.png")
ico = square(64, 0.08, WHITE).convert("RGB")
ico.save("public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

# iOS home screen (must be opaque) + PWA maskable (needs safe-zone padding)
square(180, 0.14, WHITE).convert("RGB").save("public/apple-touch-icon.png")
square(192, 0.18, WHITE).convert("RGB").save("public/icon-192.png")
square(512, 0.18, WHITE).convert("RGB").save("public/icon-512.png")

# --- OG card: 1200x630, light bg, big logo + wordmark + tagline ---
W, H = 1200, 630
og = Image.new("RGB", (W, H), (247, 249, 252))  # --bg2 light
d = ImageDraw.Draw(og)
# subtle top gold hairline
d.rectangle([0, 0, W, 6], fill=(200, 136, 26))
# logo on the left
lg = square(300, 0.02)
og.paste(lg, (150, (H - 300) // 2), lg)
# text on the right
try:
    f_bold = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 92)
    f_tag = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
except Exception:
    f_bold = ImageFont.load_default()
    f_tag = ImageFont.load_default()
tx = 500
d.text((tx, 240), "FBLA", font=f_bold, fill=(0, 60, 126))
fbla_w = d.textlength("FBLA ", font=f_bold)
d.text((tx + fbla_w, 240), "One", font=f_bold, fill=(200, 136, 26))
d.text((tx, 350), "AI-powered FBLA competition prep", font=f_tag, fill=(90, 107, 138))
og.save("public/og-image.png")

# Clean up the raw master so it's not shipped
os.remove(SRC)

print("done. public/ now:", sorted(os.listdir("public")))
