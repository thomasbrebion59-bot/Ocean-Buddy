#!/usr/bin/env python3
"""Fabrique assets/ui/monde-trait.svg (la carte du monde du passeport, au trait) et assets/ui/monde-terres.svg (les mêmes
terres, pleines).

Source : assets/globe/world-card.webp (la carte plate du passeport, scripts/build-world-card-map.py), donc la même
projection (équirectangulaire, 84°N → 58°S) et le même repère de 2400 × 946 : les points des spots se posent avec le
même calcul que passport.js. Le contour des terres est suivi, simplifié, et les îlots invisibles à petite taille sont
retirés. Le fichier sert de masque CSS (ui-nav.css) : le trait prend la couleur du thème.
"""
import pathlib
import numpy as np
from PIL import Image, ImageFilter
import contourpy

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 2400, 946
MIN_AREA = 190.0   # unités² du repère : en dessous, l'île fait moins d'un point à l'écran
TOL = 2.2          # tolérance de simplification (unités du repère)
STROKE = 11        # épaisseur du trait (unités du repère), environ 1,1 px sur un téléphone

img = Image.open(ROOT / "assets/globe/world-card.webp").convert("RGB")
assert img.size == (W, H), img.size
a = np.asarray(img).astype(np.float32)
land = (a[..., 0] > a[..., 2]).astype(np.float32)          # terres sable (rouge > bleu), océan cobalt
soft = np.asarray(Image.fromarray((land * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32) / 255
# Bord de 1 px d'océan : les terres coupées par le cadre se ferment sur le cadre.
pad = np.zeros((H + 2, W + 2), np.float32)
pad[1:-1, 1:-1] = soft
lines = contourpy.contour_generator(z=pad, name="serial").lines(0.5)


def area(p):
    x, y = p[:, 0], p[:, 1]
    return abs(float(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))) / 2


def simplify(p, tol):
    """Douglas-Peucker, sans récursion."""
    n = len(p)
    keep = np.zeros(n, bool)
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        seg = p[j] - p[i]
        d = p[i + 1:j] - p[i]
        length = float(np.hypot(*seg))
        dist = np.abs(seg[0] * d[:, 1] - seg[1] * d[:, 0]) / length if length > 1e-9 else np.hypot(d[:, 0], d[:, 1])
        k = int(np.argmax(dist))
        if dist[k] > tol:
            k += i + 1
            keep[k] = True
            stack += [(i, k), (k, j)]
    return p[keep]


parts, kept, points = [], 0, 0
for line in lines:
    p = np.asarray(line, np.float64) - 1.0   # retire le bord ajouté
    if len(p) < 4 or area(p) < MIN_AREA:
        continue
    half = len(p) // 2
    q = np.vstack([simplify(p[:half + 1], TOL), simplify(p[half:], TOL)[1:]])   # anneau fermé : deux moitiés
    if len(q) < 4:
        continue
    q = np.clip(np.round(q).astype(int), [0, 0], [W, H])
    d = np.diff(q, axis=0)
    parts.append(f"M{q[0][0]} {q[0][1]}l" + " ".join(f"{dx} {dy}" for dx, dy in d if dx or dy) + "z")
    kept += 1
    points += len(q)

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke="#000" stroke-width="{STROKE}" '
       f'stroke-linejoin="round" stroke-linecap="round"><path d="{"".join(parts)}"/></svg>\n')
out = ROOT / "assets/ui/monde-trait.svg"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(svg, encoding="utf-8")
print(out.relative_to(ROOT), f"{kept} contours, {points} points, {len(svg)} octets")

# Les mêmes terres, pleines (passe du 23 novembre 2026) : un second masque, pour teinter les terres sous le trait dans le
# résumé du passeport. Mêmes contours, donc même repère ; evenodd laisse les mers intérieures ouvertes.
fill = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="#000" fill-rule="evenodd">'
        f'<path d="{"".join(parts)}"/></svg>\n')
out_fill = ROOT / "assets/ui/monde-terres.svg"
out_fill.write_text(fill, encoding="utf-8")
print(out_fill.relative_to(ROOT), f"{len(fill)} octets")
