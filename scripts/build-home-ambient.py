"""Photos du fond d'ambiance de l'accueil, connues dès l'en-tête de index.html (LCP).

Le fond d'ambiance (photo du spot de rêve affiché, très floutée) est l'élément LCP de l'accueil. home-feed.js ne
s'exécute qu'après tous les scripts ; le script de démarrage de index.html pose donc lui-même la photo du jour sur
l'image statique de #home, dès que l'analyseur l'atteint. C'est la même URL que la première photo du carrousel :
elle est téléchargée une seule fois et déjà prête quand home-feed.js monte le héros.

Ne pas la remplacer par une vignette : Chrome ignore pour le LCP les images trop légères par pixel affiché
(moins de 0,05 bit par pixel physique) ; l'élément LCP redeviendrait la photo du héros, découverte tard.

Sources : HERO_IDS de home-feed.js et les photos réelles de data/catalog.json (même règle que photo()).
Sortie : le bloc /*ambient*/…/*/ambient*/ du script de démarrage de index.html.
À relancer après un changement de HERO_IDS ou d'une de ces photos.

Usage : python3 scripts/build-home-ambient.py
"""
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parent.parent

ids = json.loads(re.search(r"const HERO_IDS=(\[[^\]]*\]);", (ROOT / 'home-feed.js').read_text()).group(1).replace("'", '"'))
photos = {s['id']: s.get('photo') for s in json.loads((ROOT / 'data/catalog.json').read_text())}
pairs = []
for spot_id in ids:
    record = photos.get(spot_id)
    if not record or record.get('ai') or not record.get('src'):
        print('sans photo réelle, ignoré :', spot_id)
        continue
    if not (ROOT / record['src']).is_file():
        raise SystemExit(f'Photo introuvable : {record["src"]}')
    pairs.append([spot_id, record['src']])

page = ROOT / 'index.html'
html = page.read_text()
block = '/*ambient*/' + json.dumps(pairs, separators=(',', ':')).replace('"', "'") + '/*/ambient*/'
updated, n = re.subn(r'/\*ambient\*/.*?/\*/ambient\*/', lambda _: block, html, flags=re.S)
if n != 1:
    raise SystemExit('Bloc /*ambient*/ introuvable dans index.html')
if updated != html:
    page.write_text(updated)
print(len(pairs), 'photos d’ambiance dans index.html')
