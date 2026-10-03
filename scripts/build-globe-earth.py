#!/usr/bin/env python3
"""Textures de la « vraie Terre » du globe 3D (assets/globe/), depuis les images de la NASA (domaine public).

  earth-day-{4k,8k}.webp    Blue Marble Next Generation, juillet 2004 (couleurs réelles, sans relief ajouté)
  earth-normal-4k.webp      R,G  pente du relief (est, nord), 128 = plat, exagérée pour rester visible depuis l’espace
                            B    eau (255 = mer ou lac), pour le reflet du soleil
  earth-sky-4k.webp         R    lumières des villes la nuit (Black Marble 2016)
                            G    nuages (Blue Marble, couverture nuageuse combinée)
                            B    neige et glaces (pour qu’elles restent blanches sous l’atmosphère)
  sky-2k.webp               voie lactée sans les étoiles (NASA SVS Deep Star Maps 2020), ciel équatorial
  stars.bin                 étoiles : par étoile, ascension droite et déclinaison (uint16), éclat et couleur (uint8)

Sources (à placer dans un même dossier, noms d’origine) :
  https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74092/world.200407.3x21600x10800.jpg
  https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png
  https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_8192.tif
  https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg
  https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/starmap_2020_8k.exr
Le masque d’eau vient de assets/globe/earth-8k.webp (Natural Earth, voir build-globe-textures.py).

Usage : python3 scripts/build-globe-earth.py <dossier des images NASA>
Dépendances : numpy, pillow, scipy, OpenEXR.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'globe'
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'nasa'


def save(arr, name, quality):
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    Image.fromarray(arr).save(OUT / name, 'WEBP', quality=quality, method=6)
    print(name, (OUT / name).stat().st_size // 1024, 'Ko')


def gray(name, width):
    im = Image.open(SRC / name)
    if im.mode not in ('L', 'F'):
        im = im.convert('L')
    return np.asarray(im.resize((width, width // 2), Image.BOX), dtype=np.float32) / 255


def day():
    im = Image.open(SRC / 'world.200407.3x21600x10800.jpg').convert('RGB')
    for w, q in ((8192, 86), (4096, 88)):
        save(np.asarray(im.resize((w, w // 2), Image.LANCZOS)), f'earth-day-{w // 1024}k.webp', q)


def normal(width=4096):
    h, w = width // 2, width
    # Altitude GEBCO 2008 : 0 → 0 m, 255 → environ 6 400 m (terres seulement).
    elev = gray('gebco_08_rev_elev_21600x10800.png', width) * 6400.0
    elev = ndimage.gaussian_filter(elev, .7, mode=('nearest', 'wrap'))
    lat = (90 - (np.arange(h) + .5) / h * 180) * np.pi / 180
    R = 6371000.0
    dx = 2 * np.pi * R * np.maximum(np.cos(lat), .08) / w
    dy = np.pi * R / h
    gx = (np.roll(elev, -1, 1) - np.roll(elev, 1, 1)) / (2 * dx[:, None])
    gy = (np.vstack([elev[:1], elev[:-2], elev[-1:]]) - np.vstack([elev[:1], elev[2:], elev[-1:]])) / (2 * dy)
    # Exagération du relief : ×28, sinon les montagnes disparaissent à l’échelle de la planète.
    k = 28.0
    nx, ny, nz = -gx * k, -gy * k, np.ones_like(gx)
    n = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny = nx / n, ny / n
    # Eau : distance signée au rivage de la texture de données (R ≥ 128 = terre).
    data = Image.open(OUT / 'earth-8k.webp').convert('RGB').resize((w, h), Image.BOX)
    sdf = np.asarray(data, dtype=np.float32)[..., 0]
    water = np.clip((128 - sdf) / 16 + .5, 0, 1)
    save(np.dstack([128 + nx * 127, 128 + ny * 127, water * 255]), 'earth-normal-4k.webp', 90)


def sky(width=4096):
    bm = np.asarray(Image.open(SRC / 'BlackMarble_2016_3km.jpg').convert('RGB').resize((width, width // 2), Image.BOX), dtype=np.float32) / 255
    # Black Marble montre aussi les terres au clair de lune (bleutées) : on ne garde que les lumières (jaunes).
    night = np.clip((bm[..., 0] - .5 * bm[..., 2] - .02) / .5, 0, 1) ** 1.2
    clouds = gray('cloud_combined_8192.tif', width)
    clouds = np.clip((clouds - .1) / .82, 0, 1) ** 1.1
    day_im = np.asarray(Image.open(OUT / 'earth-day-4k.webp').convert('RGB').resize((width, width // 2), Image.BOX), dtype=np.float32) / 255
    ice = np.clip((day_im.min(axis=2) - .55) / .3, 0, 1)
    save(np.dstack([night * 255, clouds * 255, ice * 255]), 'earth-sky-4k.webp', 88)


def stars():
    import OpenEXR
    rgb = OpenEXR.File(str(SRC / 'starmap_2020_8k.exr')).parts[0].channels['RGB'].pixels.astype(np.float32)
    rgb[~np.isfinite(rgb)] = 0
    lum = rgb.mean(axis=2)
    H, W = lum.shape
    # Voie lactée : on retire les étoiles (ouverture morphologique), on adoucit puis on réduit.
    med = ndimage.median_filter(lum, size=(9, 9), mode='wrap')
    diffuse = ndimage.gaussian_filter(med, 7, mode=('nearest', 'wrap'))
    tint = ndimage.gaussian_filter(rgb, (6, 6, 0), mode='wrap')
    tint = tint / np.maximum(tint.mean(axis=2, keepdims=True), 1e-4)
    mw = diffuse[..., None] * np.clip(tint, .6, 1.6)
    mw = np.asarray(Image.fromarray((np.clip(mw / .22, 0, 1) ** .8 * 255).astype(np.uint8)).resize((2048, 1024), Image.LANCZOS))
    save(mw, 'sky-2k.webp', 82)
    # Étoiles : régions plus brillantes que le fond voisin, centre et éclat total.
    resid = lum - med
    mask = resid > .045
    lab, n = ndimage.label(mask)
    idx = np.arange(1, n + 1)
    flux = ndimage.sum(resid, lab, idx)
    cy, cx = np.array(ndimage.center_of_mass(resid, lab, idx)).T
    r = ndimage.sum(rgb[..., 0], lab, idx)
    b = ndimage.sum(rgb[..., 2], lab, idx)
    keep = np.argsort(flux)[::-1][:9000]
    flux, cx, cy, r, b = flux[keep], cx[keep], cy[keep], r[keep], b[keep]
    ra = ((.5 - (cx + .5) / W) % 1.0) * 360
    dec = 90 - (cy + .5) / H * 180
    # Éclat : échelle logarithmique (magnitudes), 255 = étoiles les plus brillantes.
    m = np.log10(np.maximum(flux, 1e-3))
    lo, hi = np.percentile(m, 1), m.max()
    bright = np.clip((m - lo) / (hi - lo), 0, 1) * 255
    # Couleur : 0 = bleutée, 255 = orangée.
    colour = np.clip(.5 + (r - b) / np.maximum(r + b, 1e-4) * 2.2, 0, 1) * 255
    out = np.zeros(len(ra), dtype=[('ra', '<u2'), ('dec', '<u2'), ('b', 'u1'), ('c', 'u1')])
    out['ra'] = np.round(ra / 360 * 65535)
    out['dec'] = np.round((dec + 90) / 180 * 65535)
    out['b'] = np.round(bright)
    out['c'] = np.round(colour)
    out.tofile(OUT / 'stars.bin')
    print('stars.bin', len(out), 'étoiles,', (OUT / 'stars.bin').stat().st_size // 1024, 'Ko')


if __name__ == '__main__':
    steps = sys.argv[2:] or ['day', 'normal', 'sky', 'stars']
    for step in steps:
        globals()[step]()
