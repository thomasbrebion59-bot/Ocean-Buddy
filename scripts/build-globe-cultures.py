#!/usr/bin/env python3
"""Identité culturelle du globe 3D : continents, pays et emblèmes (assets/globe/).

- cultures-2k.webp : texture de mesures lue par le shader (ocean-globe.js)
    R  continent : 18 + 36 × (0 Europe, 1 Afrique, 2 Asie, 3 Amérique du Nord et Caraïbes,
       4 Amérique du Sud, 5 Océanie, 6 Antarctique) ; le shader fond les palettes aux frontières
    G  variation de luminosité du pays (128 = neutre), pays voisins différenciés
    B  variation de teinte du pays (128 = neutre)
- patterns.webp : 7 tuiles de 256 px, raccordables, dessinées ici (motifs inspirés de savoir-faire
  régionaux : pavages, tissage en bandes, vannerie, patchwork, tissage andin, tressage, glace).
    R = trait principal (accent 1), G = rehaut (accent 2)
- countries.json : pour chaque pays du catalogue, position de l'emblème, continent et nombre de spots.

Données : Natural Earth admin 0 « map units » 10m (domaine public).
Usage : python3 scripts/build-globe-cultures.py <dossier des .geojson Natural Earth>
Dépendances : numpy, pillow, scipy.
"""
import json
import math
import random
import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'globe'
NE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'natural-earth'
W, H = 4096, 2048
CONT = {'Europe': 0, 'Africa': 1, 'Asia': 2, 'North America': 3, 'South America': 4, 'Oceania': 5, 'Antarctica': 6}
# Noms du catalogue absents ou écrits autrement dans Natural Earth.
ALIASES = {
    'États-Unis': 'United States of America', 'Royaume-Uni': 'England', 'Polynésie française': 'French Polynesia',
    'Nouvelle-Calédonie': 'New Caledonia', 'La Réunion': 'Reunion', 'Guadeloupe': 'Guadeloupe', 'Martinique': 'Martinique',
    'Porto Rico': 'Puerto Rico', 'Hong Kong': 'Hong Kong S.A.R.', 'Mayotte': 'Mayotte', 'Saint-Martin': 'Saint Martin',
    'Îles Caïmans': 'Cayman Islands', 'Îles Vierges britanniques': 'British Virgin Islands', 'Îles Cook': 'Cook Islands',
    'Îles Vierges des États-Unis': 'United States Virgin Islands', 'Îles Turques-et-Caïques': 'Turks and Caicos Islands',
    'Aruba': 'Aruba', 'Curaçao': 'Curaçao', 'Bonaire': None, 'Vietnam': 'Vietnam', 'Chine': 'China', 'Taïwan': 'Taiwan', 'Palaos': 'Palau', 'Micronésie': 'Federated States of Micronesia',
}


def features():
    for f in json.load(open(NE / 'ne_10m_admin_0_map_units.geojson'))['features']:
        if f['geometry']:
            yield f


def continent(props, lon):
    c = props['CONTINENT']
    if c == 'Seven seas (open ocean)':
        c = {'Africa': 'Africa', 'Asia': 'Asia', 'Oceania': 'Oceania', 'Americas': 'South America'}.get(props['REGION_UN'], 'Africa')
    if props['ADM0_A3'] == 'RUS' and lon > 60:
        c = 'Asia'
    return CONT.get(c, 0)


def rasterize(feats):
    """Identifiant d'unité par texel (0 = mer). La Russie est coupée à 60° E (Europe / Asie)."""
    ids = Image.new('I', (W, H), 0)
    draw = ImageDraw.Draw(ids)
    units = []
    for f in feats:
        g = f['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for poly in polys:
            ring = poly[0]
            lon = sum(p[0] for p in ring) / len(ring)
            units.append((f['properties'], continent(f['properties'], lon)))
            uid = len(units)
            for k, r in enumerate(poly):
                pts = [((p[0] + 180) / 360 * W, (90 - p[1]) / 180 * H) for p in r]
                if len(pts) > 2:
                    draw.polygon(pts, fill=uid if k == 0 else 0)
    return np.asarray(ids, dtype=np.int32), units


def colours(ids, units):
    """Continents et variation de chaque pays ; deux pays voisins n'ont jamais la même variation."""
    country = np.zeros(len(units) + 1, np.int32)
    names = {}
    for i, (p, _) in enumerate(units, 1):
        country[i] = names.setdefault(p['SU_A3'], len(names) + 1)
    cid = country[ids]
    adj = defaultdict(set)
    for a, b in ((cid[:, :-1], cid[:, 1:]), (cid[:-1, :], cid[1:, :])):
        m = (a != b) & (a > 0) & (b > 0)
        for x, y in set(zip(a[m].tolist(), b[m].tolist())):
            adj[x].add(y)
            adj[y].add(x)
    shade = {}
    for c in sorted(range(1, len(names) + 1), key=lambda c: -len(adj[c])):
        used = {shade[n] for n in adj[c] if n in shade}
        shade[c] = next(k for k in range(12) if k not in used)
    rnd = random.Random(7)
    light = [0.5 + 0.5 * math.sin(k * 2.4) for k in range(12)]
    hue = [rnd.random() for _ in range(12)]
    cont = np.array([0] + [c for _, c in units], np.float32)
    lut_l = np.array([0.5] + [light[shade[country[i]]] for i in range(1, len(units) + 1)], np.float32)
    lut_h = np.array([0.5] + [hue[shade[country[i]]] for i in range(1, len(units) + 1)], np.float32)
    land = ids > 0
    # La mer prend les valeurs de la terre la plus proche : aucun liseré parasite au filtrage.
    near = ndimage.distance_transform_edt(~land, return_distances=False, return_indices=True)
    ids = ids[tuple(near)]
    rgb = np.stack([18 + 36 * cont[ids], 255 * lut_l[ids], 255 * lut_h[ids]], axis=-1)
    return Image.fromarray(np.round(rgb).astype(np.uint8))


def tile(kind, s=256, ss=2):
    """Tuile raccordable : chaque forme est dessinée aussi décalée de ±s pour boucler."""
    S = s * ss
    a = Image.new('L', (S, S), 0)
    b = Image.new('L', (S, S), 0)
    da, db = ImageDraw.Draw(a), ImageDraw.Draw(b)
    rnd = random.Random(kind)

    def wrap(fn, *args, **kw):
        for ox in (-S, 0, S):
            for oy in (-S, 0, S):
                fn(ox, oy, *args, **kw)

    def rect(d, x0, y0, x1, y1, r, w):
        wrap(lambda ox, oy: d.rounded_rectangle([x0 + ox, y0 + oy, x1 + ox, y1 + oy], radius=r, outline=255, width=w))

    def line(d, pts, w):
        wrap(lambda ox, oy: d.line([(x + ox, y + oy) for x, y in pts], fill=255, width=w, joint='curve'))

    u = S / 8
    if kind == 0:  # Europe : pavage de petits rectangles décalés, joints irréguliers
        for row in range(8):
            off = (row % 2) * u
            for col in range(4):
                x = col * 2 * u + off + rnd.uniform(-3, 3)
                rect(da, x + 4, row * u + 4, x + 2 * u - 4, (row + 1) * u - 4, 10, 5)
                if rnd.random() < .3:
                    wrap(lambda ox, oy, cx=x + u, cy=row * u + u / 2: db.ellipse([cx - 6 + ox, cy - 6 + oy, cx + 6 + ox, cy + 6 + oy], fill=255))
    elif kind == 1:  # Afrique : bandes tissées, fines hachures puis tirets décalés
        for band in range(4):
            y0 = band * 2 * u
            line(db, [(0, y0), (S, y0)], 6)
            for k in range(16):
                x = k * S / 16
                line(da, [(x, y0 + 12), (x + u / 2, y0 + u - 8)], 5)
            for k in range(8):
                x = k * S / 8 + (band % 2) * S / 16
                line(da, [(x + 8, y0 + 1.5 * u), (x + u / 1.6, y0 + 1.5 * u)], 7)
    elif kind == 2:  # Asie : vannerie de lattes croisées dessus-dessous
        for i in range(8):
            for j in range(8):
                x0, y0 = i * u, j * u
                if (i + j) % 2:
                    for k in range(3):
                        line(da, [(x0 + 6, y0 + (k + .5) * u / 3), (x0 + u - 6, y0 + (k + .5) * u / 3)], 5)
                else:
                    for k in range(3):
                        line(da, [(x0 + (k + .5) * u / 3, y0 + 6), (x0 + (k + .5) * u / 3, y0 + u - 6)], 5)
                wrap(lambda ox, oy: db.rectangle([x0 + ox - 2, y0 + oy - 2, x0 + ox + 2, y0 + oy + 2], fill=255))
    elif kind == 3:  # Amérique du Nord et Caraïbes : patchwork de blocs à deux lignes, claustras
        for i in range(4):
            for j in range(4):
                x0, y0, v = i * 2 * u, j * 2 * u, 2 * u
                rect(db, x0 + 3, y0 + 3, x0 + v - 3, y0 + v - 3, 6, 4)
                if (i + j) % 2:
                    line(da, [(x0 + v * .33, y0 + 14), (x0 + v * .33, y0 + v - 14)], 6)
                    line(da, [(x0 + v * .66, y0 + 14), (x0 + v * .66, y0 + v - 14)], 6)
                else:
                    line(da, [(x0 + 14, y0 + v * .33), (x0 + v - 14, y0 + v * .33)], 6)
                    line(da, [(x0 + 14, y0 + v * .66), (x0 + v - 14, y0 + v * .66)], 6)
    elif kind == 4:  # Amérique du Sud : bandes fines de chevrons ouverts, tissage andin
        for band in range(8):
            y = band * u + u / 2
            pts = [(k * S / 16, y + (u / 3 if k % 2 else -u / 3)) for k in range(17)]
            line(da, pts, 6)
            if band % 2:
                line(db, [(0, band * u), (S, band * u)], 4)
    elif kind == 5:  # Océanie : rubans diagonaux tressés, petits vides carrés
        for k in range(-8, 9):
            c = k * u * 1.4142
            line(da, [(c, 0), (c + S, S)], 6)
            line(da, [(c + S, 0), (c, S)], 6)
        for i in range(8):
            for j in range(8):
                x, y = (i + .5) * u, (j + .5) * u
                if (i + j) % 2 == 0:
                    wrap(lambda ox, oy: db.rectangle([x - 7 + ox, y - 7 + oy, x + 7 + ox, y + 7 + oy], fill=255))
    else:  # Antarctique : fines fractures polygonales interrompues
        pts = [(rnd.uniform(0, S), rnd.uniform(0, S)) for _ in range(18)]
        for x, y in pts:
            near = sorted(pts, key=lambda p: min((p[0] - x - dx) ** 2 + (p[1] - y - dy) ** 2 for dx in (-S, 0, S) for dy in (-S, 0, S)))[1:4]
            for nx, ny in near:
                dx = min((nx - x + d for d in (-S, 0, S)), key=abs)
                dy = min((ny - y + d for d in (-S, 0, S)), key=abs)
                line(da, [(x + dx * .12, y + dy * .12), (x + dx * .78, y + dy * .78)], 4)
    return np.stack([np.asarray(a.resize((s, s), Image.LANCZOS)), np.asarray(b.resize((s, s), Image.LANCZOS))], -1)


def patterns():
    atlas = np.zeros((512, 1024, 3), np.uint8)
    for k in range(7):
        atlas[(k // 4) * 256:(k // 4 + 1) * 256, (k % 4) * 256:(k % 4 + 1) * 256, :2] = tile(k)
    return Image.fromarray(atlas)


def anchors(feats):
    catalog = json.load(open(ROOT / 'data' / 'catalog.json'))
    spots = defaultdict(list)
    for s in catalog:
        if s.get('coords'):
            spots[s['country']].append(s['coords'])
    by_fr, by_en = {}, {}
    for f in feats:
        p = f['properties']
        by_fr.setdefault(p['NAME_FR'], p)
        by_en.setdefault(p['NAME'], p)
        by_en.setdefault(p['ADMIN'], p)
        by_en.setdefault(p['GEOUNIT'], p)
    out = {}
    for name, pts in sorted(spots.items(), key=lambda x: -len(x[1])):
        p = by_en.get(ALIASES[name]) if ALIASES.get(name) else None if name in ALIASES else by_fr.get(name)
        # Centre des spots (sur la sphère) : repère sûr pour les îles et les pays sans unité Natural Earth.
        v = np.sum([[math.cos(math.radians(c['lat'])) * math.sin(math.radians(c['lon'])), math.sin(math.radians(c['lat'])),
                     math.cos(math.radians(c['lat'])) * math.cos(math.radians(c['lon']))] for c in pts], axis=0)
        slat, slon = math.degrees(math.asin(v[1] / np.linalg.norm(v))), math.degrees(math.atan2(v[0], v[2]))
        big = p and p.get('LABEL_X') is not None and p['MIN_LABEL'] is not None and float(p['MIN_LABEL']) < 4.5
        lat, lon = (p['LABEL_Y'], p['LABEL_X']) if big else (slat, slon)
        out[name] = {'lat': round(lat, 3), 'lon': round(lon, 3), 'n': len(pts),
                     'continent': continent(p, lon) if p else None}
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    feats = list(features())
    ids, units = rasterize(feats)
    # 2K suffit : les frontières sont tracées en lignes par ailleurs ; la mémoire du téléphone est préservée.
    colours(ids, units).resize((W // 2, H // 2), Image.NEAREST).save(OUT / 'cultures-2k.webp', 'WEBP', lossless=True, method=6, exact=True)
    patterns().save(OUT / 'patterns.webp', 'WEBP', lossless=True, method=6, exact=True)
    data = anchors(feats)
    missing = [k for k, v in data.items() if v['continent'] is None]
    (OUT / 'countries.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    for f in ('cultures-2k.webp', 'patterns.webp', 'countries.json'):
        print(f'assets/globe/{f}', f'{(OUT / f).stat().st_size / 1e3:.0f} ko')
    print('Sans unité Natural Earth (centre des spots) :', ', '.join(missing) or 'aucun')
    print('Continents :', Counter(v['continent'] for v in data.values()))


if __name__ == '__main__':
    main()
