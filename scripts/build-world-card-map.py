#!/usr/bin/env python3
"""Fabrique assets/globe/world-card.webp : la carte plate de l'accueil, en aplats.

Deux couleurs, sans dégradé, sans relief ni halo : océan bleu uni, terres sable unies, côtes nettes.
Source : earth-day-4k.webp (NASA Blue Marble). Projection équirectangulaire, 84°N → 58°S,
comme le dessin des points dans home-feed.js (drawWorld).
"""
import pathlib
import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 2400, 946
OCEAN = (27, 79, 196)   # #1B4FC4, bleu cobalt uni
LAND = (233, 223, 196)  # #E9DFC4, sable uni

src = Image.open(ROOT / "assets/globe/earth-day-4k.webp").convert("RGB")
sw, sh = src.size
top, bot = round((90 - 84) / 180 * sh), round((90 + 58) / 180 * sh)
src = src.crop((0, top, sw, bot)).resize((W, H), Image.LANCZOS)
a = np.asarray(src).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
land = ((r > b * 0.9) | (np.minimum(np.minimum(r, g), b) > 150)).astype(np.uint8) * 255

# Côtes lisses puis seuil net : des contours propres, pas de pixels ni de halo.
big = Image.fromarray(land).resize((W * 2, H * 2), Image.BILINEAR).filter(ImageFilter.GaussianBlur(3))
mask = np.asarray(big.resize((W, H), Image.LANCZOS)) > 127

out = np.empty((H, W, 3), np.uint8)
out[:] = OCEAN
out[mask] = LAND
Image.fromarray(out).save(ROOT / "assets/globe/world-card.webp", quality=92, method=6)
print("assets/globe/world-card.webp", W, H)
