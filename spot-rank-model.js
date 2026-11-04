/* Classement des spots « pour toi » et filtres combinables d’Explorer : logique pure, sans DOM.
   Le même fichier sert dans l’app (window.SpotRank) et dans les tests Node (tests/spot-rank-model.test.js).
   Utilisé par l’accueil (bloc « Pour toi aujourd’hui », home-feed.js), la liste d’Explorer et le menu de la planète
   (app.js, ocean-map.js) et la restauration de l’historique (navigation.js).

   Critères du classement, dans cet ordre (chaque palier domine les suivants) :
     1. le sport (filtre strict quand un sport est choisi) ;
     2. l’accord avec le niveau de l’utilisateur (niveau du spot + jauge de danger calculée par app.js) ;
     3. la saison du mois (data/seasons.json : repère indicatif, jamais une prévision) ;
     4. la proximité, seulement si la position est déjà connue (jamais demandée ici) ;
     5. l’éclat de la photo (data/photo-scores.json), puis de petits départages (fiche relue, favori, tirage du jour). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpotRank = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  'use strict';
  const LEVELS = ['debutant', 'intermediaire', 'expert'];
  const levelIndex = l => { const i = LEVELS.indexOf(l); return i < 0 ? null : i; };

  /* Accord entre le niveau du spot et celui de l’utilisateur, de 0 à 3 :
       3 : à ton niveau ou en dessous ;
       2 : pas de repère (niveau non choisi, ou spot « à évaluer » pour un intermédiaire ou un expert) ;
       1 : un cran au-dessus (ou spot « à évaluer » pour un débutant, ou jauge 4 pour un intermédiaire) ;
       0 : à ne pas proposer (deux crans au-dessus, ou jauge de danger ≥ 3 pour un débutant).
     gauge : jauge de danger 1 à 4 (dangerGauge d’app.js), null = non évaluée. */
  function levelTier(spotLevel, userLevel, gauge) {
    const u = levelIndex(userLevel), s = levelIndex(spotLevel), g = Number.isFinite(gauge) ? gauge : null;
    if (u == null) return 2;
    if (u === 0 && g != null && g >= 3) return 0;
    if (s == null) return u === 0 ? 1 : 2;
    const d = s - u;
    if (d >= 2) return 0;
    if (d === 1) return u === 1 && g != null && g >= 4 ? 0 : 1;
    if (u === 1 && g != null && g >= 4) return 1;
    return 3;
  }
  /* Saison du mois m (0-11) : 2 = en saison, 1 = sans donnée, 0 = hors saison. */
  function seasonTier(months, m) {
    if (!Array.isArray(months) || !months.length) return 1;
    return months.includes(m) ? 2 : 0;
  }
  function distKm(a, b) {
    if (!a || !b || !Number.isFinite(a.lat) || !Number.isFinite(b.lat) || !Number.isFinite(a.lon) || !Number.isFinite(b.lon)) return null;
    const R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(Math.min(1, h)));
  }
  /* Tirage du jour : un nombre stable dans la journée pour un spot, différent le lendemain (0 à 1). */
  function dayHash(id, day) {
    let h = 2166136261 ^ (day | 0);
    const t = String(id);
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  const sportsOf = s => Array.isArray(s && s.sports) ? s.sports : [];

  /* Contexte : {sport, level, month, pos:{lat,lon}|null, seasons:{id:[mois]}, photo:{id:score 0-100},
     favs:Set|Array, coords:(s)=>{lat,lon}, gauge:(s)=>1..4|null, hasPhoto:(s)=>bool, day:int, jitter:nombre} */
  function explain(s, ctx = {}) {
    const m = Number.isInteger(ctx.month) ? ctx.month : new Date().getMonth();
    const gauge = ctx.gauge ? ctx.gauge(s) : null;
    const tier = levelTier(s.level, ctx.level || null, gauge);
    const months = ctx.seasons ? ctx.seasons[s.id] : null;
    const season = seasonTier(months, m);
    const c = ctx.coords ? ctx.coords(s) : s.coords;
    const dist = ctx.pos ? distKm(ctx.pos, c) : null;
    return { tier, season, dist, gauge, inSeason: season === 2, seasonKnown: season !== 1 };
  }
  function score(s, ctx = {}) {
    const e = explain(s, ctx);
    let k = e.tier * 1000 + e.season * 100;
    if (e.dist != null) k += 50 / (1 + e.dist / 250);
    const p = ctx.photo && Number.isFinite(ctx.photo[s.id]) ? ctx.photo[s.id] : 55;
    k += Math.max(0, Math.min(100, p)) / 5;
    if (ctx.hasPhoto && !ctx.hasPhoto(s)) k -= 40;
    /* Même palier : le niveau exact passe devant un spot plus facile (un expert préfère un spot d’expert). */
    const u = levelIndex(ctx.level), sl = levelIndex(s.level);
    if (u != null && sl != null && sl <= u) k += sl === u ? 10 : sl === u - 1 ? 6 : 2;
    if (s.editorialStatus === 'reviewed') k += 5;
    const favs = ctx.favs;
    if (favs && (favs.has ? favs.has(s.id) : favs.includes && favs.includes(s.id))) k += 4;
    if (ctx.jitter) k += dayHash(s.id, ctx.day || 0) * ctx.jitter;
    return k;
  }
  /* Spots triés du plus pertinent au moins pertinent ; un sport choisi filtre la liste (ctx.strict:false pour seulement trier). */
  function rank(spots, ctx = {}) {
    const list = Array.isArray(spots) ? spots : [];
    const sp = ctx.sport && ctx.sport !== 'all' ? ctx.sport : null;
    const pool = sp && ctx.strict !== false ? list.filter(s => (ctx.sports ? ctx.sports(s) : sportsOf(s)).includes(sp)) : list;
    return pool.map((s, i) => ({ s, i, k: score(s, ctx) })).sort((a, b) => b.k - a.k || a.i - b.i).map(o => o.s);
  }
  /* « Pour toi aujourd’hui » : n spots, jamais un spot déconseillé (palier 0), au plus perCountry par pays,
     seulement avec une vraie photo si ctx.hasPhoto est fourni. Chaque élément : {spot, why}. */
  function forYou(spots, ctx = {}, opts = {}) {
    const n = opts.n || 3, perCountry = opts.perCountry || 1, used = opts.used || null;
    const out = [], per = new Map();
    for (const s of rank(spots, ctx)) {
      if (out.length >= n) break;
      if (used && used.has(s.id)) continue;
      if (ctx.hasPhoto && !ctx.hasPhoto(s)) continue;
      const why = explain(s, ctx);
      if (why.tier === 0) continue;
      const c = s.country || '';
      if ((per.get(c) || 0) >= perCountry) continue;
      per.set(c, (per.get(c) || 0) + 1);
      out.push({ spot: s, why });
    }
    return out;
  }

  /* ---------- Filtres combinables (Explorer et menu de la planète) ----------
     Un seul état, une chaîne canonique : 'all' (aucun filtre) ou des parties séparées par des virgules, dans l’ordre
     de PARTS, par exemple 'debutant,intermediaire,season'. Les anciennes valeurs simples ('debutant', 'season', 'new')
     restent valides : l’historique (OceanNavigation) relit sans peine les routes enregistrées avant. */
  const LEVEL_PARTS = ['debutant', 'intermediaire', 'expert', 'variable'];
  const PARTS = LEVEL_PARTS.concat(['season', 'new']);
  function parseFilter(f) {
    const set = new Set(String(f == null ? '' : f).split(',').map(x => x.trim()).filter(x => PARTS.includes(x)));
    return { levels: LEVEL_PARTS.filter(l => set.has(l)), season: set.has('season'), fresh: set.has('new') };
  }
  function formatFilter(p) {
    const parts = (p && p.levels ? LEVEL_PARTS.filter(l => p.levels.includes(l)) : []).concat(p && p.season ? ['season'] : [], p && p.fresh ? ['new'] : []);
    return parts.length ? parts.join(',') : 'all';
  }
  const normFilter = f => formatFilter(parseFilter(f));
  function hasPart(f, part) {
    if (part === 'all') return normFilter(f) === 'all';
    return normFilter(f).split(',').includes(part);
  }
  /* Ajoute ou retire une partie ('all' efface tout) ; force=true l’impose, force=false la retire. */
  function toggleFilter(f, part, force) {
    if (part === 'all' || !PARTS.includes(part)) return 'all';
    const set = new Set(normFilter(f).split(',').filter(x => x !== 'all'));
    const on = force === undefined ? !set.has(part) : !!force;
    if (on) set.add(part); else set.delete(part);
    return normFilter([...set].join(','));
  }
  const countParts = f => { const n = normFilter(f); return n === 'all' ? 0 : n.split(',').length; };
  /* inSeason(s) : vrai si le spot est en saison ce mois-ci (fourni par l’app). */
  function matchFilter(s, f, opts = {}) {
    const p = typeof f === 'string' || f == null ? parseFilter(f) : f;
    if (p.levels.length) { const l = LEVEL_PARTS.includes(s.level) ? s.level : 'variable'; if (!p.levels.includes(l)) return false; }
    if (p.season && !(opts.inSeason ? opts.inSeason(s) : false)) return false;
    if (p.fresh && !s.catalogNew) return false;
    return true;
  }

  return { LEVELS, LEVEL_PARTS, PARTS, levelIndex, levelTier, seasonTier, distKm, dayHash, explain, score, rank, forYou,
    parseFilter, formatFilter, normFilter, hasPart, toggleFilter, countParts, matchFilter };
});
