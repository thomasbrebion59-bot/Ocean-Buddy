#!/usr/bin/env python3
"""Relief du globe 3D (assets/globe/relief-{4k,8k}.webp), à partir des rasters Natural Earth.

  R  ombrage du relief terrestre (SR_HR, « shaded relief »), 128 = terrain plat
  G  détail des fonds marins (OB_LR, « ocean bottom ») : dorsales, fosses, talus ; 128 = neutre
  B  profondeur continue des fonds (OB_LR lissé), 0 = peu profond, 255 = abysses
Le shader (ocean-globe.js) module les couleurs par ces valeurs : montagnes en relief, océan sans paliers.

Données : https://www.naturalearthdata.com/downloads/10m-raster-data/ (SR_HR.tif, OB_LR.tif, domaine public).
Usage : python3 scripts/build-globe-relief.py <dossier contenant SR_HR.tif et OB_LR.tif>
Dépendances : numpy, pillow, scipy.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'globe'
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'natural-earth'


def load(name, width, mode):
    im = Image.open(SRC / name).convert(mode)
    return np.asarray(im.resize((width, width // 2), Image.LANCZOS), dtype=np.float32) / 255


def build(width):
    sr = load('SR_HR.tif', width, 'L')
    # Terrain plat de SR_HR : valeur la plus fréquente ; on centre l'ombrage sur 128.
    flat = np.median(sr[sr > .6])
    land = np.clip(128 + (sr - flat) * 300, 0, 255)
    ob = load('OB_LR.tif', width, 'RGB')
    lum = ob @ np.array([.3, .59, .11], np.float32)
    sig = width / 512
    low = ndimage.gaussian_filter(lum, sigma=sig * 3, mode=('nearest', 'wrap'))
    detail = np.clip(128 + (lum - low) * 900, 0, 255)
    lo, hi = np.percentile(low, [2, 98])
    depth = np.clip((hi - low) / (hi - lo), 0, 1) * 255
    rgb = np.stack([land, detail, depth], axis=-1)
    return Image.fromarray(np.round(rgb).astype(np.uint8))


def main():
    for width, q in ((4096, 82), (8192, 80)):
        path = OUT / f'relief-{width // 1024}k.webp'
        build(width).save(path, 'WEBP', quality=q, method=6)
        print(path.relative_to(ROOT), f'{path.stat().st_size / 1e6:.2f} Mo')


if __name__ == '__main__':
    main()
