/* Ocean Data : calculs purs sur les normales climatiques d’un spot (data/climate.json).
   Aucune dépendance au DOM : le même fichier sert dans l’app et dans les tests Node.
   Les notes mensuelles sont des repères tirés de moyennes de plusieurs années, jamais une prévision. */
(function (root) {
  'use strict';
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  /* 0 sous a, 1 au-dessus de b, linéaire entre les deux (a > b inverse le sens). */
  const ramp = (x, a, b) => (x == null || !Number.isFinite(x)) ? null : clamp((x - a) / (b - a));
  const has = v => v != null && Number.isFinite(v);
  /* Moyenne pondérée qui ignore les composantes absentes (lac sans température de l’eau, spot sans vagues). */
  function blend(parts) {
    let s = 0, w = 0;
    for (const [v, k] of parts) if (has(v)) { s += v * k; w += k; }
    return w ? s / w : null;
  }

  /* Valeurs du mois m (0-11) d’une fiche climat. */
  function month(c, m) {
    if (!c) return null;
    const a = c.air || {}, w = c.wave || null, g = k => (a[k] ? a[k][m] : null), v = k => (w && w[k] ? w[k][m] : null);
    return {
      m, sea: c.sea ? c.sea[m] : null, tx: g('tx'), tn: g('tn'), rain: g('rain'), wet: g('wet'), sun: g('sun'), day: g('day'),
      wind: g('wind'), gust: g('gust'), kite: g('kite'), wdir: g('wdir'), rh: g('rh'),
      hs: v('hs'), p90: v('p90'), tp: v('tp'), dir: v('dir'), calm: v('calm'), flat: v('flat'), h1: v('h1'), h2: v('h2'), big: v('big'),
      waves: !!w
    };
  }

  const WATER_ACTS = ['baignade', 'snorkeling', 'plongee'];
  /* Note de 0 à 1 d’une activité pour un mois. level = niveau indiqué du spot (vagues). */
  function score(act, d, level) {
    if (!d) return null;
    const warm = (a, b) => ramp(d.sea, a, b);
    const air = has(d.tx) ? clamp(ramp(d.tx, 16, 26) * (1 - ramp(d.tx, 34, 41))) : null;
    const sunny = ramp(d.sun, 3.5, 9);
    const dry = has(d.wet) ? 1 - ramp(d.wet, 6, 21) : null;
    const calm = has(d.calm) ? d.calm / 100 : null;
    const still = has(d.wind) ? 1 - ramp(d.wind, 12, 30) : null;
    let s;
    switch (act) {
      case 'baignade':
        s = has(d.sea)
          ? blend([[warm(17, 25), .47], [air, .2], [sunny, .16], [dry, .12], [calm, .05]])
          : blend([[ramp(d.tx, 20, 29), .55], [sunny, .25], [dry, .2]]);
        if (has(d.sea) && d.sea < 18) s = Math.min(s, .3);
        break;
      case 'snorkeling':
        s = blend([[warm(18, 26), .45], [calm, .15], [sunny, .17], [dry, .12], [air, .11]]);
        if (has(d.sea) && d.sea < 17) s = Math.min(s, .3);
        break;
      case 'plongee':
        s = blend([[warm(13, 26), .35], [calm, .25], [dry, .17], [sunny, .11], [still, .12]]);
        break;
      case 'surf': case 'bodyboard': {
        let fit = null;
        if (d.waves && has(d.h1)) {
          const h1 = d.h1 / 100, h2 = d.h2 / 100, big = d.big / 100;
          fit = level === 'debutant' ? h1 + .35 * h2
            : level === 'expert' ? .25 * h1 + .85 * h2 + big
            : .55 * h1 + h2 + .3 * big;
          fit = clamp(fit * 1.15);
        }
        s = blend([[fit, .62], [ramp(d.tp, 7, 12), .14], [warm(13, 22), .09], [has(d.wind) ? 1 - ramp(d.wind, 24, 40) : null, .09], [dry, .06]]);
        if (fit == null) s = null;
        break;
      }
      case 'kitesurf': case 'windsurf': case 'wingfoil':
        s = blend([[ramp(d.kite, 15, 65), .65], [warm(14, 24), .15], [sunny, .1], [has(d.big) ? 1 - d.big / 100 : null, .1]]);
        if (has(d.gust) && d.gust > 48) s *= .85;
        break;
      case 'paddle': case 'kayak':
        s = blend([[still, .3], [calm, .25], [air, .2], [sunny, .15], [dry, .1]]);
        break;
      default:
        s = blend([[air, .4], [sunny, .3], [dry, .3]]);
    }
    return s == null ? null : Math.round(clamp(s) * 100) / 100;
  }
  const LEVELS = [.38, .55, .72];
  /* 0 = peu favorable, 1 = possible, 2 = bon, 3 = top */
  const level = s => s == null ? null : s >= LEVELS[2] ? 3 : s >= LEVELS[1] ? 2 : s >= LEVELS[0] ? 1 : 0;

  /* Les 12 notes d’une activité. */
  function year(c, act, lvl) {
    const out = [];
    for (let m = 0; m < 12; m++) out.push(score(act, month(c, m), lvl));
    return out;
  }
  /* Meilleurs mois : ceux à moins de 0,08 de la meilleure note (et au moins « possible »), groupés en plages. */
  function best(scores) {
    const ok = scores.filter(has);
    if (!ok.length) return { months: [], ranges: [], top: null };
    const top = Math.max(...ok);
    const months = scores.map((s, m) => (has(s) && s >= top - .08 && s >= LEVELS[0]) ? m : -1).filter(m => m >= 0);
    return { months, ranges: ranges(months), top };
  }
  /* [0,1,2,10,11] → [[10,2]] (plage circulaire novembre → mars) */
  function ranges(months) {
    if (!months.length) return [];
    if (months.length === 12) return [[0, 11]];
    const set = new Set(months), out = [];
    let start = months.find(m => !set.has((m + 11) % 12));
    if (start === undefined) return [[0, 11]];
    const seen = new Set();
    for (let k = 0; k < 12; k++) {
      const m = (start + k) % 12;
      if (!set.has(m) || seen.has(m)) continue;
      let e = m; seen.add(m);
      while (set.has((e + 1) % 12) && !seen.has((e + 1) % 12)) { e = (e + 1) % 12; seen.add(e); }
      out.push([m, e]);
    }
    return out;
  }

  /* Planificateur par mois : la vue légère [eau, air max, soleil, jours de pluie, % ventés, houle×10, % calme]. */
  const CRITERIA = {
    warm: r => has(r[0]) && r[0] >= 24,
    mild: r => has(r[0]) && r[0] >= 20,
    sun: r => has(r[2]) && r[2] >= 8,
    dry: r => has(r[3]) && r[3] <= 7,
    waves: r => has(r[5]) && r[5] >= 10 && r[5] <= 25,
    big: r => has(r[5]) && r[5] > 22,
    wind: r => has(r[4]) && r[4] >= 50,
    calm: r => has(r[6]) && r[6] >= 60,
    hot: r => has(r[1]) && r[1] >= 27
  };
  function lite(rec, m) {
    if (!rec) return null;
    return rec.map(v => (Array.isArray(v) ? v[m] : null));
  }
  function matches(rec, m, crit) {
    const r = lite(rec, m);
    if (!r) return false;
    return (crit || []).every(k => CRITERIA[k] ? CRITERIA[k](r) : true);
  }

  /* Lever et coucher du soleil (algorithme NOAA simplifié), en heures UTC décimales ; null si jour/nuit polaire. */
  function sunTimes(date, lat, lon) {
    const rad = Math.PI / 180;
    const start = Date.UTC(date.getUTCFullYear(), 0, 0);
    const doy = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 864e5);
    const g = 2 * Math.PI / 365 * (doy - 1);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const cosH = (Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(dec))) - Math.tan(lat * rad) * Math.tan(dec);
    if (cosH > 1 || cosH < -1) return null;
    const ha = Math.acos(cosH) / rad;
    const noon = 720 - 4 * lon - eq;
    return { rise: (noon - 4 * ha) / 60, set: (noon + 4 * ha) / 60, noon: noon / 60 };
  }

  /* Secteur (0 = nord … 7 = nord-ouest) en angle et en mots. */
  const SECTOR_DEG = s => s * 45;
  const DIR_FROM = ['du nord', 'du nord-est', 'd’est', 'du sud-est', 'du sud', 'du sud-ouest', 'd’ouest', 'du nord-ouest'];

  const api = { clamp, ramp, blend, month, score, level, year, best, ranges, LEVELS, CRITERIA, lite, matches, sunTimes, SECTOR_DEG, DIR_FROM, WATER_ACTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SpotDataModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
