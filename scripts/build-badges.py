#!/usr/bin/env python3
"""Médailles des trophées Ocean Buddy (images ChatGPT sur fond vert #00FF00).
Entrée : un dossier contenant <id>.png (first, eco, explorer, dawn, streak7, quiz, dolphin, legend,
         quiz-faune, quiz-secu, quiz-tech, quiz-ocean, quiz-eco).
Sortie : assets/badges/<id>.webp, 512 × 512, fond transparent, médaille centrée (< 80 Ko) ;
         assets/badges/<id>-hd.webp, 768 × 768 (fiche détaillée, célébration et carte à partager).
Détourage : seul le vert relié aux bords de l'image est retiré (les feuilles et algues vertes
à l'intérieur de la médaille restent intactes), bords adoucis et liseré vert neutralisé.
Usage : python3 scripts/build-badges.py <dossier>   (nécessite numpy, pillow, scipy)"""
import io, sys, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'badges'
SIZE, PAD, MAX_BYTES = 512, 10, 80_000
HD_SIZE, HD_MAX = 768, 160_000


def key(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = g - np.maximum(r, b)
    # Fond = pixels nettement verts ET reliés au bord de l'image.
    greenish = spill > 70
    lab, _ = ndimage.label(greenish)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    # Bande de bord : quelques pixels autour du fond, où l'on calcule un alpha progressif.
    band = ndimage.binary_dilation(bg, iterations=4) & ~bg
    soft = np.clip(1 - (spill - 18) / 120, 0, 1)
    alpha = np.where(bg, 0.0, np.where(band, soft, 1.0))
    # Petite érosion pour supprimer le halo résiduel.
    alpha = np.minimum(alpha, ndimage.grey_erosion(alpha, size=(2, 2)) * 0.5 + alpha * 0.5)
    # Despill : dans la bande, le vert ne dépasse pas le max(r, b).
    near = ndimage.binary_dilation(bg, iterations=6) & ~bg
    g2 = np.where(near & (spill > 0), np.maximum(r, b) + np.clip(spill, 0, 12) * 0.2, g)
    a[..., 1] = g2
    out = np.dstack([a, alpha * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out).convert('RGBA')


def fit(im, size=SIZE):
    box = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    im = im.crop(box)
    w, h = im.size
    pad = round(PAD * size / SIZE)
    inner = size - 2 * pad
    s = inner / max(w, h)
    nw, nh = max(1, round(w * s)), max(1, round(h * s))
    im = im.convert('RGBa').resize((nw, nh), Image.LANCZOS).convert('RGBA')
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    canvas.paste(im, ((size - nw) // 2, (size - nh) // 2))
    return canvas


def save(im, path, limit=MAX_BYTES):
    for q in (86, 82, 78, 74, 70, 66, 62):
        buf = io.BytesIO()
        im.save(buf, 'WEBP', quality=q, alpha_quality=90, method=6)
        if buf.tell() <= limit:
            break
    path.write_bytes(buf.getvalue())
    return q, buf.tell()


def main(src):
    src = pathlib.Path(src)
    OUT.mkdir(parents=True, exist_ok=True)
    for png in sorted(src.glob('*.png')):
        keyed = key(Image.open(png))
        q, n = save(fit(keyed), OUT / f'{png.stem}.webp')
        q2, n2 = save(fit(keyed, HD_SIZE), OUT / f'{png.stem}-hd.webp', HD_MAX)
        print(f'{png.stem:12s} q={q} {n/1024:.1f} Ko · hd q={q2} {n2/1024:.1f} Ko')


if __name__ == '__main__':
    main(sys.argv[1])
