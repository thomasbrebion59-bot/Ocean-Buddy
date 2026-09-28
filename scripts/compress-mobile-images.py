#!/usr/bin/env python3
"""Allège les photos de spots de l'app mobile (le site garde les originaux).

Photos : 1080 px de large au plus, WebP/JPEG qualité 72 ; vignettes : qualité 70.
Sur un téléphone, une photo plein écran fait environ 1080 px : la différence est invisible.
Les fichiers gardent leur nom et leur format (les liens de l'app ne changent pas) et ne
remplacent l'original que s'ils sont plus légers. Résultats mis en cache dans mobile/build/.

Usage : python3 scripts/compress-mobile-images.py mobile/www/assets/spots
Dépendance : Pillow.
"""
import hashlib
import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'mobile' / 'build' / 'image-cache'
RULES = [('thumbs', 640, 70), ('', 1080, 72)]


def rule(path, base):
    rel = path.relative_to(base).as_posix()
    return next((w, q) for prefix, w, q in RULES if rel.startswith(prefix))


def compress(src, out, width, quality):
    with Image.open(src) as im:
        im.load()
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        if src.suffix.lower() == '.webp':
            im.save(out, 'WEBP', quality=quality, method=6)
        else:
            im.convert('RGB').save(out, 'JPEG', quality=quality, optimize=True, progressive=True)


def main():
    base = Path(sys.argv[1]).resolve()
    CACHE.mkdir(parents=True, exist_ok=True)
    before = after = 0
    for path in sorted(base.rglob('*')):
        if path.suffix.lower() not in ('.webp', '.jpg', '.jpeg'):
            continue
        width, quality = rule(path, base)
        data = path.read_bytes()
        key = hashlib.sha1(data + f'{width}:{quality}'.encode()).hexdigest() + path.suffix.lower()
        cached = CACHE / key
        if not cached.exists():
            tmp = cached.with_name(cached.name + '.tmp' + path.suffix)
            compress(path, tmp, width, quality)
            if tmp.stat().st_size >= len(data):
                tmp.write_bytes(data)
            tmp.replace(cached)
        before += len(data)
        shutil.copyfile(cached, path)
        after += cached.stat().st_size
    print(f'Photos mobiles : {before / 1e6:.0f} Mo → {after / 1e6:.0f} Mo')


if __name__ == '__main__':
    main()
