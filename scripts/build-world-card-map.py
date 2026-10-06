#!/usr/bin/env python3
"""Fabrique assets/globe/world-card.webp : la carte plate de l'accueil (océan cobalt, terres sable).

Source : earth-day-4k.webp (NASA Blue Marble). Projection équirectangulaire, 84°N → 58°S,
comme le dessin des points dans home-feed.js (drawWorld).
"""
import pathlib
import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 2400, 946
src = Image.open(ROOT / "assets/globe/earth-day-4k.webp").convert("RGB")
sw, sh = src.size
top, bot = round((90 - 84) / 180 * sh), round((90 + 58) / 180 * sh)
src = src.crop((0, top, sw, bot)).resize((W, H), Image.LANCZOS)
a = np.asarray(src).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
land = ((r > b * 0.9) | (np.minimum(np.minimum(r, g), b) > 150)).astype(np.float32)
mask = Image.fromarray((land * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.6))
mask = Image.fromarray(((np.asarray(mask) > 127) * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.9))
m = np.asarray(mask).astype(np.float32) / 255

# Océan : dégradé cobalt + halo clair le long des côtes (eaux peu profondes).
yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
top_c, bot_c = np.array([30, 86, 214], np.float32), np.array([10, 44, 128], np.float32)
ocean = top_c * (1 - yy[..., None]) + bot_c * yy[..., None]
ocean = np.broadcast_to(ocean, (H, W, 3)).copy()
halo = np.asarray(mask.filter(ImageFilter.GaussianBlur(14))).astype(np.float32) / 255
ocean += (np.array([70, 150, 255], np.float32) - ocean) * (halo[..., None] * 0.55)

# Terres : sable, avec un relief très discret (luminance NASA) pour ne pas faire aplat.
lum = (0.3 * r + 0.59 * g + 0.11 * b)
lum = np.asarray(Image.fromarray(lum.astype("uint8")).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)
rel = (lum - lum[m > 0.5].mean()) / 255
sand = np.array([233, 223, 196], np.float32)
land_rgb = np.clip(sand + rel[..., None] * 70, 0, 255)

out = ocean * (1 - m[..., None]) + land_rgb * m[..., None]
# Liseré sombre fin sur le trait de côte.
edge = np.clip(np.abs(np.asarray(mask.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255 - m) * 6, 0, 1)
out = out * (1 - edge[..., None] * 0.35) + np.array([8, 30, 100], np.float32) * (edge[..., None] * 0.35)
Image.fromarray(np.clip(out, 0, 255).astype("uint8")).save(ROOT / "assets/globe/world-card.webp", quality=88, method=6)
print("assets/globe/world-card.webp", W, H)
