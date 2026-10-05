#!/usr/bin/env python3
"""
« Y aller » : aéroports proches, fuseau horaire et repères pays de chaque spot (data/access.json).

Sources ouvertes réunies dans un dossier de cache :
  airports.csv     OurAirports (domaine public) — https://davidmegginson.github.io/ourairports-data/airports.csv
  tz.json          fuseau IANA de chaque spot (Open-Meteo, timezone=auto)
  mledoze.json     mledoze/countries (ODbL) : monnaies, langues, indicatif téléphonique

Les distances sont à vol d'oiseau depuis le secteur du spot ; le trajet réel est plus long.
Seuls les aéroports avec des vols réguliers et un code IATA sont retenus.

  python3 scripts/build-access.py <dossier de cache>
"""
import csv, json, math, os, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__)
catalog = json.load(open(os.path.join(ROOT, 'data', 'catalog.json')))

try:
    import pycountry
except ImportError:  # noqa
    pycountry = None


def hav(a, b, c, d):
    p1, p2 = math.radians(a), math.radians(c)
    dl = math.radians(d - b)
    x = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(min(1, x)))


def norm(s):
    return unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode().replace('-', ' ').replace("'", ' ').replace('’', ' ').strip()


airports = []
with open(os.path.join(CACHE, 'airports.csv'), newline='', encoding='utf8') as f:
    for r in csv.DictReader(f):
        if r['type'] not in ('large_airport', 'medium_airport') or r['scheduled_service'] != 'yes' or not r['iata_code']:
            continue
        airports.append((float(r['latitude_deg']), float(r['longitude_deg']), r['iata_code'], r['name'], r['municipality'], 1 if r['type'] == 'large_airport' else 0, r['iso_country']))

tz = json.load(open(os.path.join(CACHE, 'tz.json')))
countries = json.load(open(os.path.join(CACHE, 'mledoze.json')))
by_name = {}
by_code = {}
for c in countries:
    by_code[c['cca2']] = c
    for k in (c['translations'].get('fra', {}).get('common'), c['translations'].get('fra', {}).get('official'), c['name']['common']):
        if k:
            by_name[norm(k)] = c['cca2']
MANUAL = {'bonaire': 'BQ', 'cap vert': 'CV', 'la reunion': 'RE', 'maurice': 'MU', 'palaos': 'PW'}


def lang2(code3):
    if pycountry:
        l = pycountry.languages.get(alpha_3=code3)
        if l and getattr(l, 'alpha_2', None):
            return l.alpha_2
    return code3


spots = {}
cinfo = {}
for s in catalog:
    lat, lon = s['coords']['lat'], s['coords']['lon']
    near = sorted(((hav(lat, lon, a[0], a[1]), a) for a in airports), key=lambda x: x[0])
    picks = []
    for d, a in near[:12]:
        if len(picks) >= 3:
            break
        if picks and d > 350:
            break
        picks.append([a[2], a[3], a[4], round(d), a[5]])
    # Toujours proposer un grand aéroport international s'il est à moins de 400 km et absent de la liste
    if not any(p[4] for p in picks):
        for d, a in near[:60]:
            if a[5] and d < 400:
                picks.append([a[2], a[3], a[4], round(d), 1])
                break
    code = MANUAL.get(norm(s['country'])) or by_name.get(norm(s['country']))
    spots[s['id']] = {'ap': picks, 'tz': tz.get(s['id']), 'cc': code}
    if code and code not in cinfo and code in by_code:
        c = by_code[code]
        idd = c.get('idd') or {}
        suf = idd.get('suffixes') or ['']
        cinfo[code] = {
            'cur': sorted((c.get('currencies') or {}).keys()),
            'lang': [lang2(k) for k in (c.get('languages') or {}).keys()][:3],
            'tel': (idd.get('root') or '') + (suf[0] if len(suf) == 1 else ''),
        }

out = {'meta': {'edition': '2026-10', 'sources': {'airports': 'OurAirports (domaine public)', 'countries': 'mledoze/countries (ODbL)', 'tz': 'Open-Meteo'}}, 'countries': cinfo, 'spots': spots}
json.dump(out, open(os.path.join(ROOT, 'data', 'access.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
miss = [k for k, v in spots.items() if not v['cc']]
print(f"data/access.json : {len(spots)} spots, {len(cinfo)} pays ; sans pays : {miss[:10]}")

# Vue navigateur chargée à la demande
import hashlib, re  # noqa: E402
body = '/* Généré depuis data/access.json par scripts/build-access.py. Ne pas modifier à la main. */\nwindow.OCEAN_ACCESS=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'assets', 'data', 'spot-access.js'), 'w').write(body)
h = hashlib.sha1(body.encode()).hexdigest()[:12]
js = os.path.join(ROOT, 'spot-data.js')
code = open(js).read()
code2 = re.sub(r"assets/data/spot-access\.js\?v=[0-9a-f]+", 'assets/data/spot-access.js?v=' + h, code)
if code2 != code:
    open(js, 'w').write(code2)
print(f"assets/data/spot-access.js : {len(body)//1024} Ko (v={h})")
