/* Dernier relevé gardé sur l'appareil (lot 1, nov. 2026) : logique pure, sans DOM ni réseau. Le même fichier sert dans
   l'app (window.ConditionsModel) et dans les tests Node (tests/conditions-lot1.test.js).

   POURQUOI. Sans réseau, ou quand le service météo refuse, chaque ligne de l'accueil disait seulement « Conditions
   indisponibles ». L'app garde maintenant, pour chaque spot dont elle a lu les conditions, le DERNIER relevé et son heure ;
   sans relevé du tout, elle montre l'eau et la saison du mois (normales déjà sur l'appareil).

   RÈGLES (à relire avant de toucher quoi que ce soit) :
     1. Un relevé porte toujours son heure réelle de mesure (at, en ms), jamais l'heure de sa lecture.
     2. Relevé de 3 h ou moins : ses chiffres s'affichent avec « Relevé à 7 h 50 ». Son verdict (bon, possible, pas
        aujourd'hui) et son créneau ne sont repris que s'il a été calculé le MÊME JOUR, pour le même sport et le même
        niveau, et seulement tant que son créneau n'est pas terminé (v.until) : sinon les chiffres seuls.
     3. Relevé de plus de 3 h : chiffres grisés, heure ET date (« Relevé hier à 7 h 50 »), JAMAIS de verdict ni de créneau.
        Un vieux relevé ne donne donc jamais « Bon pour toi ».
     4. Relevé de plus de 7 jours, daté d'un instant futur (horloge de l'appareil changée) ou illisible : ignoré.
     5. Sans relevé exploitable : eau et saison du mois (data/climate.json et data/seasons.json, repères indicatifs, étiquetés
        comme une moyenne). Aucune valeur n'est inventée : sans donnée, la ligne le dit.
   La clé de stockage commence par ob_ (et non oceanbuddy_) : tout ce qui commence par oceanbuddy_ est recopié dans les
   préférences natives ; un relevé n'a pas à l'être. Elle est ajoutée à l'effacement des données (privacy.js).

   Forme gardée : { [spotId]: { at, inland, now: {windKmh, windDir, swellM, swellS, waterC}, v?: {key, verdict, slot, day, until?, next?} } }
   (valeurs métriques : les unités choisies ne changent que l'affichage). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ConditionsModel = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  'use strict';
  const KEY = 'ob_conditions_v1';
  const HOUR = 3600e3, DAY = 24 * HOUR;
  const STALE_MS = 3 * HOUR;        /* au-delà : chiffres grisés, aucun verdict */
  const MAX_AGE_MS = 7 * DAY;       /* au-delà : relevé oublié */
  const MAX_ENTRIES = 60;
  const FUTURE_SLACK = 5 * 60e3;    /* tolérance sur l'horloge de l'appareil */
  const NOW_FIELDS = ['windKmh', 'windDir', 'swellM', 'swellS', 'waterC'];
  const VERDICTS = ['bon', 'possible', 'non'];
  const num = v => (v != null && v !== '' && Number.isFinite(+v) ? +v : null);

  /* ---------- Garde : lecture, écriture, oubli ---------- */
  function cleanNow(n) {
    if (!n || typeof n !== 'object') return null;
    const out = {};
    for (const k of NOW_FIELDS) out[k] = num(n[k]);
    return NOW_FIELDS.some(k => out[k] != null) ? out : null;
  }
  function cleanRec(r) {
    if (!r || typeof r !== 'object') return null;
    const at = num(r.at), now = cleanNow(r.now);
    if (at == null || at <= 0 || !now) return null;
    const out = { at, inland: !!r.inland, now };
    const v = r.v;
    if (v && typeof v === 'object' && typeof v.key === 'string' && VERDICTS.includes(v.verdict)) {
      out.v = { key: v.key, verdict: v.verdict, slot: typeof v.slot === 'string' ? v.slot : null, day: v.day === 'tomorrow' ? 'tomorrow' : 'today' };
      if (num(v.until) != null && +v.until > 0) out.v.until = +v.until;
      const n = v.next;
      if (n && typeof n === 'object' && (n.verdict === 'bon' || n.verdict === 'possible') && typeof n.slot === 'string') out.v.next = { verdict: n.verdict, slot: n.slot, day: 'tomorrow' };
    }
    return out;
  }
  /* Texte du stockage -> table propre (jamais d'erreur : texte vide, cassé ou étranger = table vide). */
  function parse(raw) {
    let o = raw;
    if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (e) { o = null; } }
    const out = {};
    if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
    for (const id of Object.keys(o)) { const r = cleanRec(o[id]); if (r && typeof id === 'string' && id) out[id] = r; }
    return out;
  }
  const serialize = map => JSON.stringify(map || {});
  /* Les relevés trop vieux sont oubliés, puis les plus anciens au-delà de MAX_ENTRIES. */
  function prune(map, nowMs) {
    const live = Object.keys(map).filter(id => { const a = map[id].at; return a <= nowMs + FUTURE_SLACK && nowMs - a <= MAX_AGE_MS; });
    live.sort((a, b) => map[b].at - map[a].at);
    const out = {};
    for (const id of live.slice(0, MAX_ENTRIES)) out[id] = map[id];
    return out;
  }
  /* Garde un relevé : le plus récent l'emporte (un relevé plus ancien que celui déjà gardé ne le remplace pas). */
  function remember(map, id, rec, nowMs) {
    const next = Object.assign({}, map || {});
    const r = cleanRec(rec);
    if (!id || !r) return prune(next, nowMs);
    if (!next[id] || r.at >= next[id].at) next[id] = r;
    return prune(next, nowMs);
  }
  function recall(map, id, nowMs) {
    const r = map && map[id];
    if (!r) return null;
    if (r.at > nowMs + FUTURE_SLACK || nowMs - r.at > MAX_AGE_MS) return null;
    return r;
  }
  /* Enregistrement à garder pour une entrée OceanVerdict calculée en ligne (entrée.now, .at, .inland, verdict et créneau). */
  function recordOf(entry, key) {
    if (!entry || !entry.now || !(entry.at > 0)) return null;
    const rec = { at: entry.at, inland: !!entry.inland, now: entry.now };
    if (VERDICTS.includes(entry.verdict) && typeof key === 'string') {
      rec.v = { key, verdict: entry.verdict, slot: entry.slot || null, day: entry.day === 'tomorrow' ? 'tomorrow' : 'today' };
      if (entry.until > 0) rec.v.until = entry.until;
      if (entry.next) rec.v.next = entry.next;
    }
    return cleanRec(rec);
  }

  /* ---------- Âge, jour, texte de l'heure ---------- */
  const age = (rec, nowMs) => nowMs - rec.at;
  const isStale = (rec, nowMs) => age(rec, nowMs) > STALE_MS;
  function dayStart(ms) { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
  const sameDay = (a, b) => dayStart(a) === dayStart(b);
  /* 0 = aujourd'hui, 1 = hier, 2 et plus : plus ancien (jours du calendrier de l'appareil). */
  const daysAgo = (at, nowMs) => Math.round((dayStart(nowMs) - dayStart(at)) / DAY);

  /* Entrée OceanVerdict reconstruite d'un relevé gardé (hors contrat de base : kept, stale). Voir les règles en tête. */
  function keptEntry(rec, o) {
    if (!rec) return null;
    const nowMs = o.now, danger = o.danger == null ? null : o.danger;
    const out = { now: Object.assign({}, rec.now), verdict: null, slot: null, day: 'today', danger, at: rec.at, inland: !!rec.inland, kept: true };
    if (isStale(rec, nowMs)) { out.stale = true; return out; }
    /* Créneau déjà terminé (rec.v.until : fin réelle de sa dernière heure) : plus de verdict, les chiffres et l'heure seuls. */
    if (rec.v && rec.v.until > 0 && nowMs >= rec.v.until) return out;
    if (rec.v && rec.v.key === o.key && sameDay(rec.at, nowMs)) {
      out.verdict = rec.v.verdict; out.slot = rec.v.slot; out.day = rec.v.day;
      if (rec.v.next) out.next = Object.assign({}, rec.v.next);
    }
    return out;
  }

  /* « 7 h 50 » en français, l'heure de la langue ailleurs (comme le point de fraîcheur de l'accueil). */
  const hmCache = new Map();
  function timeText(at, lang, locale) {
    const d = new Date(at);
    if (/^fr/.test(lang || 'fr')) return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
    const loc = locale || lang;
    let f = hmCache.get(loc);
    if (!f) { try { f = new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit' }); } catch (e) { f = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }); } hmCache.set(loc, f); }
    return f.format(d);
  }
  const dayCache = new Map();
  function dateText(at, lang, locale) {
    const loc = locale || lang || 'fr';
    let f = dayCache.get(loc);
    if (!f) { try { f = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short' }); } catch (e) { f = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }); } dayCache.set(loc, f); }
    return f.format(new Date(at));
  }
  /* Quel gabarit dire : l'heure seule pour un relevé récent du jour ; avec le jour pour un relevé grisé (plus de 3 h),
     « aujourd'hui », « hier » ou la date. Les gabarits sont les clés du dictionnaire de l'app (traduits à la main). */
  const STAMP = {
    time: 'Relevé à {0}',
    today: 'Relevé aujourd’hui à {0}',
    yesterday: 'Relevé hier à {0}',
    date: 'Relevé le {0} à {1}'
  };
  function stampParts(rec, nowMs) {
    const d = daysAgo(rec.at, nowMs), stale = isStale(rec, nowMs);
    if (!stale && d === 0) return { tpl: STAMP.time, args: ['time'] };
    if (d === 0) return { tpl: STAMP.today, args: ['time'] };
    if (d === 1) return { tpl: STAMP.yesterday, args: ['time'] };
    return { tpl: STAMP.date, args: ['date', 'time'] };
  }
  /* tr : traducteur (obT) ; renvoie la phrase écrite dans la langue. */
  function stampText(rec, nowMs, ctx) {
    const c = ctx || {}, tr = c.tr || (s => s), p = stampParts(rec, nowMs);
    const vals = { time: timeText(rec.at, c.lang, c.locale), date: dateText(rec.at, c.lang, c.locale) };
    let s = tr(p.tpl);
    p.args.forEach((k, i) => { s = s.split('{' + i + '}').join(vals[k]); });
    return s;
  }

  /* ---------- Sans relevé : l'eau et la saison du mois ---------- */
  /* sea : températures mensuelles (12 valeurs, normales NOAA de data/climate.json) ; months : mois « prudents » de
     data/seasons.json (0 = janvier) ; month : mois de l'appareil. Rien de connu : null, la ligne le dit. */
  function climate({ sea, months, month, inland }) {
    const m = Number.isInteger(month) ? month : new Date().getMonth();
    const seaC = !inland && Array.isArray(sea) && num(sea[m]) != null ? Math.round(+sea[m]) : null;
    const list = Array.isArray(months) ? months.filter(x => Number.isInteger(x) && x >= 0 && x <= 11) : null;
    const known = !!list && list.length > 0;
    const inSeason = known ? list.includes(m) : null;
    if (seaC == null && !known) return null;
    return { month: m, seaC, inSeason, months: known ? list.slice() : null };
  }

  /* ---------- « Bon aujourd'hui » sans position : la région des favoris ---------- */
  const R = Math.PI / 180;
  function km(a, b) {
    const dLa = (b.lat - a.lat) * R, dLo = (b.lon - a.lon) * R;
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * R) * Math.cos(b.lat * R) * Math.sin(dLo / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, h)));
  }
  /* Point de repère de la région des favoris : le favori le plus central (celui dont la somme des distances aux autres est
     la plus petite). Un favori réel, jamais un barycentre qui tomberait en pleine mer ou entre deux continents. */
  function regionAnchor(points) {
    const pts = (points || []).filter(p => p && Number.isFinite(p.lat) && Number.isFinite(p.lon));
    if (!pts.length) return null;
    if (pts.length === 1) return { lat: pts[0].lat, lon: pts[0].lon, n: 1 };
    let best = null, bestSum = Infinity;
    for (const p of pts) {
      const sum = pts.reduce((t, q) => t + km(p, q), 0);
      if (sum < bestSum) { bestSum = sum; best = p; }
    }
    return { lat: best.lat, lon: best.lon, n: pts.length };
  }

  /* ---------- Tirer pour rafraîchir ---------- */
  const PULL_TRIGGER = 72;      /* px à tirer avant de rafraîchir */
  const PULL_MIN_GAP = 20e3;    /* pas plus d'un rafraîchissement toutes les 20 s (quota du service météo) */
  const pullState = (dy, threshold) => (dy >= (threshold || PULL_TRIGGER) ? 'ready' : dy > 8 ? 'pulling' : 'idle');
  const canRefresh = (lastMs, nowMs) => !(lastMs > 0) || nowMs - lastMs >= PULL_MIN_GAP;

  return { KEY, STALE_MS, MAX_AGE_MS, MAX_ENTRIES, STAMP, parse, serialize, prune, remember, recall, recordOf, age, isStale, sameDay, daysAgo,
    keptEntry, timeText, dateText, stampParts, stampText, climate, regionAnchor, PULL_TRIGGER, PULL_MIN_GAP, pullState, canRefresh };
});
