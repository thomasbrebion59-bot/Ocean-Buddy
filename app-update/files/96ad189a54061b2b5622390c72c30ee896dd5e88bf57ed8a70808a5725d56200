/* Météo d’un spot : calculs purs sur les réponses Open-Meteo (prévision + marine), sans DOM.
   Le même fichier sert dans l’app (window.SpotWeatherModel) et dans les tests Node.
   « Meilleur créneau » : AUCUNE règle nouvelle. Chaque heure est jugée avec les bandes et les phrases de « Lire les conditions »
   (spot-data-model.js : windBand 10/20/30 km/h, swellBand 0,6/1,2/2 m, windSide, coachKind). Le jugement « bon / possible / non »
   reprend ce que dit le texte du coach pour la même bande ; quand le coach ne fixe pas de repère (expert en surf, plongée), rien n’est calculé. */
(function (root) {
  'use strict';
  const M = root.SpotDataModel || (typeof require === 'function' ? require('./spot-data-model.js') : null);
  const has = v => v != null && v !== '' && Number.isFinite(+v);
  const num = v => (has(v) ? +v : null);
  const at = (arr, i) => (Array.isArray(arr) ? num(arr[i]) : null);

  /* Direction météo = d’où vient le vent (ou la houle). La flèche pointe vers où il va : +180°. */
  const toward = deg => (has(deg) ? (((+deg + 180) % 360) + 360) % 360 : null);
  const CARD_FR = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const CARD_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const cardinal = (deg, lang) => (has(deg) ? (lang && lang !== 'fr' ? CARD_EN : CARD_FR)[Math.round((((+deg % 360) + 360) % 360) / 45) % 8] : null);

  /* Codes WMO d’Open-Meteo → famille de ciel (un picto par famille). */
  function sky(code) {
    const c = num(code);
    if (c == null) return null;
    if (c === 0) return 'clear';
    if (c === 1 || c === 2) return 'partly';
    if (c === 3) return 'cloudy';
    if (c === 45 || c === 48) return 'fog';
    if (c >= 51 && c <= 57) return 'drizzle';
    if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return 'rain';
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
    if (c >= 95 && c <= 99) return 'storm';
    return 'cloudy';
  }
  const STORM = new Set([95, 96, 99]);

  /* Heure murale du spot (« 2026-11-03T15 ») à partir du décalage UTC renvoyé par Open-Meteo (timezone=auto). */
  function localHourIso(offsetSec, nowMs) {
    const d = new Date((nowMs == null ? Date.now() : nowMs) + (has(offsetSec) ? +offsetSec : 0) * 1000);
    return d.toISOString().slice(0, 13);
  }
  const dateOf = iso => String(iso || '').slice(0, 10);
  const hourOf = iso => { const m = /T(\d\d)/.exec(String(iso || '')); return m ? +m[1] : null; };
  const minutesOf = iso => { const m = /T(\d\d):(\d\d)/.exec(String(iso || '')); return m ? +m[1] * 60 + +m[2] : null; };

  /* Instant réel (ms) d’une heure murale renvoyée avec timezone=auto. Les deux API peuvent choisir un fuseau différent
     pour le même point (vu à Dakhla : prévision UTC+0, marine UTC+1) : on aligne donc sur l’instant, jamais sur le texte. */
  function instant(iso, offsetSec) {
    const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(String(iso || ''));
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - (has(offsetSec) ? +offsetSec : 0) * 1000 : NaN;
  }
  /* Lignes horaires fusionnées (prévision + marine), alignées sur l’instant ; t reste l’heure locale de la prévision.
     Sans marine (plan d’eau intérieur) : vagues nulles. */
  function hours(weather, marine, opts) {
    const o = opts || {}, h = (weather && weather.hourly) || {}, mh = o.inland ? {} : ((marine && marine.hourly) || {});
    const times = Array.isArray(h.time) ? h.time : [];
    const wOff = weather && weather.utc_offset_seconds, mOff = marine && has(marine.utc_offset_seconds) ? marine.utc_offset_seconds : wOff;
    const mIndex = new Map((Array.isArray(mh.time) ? mh.time : []).map((t, i) => [instant(t, mOff), i]));
    const days = (weather && weather.daily) || {};
    const sun = new Map((days.time || []).map((d, i) => [d, { rise: minutesOf((days.sunrise || [])[i]), set: minutesOf((days.sunset || [])[i]) }]));
    return times.map((t, i) => {
      const k = instant(t, wOff), j = mIndex.has(k) ? mIndex.get(k) : -1, date = dateOf(t), s = sun.get(date);
      let day = at(h.is_day, i);
      if (day == null && s && s.rise != null && s.set != null) { const mn = minutesOf(t); day = mn >= s.rise && mn < s.set ? 1 : 0; }
      return {
        t, date, hour: hourOf(t), isDay: day == null ? null : day === 1,
        temp: at(h.temperature_2m, i), wind: at(h.wind_speed_10m, i), gust: at(h.wind_gusts_10m, i), windDir: at(h.wind_direction_10m, i),
        code: at(h.weather_code, i), pop: at(h.precipitation_probability, i), rain: at(h.precipitation, i),
        wave: j >= 0 ? at(mh.wave_height, j) : null, period: j >= 0 ? at(mh.wave_period, j) : null, waveDir: j >= 0 ? at(mh.wave_direction, j) : null
      };
    });
  }

  /* Les n heures à partir de l’heure locale courante du spot (une réponse en cache peut commencer une heure plus tôt). */
  function upcoming(list, nowIso, n) {
    const k = String(nowIso || '').slice(0, 13);
    let i = list.findIndex(x => String(x.t).slice(0, 13) >= k);
    if (i < 0) i = list.length;
    return list.slice(i, i + (n || 48));
  }

  /* Pas de trou visible : en mer, on retire les heures du bord de la fenêtre où la marine n’a pas encore (ou plus) de valeur. */
  function trimMarine(list) {
    if (!list.some(x => x.wave != null)) return list;
    let a = 0, b = list.length;
    while (a < b && list[a].wave == null) a++;
    while (b > a && list[b - 1].wave == null) b--;
    return list.slice(a, b);
  }

  /* Résumé des 7 jours. La période et la direction viennent des mêmes variables que la lecture du jour (wave_*). */
  function days(weather, marine, opts) {
    const o = opts || {}, d = (weather && weather.daily) || {}, m = o.inland ? {} : ((marine && marine.daily) || {});
    const times = d.time || m.time || [];
    const mIndex = new Map((m.time || []).map((t, i) => [t, i]));
    return times.slice(0, o.count || 7).map((t, i) => {
      const j = mIndex.has(t) ? mIndex.get(t) : -1;
      return {
        date: t, tmax: at(d.temperature_2m_max, i), tmin: at(d.temperature_2m_min, i), uv: at(d.uv_index_max, i), pop: at(d.precipitation_probability_max, i),
        wind: at(d.wind_speed_10m_max, i), gust: at(d.wind_gusts_10m_max, i), windDir: at(d.wind_direction_10m_dominant, i), code: at(d.weather_code, i),
        sunrise: (d.sunrise || [])[i] || null, sunset: (d.sunset || [])[i] || null,
        wave: j >= 0 ? at(m.wave_height_max, j) : null, period: j >= 0 ? at(m.wave_period_max, j) : null
      };
    });
  }

  /* ---------- Jugement d’une heure : 2 = bon, 1 = possible, 0 = non, null = impossible à dire ----------
     Chaque branche cite la phrase de « Lire les conditions » (spot-data-model.js) qu’elle traduit. */
  const GOOD = 2, OK = 1, NO = 0;
  function waveVerdict(level, h, w, side) {
    if (h == null || w == null) return null;
    const sb = M.swellBand(h), wb = M.windBand(w);
    if (level === 'debutant') {
      if (wb === 'fort') return NO;                         // « Reste à terre aujourd’hui. »
      if (sb === 'petite') return GOOD;                     // « c’est le bon moment pour apprendre »
      if (sb === 'modeste') return OK;                      // « assez petite pour apprendre, mais elle pousse déjà »
      return NO;                                            // moyenne : « Demande conseil… » · grosse : « regarde depuis la plage »
    }
    if (level === 'intermediaire') {
      if (sb === 'grosse') return NO;                       // « seuls les pics bien protégés restent jouables »
      const swell = sb === 'modeste' ? GOOD : OK;           // modeste « jouable » · petite « vagues molles » · moyenne « choisis un pic »
      let wind;
      if (w < 10) wind = GOOD;                              // « Presque nul : surface lisse, c’est une bonne fenêtre. »
      else if (side === 'offshore') wind = w < 25 ? GOOD : NO; // « Offshore modéré… Bonne fenêtre » / « Offshore fort… Cherche un abri »
      else if (side === 'onshore') wind = w < 15 ? OK : NO;    // « Onshore léger… encore jouable » / « Onshore marqué… Attends »
      else if (side === 'cross') wind = OK;                 // « Vent de côté : la surface se dégrade »
      else wind = w < 20 ? OK : NO;                         // sens inconnu : « Modéré… regarde la surface » / « Soutenu… regarde si la surface tient »
      return Math.min(swell, wind);
    }
    return null;                                            // expert : le coach ne donne aucun seuil
  }
  function windVerdict(level, w) {
    if (w == null) return null;
    const wb = M.windBand(w);
    if (wb === 'faible') return NO;                         // « Trop faible pour tracter une aile ou une voile. »
    if (wb === 'modere') return GOOD;                       // « suffisant… sans excès »
    if (wb === 'soutenu') return OK;                        // « choisis une voile ou une aile plus petite »
    return level === 'expert' ? OK : NO;                    // « seuls les pratiquants expérimentés sortent »
  }
  function waterVerdict(w) {
    if (w == null) return null;
    const wb = M.windBand(w);
    if (wb === 'faible') return GOOD;                       // « la surface reste lisse »
    if (wb === 'modere') return OK;                         // « un peu de clapot, surtout au large »
    return NO;                                              // « le clapot grossit et fatigue vite » / « mer hachée, reste à terre »
  }
  function verdict(kind, level, x, catalogWind) {
    if (!x) return null;
    if (STORM.has(x.code)) return NO;                       // heure d’orage : jamais proposée (le coach ne la juge pas, on l’écarte par prudence)
    if (kind === 'wave') return waveVerdict(level, x.wave, x.wind, M.windSide(x.windDir, catalogWind));
    if (kind === 'wind') return windVerdict(level, x.wind);
    if (kind === 'water') return waterVerdict(x.wind);
    return null;
  }

  /* Le créneau peut-il être calculé pour ce sport et ce niveau ? */
  function rule(act, inland, level) {
    const kind = M.coachKind(act, !!inland);
    if (!kind) return { ok: false, reason: 'sport' };
    const lv = M.COACH_LEVELS.includes(level) ? level : null;
    if (kind === 'wave' && !lv) return { ok: false, reason: 'level', kind };
    if (kind === 'wave' && lv === 'expert') return { ok: false, reason: 'expert', kind };
    return { ok: true, kind, level: lv };
  }

  /* Meilleur créneau d’une journée, en heures de jour seulement (et à partir de maintenant pour aujourd’hui).
     Créneau = suite d’heures consécutives jugées « bon » ou « possible » ; on garde celle qui cumule le plus de points
     (bon = 2, possible = 1), puis la plus tôt. */
  function bestSlot(list, o) {
    const r = rule(o.act, o.inland, o.level);
    if (!r.ok) return { status: 'rule', reason: r.reason };
    const now = String(o.nowIso || '').slice(0, 13);
    const day = list.filter(x => x.date === o.date && (!now || String(x.t).slice(0, 13) >= now));
    const light = day.filter(x => x.isDay === true);
    if (!light.length) return { status: day.length ? 'night' : 'nodata' };
    const judged = light.map(x => ({ x, v: verdict(r.kind, r.level, x, o.catalogWind) }));
    if (judged.every(j => j.v == null)) return { status: 'nodata' };
    let best = null, run = [];
    const close = () => {
      if (!run.length) return;
      const score = run.reduce((s, j) => s + j.v, 0);
      if (!best || score > best.score) best = { score, run };
      run = [];
    };
    judged.forEach((j, i) => {
      const prev = judged[i - 1];
      const next = prev && Date.parse(j.x.t + ':00Z') - Date.parse(prev.x.t + ':00Z') === 36e5;
      if (!next) close();
      if (j.v != null && j.v >= OK) run.push(j); else close();
    });
    close();
    if (!best) return { status: 'none', kind: r.kind, level: r.level };
    const xs = best.run.map(j => j.x), vals = k => xs.map(x => x[k]).filter(has);
    const side = xs.map(x => M.windSide(x.windDir, o.catalogWind));
    return {
      status: 'ok', kind: r.kind, level: r.level,
      start: xs[0].t, end: xs[xs.length - 1].t, count: xs.length,
      quality: best.run.every(j => j.v === GOOD) ? 'good' : 'ok',
      wind: vals('wind').length ? [Math.min(...vals('wind')), Math.max(...vals('wind'))] : null,
      gust: vals('gust').length ? Math.max(...vals('gust')) : null,
      wave: vals('wave').length ? [Math.min(...vals('wave')), Math.max(...vals('wave'))] : null,
      period: vals('period').length ? Math.max(...vals('period')) : null,
      offshore: xs.some((x, i) => x.wind != null && x.wind >= 10 && side[i] === 'offshore')
    };
  }

  /* Écart entre l’heure du spot et celle du lecteur, en secondes (0 = même heure). */
  function tzGap(offsetSec, nowMs) {
    if (!has(offsetSec)) return 0;
    const d = new Date(nowMs == null ? Date.now() : nowMs);
    return +offsetSec + d.getTimezoneOffset() * 60;
  }

  /* Reprise des demandes météo de la fiche (open-meteo répond parfois 503). Un essai, puis UN seul nouvel essai
     automatique RETRY_MS plus tard ; ensuite plus rien tant qu’on ne touche pas « Réessayer » (again : un toucher = un essai).
     Jamais deux essais à la fois : start et again ne font rien pendant un essai en cours ou programmé (ils renvoient false).
     task() renvoie une promesse : tenue = réussite, rompue = échec. on(état, valeur) reçoit 'busy' (un essai part),
     'ok' (réussite), 'wait' (échec, nouvel essai programmé : l’écran garde « Chargement… ») ou 'failed' (échec après la
     reprise : « Réessayer »). stop() : la fiche a changé de spot, plus rien n’est demandé ni signalé. Sans DOM ; minuteries
     injectables pour les tests (opts.setTimeout, opts.clearTimeout, opts.delay). */
  const RETRY_MS = 4000;
  function retrier(task, on, opts) {
    const o = opts || {}, delay = o.delay != null ? o.delay : RETRY_MS;
    const later = o.setTimeout || ((f, ms) => setTimeout(f, ms)), cancel = o.clearTimeout || (t => clearTimeout(t));
    let busy = false, timer = null, autoLeft = 1, dead = false;
    const tell = (state, value) => { try { if (on) on(state, value); } catch (e) {} };
    function run() {
      if (dead || busy || timer != null) return false;
      busy = true;
      tell('busy');
      let p;
      try { p = Promise.resolve(task()); } catch (e) { p = Promise.reject(e); }
      p.then(v => { busy = false; if (!dead) tell('ok', v); }, e => {
        busy = false;
        if (dead) return;
        if (autoLeft > 0) { autoLeft--; tell('wait', e); timer = later(() => { timer = null; run(); }, delay); }
        else tell('failed', e);
      });
      return true;
    }
    return {
      start: run, again: run,
      stop() { dead = true; if (timer != null) cancel(timer); timer = null; },
      get busy() { return busy || timer != null; }
    };
  }

  const api = { toward, cardinal, sky, STORM, localHourIso, dateOf, hourOf, minutesOf, instant, hours, upcoming, trimMarine, days, verdict, rule, bestSlot, tzGap, GOOD, OK, NO, RETRY_MS, retrier };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SpotWeatherModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
