#!/usr/bin/env python3
"""
« Observé ici » : faune aquatique réellement observée autour de chaque spot (data/wildlife.json
et assets/data/spot-wildlife.js, chargé à la demande).

Sources réunies dans un dossier de cache par scripts/fetch-wildlife.py :
  inat/sc_<id>.json   iNaturalist, espèces des groupes aquatiques observées (niveau « recherche ») autour du spot
  inat/taxa_en.json   fiches des espèces : nom anglais, statut UICN mondial, photo sous licence libre (CC0, CC BY, CC BY-SA)
  inat/worms.json     WoRMS : milieu marin, saumâtre, d'eau douce ou terrestre
  inat/hist.json      observations par mois des espèces phares (cétacés, requins et raies, tortues, phoques, siréniens, manchots)
  inat/names_<l>.json noms communs dans les autres langues de l'app (facultatif)
  obis/<id>.json      OBIS, nombre d'espèces marines recensées dans un carré d'environ 30 km

  python3 scripts/build-wildlife.py <dossier de cache>
"""
import glob, hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__)
D = os.path.join(CACHE, 'inat')
catalog = {s['id']: s for s in json.load(open(os.path.join(ROOT, 'data', 'catalog.json')))}
taxa = json.load(open(os.path.join(D, 'taxa_en.json')))
worms = json.load(open(os.path.join(D, 'worms.json'))) if os.path.exists(os.path.join(D, 'worms.json')) else {}
hist = json.load(open(os.path.join(D, 'hist.json'))) if os.path.exists(os.path.join(D, 'hist.json')) else {}
names = {}
for fn in glob.glob(os.path.join(D, 'names_*.json')):
    names[os.path.basename(fn)[6:-5]] = json.load(open(fn))

PER_SPOT = 18


def habitat_ok(sci, water):
    """Garde les espèces du bon milieu : marin ou saumâtre pour la mer, eau douce pour les lacs et rivières."""
    w = worms.get(sci)
    if not w:
        return True  # inconnu de WoRMS : on garde (groupes déjà filtrés sur l'eau)
    marine, brackish, fresh, terr = (bool(x) for x in w)
    if water == 'sea':
        return marine or brackish
    return fresh or brackish or not marine


def clean_credit(a):
    if not a:
        return ''
    a = re.sub(r',?\s*uploaded by .*$', '', a)
    a = a.replace('some rights reserved', '').replace('no rights reserved', '').replace('  ', ' ')
    return re.sub(r'\s*,\s*\(', ' (', a).strip(' ,')


used = {}
spots = {}
for fn in glob.glob(os.path.join(D, 'sc_*.json')):
    sid = os.path.basename(fn)[3:-5]
    s = catalog.get(sid)
    if not s:
        continue
    d = json.load(open(fn))
    rows = []
    for r in d['res']:
        t = taxa.get(str(r['id']))
        if not t or r.get('rank') not in ('species', 'hybrid', None):
            continue
        if not habitat_ok(t['sci'], s.get('waterType')):
            continue
        h = hist.get(f"{sid}:{r['id']}")
        row = [r['id'], r['c']]
        if h and sum(h) >= 6:
            row.append(h)
        rows.append(row)
        if r.get('fr'):
            used.setdefault(r['id'], {})['fr'] = r['fr']
        if len(rows) >= PER_SPOT:
            break
    if len(rows) < 3:
        continue
    rec = {'r': d['r'], 'n': d['total'], 'sp': rows}
    ob = os.path.join(CACHE, 'obis', sid + '.json')
    if os.path.exists(ob):
        o = json.load(open(ob))
        if o.get('species'):
            rec['o'] = o['species']
    spots[sid] = rec
    for row in rows:
        used.setdefault(row[0], {})

out_taxa = {}
for tid, extra in used.items():
    t = taxa[str(tid)]
    rec = {'s': t['sci']}
    if extra.get('fr'):
        rec['fr'] = extra['fr']
    if t.get('en'):
        rec['en'] = t['en']
    if t.get('iucn') in ('CR', 'EN', 'VU', 'NT'):
        rec['i'] = t['iucn']
    if t.get('photo'):
        p = t['photo']
        rec['p'] = [p['u'], clean_credit(p.get('a'))]
    loc = {l: n[str(tid)] for l, n in names.items() if n.get(str(tid))}
    if loc:
        rec['n'] = loc
    out_taxa[tid] = rec

data = {'meta': {'edition': '2026-10', 'sources': {'inat': 'iNaturalist, observations de niveau recherche', 'obis': 'OBIS', 'worms': 'WoRMS'}}, 'taxa': out_taxa, 'spots': spots}
json.dump(data, open(os.path.join(ROOT, 'data', 'wildlife.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
body = '/* Généré depuis data/wildlife.json par scripts/build-wildlife.py. Ne pas modifier à la main. */\nwindow.OCEAN_WILDLIFE=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'assets', 'data', 'spot-wildlife.js'), 'w').write(body)
h = hashlib.sha1(body.encode()).hexdigest()[:12]
js = os.path.join(ROOT, 'spot-data.js')
code = open(js).read()
code2 = re.sub(r"assets/data/spot-wildlife\.js\?v=[0-9a-f]+", 'assets/data/spot-wildlife.js?v=' + h, code)
if code2 != code:
    open(js, 'w').write(code2)
withp = sum(1 for t in out_taxa.values() if 'p' in t)
print(f"data/wildlife.json : {len(spots)} spots, {len(out_taxa)} espèces ({withp} avec photo libre) ; vue {len(body)//1024} Ko (v={h})")
