#!/usr/bin/env python3
"""Score d’éclat des photos de couverture (data/photo-scores.json), pour l’ordre des rails de l’accueil.

Mesuré sur les miniatures : luminosité, saturation, part de bleus et de turquoises (mer, ciel, lagon),
pénalité pour les images grises ou sombres. 0 = terne, 100 = éclatante. Les illustrations ne sont pas notées.
Usage : python3 scripts/build-photo-scores.py   (numpy, pillow)
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
catalog = json.loads((ROOT / 'data/catalog.json').read_text())
scores = {}
for s in catalog:
    p = s.get('photo') or {}
    if not p.get('thumb') or p.get('ai') or not (ROOT / p['thumb']).exists():
        continue
    im = Image.open(ROOT / p['thumb']).convert('RGB').resize((160, 107))
    hsv = np.asarray(im.convert('HSV'), dtype=np.float32) / 255
    h, sat, val = hsv[..., 0] * 360, hsv[..., 1], hsv[..., 2]
    bright = float(np.clip((val.mean() - .25) / .45, 0, 1))
    colour = float(np.clip((sat.mean() - .12) / .38, 0, 1))
    sea = float((((h > 165) & (h < 230)) & (sat > .28) & (val > .35)).mean())
    grey = float(((sat < .12) & (val > .3)).mean())
    dark = float((val < .22).mean())
    score = 100 * (.32 * bright + .3 * colour + .5 * min(sea / .45, 1) - .25 * grey - .3 * dark)
    scores[s['id']] = int(round(max(0, min(100, score))))
(ROOT / 'data/photo-scores.json').write_text(json.dumps(scores, separators=(',', ':')) + '\n')
print(len(scores), 'photos notées')
