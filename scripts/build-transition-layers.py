#!/usr/bin/env python3
"""Calques des transitions d'activité (direction artistique GPT-6 Astra, images ChatGPT).
Entrée : un dossier avec <activité>-bg.png (décor portrait) et <activité>-fg.png (premier plan sur vert #00FF00).
Sortie : assets/transitions/<activité>.webp (décor 900×1350, aussi utilisé par les en-têtes thémés)
         assets/transitions/<activité>-fg.webp (premier plan détouré, recadré ; <activité>-fg2.png → -fg2.webp, <activité>-mid.png → -mid.webp pour la 3D)
         assets/transitions/layers.json (position du premier plan dans le cadre, en fractions).
Usage : python3 scripts/build-transition-layers.py <dossier>"""
import json, sys, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'transitions'
W, H = 900, 1350

def key(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # Vert dominant = fond ; transition douce sur ~40 niveaux pour des bords propres.
    spill = g - np.maximum(r, b)
    alpha = np.clip(1 - (spill - 40) / 60, 0, 1)
    # Suppression du liseré vert : le vert ne dépasse jamais le max(r, b) sur les bords.
    edge = alpha < 1
    g2 = np.where(spill > 0, np.maximum(r, b), g)
    a[..., 1] = np.where(edge | (spill > 25), g2, g)
    # Érosion d'un pixel de l'alpha pour enlever le halo.
    al = alpha.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        al = np.minimum(al, np.roll(np.roll(alpha, dy, 0), dx, 1))
    alpha = (alpha + al) / 2
    out = np.dstack([a, alpha * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out)

def main(src):
    src = pathlib.Path(src); layers = {}
    for bg in sorted(src.glob('*-bg.png')):
        act = bg.name[:-7]
        Image.open(bg).convert('RGB').resize((W, H), Image.LANCZOS).save(OUT / f'{act}.webp', quality=80, method=6)
        # Premier plan, et second premier plan éventuel (kitesurf : l’aile + Poulpy).
        for suffix, name in (('fg', act), ('fg2', act + '#2'), ('mid', act + '#mid')):
            fg = src / f'{act}-{suffix}.png'
            if not fg.exists(): continue
            im = key(Image.open(fg)).resize((W, H), Image.LANCZOS)
            box = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
            if not box: continue
            p = 6; box = (max(0, box[0]-p), max(0, box[1]-p), min(W, box[2]+p), min(H, box[3]+p))
            im.crop(box).save(OUT / f'{act}-{suffix}.webp', quality=86, method=6)
            layers[name] = {'x': round(box[0]/W, 4), 'y': round(box[1]/H, 4), 'w': round((box[2]-box[0])/W, 4), 'h': round((box[3]-box[1])/H, 4)}
            print(name, layers[name])
    old = OUT / 'layers.json'
    merged = json.loads(old.read_text()) if old.exists() else {}
    merged.update(layers)
    old.write_text(json.dumps(merged, indent=1, sort_keys=True) + '\n')

if __name__ == '__main__':
    main(sys.argv[1])
