/* Verdict « pour toi » de plusieurs spots à la fois (interface v2, 19 novembre 2026).
   Sert l'accueil (Mes spots, Bon aujourd'hui) et la liste d'Explorer : conditions du moment et pastille de couleur
   (bon pour toi, possible, pas aujourd'hui) avec les heures, sans ouvrir chaque fiche.

   CONTRAT (ne pas changer sans prévenir les autres écrans) :
     OceanVerdict.forSpots(ids, opts?) -> Promise<Map<id, entrée>>
       ids  : identifiants de spots (ceux de openSpot).
       opts : { sport, level } ; par défaut le sport et le niveau enregistrés de l'utilisateur.
     OceanVerdict.cached(id, opts?) -> entrée | null    lecture immédiate du cache, pour un premier rendu sans attente.
     OceanVerdict.html(entrée) -> chaîne HTML           .ui-cond et .ui-verdict prêts à poser (ui-v2.css).

     entrée = {
       now:     { windKmh, windDir, swellM, swellS, waterC } | null   valeurs du moment ; null si indisponible ;
       verdict: 'bon' | 'possible' | 'non' | null                     null : pas de calcul pour ce sport ou ce niveau ;
       slot:    '10 h à 13 h' | null                                   heures du créneau, déjà écrites pour l'affichage ;
       day:     'today' | 'tomorrow'                                   le soir, le créneau de demain ;
       danger:  0 à 4 | null                                           niveau de danger du spot, jamais caché s'il est connu ;
       at:      horodatage de la mesure (ms)
     }

   Source des calculs : SpotWeatherModel.bestSlot (spot-weather-model.js) et SpotFitModel.slotSummary (spot-fit-model.js),
   les mêmes que « Ton créneau » de la fiche. Données : Open-Meteo, demande groupée pour plusieurs spots, cache de 30 min et
   pause après un refus, comme le reste de l'app. Aucun chiffre inventé : sans donnée, now est null et la ligne le dit.

   ÉTAT : écrit (20 novembre 2026, écran d'accueil). Le contrat ci-dessus n'a pas changé.

   COMMENT C'EST CALCULÉ
     - Activité jugée : le sport demandé si le spot le propose, sinon la première activité du spot (comme la fiche,
       detailAct d'app.js). Niveau : celui des Réglages.
     - Créneau : SpotWeatherModel.hours() puis bestSlot() sur aujourd'hui, à partir de l'heure locale du spot ;
       s'il ne reste plus d'heure de jour (status « night »), bestSlot() sur demain et day = 'tomorrow'.
       « bon » = créneau dont toutes les heures sont « dans tes repères » ; « possible » = créneau « possible, sans plus » ;
       « non » = aucun créneau ; null = pas de seuil (plongée, surf expert, niveau non choisi) ou prévision incomplète.
     - Heures : celles du spot, écrites comme dans la fiche (heure de début de la première et de la dernière heure du
       créneau). Une seule heure : « 10 h ».
     - Danger : dangerGauge (app.js), la jauge de la fiche. null = non évalué (jamais « sans danger »).

   DEMANDES
     - Une demande « prévision » et une demande « marine » par lot de LOT spots (plusieurs latitudes et longitudes dans la
       même adresse), sur 2 jours, heure par heure, avec les valeurs du moment. Les spots de mer et les plans d'eau
       intérieurs partent dans des lots séparés : chacun garde la maille de sa fiche (mer ou terre), donc les mêmes chiffres.
     - Open-Meteo compte un appel par lieu (en-tête X-RateLimit-Cost : 3 pour 3 lieux, vérifié le 20 novembre 2026) ;
       limites gratuites : 600 appels par minute, 5 000 par heure, 10 000 par jour. Un spot coûte donc 2 appels par
       demi-heure. Ne demander que les lignes visibles.
     - Cache : meteoCached (app.js), 30 min par adresse, et pause de 2 min après un refus 429 ou 503, partagés avec le
       reste de l'app. En plus, chaque spot garde sa réponse 30 min en mémoire : cached() répond tout de suite et un
       spot déjà reçu n'est pas redemandé.

   AJOUTS (facultatifs, hors contrat ; rien n'oblige à s'en servir) :
     entrée.inland                                        vrai pour un plan d'eau intérieur : html() n'y montre que le vent
                                                          (en mer, une houle ou une eau manquante s'écrit « — ») ;
     OceanVerdict.hasVerdict(id, opts?) -> booléen        une pastille sera-t-elle calculée pour ce spot (sport, niveau) ?
     OceanVerdict.pending(id, opts?) -> chaîne HTML       place réservée pendant l'attente : mêmes lignes, mêmes hauteurs ;
     OceanVerdict.animate(élément)                        chiffres qui montent jusqu'à leur valeur (une fois, rien en
                                                          mouvement réduit) ; à appeler juste après avoir posé html().
     OceanVerdict.LOT                                     taille d'un lot. */
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && !!module.exports;
  const W = root.SpotWeatherModel || (node ? require('./spot-weather-model.js') : null);
  const F = root.SpotFitModel || (node ? require('./spot-fit-model.js') : null);
  const TTL = 30 * 60 * 1000, PAUSE = 2 * 60 * 1000, LOT = 10;
  const FORECAST = 'https://api.open-meteo.com/v1/forecast', MARINE = 'https://marine-api.open-meteo.com/v1/marine';
  const HOURLY = 'wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,is_day';
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => (v != null && v !== '' && Number.isFinite(+v) ? +v : null);

  /* ---------- Ce que le module lit dans l'app (remplaçable dans les tests : OceanVerdict.setup) ---------- */
  let byId = null;
  const times = new WeakMap();
  const env = {
    now: () => Date.now(),
    spot(id) {
      if (typeof SPOTS === 'undefined') return null;
      if (!byId || byId.n !== SPOTS.length) { byId = new Map(SPOTS.map(s => [s.id, s])); byId.n = SPOTS.length; }
      return byId.get(id) || null;
    },
    coords: s => (typeof COORDS !== 'undefined' && COORDS[s.id]) || null,
    inland: s => (typeof isInland === 'function' ? isInland(s) : ['lake', 'inland'].includes(s && s.waterType)),
    sports: s => (typeof spotSports === 'function' ? spotSports(s) : Array.isArray(s && s.sports) ? s.sports : []),
    /* Niveau de danger : la jauge calculée de la fiche (points de danger de l'onglet Sécurité). */
    gauge: s => { try { return typeof dangerGauge === 'function' ? dangerGauge(s).n : null; } catch (e) { return null; } },
    sport: () => { try { return (typeof activeSport !== 'undefined' && activeSport) || null; } catch (e) { return null; } },
    level() {
      try { if (typeof chosenLevel !== 'undefined' && chosenLevel) return chosenLevel; } catch (e) {}
      try { const d = JSON.parse(localStorage.getItem('oceanbuddy_v1') || 'null'); return (d && d.level) || null; } catch (e) { return null; }
    },
    /* Même cache et même pause que les aperçus de conditions (meteoCached, app.js) ; sans l'app, les mêmes règles ici. */
    load: url => (typeof meteoCached === 'function' ? meteoCached(url) : ownLoad(url)),
    /* Heure réelle du relevé d'une réponse reprise du cache (meteoTimes, app.js). */
    stamp: d => { try { if (typeof meteoTimes !== 'undefined' && d && typeof d === 'object') return meteoTimes.get(d) || 0; } catch (e) {} return (d && typeof d === 'object' && times.get(d)) || 0; },
    lang: () => (root.OB_I18N && root.OB_I18N.lang) || 'fr',
    locale: () => (root.OB_I18N && root.OB_I18N.locale) || 'fr-FR',
    t: s => (typeof root.obT === 'function' ? root.obT(s) : s),
    num: (v, d) => (typeof root.obNum === 'function' ? root.obNum(v, d) : (+v).toFixed(d).replace('.', ',')),
    fetch: url => fetch(url),
    reduced: () => { try { return document.body.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; } }
  };

  /* Sans meteoCached (tests, page sans app.js) : mêmes règles, 30 min par adresse et 2 min de pause après un 429 ou un 503. */
  let pauseUntil = 0;
  const own = new Map();
  function ownLoad(url) {
    const t = env.now(), hit = own.get(url);
    if (hit && t - hit.t < TTL) return Promise.resolve(hit.d);
    if (t < pauseUntil) return Promise.resolve(null);
    let p;
    try { p = Promise.resolve(env.fetch(url)); } catch (e) { return Promise.resolve(null); }
    return p.then(r => {
      if (r.status === 429 || r.status === 503) { pauseUntil = env.now() + PAUSE; throw Error('busy'); }
      if (!r.ok) throw Error('Conditions indisponibles');
      return r.json();
    }).then(d => { const at = env.now(); own.set(url, { t: at, d }); if (d && typeof d === 'object') times.set(d, at); return d; }).catch(() => null);
  }

  /* ---------- Calcul d'une entrée (pur : une réponse prévision, une réponse marine, une heure) ---------- */
  const empty = danger => ({ now: null, verdict: null, slot: null, day: 'today', danger: danger == null ? null : danger, at: 0 });
  const dangerOf = s => { const n = num(env.gauge(s)); return n == null ? null : Math.max(0, Math.min(4, Math.round(n))); };
  /* Activité jugée : le sport demandé si le spot le propose, sinon sa première activité (detailAct, app.js). */
  function actOf(s, sport) {
    const list = env.sports(s) || [];
    return sport && sport !== 'all' && list.indexOf(sport) >= 0 ? sport : list[0] || null;
  }
  const want = o => { const x = o || {}; return { sport: x.sport !== undefined ? x.sport : env.sport(), level: x.level !== undefined ? x.level : env.level() }; };
  const ruleOf = (s, o) => (W ? W.rule(actOf(s, o.sport), env.inland(s), o.level || null) : { ok: false, reason: 'sport' });

  /* « 10 h » en français et en espagnol, l'heure de la langue ailleurs (comme la fiche). */
  let hourFmt = null, hourLoc = '';
  function hour(h) {
    if (/^(fr|es)/.test(env.lang())) return `${h} h`;
    try {
      const loc = env.locale();
      if (!hourFmt || hourLoc !== loc) { hourFmt = new Intl.DateTimeFormat(loc, { hour: 'numeric', timeZone: 'UTC' }); hourLoc = loc; }
      return hourFmt.format(Date.UTC(2000, 0, 1, h));
    } catch (e) { return h + ' h'; }
  }
  /* « 10 h à 13 h » : le mot de liaison et « Demain » passent par le dictionnaire (obT), le reste par l'heure de la langue. */
  const obT = s => env.t(s);
  const range = (a, b) => (a === b ? hour(a) : [hour(a), obT('à'), hour(b)].join(' '));

  function compute(s, rec, o, nowMs) {
    const danger = dangerOf(s);
    if (!W || !F || !rec || !rec.weather) return empty(danger);
    const inland = !!env.inland(s), wx = rec.weather, mar = inland ? null : rec.marine || null;
    const list = W.hours(wx, mar || {}, { inland });
    const nowIso = W.localHourIso(wx.utc_offset_seconds, nowMs);
    const row = list.find(x => String(x.t).slice(0, 13) === nowIso) || null;
    const cur = wx.current || {}, mc = (mar && mar.current) || {};
    const first = (a, b) => (num(a) != null ? num(a) : num(b));
    const now = {
      windKmh: first(cur.wind_speed_10m, row && row.wind),
      windDir: first(cur.wind_direction_10m, row && row.windDir),
      swellM: inland ? null : first(mc.wave_height, row && row.wave),
      swellS: inland ? null : first(mc.wave_period, row && row.period),
      waterC: inland ? null : num(mc.sea_surface_temperature)
    };
    const out = empty(danger);
    out.at = rec.at || 0;
    out.inland = inland;
    if (Object.keys(now).some(k => now[k] != null)) out.now = now;
    const act = actOf(s, o.sport), level = o.level || null, rule = W.rule(act, inland, level);
    if (!rule.ok || !list.length) return out;
    const base = { act, inland, level, catalogWind: s.wind };
    const today = nowIso.slice(0, 10);
    let r = W.bestSlot(list, Object.assign({ date: today, nowIso }, base)), day = 'today';
    if (r.status === 'night') {
      /* Plus d'heure de jour aujourd'hui : le créneau de demain. */
      const tomorrow = (list.find(x => x.date > today) || {}).date;
      if (tomorrow) { r = W.bestSlot(list, Object.assign({ date: tomorrow, nowIso: null }, base)); day = 'tomorrow'; }
    }
    const x = F.slotSummary(rule, r);
    if (x.status === 'ok') { out.verdict = x.quality === 'good' ? 'bon' : 'possible'; out.slot = range(x.start, x.end); out.day = day; }
    else if (x.status === 'none') { out.verdict = 'non'; out.day = day; }
    return out;
  }

  /* ---------- Cache par spot et demandes groupées ---------- */
  const store = new Map();   // id -> { weather, marine, at, full, memo }
  const flying = new Map();  // id -> promesse de la demande en cours
  const fresh = (rec, t) => !!rec && t - rec.at < TTL;
  const asList = d => (d && typeof d === 'object' && !d.error ? (Array.isArray(d) ? d : [d]) : []);
  function urls(points, inland) {
    const lat = points.map(c => c.lat).join(','), lon = points.map(c => c.lon).join(',');
    return {
      weather: `${FORECAST}?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m&hourly=${HOURLY}&forecast_days=2&wind_speed_unit=kmh&timezone=auto&cell_selection=${inland ? 'land' : 'sea'}`,
      marine: inland ? null : `${MARINE}?latitude=${lat}&longitude=${lon}&current=wave_height,wave_period,sea_surface_temperature&hourly=wave_height,wave_period,wave_direction&forecast_days=2&timezone=auto&cell_selection=sea`
    };
  }
  function fetchLot(spots, inland) {
    const u = urls(spots.map(s => env.coords(s)), inland);
    return Promise.all([env.load(u.weather), u.marine ? env.load(u.marine) : Promise.resolve(null)]).then(([w, m]) => {
      const wa = asList(w), ma = asList(m), t = env.now();
      const at = Math.min(env.stamp(w) || t, (u.marine && m && env.stamp(m)) || t);
      spots.forEach((s, i) => {
        const wx = wa[i] || null, mx = ma[i] || null;
        if (!wx || wx.error) return;
        store.set(s.id, { weather: wx, marine: mx && !mx.error ? mx : null, at, full: inland || !!(mx && !mx.error), memo: null });
      });
    });
  }
  function entry(id, o, t) {
    const s = env.spot(id);
    if (!s) return empty(null);
    const rec = store.get(id);
    if (!fresh(rec, t)) return empty(dangerOf(s));
    const key = [o.sport || '', o.level || '', env.lang(), Math.floor(t / 9e5)].join('|');
    if (!rec.memo || rec.memo.key !== key) rec.memo = { key, e: compute(s, rec, o, t) };
    return rec.memo.e;
  }

  const api = root.OceanVerdict = root.OceanVerdict || {};
  api.LOT = LOT;
  api.forSpots = function (ids, opts) {
    const o = want(opts), list = [...new Set(Array.isArray(ids) ? ids : [])], t = env.now();
    const need = [];
    for (const id of list) {
      const s = env.spot(id), c = s && env.coords(s);
      if (!s || !c || num(c.lat) == null || num(c.lon) == null || flying.has(id)) continue;
      const rec = store.get(id);
      if (rec && rec.full && fresh(rec, t)) continue;
      need.push(s);
    }
    for (const inland of [false, true]) {
      const group = need.filter(s => !!env.inland(s) === inland);
      for (let i = 0; i < group.length; i += LOT) {
        const lot = group.slice(i, i + LOT);
        let p;
        try { p = fetchLot(lot, inland); } catch (e) { p = Promise.resolve(); }
        p = p.catch(() => {}).then(() => { lot.forEach(s => flying.delete(s.id)); });
        lot.forEach(s => flying.set(s.id, p));
      }
    }
    return Promise.all(list.map(id => flying.get(id)).filter(Boolean)).then(() => { const at = env.now(); return new Map(list.map(id => [id, entry(id, o, at)])); });
  };
  api.cached = function (id, opts) {
    const t = env.now();
    return fresh(store.get(id), t) && env.spot(id) ? entry(id, want(opts), t) : null;
  };
  api.hasVerdict = function (id, opts) { const s = env.spot(id); return !!s && ruleOf(s, want(opts)).ok; };

  /* ---------- Affichage : ligne de conditions puis verdict (ui-v2.css) ---------- */
  /* Pictogrammes au trait de la fiche (spot-before.js, ICON) : vent, houle, eau. */
  const IC = {
    wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 13.5h15.5a3 3 0 1 1-3 3M3 18h6"/>',
    wave: '<path d="M2 17c2 0 3-1.6 5-1.6S10 17 12 17s3-1.6 5-1.6S20 17 22 17"/><path d="M3 12.4c2.2-4.4 6.6-6.2 10.8-4.8-2 .6-3.1 2.4-2.6 4.8"/>',
    temp: '<path d="M10 13.6V5a2 2 0 1 1 4 0v8.6a4 4 0 1 1-4 0z"/><path d="M12 9.5v6"/>'
  };
  const NAME = { wind: 'Vent', wave: 'Houle', temp: 'Eau' };
  const UNIT = { wind: 'km/h', wave: 'm', temp: '°C' };
  const DEC = { wind: 0, wave: 1, temp: 0 };
  const ic = k => `<svg class="ui-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${NAME[k]}">${IC[k]}</svg>`;
  const shown = (v, d) => (d ? env.num(v, d) : String(Math.round(v)));
  function reading(k, v) {
    if (v == null) return `<span class="is-none">${ic(k)}—</span>`;
    const d = DEC[k], n = d ? Math.round(v * 10) / 10 : Math.round(v);
    return `<span>${ic(k)}<span class="ui-n" data-ui-n="${n}" data-ui-d="${d}">${esc(shown(n, d))}</span><small>${UNIT[k]}</small></span>`;
  }
  const LABEL = { bon: 'Bon pour toi', possible: 'Possible', non: 'Pas aujourd’hui' };
  api.html = function (e) {
    if (!e || !e.now) return '<p class="ui-cond"><span class="is-none">Conditions indisponibles</span></p>';
    const n = e.now, sea = e.inland === false || n.swellM != null || n.swellS != null || n.waterC != null;
    /* Plan d'eau intérieur : ni houle marine ni température de mer, seulement le vent. */
    let h = `<p class="ui-cond">${reading('wind', n.windKmh)}${sea ? reading('wave', n.swellM) + reading('temp', n.waterC) : ''}</p>`;
    if (LABEL[e.verdict]) {
      const tomorrow = e.day === 'tomorrow';
      const label = e.verdict === 'non' && tomorrow ? 'Pas demain' : LABEL[e.verdict];
      const when = e.slot ? (tomorrow ? obT('Demain') + ' ' + e.slot : e.slot) : '';
      h += `<p class="ui-verdict" data-v="${e.verdict}"><b>${label}</b>${when ? `<span>${esc(when)}</span>` : ''}</p>`;
    }
    return h;
  };
  /* Place réservée : les mêmes lignes que html(), pictogrammes compris, les chiffres en attente. */
  api.pending = function (id, opts) {
    const s = env.spot(id), wait = k => `<span>${ic(k)}<i class="ui-skel"></i></span>`;
    const sea = !s || !env.inland(s);
    return `<p class="ui-cond is-wait" aria-hidden="true">${wait('wind')}${sea ? wait('wave') + wait('temp') : ''}</p>`
      + (s && ruleOf(s, want(opts)).ok ? '<p class="ui-verdict is-wait" aria-hidden="true"><b class="ui-skel"></b></p>' : '');
  };
  /* Chiffres qui montent jusqu'à leur valeur, une seule fois par chiffre, en 600 ms. La largeur finale est gardée
     pendant le décompte (rien ne bouge autour). Mouvement réduit : rien, les valeurs sont déjà écrites. */
  api.animate = function (el) {
    if (!el || typeof el.querySelectorAll !== 'function' || env.reduced() || typeof requestAnimationFrame !== 'function') return;
    const items = [...el.querySelectorAll('.ui-n[data-ui-n]:not([data-ui-done])')].map(n => ({ n, to: +n.dataset.uiN, d: +n.dataset.uiD || 0, text: n.textContent }))
      .filter(x => Number.isFinite(x.to) && x.to > 0);
    if (!items.length) return;
    const widths = items.map(x => x.n.getBoundingClientRect().width);
    items.forEach((x, i) => { x.n.dataset.uiDone = '1'; x.n.style.minWidth = widths[i].toFixed(2) + 'px'; x.n.textContent = shown(0, x.d); });
    const DUR = 600;
    let t0 = 0;
    const step = t => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / DUR), k = 1 - Math.pow(1 - p, 3);
      for (const x of items) {
        if (!x.n.isConnected) continue;
        const v = p >= 1 ? x.text : shown(x.d ? Math.round(x.to * k * 10) / 10 : Math.round(x.to * k), x.d);
        if (x.n.firstChild && x.n.firstChild.nodeType === 3) { if (x.n.firstChild.nodeValue !== v) x.n.firstChild.nodeValue = v; } else x.n.textContent = v;
        if (p >= 1) x.n.style.minWidth = '';
      }
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* Tests (Node) : remplacer ce que le module lit dans l'app, vider les caches, appeler le calcul pur. */
  api.setup = function (over) { Object.assign(env, over || {}); byId = null; hourFmt = null; return api; };
  api.reset = function (o) { store.clear(); flying.clear(); if (!o || !o.keepOwn) { own.clear(); pauseUntil = 0; } return api; };
  api.ownLoad = ownLoad;
  api.compute = (s, rec, opts, nowMs) => compute(s, rec, want(opts), nowMs == null ? env.now() : nowMs);
  api.urls = urls;
  if (node) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
