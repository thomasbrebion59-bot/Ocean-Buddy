#!/usr/bin/env python3
"""
Climat de chaque spot, mois par mois (data/climate.json et assets/data/spot-climate.js).

Sources (toutes ouvertes, sans compte) réunies par scripts/fetch-climate.py dans un dossier de cache :
  power/<id>.json        NASA POWER, données journalières 2010-2024 (MERRA-2 et CERES) :
                         températures de l'air, pluie, vent à 10 m, rayonnement (indice de clarté)
  sst.mon.ltm.1991-2020.nc  NOAA OISST v2.1, normales mensuelles 1991-2020 de la température de surface de la mer
  ww3/box_*.csv          WaveWatch III global (NOAA / PacIOOS), 2017-2025, un relevé tous les trois jours
  era5/<id>.json         ERA5 vagues (Copernicus, servi par Open-Meteo) pour les mers fermées hors WaveWatch III
  ww3_plan.json          cellules de grille retenues pour chaque spot

Le fichier produit est une NORMALE : la moyenne de plusieurs années, jamais une prévision.

  python3 scripts/build-climate.py <dossier de cache>
"""
import calendar, csv, glob, hashlib, json, math, os, re, sys
from collections import defaultdict
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = sys.argv[1] if len(sys.argv) > 1 else None
if not CACHE:
    sys.exit(__doc__)

catalog = json.load(open(os.path.join(ROOT, 'data', 'catalog.json')))
MDAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def r1(x):
    return None if x is None else round(x, 1)


def mean(v):
    v = [x for x in v if x is not None]
    return sum(v) / len(v) if v else None


def pct(v, p):
    v = sorted(x for x in v if x is not None)
    if not v:
        return None
    k = (len(v) - 1) * p
    f = math.floor(k)
    c = min(f + 1, len(v) - 1)
    return v[f] + (v[c] - v[f]) * (k - f)


def daylength(lat, doy):
    """Durée astronomique du jour (h), FAO-56 éq. 24-34."""
    phi = math.radians(lat)
    dec = 0.409 * math.sin(2 * math.pi * doy / 365 - 1.39)
    x = -math.tan(phi) * math.tan(dec)
    x = max(-1.0, min(1.0, x))
    return 24 / math.pi * math.acos(x)


SECT = 8


def sector(deg):
    return int(((deg % 360) + 22.5) // 45) % SECT


# ---------------------------------------------------------------- NASA POWER (air)
def air_climate(sid, lat):
    fn = os.path.join(CACHE, 'power', sid + '.json')
    if not os.path.exists(fn):
        return None
    d = json.load(open(fn))
    p = d['p']
    start = date(int(d['start'][:4]), int(d['start'][4:6]), int(d['start'][6:8]))
    by = defaultdict(lambda: defaultdict(list))
    years = set()
    for k in range(d['n']):
        day = start + timedelta(days=k)
        m = day.month - 1
        years.add(day.year)
        g = by[m]
        tx, tn, pr = p['T2M_MAX'][k], p['T2M_MIN'][k], p['PRECTOTCORR'][k]
        ws, wx, wd = p['WS10M'][k], p['WS10M_MAX'][k], p['WD10M'][k]
        kt = p['ALLSKY_KT'][k]
        rh = p.get('RH2M', [None] * d['n'])[k]
        g['tx'].append(tx); g['tn'].append(tn)
        if pr is not None:
            g['pr'].append(pr); g['wet'].append(1 if pr >= 1.0 else 0)
        if ws is not None:
            g['ws'].append(ws)
        if wx is not None:
            g['wx'].append(wx)
            # Vent assez fort pour le kitesurf : rafale/vent maximal journalier >= 7 m/s (~14 nœuds)
            g['kite'].append(1 if wx >= 7.0 else 0)
        if ws is not None and wd is not None:
            g['u'].append(-ws * math.sin(math.radians(wd)))
            g['v'].append(-ws * math.cos(math.radians(wd)))
            g['sec'].append(sector(wd))
        if rh is not None:
            g['rh'].append(rh)
        N = daylength(lat, day.timetuple().tm_yday)
        g['N'].append(N)
        if kt is not None:
            # Durée d'insolation estimée : relation d'Ångström-Prescott inversée (a = 0,25 ; b = 0,50, FAO-56)
            frac = max(0.0, min(1.0, (kt - 0.25) / 0.50))
            g['sun'].append(frac * N)
    out = {'yrs': [min(years), max(years)]}
    keys = {'tx': [], 'tn': [], 'rain': [], 'wet': [], 'sun': [], 'day': [], 'wind': [], 'gust': [], 'kite': [], 'wdir': [], 'rh': []}
    for m in range(12):
        g = by[m]
        keys['tx'].append(r1(mean(g['tx'])))
        keys['tn'].append(r1(mean(g['tn'])))
        pm = mean(g['pr'])
        keys['rain'].append(None if pm is None else round(pm * MDAYS[m]))
        w = mean(g['wet'])
        keys['wet'].append(None if w is None else round(w * MDAYS[m], 1))
        keys['sun'].append(r1(mean(g['sun'])))
        keys['day'].append(r1(mean(g['N'])))
        ws = mean(g['ws'])
        keys['wind'].append(None if ws is None else round(ws * 3.6))          # km/h
        wx = mean(g['wx'])
        keys['gust'].append(None if wx is None else round(wx * 3.6))          # km/h
        kt = mean(g['kite'])
        keys['kite'].append(None if kt is None else round(kt * 100))          # % de jours
        if g['u']:
            u, v = mean(g['u']), mean(g['v'])
            # direction d'où vient le vent dominant (rose à 8 secteurs : secteur le plus fréquent)
            counts = [0] * SECT
            for s in g['sec']:
                counts[s] += 1
            keys['wdir'].append(counts.index(max(counts)))
        else:
            keys['wdir'].append(None)
        rh = mean(g['rh'])
        keys['rh'].append(None if rh is None else round(rh))
    out.update(keys)
    out['elev'] = d.get('elev')
    return out


# ---------------------------------------------------------------- NOAA OISST (mer)
_sst = None


def load_sst():
    global _sst
    if _sst is None:
        import netCDF4  # noqa
        import numpy as np
        ds = netCDF4.Dataset(os.path.join(CACHE, 'sst.mon.ltm.1991-2020.nc'))
        sst = ds.variables['sst'][:]
        _sst = (np.ma.filled(sst, np.nan).astype('float32'), ds.variables['lat'][:], ds.variables['lon'][:])
    return _sst


def sea_temp(lat, lon):
    import numpy as np
    sst, lats, lons = load_sst()
    i0 = int(round((lat + 89.875) / 0.25))
    j0 = int(round(((lon % 360) - 0.125) / 0.25)) % 1440
    best = []
    for rad in range(0, 9):  # jusqu'à ~2° pour les spots en fond de baie
        for di in range(-rad, rad + 1):
            for dj in range(-rad, rad + 1):
                if max(abs(di), abs(dj)) != rad:
                    continue
                i, j = i0 + di, (j0 + dj) % 1440
                if not (0 <= i < 720):
                    continue
                col = sst[:, i, j]
                if np.isnan(col).any():
                    continue
                la, lo = float(lats[i]), float(lons[j])
                dist = hav(lat, lon % 360, la, lo)
                best.append((dist, col))
        if len(best) >= 3 or (best and rad >= 2):
            break
    if not best:
        return None, None
    best.sort(key=lambda x: x[0])
    best = best[:4]
    wsum = 0
    acc = np.zeros(12)
    for dist, col in best:
        w = 1 / max(dist, 5)
        acc += w * col
        wsum += w
    vals = acc / wsum
    return [round(float(x), 1) for x in vals], round(best[0][0])


def hav(la1, lo1, la2, lo2):
    p1, p2 = math.radians(la1), math.radians(la2)
    dl = math.radians(lo2 - lo1)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(min(1, a)))


# ---------------------------------------------------------------- WaveWatch III et ERA5 (vagues)
def load_ww3():
    plan_fn = os.path.join(CACHE, 'ww3_plan.json')
    if not os.path.exists(plan_fn):
        return {}, {}
    plan = json.load(open(plan_fn))
    need = {tuple(map(int, k.split(','))): v for k, v in plan['need'].items()}
    series = defaultdict(list)  # (i,j) -> [(month, hs, tp, dir)]
    for fn in glob.glob(os.path.join(CACHE, 'ww3', 'box_*.csv')):
        with open(fn) as f:
            for row in csv.reader(f):
                if len(row) < 7:
                    continue
                try:
                    la, lo = float(row[2]), float(row[3])
                except ValueError:
                    continue
                key = (int(round((la + 77.5) / 0.5)), int(round(lo / 0.5)))
                if key not in need:
                    continue
                hs = row[4]
                if hs == 'NaN':
                    continue
                m = int(row[0][5:7]) - 1
                tp = None if row[5] == 'NaN' else float(row[5])
                dr = None if row[6] == 'NaN' else float(row[6])
                series[key].append((m, float(hs), tp, dr))
    spot_cell = {}
    for key, ids in need.items():
        for sid in ids:
            spot_cell[sid] = key
    return series, spot_cell


def wave_stats(samples, src, years):
    by = defaultdict(list)
    for m, hs, tp, dr in samples:
        by[m].append((hs, tp, dr))
    if len(by) < 12:
        return None
    out = {'src': src, 'yrs': years, 'hs': [], 'p90': [], 'tp': [], 'dir': [], 'calm': [], 'flat': [], 'h1': [], 'h2': [], 'big': [], 'n': []}
    annual = [0] * SECT
    for m in range(12):
        v = by[m]
        hs = [x[0] for x in v]
        tp = [x[1] for x in v if x[1] is not None]
        secs = [0] * SECT
        for x in v:
            if x[2] is not None:
                s = sector(x[2])
                secs[s] += 1
                annual[s] += 1
        out['hs'].append(round(mean(hs), 2))
        out['p90'].append(round(pct(hs, 0.9), 2))
        out['tp'].append(r1(mean(tp)))
        out['dir'].append(secs.index(max(secs)) if sum(secs) else None)
        share = lambda f: round(100 * sum(1 for h in hs if f(h)) / len(hs))
        out['calm'].append(share(lambda h: h < 0.75))          # mer plutôt calme au large
        out['flat'].append(share(lambda h: h < 0.5))           # trop petit pour surfer
        out['h1'].append(share(lambda h: 0.5 <= h < 1.25))     # petites vagues
        out['h2'].append(share(lambda h: 1.25 <= h <= 2.5))    # vagues moyennes
        out['big'].append(share(lambda h: h > 2.5))            # grosse houle
        out['n'].append(len(hs))
    tot = sum(annual) or 1
    out['rose'] = [round(100 * a / tot) for a in annual]
    return out


def era5_waves(sid):
    fn = os.path.join(CACHE, 'era5', sid + '.json')
    if not os.path.exists(fn):
        return None
    d = json.load(open(fn))
    samples = []
    years = set()
    for chunk in d.get('chunks', []):
        h = chunk.get('hourly') or {}
        t = h.get('time') or []
        hs = h.get('wave_height') or []
        tp = h.get('wave_peak_period') or h.get('wave_period') or []
        dr = h.get('wave_direction') or []
        for k, ts in enumerate(t):
            if not ts.endswith('T00:00') and not ts.endswith('T12:00'):
                continue
            if k >= len(hs) or hs[k] is None:
                continue
            years.add(int(ts[:4]))
            samples.append((int(ts[5:7]) - 1, hs[k], tp[k] if k < len(tp) else None, dr[k] if k < len(dr) else None))
    if not samples:
        return None
    return wave_stats(samples, 'era5', [min(years), max(years)])


# ---------------------------------------------------------------- Assemblage
def main():
    series, spot_cell = load_ww3()
    out = {}
    miss = defaultdict(int)
    for s in catalog:
        sid = s['id']
        lat, lon = s['coords']['lat'], s['coords']['lon']
        rec = {}
        air = air_climate(sid, lat)
        if air:
            rec['air'] = air
        else:
            miss['air'] += 1
        if s.get('waterType') == 'sea':
            sea, dist = sea_temp(lat, lon)
            if sea:
                rec['sea'] = sea
                rec['seaKm'] = dist
            else:
                miss['sea'] += 1
            w = None
            if sid in spot_cell and series.get(spot_cell[sid]):
                w = wave_stats(series[spot_cell[sid]], 'ww3', [2017, 2025])
            if not w:
                w = era5_waves(sid)
            if w:
                rec['wave'] = w
            else:
                miss['wave'] += 1
        if rec:
            out[sid] = rec
    meta = {
        'edition': '2026-10',
        'sources': {
            'air': 'NASA POWER (MERRA-2, CERES), journalier 2010-2024',
            'sea': 'NOAA OISST v2.1, normales 1991-2020',
            'ww3': 'NOAA WaveWatch III global (PacIOOS), 2017-2025',
            'era5': 'ERA5 vagues (Copernicus/ECMWF via Open-Meteo)',
        },
    }
    data = {'meta': meta, 'spots': out}
    with open(os.path.join(ROOT, 'data', 'climate.json'), 'w') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    # Vue navigateur compacte, chargée à la demande
    body = '/* Généré depuis data/climate.json par scripts/build-climate.py. Ne pas modifier à la main. */\nwindow.OCEAN_CLIMATE=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    os.makedirs(os.path.join(ROOT, 'assets', 'data'), exist_ok=True)
    with open(os.path.join(ROOT, 'assets', 'data', 'spot-climate.js'), 'w') as f:
        f.write(body)
    # Vue légère pour l'accueil et le planificateur par mois : eau, air, soleil, pluie, vent, vagues
    def ints(v):
        return [None if x is None else round(x) for x in v] if v else None
    lite = {}
    for sid, r in out.items():
        a, w = r.get('air') or {}, r.get('wave') or {}
        lite[sid] = [ints(r.get('sea')), ints(a.get('tx')), ints(a.get('sun')), ints(a.get('wet')), a.get('kite'),
                     [None if x is None else round(x * 10) for x in w['hs']] if w else None, w.get('calm') if w else None]
    lite_body = '/* Généré par scripts/build-climate.py. [eau, air max, soleil h/j, jours de pluie, % jours ventés, houle ×10, % mer calme] */\nwindow.OCEAN_CLIMATE_LITE=' + json.dumps(lite, separators=(',', ':')) + ';\n'
    with open(os.path.join(ROOT, 'assets', 'data', 'spot-climate-lite.js'), 'w') as f:
        f.write(lite_body)
    h = hashlib.sha1(body.encode()).hexdigest()[:12]
    hl = hashlib.sha1(lite_body.encode()).hexdigest()[:12]
    js = os.path.join(ROOT, 'spot-data.js')
    if os.path.exists(js):
        code = open(js).read()
        code2 = re.sub(r"assets/data/spot-climate\.js\?v=[0-9a-f]+", 'assets/data/spot-climate.js?v=' + h, code)
        code2 = re.sub(r"assets/data/spot-climate-lite\.js\?v=[0-9a-f]+", 'assets/data/spot-climate-lite.js?v=' + hl, code2)
        if code2 != code:
            open(js, 'w').write(code2)
    print(f"data/climate.json : {len(out)} spots ; manquants {dict(miss)} ; vue {len(body)//1024} Ko (v={h}) ; légère {len(lite_body)//1024} Ko")


if __name__ == '__main__':
    main()
