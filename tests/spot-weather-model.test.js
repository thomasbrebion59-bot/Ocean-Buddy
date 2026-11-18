/* Météo du spot : agrégation horaire, meilleur créneau (mêmes seuils que « Lire les conditions »), directions,
   puis rendu de la carte « Météo du spot » avec des réponses Open-Meteo factices. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const D = require('../spot-data-model.js');
const W = require('../spot-weather-model.js');

const pad = n => String(n).padStart(2, '0');
/* 48 heures à partir de 2026-07-10T00:00 (heure locale du spot), lever 06:30, coucher 21:30. */
let BASE = Date.UTC(2026, 6, 10);
const ymd = ms => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
function iso(i) { const d = new Date(BASE + i * 36e5); return `${ymd(d.getTime())}T${pad(d.getUTCHours())}:00`; }
const dayIso = k => ymd(BASE + k * 864e5);
function forecast(f = {}) {
  const n = 48, t = Array.from({length: n}, (_, i) => iso(i));
  const hourOf = i => i % 24;
  const v = (k, def) => t.map((_, i) => (f[k] ? f[k](i, hourOf(i)) : def(i, hourOf(i))));
  return {
    utc_offset_seconds: 7200,
    hourly: {
      time: t,
      temperature_2m: v('temp', () => 22), wind_speed_10m: v('wind', () => 8), wind_gusts_10m: v('gust', () => 15), wind_direction_10m: v('dir', () => 90),
      weather_code: v('code', () => 1), precipitation: v('rain', () => 0), precipitation_probability: v('pop', () => 5),
      is_day: f.noIsDay ? undefined : v('isDay', (i, h) => (h >= 7 && h <= 21 ? 1 : 0))
    },
    daily: {
      time: [0, 1, 2].map(dayIso), temperature_2m_max: [26, 27, 25], temperature_2m_min: [17, 18, 16], uv_index_max: [8.2, 7.9, 6],
      precipitation_probability_max: [10, 20, 60], wind_speed_10m_max: [14, 25, 31], wind_gusts_10m_max: [24, 40, 52], wind_direction_10m_dominant: [90, 270, 315],
      weather_code: [1, 3, 61], sunrise: [0, 1, 2].map(k => dayIso(k) + 'T06:3' + k), sunset: [0, 1, 2].map(k => dayIso(k) + 'T21:3' + k)
    }
  };
}
function marine(f = {}) {
  const t = Array.from({length: 48}, (_, i) => iso(i));
  const v = (k, def) => t.map((_, i) => (f[k] ? f[k](i, i % 24) : def));
  return {
    hourly: {time: t, wave_height: v('wave', 0.5), wave_period: v('period', 9), wave_direction: v('wdir', 290)},
    daily: {time: [0, 1, 2].map(dayIso), wave_height_max: [0.8, 1.4, 2.3], wave_period_max: [10.2, 12.6, 14]}
  };
}
const list = (fo, mo, inland) => W.hours(forecast(fo), inland ? {} : marine(mo), {inland});
const slot = (l, o) => W.bestSlot(l, Object.assign({date: '2026-07-10', nowIso: null, inland: false, catalogWind: ''}, o));

test('heures : prévision et marine fusionnées sur la même heure locale', () => {
  const l = list({wind: i => 10 + i}, {wave: i => i / 10});
  assert.equal(l.length, 48);
  assert.equal(l[3].t, '2026-07-10T03:00');
  assert.equal(l[3].wind, 13);
  assert.equal(l[3].wave, 0.3);
  assert.equal(l[3].isDay, false);
  assert.equal(l[12].isDay, true);
  assert.equal(l[30].date, '2026-07-11');
});

test('prévision et marine dans deux fuseaux différents (Dakhla) : alignées sur l’instant, pas sur le texte', () => {
  const f = forecast(), m = marine({wave: i => i / 10});
  f.utc_offset_seconds = 0;
  m.utc_offset_seconds = 3600;
  m.hourly.time = m.hourly.time.map(t => iso(Number(Object.keys(f.hourly.time).find(i => f.hourly.time[i] === t)) + 1));
  const l = W.hours(f, m, {});
  assert.equal(l[0].wave, 0, '15:00 UTC+0 = 16:00 UTC+1 : même instant, même valeur');
  assert.equal(l[5].wave, 0.5);
});

test('pas de trou : les heures du bord sans houle sont retirées, le milieu est gardé', () => {
  const l = list({}, {wave: i => (i < 2 || i > 45 ? null : 0.8)});
  const t = W.trimMarine(l);
  assert.equal(t[0].t, l[2].t);
  assert.equal(t[t.length - 1].t, l[45].t);
  assert.equal(W.trimMarine(W.hours(forecast(), {}, {})).length, 48, 'sans aucune donnée marine : rien n’est retiré');
});

test('plan d’eau intérieur : aucune donnée de houle, même si la réponse marine en contient', () => {
  const l = W.hours(forecast(), marine(), {inland: true});
  assert.ok(l.every(x => x.wave == null && x.period == null && x.waveDir == null));
  const d = W.days(forecast(), marine(), {inland: true});
  assert.ok(d.every(x => x.wave == null && x.period == null));
});

test('jour / nuit : sans is_day, le lever et le coucher du soleil décident', () => {
  const l = W.hours(forecast({noIsDay: true}), marine(), {});
  assert.equal(l[6].isDay, false, '06:00 avant le lever de 06:30');
  assert.equal(l[7].isDay, true);
  assert.equal(l[21].isDay, true, '21:00 avant le coucher de 21:30');
  assert.equal(l[22].isDay, false);
});

test('heure locale du spot et 48 h à venir', () => {
  const now = Date.UTC(2026, 6, 10, 13, 20); // 15:20 à UTC+2
  assert.equal(W.localHourIso(7200, now), '2026-07-10T15');
  const next = W.upcoming(list(), W.localHourIso(7200, now), 48);
  assert.equal(next[0].t, '2026-07-10T15:00');
  assert.equal(next.length, 33, 'la réponse factice s’arrête au bout de 48 h');
});

test('directions : la flèche pointe vers où va le vent ; points cardinaux FR et EN', () => {
  assert.equal(W.toward(0), 180);
  assert.equal(W.toward(270), 90);
  assert.equal(W.toward(null), null);
  assert.equal(W.cardinal(225, 'fr'), 'SO');
  assert.equal(W.cardinal(225, 'en'), 'SW');
  assert.equal(W.cardinal(359, 'fr'), 'N');
});

test('ciel : codes WMO regroupés en familles', () => {
  assert.equal(W.sky(0), 'clear');
  assert.equal(W.sky(2), 'partly');
  assert.equal(W.sky(45), 'fog');
  assert.equal(W.sky(53), 'drizzle');
  assert.equal(W.sky(81), 'rain');
  assert.equal(W.sky(73), 'snow');
  assert.equal(W.sky(95), 'storm');
  assert.equal(W.sky(null), null);
});

test('7 jours : rafales, période max, direction dominante, lever et coucher', () => {
  const d = W.days(forecast(), marine(), {});
  assert.equal(d.length, 3);
  assert.deepEqual([d[1].gust, d[1].period, d[1].windDir, d[1].sunrise, d[1].sunset], [40, 12.6, 270, '2026-07-11T06:31', '2026-07-11T21:31']);
});

test('verdict débutant en surf : mêmes bornes que swellBand et windBand du coach', () => {
  const h = (wave, wind) => W.verdict('wave', 'debutant', {wave, wind, windDir: 90, code: 1}, '');
  assert.equal(D.swellBand(0.59), 'petite'); assert.equal(h(0.59, 8), W.GOOD);
  assert.equal(D.swellBand(0.6), 'modeste'); assert.equal(h(0.6, 8), W.OK);
  assert.equal(D.swellBand(1.2), 'moyenne'); assert.equal(h(1.2, 8), W.NO);
  assert.equal(D.windBand(30), 'fort'); assert.equal(h(0.4, 30), W.NO, '« Reste à terre aujourd’hui »');
  assert.equal(h(0.4, 29), W.GOOD);
  assert.equal(h(null, 8), null);
});

test('verdict intermédiaire en surf : orientation du catalogue (offshore 25, onshore 15, sens inconnu 20)', () => {
  const h = (wave, wind, dir, cat) => W.verdict('wave', 'intermediaire', {wave, wind, windDir: dir, code: 1}, cat);
  assert.equal(h(0.8, 8, 0, ''), W.GOOD, 'vent presque nul + houle modeste');
  assert.equal(h(0.8, 24, 90, 'Offshore E'), W.GOOD);
  assert.equal(h(0.8, 25, 90, 'Offshore E'), W.NO);
  assert.equal(h(0.8, 14, 270, 'Offshore E'), W.OK, 'onshore léger');
  assert.equal(h(0.8, 15, 270, 'Offshore E'), W.NO, 'onshore marqué');
  assert.equal(h(0.8, 19, 0, ''), W.OK);
  assert.equal(h(0.8, 20, 0, ''), W.NO);
  assert.equal(h(0.4, 8, 0, ''), W.OK, 'petite houle : vagues molles');
  assert.equal(h(2, 8, 0, ''), W.NO, 'grosse houle');
});

test('verdict vent (kite) et plan d’eau (paddle) : bandes 10 / 20 / 30 km/h', () => {
  const k = (w, lv) => W.verdict('wind', lv, {wind: w, code: 1});
  assert.deepEqual([k(9, 'debutant'), k(10, 'debutant'), k(20, 'debutant'), k(30, 'debutant'), k(30, 'expert')], [W.NO, W.GOOD, W.OK, W.NO, W.OK]);
  const p = w => W.verdict('water', null, {wind: w, code: 1});
  assert.deepEqual([p(9), p(10), p(20), p(35)], [W.GOOD, W.OK, W.NO, W.NO]);
  assert.equal(W.verdict('water', null, {wind: 5, code: 95}), W.NO, 'heure d’orage écartée');
});

test('meilleur créneau : heures de jour seulement, même si la nuit est plus calme', () => {
  const l = list({wind: (i, h) => (h < 7 ? 2 : h >= 10 && h <= 12 ? 5 : 15)});
  const r = slot(l, {act: 'paddle'});
  assert.equal(r.status, 'ok');
  assert.ok(r.start >= '2026-07-10T07:00');
  assert.equal(r.start, '2026-07-10T07:00', 'toute la journée reste « possible » : la plus longue suite gagne');
  const calm = list({wind: (i, h) => (h >= 10 && h <= 12 ? 5 : 25)});
  const c = slot(calm, {act: 'paddle'});
  assert.deepEqual([c.start, c.end, c.count, c.quality], ['2026-07-10T10:00', '2026-07-10T12:00', 3, 'good']);
});

test('meilleur créneau : aujourd’hui commence à l’heure actuelle du spot', () => {
  const l = list({wind: (i, h) => (h >= 8 && h <= 9 ? 5 : 25)});
  assert.equal(slot(l, {act: 'paddle'}).start, '2026-07-10T08:00');
  assert.equal(slot(l, {act: 'paddle', nowIso: '2026-07-10T11'}).status, 'none');
  assert.equal(slot(l, {act: 'paddle', nowIso: '2026-07-10T23'}).status, 'night');
  assert.equal(slot(l, {act: 'paddle', date: '2026-07-11'}).start, '2026-07-11T08:00');
});

test('meilleur créneau surf débutant : la houle trop forte l’après-midi est exclue', () => {
  const l = list({wind: () => 8}, {wave: (i, h) => (h < 14 ? 0.5 : 1.5)});
  const r = slot(l, {act: 'surf', level: 'debutant'});
  assert.deepEqual([r.start, r.end, r.quality], ['2026-07-10T07:00', '2026-07-10T13:00', 'good']);
  assert.deepEqual(r.wave, [0.5, 0.5]);
});

test('meilleur créneau : rien quand aucune heure n’est dans les repères', () => {
  const r = slot(list({wind: () => 40}), {act: 'kitesurf', level: 'expert'});
  assert.equal(r.status, 'ok', '« fort » reste possible pour un expert');
  assert.equal(slot(list({wind: () => 40}), {act: 'kitesurf', level: 'debutant'}).status, 'none');
});

test('meilleur créneau : pas de calcul sans repère chiffré du coach', () => {
  assert.equal(slot(list(), {act: 'surf', level: 'expert'}).reason, 'expert');
  assert.equal(slot(list(), {act: 'surf', level: null}).reason, 'level');
  assert.equal(slot(list(), {act: 'plongee', level: 'debutant'}).reason, 'sport');
  assert.equal(slot(list(), {act: 'surf', level: 'debutant', inland: true}).reason, 'sport', 'vague de rivière : pas de lecture des conditions');
  assert.equal(slot(list({wind: () => 15}), {act: 'kitesurf', level: null}).status, 'ok', 'vent seul : calcul prudent sans niveau');
  assert.equal(slot(list({wind: () => 32}), {act: 'kitesurf', level: null}).status, 'none', 'sans niveau, « fort » n’est pas proposé');
});

test('meilleur créneau : vent de terre signalé (phrase du coach) pour le kite', () => {
  const r = slot(list({wind: () => 15, dir: () => 90}), {act: 'kitesurf', level: 'intermediaire', catalogWind: 'Offshore E'});
  assert.equal(r.offshore, true);
  assert.equal(slot(list({wind: () => 15, dir: () => 270}), {act: 'kitesurf', level: 'intermediaire', catalogWind: 'Offshore E'}).offshore, false);
});

/* ---------- Rendu dans la fiche (DOM factice) ---------- */
function el() {
  const kids = {};
  return {
    hidden: false, innerHTML: '', textContent: '', className: '', dataset: {}, style: {},
    classList: {add() {}, remove() {}, toggle() {}, contains() { return false; }},
    querySelector(s) { return kids[s] || (kids[s] = el()); }, querySelectorAll() { return []; },
    setAttribute() {}, getAttribute() {}, addEventListener() {}, append() {}, after() {}, remove() {}, closest() { return null; }
  };
}
const today = () => { const d = new Date(Date.now() + 7200e3); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
function render(spot, act, level) {
  BASE = today();
  const els = {}, calls = [], listeners = {};
  const sb = {
    document: {readyState: 'complete', querySelector: s => els[s] || (els[s] = el()), querySelectorAll: () => [], createElement: () => el(), addEventListener(t, f) { listeners[t] = f; }},
    OB_I18N: {locale: 'fr-FR', lang: 'fr'}, isInland: s => ['lake', 'inland'].includes(s?.waterType), spotSports: s => s.sports,
    COORDS: {[spot.id]: {lat: 43.6, lon: -1.4}}, SPORTMAP: {surf: {label: 'Surf'}, kitesurf: {label: 'Kitesurf'}, paddle: {label: 'Paddle (SUP)'}},
    chosenLevel: level, localStorage: {getItem: () => null}, Intl, Date, Promise, console, setTimeout, clearTimeout,
    fetch: url => { calls.push(url); return Promise.resolve({ok: true, json: () => Promise.resolve(/marine-api/.test(url) ? marine() : forecast())}); }
  };
  sb.window = sb; sb.SpotDataModel = D;
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'spot-weather-model.js'), 'utf8'), sb);
  /* « Avant d’y aller » fournit le bouton d’invitation au niveau repris par « Ton meilleur créneau ». */
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'spot-before.js'), 'utf8'), sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'spot-experience.js'), 'utf8'), sb);
  sb.OceanExperience.update(spot, act);
  const html = () => els['#spotWeek'].innerHTML;
  /* Le rendu est différé (après l’ouverture de la fiche) : on attend qu’il arrive, sans délai fixe fragile. */
  const until = async () => { for (let i = 0; i < 200 && !/wx-block|spot-week-empty/.test(html()); i++) await new Promise(r => setTimeout(r, 10)); };
  return until().then(() => ({html: html(), calls, sb, listeners, els}));
}

test('fiche : un appel prévision + un appel marine, heure par heure et 7 jours, source citée', async () => {
  const {html, calls} = await render({id: 'hossegor', name: 'Hossegor', waterType: 'sea', sports: ['surf'], wind: 'Offshore E'}, 'surf', 'debutant');
  assert.equal(calls.length, 2);
  assert.ok(calls.some(u => /api\.open-meteo\.com\/v1\/forecast.*hourly=.*wind_gusts_10m.*forecast_hours=48.*daily=.*sunrise,sunset/.test(u)));
  assert.ok(calls.some(u => /marine-api.*hourly=wave_height,wave_period,wave_direction.*daily=wave_height_max,wave_period_max/.test(u)));
  assert.ok(calls.every(u => !/sea_level_height_msl/.test(u)), 'aucun niveau de la mer présenté comme marée');
  for (const s of ['Ton meilleur créneau', 'Heure par heure', 'Rafales', 'Houle', 'Période', 'Les 7 jours', 'Lever', 'Prévisions Open-Meteo (CC BY 4.0)', 'le poste de secours, le balisage et les drapeaux priment']) assert.ok(html.includes(s), s);
  assert.ok(/href="https:\/\/open-meteo\.com\/"/.test(html));
  assert.ok(!/Pleine mer|Basse mer/.test(html));
  assert.ok(calls.some(u => /marine-api.*past_hours=1&forecast_hours=49/.test(u)), 'la marine couvre toute la fenêtre de la prévision');
});

test('fiche : lac sans houle ; plongée sans créneau ; niveau changé = nouveau rendu sans nouvel appel', async () => {
  const lake = await render({id: 'annecy', name: 'Lac', waterType: 'lake', sports: ['paddle']}, 'paddle', null);
  assert.equal(lake.calls.length, 1, 'pas d’appel marine pour un lac');
  assert.ok(!/<th scope="row">Houle/.test(lake.html) && !/<dt>Houle/.test(lake.html));
  assert.ok(lake.html.includes('Ton meilleur créneau'));
  const dive = await render({id: 'medes', name: 'Medes', waterType: 'sea', sports: ['plongee']}, 'plongee', 'debutant');
  assert.ok(dive.html.includes('Pas de créneau calculé pour ce sport ici'));
  const surf = await render({id: 'hossegor', name: 'Hossegor', waterType: 'sea', sports: ['surf']}, 'surf', null);
  /* Sans niveau : le même bouton court qu’« Avant d’y aller » (même composant, même libellé), plus la longue consigne. */
  assert.ok(surf.html.includes('<button type="button" class="db-level" data-open-level>Choisis ton niveau pour savoir si ce spot te correspond</button>'));
  assert.ok(!surf.html.includes('Choisis ton niveau dans Réglages'));
  surf.sb.chosenLevel = 'expert';
  surf.listeners['ocean:level']();
  assert.ok(surf.els['#spotWeek'].innerHTML.includes('Niveau expert'));
  assert.equal(surf.calls.length, 2);
});

/* Horloge factice : minuteries rangées par échéance, tâches de fond vidées entre deux échéances. */
function clock() {
  let now = 0;
  const timers = [];
  const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
  return {
    setTimeout: (fn, ms) => { const t = {at: now + (+ms || 0), fn}; timers.push(t); return t; },
    clearTimeout: t => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); },
    async advance(ms) {
      const end = now + ms;
      for (;;) {
        await flush();
        const due = timers.filter(t => t.at <= end).sort((a, b) => a.at - b.at)[0];
        if (!due) break;
        timers.splice(timers.indexOf(due), 1); now = due.at; due.fn();
      }
      now = end; await flush();
    }
  };
}

test('fiche : open-meteo en 503, exactement deux demandes automatiques, puis aucune jusqu’au toucher de « Réessayer »', async () => {
  const els = {}, calls = [], listeners = {}, ck = clock();
  const sb = {
    document: {readyState: 'complete', querySelector: s => els[s] || (els[s] = el()), querySelectorAll: () => [], createElement: () => el(), addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); }},
    OB_I18N: {locale: 'fr-FR', lang: 'fr'}, spotSports: s => s.sports, COORDS: {x: {lat: 1, lon: 2}}, Intl, Date, Promise, console,
    setTimeout: ck.setTimeout, clearTimeout: ck.clearTimeout,
    fetch: url => { calls.push(url); return Promise.resolve({ok: false, status: 503, json: () => Promise.resolve({error: true, reason: 'busy'})}); }
  };
  sb.window = sb; sb.SpotDataModel = D;
  vm.createContext(sb);
  for (const f of ['spot-weather-model.js', 'spot-experience.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), sb);
  const week = () => els['#spotWeek'].innerHTML;
  const count = () => ({forecast: calls.filter(u => /api\.open-meteo\.com\/v1\/forecast/.test(u)).length, marine: calls.filter(u => /marine-api/.test(u)).length});
  sb.OceanExperience.update({id: 'x', name: 'X', waterType: 'sea', sports: ['surf']}, 'surf');
  await ck.advance(0);
  assert.deepEqual(count(), {forecast: 1, marine: 1}, 'premier essai');
  assert.ok(week().includes('Chargement'), 'premier refus : l’écran garde « Chargement… » (nouvel essai programmé)');
  assert.ok(!week().includes('data-weather-retry'));
  await ck.advance(sb.SpotWeatherModel.RETRY_MS - 1);
  assert.deepEqual(count(), {forecast: 1, marine: 1}, 'rien avant le délai');
  await ck.advance(1);
  assert.deepEqual(count(), {forecast: 2, marine: 2}, 'un seul nouvel essai automatique, quelques secondes plus tard');
  assert.ok(week().includes('data-weather-retry="week"') && week().includes('Réessayer'), 'échec persistant : « Réessayer »');
  assert.ok(week().includes('spot-week-loading is-failed'), 'même cadre que le chargement (même hauteur)');
  await ck.advance(10 * 60 * 1000);
  assert.deepEqual(count(), {forecast: 2, marine: 2}, 'aucune autre demande automatique, même dix minutes après');
  /* Toucher « Réessayer » : un essai ; un second toucher pendant cet essai ne relance rien. */
  const tap = () => (listeners.click || []).forEach(f => f({target: {closest: s => (s === '[data-weather-retry="week"]' ? {} : null)}}));
  tap(); tap();
  assert.ok(week().includes('Chargement'), 'le toucher remet « Chargement… » à la place du bouton');
  await ck.advance(0);
  assert.deepEqual(count(), {forecast: 3, marine: 3}, 'un toucher = un essai, jamais deux à la fois');
  assert.ok(week().includes('data-weather-retry="week"'), 'nouvel échec : de nouveau « Réessayer », sans reprise automatique');
  await ck.advance(10 * 60 * 1000);
  assert.deepEqual(count(), {forecast: 3, marine: 3});
});

test('fiche : hors connexion, un seul nouvel essai puis un message simple, fiche intacte', async () => {
  const els = {}, ck = clock();
  const sb = {
    document: {readyState: 'complete', querySelector: s => els[s] || (els[s] = el()), querySelectorAll: () => [], createElement: () => el(), addEventListener() {}},
    OB_I18N: {locale: 'fr-FR', lang: 'fr'}, spotSports: s => s.sports, COORDS: {x: {lat: 1, lon: 2}}, Intl, Date, Promise, console,
    setTimeout: ck.setTimeout, clearTimeout: ck.clearTimeout,
    fetch: () => Promise.reject(new TypeError('offline'))
  };
  sb.window = sb; sb.SpotDataModel = D;
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'spot-weather-model.js'), 'utf8'), sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'spot-experience.js'), 'utf8'), sb);
  sb.OceanExperience.update({id: 'x', name: 'X', waterType: 'sea', sports: ['surf']}, 'surf');
  assert.ok(els['#spotWeek'].innerHTML.includes('Chargement'), 'chargement affiché tout de suite, rendu après');
  await ck.advance(sb.SpotWeatherModel.RETRY_MS + 100);
  assert.ok(els['#spotWeek'].innerHTML.includes('Prévision indisponible pour le moment'));
  assert.ok(!/serveur|HTTP|503|Open-Meteo/i.test(els['#spotWeek'].innerHTML.replace(/<[^>]+>/g, '')), 'aucune mention technique');
});

test('aucun horaire de pleine ou basse mer tiré du niveau modélisé ; plus de doublon « 5 jours » dans la fiche', () => {
  const root = path.join(__dirname, '..');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(!/Pleine mer à|Basse mer à|renderTideChart/.test(app));
  assert.ok(!/id="dTideBlock"|id="dFcHead"|id="dForecast"/.test(html));
  assert.ok(!/courbe de marée/.test(fs.readFileSync(path.join(root, 'spot-data-model.js'), 'utf8')), '« Lire les conditions » ne renvoie plus vers une courbe retirée');
  assert.ok(/id="fcBars"/.test(html), 'les prévisions de l’accueil restent');
});
