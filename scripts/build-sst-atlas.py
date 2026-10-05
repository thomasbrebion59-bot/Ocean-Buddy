#!/usr/bin/env python3
"""
Couche « température de l'eau » du globe : assets/globe/sst-atlas.webp.

12 cartes mensuelles (normales NOAA OISST v2.1, 1991-2020) à 0,5°, rangées en 4 colonnes × 3 lignes
(janvier en haut à gauche). Chaque carte : 720 × 360, longitude -180 → 180, nord en haut.
Niveau de gris = (température + 2 °C) / 34 °C × 254 ; 255 = terre ou banquise (pas de couleur).

  python3 scripts/build-sst-atlas.py <dossier contenant sst.mon.ltm.1991-2020.nc>
Nécessite numpy, netCDF4 et Pillow.
"""
import os, sys
import numpy as np
import netCDF4
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__)
ds = netCDF4.Dataset(os.path.join(src, 'sst.mon.ltm.1991-2020.nc'))
sst = np.ma.filled(ds.variables['sst'][:], np.nan).astype('float32')  # (12, 720 lat sud→nord, 1440 lon 0→360)

tiles = []
for m in range(12):
    a = sst[m]
    a = np.roll(a, 720, axis=1)                    # longitudes -180 → 180
    a = a.reshape(360, 2, 720, 2)
    with np.errstate(invalid='ignore'):
        a = np.nanmean(a, axis=(1, 3))             # 0,5°
    # Prolonge la mer de deux mailles vers la côte pour que la couleur touche le rivage.
    for _ in range(2):
        nan = np.isnan(a)
        pad = np.pad(a, 1, mode='edge')
        neigh = np.stack([pad[1:-1, :-2], pad[1:-1, 2:], pad[:-2, 1:-1], pad[2:, 1:-1]])
        with np.errstate(invalid='ignore'):
            fill = np.nanmean(neigh, axis=0)
        a = np.where(nan & ~np.isnan(fill), fill, a)
    v = np.clip(np.round((a + 2) / 34 * 254), 0, 254)
    v = np.where(np.isnan(a), 255, v).astype('uint8')
    tiles.append(v[::-1])                          # nord en haut
rows = [np.concatenate(tiles[r * 4:(r + 1) * 4], axis=1) for r in range(3)]
atlas = np.concatenate(rows, axis=0)
out = os.path.join(ROOT, 'assets', 'globe', 'sst-atlas.webp')
Image.fromarray(atlas, 'L').save(out, 'WEBP', lossless=True, method=6)
print(f"{out} : {atlas.shape[1]}×{atlas.shape[0]}, {os.path.getsize(out) // 1024} Ko")
