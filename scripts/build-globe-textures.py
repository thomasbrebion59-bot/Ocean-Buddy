#!/usr/bin/env python3
"""Textures de données du globe 3D (assets/globe/), construites depuis Natural Earth.

Chaque texel équirectangulaire porte des mesures, pas des couleurs : la palette est
appliquée par le shader (ocean-globe.js), ce qui garde des côtes nettes au zoom.
  R  distance signée au rivage (mer et lacs), 128 = trait de côte, +16 par texel vers la terre
  G  profondeur continue : 0 = lac, 25 = plateau 0–200 m … 250 = fosses ≥ 8 000 m
  B  glaces (couverture 0–255)
Pas de canal alpha : certains navigateurs le prémultiplient et abîmeraient les mesures.
Les frontières terrestres sont exportées à part en lignes simplifiées (borders.json).

Données : https://github.com/nvkelso/natural-earth-vector (geojson/, domaine public).
Usage : python3 scripts/build-globe-textures.py <dossier des .geojson Natural Earth>
Dépendances : numpy, pillow, scipy.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'globe'
NE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'natural-earth'
BASE_W = 8192
SS = 2
LEVELS = ['L_0', 'K_200', 'J_1000', 'I_2000', 'H_3000', 'G_4000', 'F_5000', 'E_6000', 'D_7000', 'C_8000']


def rings(name):
    for feature in json.load(open(NE / f'{name}.geojson'))['features']:
        geom = feature['geometry']
        if not geom:
            continue
        polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']] if geom['type'] == 'Polygon' else []
        for poly in polys:
            yield from poly


def coverage(names, width):
    """Remplissage pair-impair (trous, îles dans les lacs) suréchantillonné ×2, puis moyenné."""
    bw, bh = width * SS, width // 2 * SS
    big = np.zeros((bh, bw), dtype=bool)
    for name in names:
        for ring in rings(name):
            if len(ring) < 3:
                continue
            xs = [(p[0] + 180.0) / 360.0 * bw for p in ring]
            ys = [(90.0 - p[1]) / 180.0 * bh for p in ring]
            x0, x1 = max(0, int(min(xs)) - 1), min(bw, int(max(xs)) + 2)
            y0, y1 = max(0, int(min(ys)) - 1), min(bh, int(max(ys)) + 2)
            if x1 <= x0 or y1 <= y0:
                continue
            tile = Image.new('1', (x1 - x0, y1 - y0), 0)
            ImageDraw.Draw(tile).polygon([(x - x0, y - y0) for x, y in zip(xs, ys)], fill=1)
            big[y0:y1, x0:x1] ^= np.asarray(tile, dtype=bool)
    return big.reshape(bh // SS, SS, bw // SS, SS).mean(axis=(1, 3), dtype=np.float32)


def signed_distance(cov):
    """Distance en texels à la côte (positive sur terre), sous-texel près du bord grâce à la couverture.
    L’axe est-ouest boucle : on calcule sur une image élargie de 64 texels de chaque côté."""
    pad = 64
    wide = np.concatenate([cov[:, -pad:], cov, cov[:, :pad]], axis=1)
    inside = wide >= 0.5
    d_in = ndimage.distance_transform_edt(inside)
    d_out = ndimage.distance_transform_edt(~inside)
    sdf = np.where(inside, d_in - 0.5, -(d_out - 0.5))
    near = np.abs(sdf) < 1.0
    sdf[near] = wide[near] - 0.5
    return sdf[:, pad:-pad]


def fill_from_nearest(values, valid):
    idx = ndimage.distance_transform_edt(~valid, return_distances=False, return_indices=True)
    return values[tuple(idx)]


def encode(width, land, lakes, ice, depth):
    scale = width / BASE_W
    sdf = signed_distance(np.clip(land - lakes, 0, 1))
    # Sous les terres, la profondeur reprend celle de l’eau la plus proche (mer, ou 0 pour un lac) :
    # pas de frange artificielle le long des rivages quand la texture est filtrée.
    ocean = (land < 0.5) & (lakes < 0.5) & (depth >= 0.5)
    lake = lakes >= 0.5
    deep = fill_from_nearest(np.where(lake, 0, depth), ocean | lake)
    deep = ndimage.gaussian_filter(deep, sigma=0.9 * max(scale, 0.5), mode=('nearest', 'wrap'))
    r = np.clip(128 + sdf * 16, 0, 255)
    g = np.clip(deep * 25, 0, 255)
    rgb = np.stack([r, g, ice * 255], axis=-1)
    return Image.fromarray(np.round(rgb).astype(np.uint8))


def borders():
    lines = []
    for feature in json.load(open(NE / 'ne_50m_admin_0_boundary_lines_land.geojson'))['features']:
        geom = feature['geometry']
        parts = geom['coordinates'] if geom['type'] == 'MultiLineString' else [geom['coordinates']]
        for part in parts:
            pts, last = [], None
            for lon, lat, *_ in part:
                p = (round(lon, 2), round(lat, 2))
                if last is None or abs(p[0] - last[0]) + abs(p[1] - last[1]) >= 0.08:
                    pts.append(p)
                    last = p
            if part and (round(part[-1][0], 2), round(part[-1][1], 2)) != last:
                pts.append((round(part[-1][0], 2), round(part[-1][1], 2)))
            if len(pts) > 1:
                lines.append([c for p in pts for c in p])
    return lines


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    land = np.maximum(coverage(['ne_10m_land'], BASE_W), coverage(['ne_10m_minor_islands'], BASE_W))
    lakes = coverage(['ne_10m_lakes'], BASE_W)
    ice = coverage(['ne_10m_glaciated_areas'], BASE_W)
    depth = sum(coverage([f'ne_10m_bathymetry_{level}'], BASE_W) for level in LEVELS)
    for width in (BASE_W, 4096):
        k = BASE_W // width
        shrink = (lambda a: a.reshape(a.shape[0] // k, k, a.shape[1] // k, k).mean(axis=(1, 3))) if k > 1 else (lambda a: a)
        image = encode(width, shrink(land), shrink(lakes), shrink(ice), shrink(depth))
        path = OUT / f'earth-{width // 1024}k.webp'
        image.save(path, 'WEBP', lossless=True, quality=100, method=6, exact=True)
        print(path.relative_to(ROOT), f'{path.stat().st_size / 1e6:.2f} Mo')
    path = OUT / 'borders.json'
    path.write_text(json.dumps(borders(), separators=(',', ':')))
    print(path.relative_to(ROOT), f'{path.stat().st_size / 1e3:.0f} ko')


if __name__ == '__main__':
    main()
