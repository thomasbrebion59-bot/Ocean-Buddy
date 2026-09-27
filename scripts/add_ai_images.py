#!/usr/bin/env python3
"""Intègre les images générées avec ChatGPT, déposées dans le dossier ai-images/.

Noms attendus :
  <id>.png|jpg|webp              couverture d'un spot qui n'a pas encore de photographie
  <id>-scene-1.png … -scene-4    scènes du « Voyage dans le spot »

Les couvertures ne remplacent jamais une vraie photographie. Chaque image est marquée
« Illustration IA » dans l'application. Ensuite :
  python3 scripts/add_ai_images.py && node scripts/build-ai-catalog.cjs && python3 scripts/build_photo_catalog.py
"""
from pathlib import Path
import json, re
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / 'ai-images'
catalog = json.loads((ROOT / 'data/catalog.json').read_text())
spots = {s['id']: s for s in catalog}
scenes_file = ROOT / 'spot-scenes.js'
scenes_text = scenes_file.read_text()
scenes = json.loads(re.search(r'^window\.OCEAN_SCENES = (\{.*\});', scenes_text, re.S | re.M).group(1))
TITLES = ['Arrivée sur le spot', 'Au bord de l’eau', 'Dans l’eau', 'Au coucher du soleil']
covers = added = 0

def save(image, dest, box):
    im = ImageOps.exif_transpose(image).convert('RGB')
    im.thumbnail(box, Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, 'WEBP', quality=82, method=6)
    return im.size

for path in sorted(INBOX.glob('*')) if INBOX.is_dir() else []:
    if path.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
        continue
    m = re.fullmatch(r'([a-z0-9_]+?)(?:-scene-(\d))?', path.stem)
    if not m or m.group(1) not in spots:
        print('ignoré (spot inconnu) :', path.name)
        continue
    sid, n = m.group(1), m.group(2)
    with Image.open(path) as image:
        if n:
            rel = f'assets/scenes/{sid}-{n}.webp'
            save(image, ROOT / rel, (1920, 1920))
            rows = [r for r in scenes.get(sid, []) if r['src'] != rel]
            rows.append({'src': rel, 'title': TITLES[(int(n) - 1) % len(TITLES)], 'caption': 'Scène illustrée par IA'})
            scenes[sid] = sorted(rows, key=lambda r: r['src'])
            added += 1
        else:
            spot = spots[sid]
            if spot.get('photo') and not spot['photo'].get('ai'):
                print('ignoré (le spot a déjà une vraie photo) :', path.name)
                continue
            src, thumb = f'assets/spots/{sid}-ia.webp', f'assets/spots/thumbs/{sid}.webp'
            w, h = save(image, ROOT / src, (1600, 1600))
            save(image, ROOT / thumb, (640, 640))
            spot['photo'] = {
                'ai': True, 'file': path.name, 'src': src, 'thumb': thumb, 'width': w, 'height': h,
                'source': 'https://thomasbrebion59-bot.github.io/Ocean-Buddy/photos.html',
                'author': 'Illustration générée par IA (ChatGPT)', 'license': 'Illustration Ocean Buddy',
                'caption': 'Illustration IA · ce n’est pas une photo du lieu', 'label': 'Illustration IA',
            }
            covers += 1

(ROOT / 'data/catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
scenes_file.write_text(scenes_text[:scenes_text.index('\nwindow.OCEAN_SCENES') + 1] + 'window.OCEAN_SCENES = ' + json.dumps(scenes, ensure_ascii=False, indent=1) + ';\n')
print(f'{covers} couverture(s) et {added} scène(s) intégrées.')
