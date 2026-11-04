"""Télécharge les photographies Wikimedia Commons manquantes du catalogue et crée les .webp.

Pour chaque fiche de data/catalog.json dont `photo.src` n'existe pas encore sur disque, demande à l'API Commons
(imageinfo, iiurlwidth=1280) l'URL de la vignette du fichier `photo.file`, la télécharge, vérifie que l'image s'ouvre,
que ses dimensions correspondent à `photo.width` x `photo.height` et que la licence annoncée par Commons est celle
de la fiche, puis écrit `photo.src` en WebP (qualité 85, sans agrandissement). Un fichier refusé (HTTP 403/404…) est
signalé et laissé de côté : on ne contourne pas la politique de Wikimedia.
Les vignettes de liste (assets/spots/thumbs) se fabriquent ensuite avec scripts/build_photo_variants.py.

Usage : python3 scripts/fetch-spot-photos.py [identifiant ...]   (sans argument : toutes les photos manquantes)
User-Agent descriptif, sans adresse e-mail ; une requête à la fois, pause entre les fichiers, Retry-After respecté.
"""
from pathlib import Path
from io import BytesIO
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
UA = 'OceanBuddyBot/1.0 (https://oceanbuddy.app/)'
API = 'https://commons.wikimedia.org/w/api.php'
catalog = json.loads((ROOT / 'data/catalog.json').read_text())
wanted = set(sys.argv[1:])


def get(url):
    """GET avec reprise sur 429/503 (en respectant Retry-After) et sur coupure réseau ; None si refus définitif."""
    for attempt in range(6):
        request = urllib.request.Request(url, headers={'User-Agent': UA})
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code in (429, 503):
                wait = int(error.headers.get('Retry-After') or 10 * (attempt + 1))
                print(f'  HTTP {error.code}, pause de {wait} s', flush=True)
                time.sleep(min(wait, 120))
            else:
                print(f'  HTTP {error.code} : refusé, fichier laissé de côté', flush=True)
                return None
        except Exception as error:  # coupure réseau
            print(f'  {error}, nouvelle tentative', flush=True)
            time.sleep(5 * (attempt + 1))
    return None


def thumbnail_info(file):
    query = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'titles': 'File:' + file, 'prop': 'imageinfo',
                                    'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1280})
    raw = get(API + '?' + query)
    if raw is None:
        return None
    page = next(iter(json.loads(raw)['query']['pages'].values()))
    return page['imageinfo'][0] if 'imageinfo' in page else None


done, problems = 0, []
for spot in catalog:
    photo = spot.get('photo')
    if not photo or photo.get('ai') or (wanted and spot['id'] not in wanted):
        continue
    target = ROOT / photo['src']
    if target.is_file():
        continue
    print(spot['id'], photo['file'], flush=True)
    info = thumbnail_info(photo['file'])
    if info is None:
        problems.append((spot['id'], 'API Commons : fichier introuvable ou refusé'))
        continue
    licence = (info.get('extmetadata', {}).get('LicenseShortName') or {}).get('value', '')
    if licence and licence.strip().lower() != photo['license'].strip().lower():
        print(f"  licence Commons « {licence} » différente de la fiche « {photo['license']} »", flush=True)
        problems.append((spot['id'], f'licence Commons {licence} / fiche {photo["license"]}'))
    blob = get(info.get('thumburl') or info['url'])
    if blob is None:
        problems.append((spot['id'], 'téléchargement refusé'))
        continue
    with Image.open(BytesIO(blob)) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
    if image.size != (photo['width'], photo['height']):
        print(f"  dimensions {image.size} différentes de {photo['width']}x{photo['height']} (fiche)", flush=True)
        problems.append((spot['id'], f"dimensions {image.size[0]}x{image.size[1]} / fiche {photo['width']}x{photo['height']}"))
        continue
    image.save(target, 'WEBP', quality=85, method=6)
    done += 1
    time.sleep(3)
print(done, 'photographies téléchargées')
for spot_id, reason in problems:
    print('À TRAITER', spot_id, reason)
sys.exit(1 if problems else 0)
