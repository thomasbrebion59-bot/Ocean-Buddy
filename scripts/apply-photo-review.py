#!/usr/bin/env python3
"""Applique une revue des photos de couverture des spots.

Chaque dossier de revue contient out/<id>.webp (photo choisie, 1600 px) et manifest.json
({id: {file, source, author, license, licenseUrl, download, width, height}}), produits à partir de
Wikimedia Commons (licences libres uniquement). Le script copie la photo en assets/spots/<id>-cover.webp,
met à jour data/catalog.json (photo du spot), retire l’ancienne photo si plus rien ne s’en sert, puis
il faut relancer :
  node scripts/build-ai-catalog.cjs && python3 scripts/build_photo_variants.py && python3 scripts/build_photo_catalog.py

Usage : python3 scripts/apply-photo-review.py <dossier de revue> [<dossier>…]
"""
import json, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
catalog_path = ROOT / 'data/catalog.json'
catalog = json.loads(catalog_path.read_text())
by_id = {s['id']: s for s in catalog}
galleries = json.loads((ROOT / 'assets/spots/gallery-sources.json').read_text()) if (ROOT / 'assets/spots/gallery-sources.json').exists() else {}
used_in_galleries = {p.get('src') for rows in galleries.values() for p in rows}

applied, removed = [], []
for folder in map(Path, sys.argv[1:]):
    manifest = json.loads((folder / 'manifest.json').read_text()) if (folder / 'manifest.json').exists() else {}
    for sid, m in manifest.items():
        src_file = folder / 'out' / f'{sid}.webp'
        spot = by_id.get(sid)
        if not spot or not src_file.exists():
            print('ignoré', sid); continue
        dest = ROOT / 'assets/spots' / f'{sid}-cover.webp'
        shutil.copyfile(src_file, dest)
        old = (spot.get('photo') or {}).get('src')
        spot['photo'] = {
            'author': m['author'], 'download': m['download'], 'file': m['file'],
            'height': m['height'], 'license': m['license'], 'licenseUrl': m.get('licenseUrl') or '',
            'source': m['source'], 'src': f'assets/spots/{sid}-cover.webp', 'thumb': f'assets/spots/thumbs/{sid}.webp',
            'width': m['width'],
        }
        if not spot['photo']['licenseUrl']:
            spot['photo'].pop('licenseUrl')
        applied.append(sid)
        if old and old != spot['photo']['src'] and old not in used_in_galleries and (ROOT / old).exists():
            others = [s for s in catalog if s is not spot and (s.get('photo') or {}).get('src') == old]
            if not others:
                (ROOT / old).unlink(); removed.append(old)

catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
print(f'{len(applied)} photos appliquées, {len(removed)} anciennes photos retirées')
