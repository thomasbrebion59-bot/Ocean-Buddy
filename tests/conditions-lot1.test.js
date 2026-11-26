/* Lot 1 « Les conditions d'abord, jamais vides » (26 nov. 2026) : tests purs, sans réseau.
   - units-model.js : conversions (nœuds, pieds, °F), textes de relevé, réglages ;
   - conditions-model.js : relevé gardé, règle des 3 h, jamais de verdict sur un vieux relevé, eau et saison du mois,
     région des favoris, tirer pour rafraîchir ;
   - spot-verdict.js : le relevé calculé en ligne est gardé, puis repris hors connexion ;
   - sources : clé ob_ effacée par privacy.js, scripts chargés avant spot-verdict.js, marée sans aucune heure. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const U = require('../units-model.js');
const CM = require('../conditions-model.js');
const V = require('../spot-verdict.js');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const H = 3600e3;
const local = (d, h, m = 0) => new Date(2026, 10, d, h, m).getTime();

/* ---------- Unités ---------- */
test('unités : défaut métrique, nœuds, pieds et °F, valeurs inconnues ignorées', () => {
  assert.deepEqual(U.normalize(null), { wind: 'kmh', length: 'm', temp: 'C' });
  assert.deepEqual(U.normalize('pas du json'), U.DEFAULTS);
  assert.deepEqual(U.normalize({ wind: 'mph', length: 'ft', temp: 'K' }), { wind: 'kmh', length: 'ft', temp: 'C' });
  assert.equal(U.text('wind', 18.52, { wind: 'kn' }), '10 kn');
  assert.equal(U.text('wind', 12, {}), '12 km/h');
  assert.equal(U.text('length', 1.8, { length: 'ft' }), '5.9 ft');
  assert.equal(U.text('temp', 17, { temp: 'F' }), '63 °F');
  assert.equal(U.text('temp', 0, { temp: 'F' }), '32 °F');
  assert.equal(U.convert('wind', null, {}), null);
});
test('unités : convertText convertit un relevé, jamais « mm » ni « m/s », et laisse le métrique tel quel', () => {
  const all = { wind: 'kn', length: 'ft', temp: 'F' };
  assert.equal(U.convertText('12 km/h NO', all), '6 kn NO');
  assert.equal(U.convertText('1,8 m', all, (n, d) => n.toFixed(d).replace('.', ',')), '5,9 ft');
  assert.equal(U.convertText('17 °C', all), '63 °F');
  assert.equal(U.convertText('5 mm 3 m/s', all), '5 mm 3 m/s');
  assert.equal(U.convertText('12 km/h NO', {}), '12 km/h NO');
  assert.equal(U.convertText('—', all), '—');
});
test('unités : réglage gardé sur l’appareil sous oceanbuddy_units (préférence), jamais de plantage sans stockage', () => {
  assert.equal(U.KEY, 'oceanbuddy_units');
  assert.deepEqual(U.get(), U.DEFAULTS);
  const mem = {}; global.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = v; } };
  try {
    assert.deepEqual(U.set({ wind: 'kn' }), { wind: 'kn', length: 'm', temp: 'C' });
    assert.deepEqual(U.get(), { wind: 'kn', length: 'm', temp: 'C' });
    assert.equal(U.show('wind', 18.52), '10 kn');
  } finally { delete global.localStorage; }
});

/* ---------- Relevé gardé ---------- */
const NOW = { windKmh: 12, windDir: 250, swellM: 1.8, swellS: 10, waterC: 14 };
test('garde : lecture robuste, le plus récent l’emporte, les trop vieux et les futurs sont oubliés', () => {
  assert.deepEqual(CM.parse('{cassé'), {});
  assert.deepEqual(CM.parse('[1,2]'), {});
  assert.deepEqual(CM.parse({ a: { at: 0, now: NOW }, b: { at: 5 }, c: 'x' }), {});
  const t = local(26, 12);
  let m = CM.remember({}, 'a', { at: t - H, now: NOW }, t);
  m = CM.remember(m, 'a', { at: t - 2 * H, now: Object.assign({}, NOW, { windKmh: 99 }) }, t);
  assert.equal(m.a.now.windKmh, 12, 'un relevé plus ancien ne remplace pas le plus récent');
  m = CM.remember(m, 'b', { at: t - 8 * 24 * H, now: NOW }, t);
  assert.equal(m.b, undefined, 'plus de 7 jours : oublié');
  m = CM.remember(m, 'c', { at: t + H, now: NOW }, t);
  assert.equal(m.c, undefined, 'daté du futur : oublié');
  assert.equal(CM.recall(m, 'a', t + 8 * 24 * H), null);
  const big = {}; for (let i = 0; i < 80; i++) big['s' + i] = { at: t - i * 60e3, now: NOW };
  assert.equal(Object.keys(CM.prune(CM.parse(big), t)).length, CM.MAX_ENTRIES);
  assert.deepEqual(CM.parse(CM.serialize(m)), m, 'aller-retour sans perte');
});
test('règle des 3 h : jusqu’à 3 h les chiffres et, le même jour, le verdict ; au-delà jamais de verdict ni de créneau', () => {
  const at = local(26, 8);
  const rec = { at, inland: false, now: NOW, v: { key: 'surf|intermediaire', verdict: 'bon', slot: '9 h à 12 h', day: 'today' } };
  const o = h => ({ now: at + h * H, key: 'surf|intermediaire', danger: 3 });
  const a = CM.keptEntry(rec, o(2.9));
  assert.equal(a.verdict, 'bon'); assert.equal(a.kept, true); assert.equal(a.stale, undefined); assert.equal(a.slot, '9 h à 12 h');
  const b = CM.keptEntry(rec, o(3.1));
  assert.equal(b.verdict, null); assert.equal(b.slot, null); assert.equal(b.stale, true); assert.equal(b.now.windKmh, 12);
  assert.equal(CM.keptEntry(rec, { now: at + H, key: 'surf|expert', danger: null }).verdict, null, 'autre niveau : pas de verdict repris');
  const late = { at: local(26, 23, 30), now: NOW, v: rec.v };
  assert.equal(CM.keptEntry(late, { now: local(27, 1), key: rec.v.key }).verdict, null, 'relevé de la veille au soir : pas de verdict');
  assert.equal(CM.keptEntry(null, o(1)), null);
  for (let h = 0; h < 72; h += 0.5) {
    const e = CM.keptEntry(rec, o(h));
    if (h > 3) assert.equal(e.verdict, null, 'un vieux relevé ne donne jamais « Bon » à ' + h + ' h');
  }
});
test('heure du relevé : « Relevé à 7 h 50 », puis avec le jour une fois grisé ; dans la langue', () => {
  const tr = { en: { 'Relevé à {0}': 'Measured at {0}', 'Relevé hier à {0}': 'Measured yesterday at {0}', 'Relevé le {0} à {1}': 'Measured on {0} at {1}', 'Relevé aujourd’hui à {0}': 'Measured today at {0}' } };
  const at = local(26, 7, 50), fr = { lang: 'fr', locale: 'fr-FR' };
  assert.equal(CM.stampText({ at }, at + H, fr), 'Relevé à 7 h 50');
  assert.equal(CM.stampText({ at }, at + 4 * H, fr), 'Relevé aujourd’hui à 7 h 50');
  assert.equal(CM.stampText({ at }, local(27, 9), fr), 'Relevé hier à 7 h 50');
  assert.match(CM.stampText({ at }, local(30, 9), fr), /^Relevé le .*nov.* à 7 h 50$/);
  assert.equal(CM.stampText({ at }, local(27, 9), { lang: 'en', locale: 'en-GB', tr: s => tr.en[s] || s }), 'Measured yesterday at ' + CM.timeText(at, 'en', 'en-GB'));
  assert.match(CM.timeText(at, 'en', 'en-GB'), /^0?7:50/);
});
test('sans relevé : eau et saison du mois, rien d’inventé', () => {
  const sea = [12, 12, 12, 13, 16, 19, 21, 22, 21, 18, 16, 13];
  assert.deepEqual(CM.climate({ sea, months: [9, 10], month: 10 }), { month: 10, seaC: 16, inSeason: true, months: [9, 10] });
  assert.equal(CM.climate({ sea, months: [9, 10], month: 2 }).inSeason, false);
  assert.equal(CM.climate({ sea: null, months: null, month: 2 }), null);
  assert.equal(CM.climate({ sea, months: [1], month: 2, inland: true }).seaC, null, 'plan d’eau intérieur : pas d’eau de mer');
});
test('région des favoris : le favori le plus central, jamais un barycentre en mer', () => {
  const landes = { lat: 43.66, lon: -1.44 }, biarritz = { lat: 43.48, lon: -1.56 }, bali = { lat: -8.7, lon: 115.2 };
  const a = CM.regionAnchor([landes, biarritz, bali]);
  assert.ok(a.lat > 40 && a.lon < 0, 'reste en France, pas à Bali');
  assert.equal(CM.regionAnchor([]), null);
  assert.deepEqual(CM.regionAnchor([landes]), { lat: 43.66, lon: -1.44, n: 1 });
});
test('tirer pour rafraîchir : seuil de 72 px, une fois toutes les 20 s au plus', () => {
  assert.equal(CM.pullState(3), 'idle'); assert.equal(CM.pullState(40), 'pulling'); assert.equal(CM.pullState(72), 'ready');
  assert.equal(CM.canRefresh(0, 1000), true); assert.equal(CM.canRefresh(1000, 15000), false); assert.equal(CM.canRefresh(1000, 21000), true);
});

/* ---------- Dans OceanVerdict : en ligne puis hors connexion ---------- */
const pad = n => String(n).padStart(2, '0');
const BASE = Date.UTC(2026, 6, 10), OFF = 7200;
const iso = i => { const d = new Date(BASE + i * 36e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`; };
const times = Array.from({ length: 48 }, (_, i) => iso(i));
const col = f => times.map((_, i) => f(i % 24, i));
const wx = () => ({ utc_offset_seconds: OFF, current: { time: iso(10), wind_speed_10m: 22.4, wind_direction_10m: 250 }, hourly: { time: times, wind_speed_10m: col(() => 6), wind_gusts_10m: col(() => 12), wind_direction_10m: col(() => 90), weather_code: col(() => 1), is_day: col(h => (h >= 7 && h <= 21 ? 1 : 0)) } });
const mr = () => ({ utc_offset_seconds: OFF, current: { time: iso(10), wave_height: 1, wave_period: 11, sea_surface_temperature: 15.4 }, hourly: { time: times, wave_height: col(() => 1), wave_period: col(() => 10), wave_direction: col(() => 280) } });
const at = (h, day = 0) => BASE + (day * 24 + h) * 36e5 - OFF * 1000 + 5 * 60e3;
const SPOT = { surf: { id: 'surf', sports: ['surf'], waterType: 'sea', coords: { lat: 43.66, lon: -1.44 }, gauge: 3 } };
let disk = null;
function world(o) {
  const w = { now: o.now, offline: !!o.offline, units: o.units || null };
  V.reset().setup({
    now: () => w.now, spot: id => SPOT[id] || null, coords: s => s.coords, inland: () => false, sports: s => s.sports, gauge: s => s.gauge,
    sport: () => 'surf', level: () => 'intermediaire', lang: () => 'fr', locale: () => 'fr-FR', t: s => s, num: (v, d) => (+v).toFixed(d).replace('.', ','),
    stamp: () => w.stampAt || 0, reduced: () => true,
    load: url => Promise.resolve(w.offline ? null : /marine-api/.test(url) ? mr() : wx()),
    keptRead: () => disk, keptWrite: t => { disk = t; },
    climate: o.climate || (() => null), seasonLabel: () => 'sept. – oct.',
    units: (k, v) => (w.units ? U.convert(k, v, w.units) : null)
  });
  return w;
}
test('hors connexion : le relevé calculé en ligne est gardé, puis repris avec son heure et son verdict (3 h au plus)', async () => {
  disk = null;
  const w = world({ now: at(10) }); w.stampAt = at(10);
  const on = (await V.forSpots(['surf'])).get('surf');
  assert.equal(on.verdict, 'bon'); assert.ok(on.now);
  V.flushKept();
  const saved = CM.parse(disk);
  assert.equal(saved.surf.at, on.at); assert.equal(saved.surf.v.verdict, 'bon');
  /* 1 h plus tard, sans réseau : mêmes chiffres, « Relevé à … », verdict repris. */
  const w2 = world({ now: at(11), offline: true });
  const off = (await V.forSpots(['surf'])).get('surf');
  assert.equal(off.kept, true); assert.equal(off.stale, undefined); assert.equal(off.verdict, 'bon');
  assert.deepEqual(off.now, on.now);
  assert.match(V.html(off), /class="ui-stamp">Relevé à /);
  assert.doesNotMatch(V.html(off), /Conditions indisponibles/);
  /* 5 h plus tard : grisé, jamais « Bon pour toi », heure et jour dits. */
  w2.now = at(15);
  const old = V.reset({ keepOwn: true }) && (await V.forSpots(['surf'])).get('surf');
  assert.equal(old.stale, true); assert.equal(old.verdict, null); assert.equal(old.slot, null);
  const h = V.html(old);
  assert.match(h, /class="ui-cond is-old"/); assert.match(h, /ui-stamp is-old">Relevé aujourd’hui à /);
  assert.doesNotMatch(h, /Bon pour toi|ui-verdict/);
  /* Le lendemain : « hier ». */
  w2.now = at(10, 1);
  assert.match(V.html((await V.forSpots(['surf'])).get('surf')), /Relevé hier à /);
});
test('hors connexion sans relevé : l’eau et la saison du mois, étiquetées comme une moyenne', async () => {
  disk = null;
  world({ now: at(10), offline: true, climate: () => ({ month: 10, seaC: 27, inSeason: true, months: [10] }) });
  const e = (await V.forSpots(['surf'])).get('surf');
  assert.equal(e.now, null); assert.equal(e.climate.seaC, 27);
  const h = V.html(e);
  assert.match(h, /ui-clim/); assert.match(h, /data-ui-n="27"/); assert.match(h, /moyenne en /); assert.match(h, /En saison/);
  world({ now: at(10), offline: true, climate: () => ({ month: 2, seaC: 12, inSeason: false, months: [9, 10] }) });
  assert.match(V.html((await V.forSpots(['surf'])).get('surf')), /Saison : sept\. – oct\./);
  world({ now: at(10), offline: true });
  assert.match(V.html((await V.forSpots(['surf'])).get('surf')), /Aucun relevé pour l’instant/);
});
test('unités dans la ligne de conditions : nœuds, pieds et °F, valeurs de l’entrée toujours métriques', async () => {
  disk = null;
  world({ now: at(10), units: { wind: 'kn', length: 'ft', temp: 'F' } });
  const e = (await V.forSpots(['surf'])).get('surf');
  assert.equal(e.now.windKmh, 22.4, 'l’entrée reste métrique');
  const h = V.html(e);
  assert.match(h, /data-ui-n="12"[^>]*>12<\/span><small>kn<\/small>/);
  assert.match(h, /<small>ft<\/small>/); assert.match(h, /<small>°F<\/small>/);
  world({ now: at(10) });
  assert.match(V.html((await V.forSpots(['surf'])).get('surf')), /<small>km\/h<\/small>/);
});

/* ---------- Sources ---------- */
test('clé ob_ (pas oceanbuddy_) effacée avec les données ; scripts chargés avant spot-verdict.js', () => {
  assert.match(CM.KEY, /^ob_/);
  assert.ok(read('privacy.js').includes("'" + CM.KEY + "'"), 'effacement des données');
  const html = read('index.html'), i = s => html.indexOf('src="' + s);
  assert.ok(i('units-model.js') > 0 && i('units-model.js') < i('app.js'));
  assert.ok(i('conditions-model.js') > 0 && i('conditions-model.js') < i('spot-verdict.js'));
  for (const id of ['setUnitWind', 'setUnitLength', 'setUnitTemp']) assert.ok(html.includes('id="' + id + '"'), id);
});
test('marée : le sens et une courbe sans chiffre ni heure ; les tests de marée ne sont pas touchés', () => {
  const app = read('app.js'), fn = app.slice(app.indexOf('function tideSeries'), app.indexOf('/* Conditions du moment de la fiche'));
  assert.match(fn, /return \{pts:/); assert.doesNotMatch(fn, /toLocale|getHours|Intl|\.time\b.*return/);
  const before = read('spot-before.js'), c = before.slice(before.indexOf('function tideCurve'), before.indexOf('/* Écart à la normale'));
  assert.doesNotMatch(c, /<text|toFixed\(0\)|getHours|\bh\b.*pleine/);
  assert.match(before, /Niveau modélisé, sans horaire/);
});
test('textes du lot : traduits en anglais et en espagnol, ni flèche ni tiret long ni point médian', () => {
  const en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json'));
  for (const k of ['Hors connexion. Derniers relevés gardés.', 'Relevé hier à {0}', 'Relevé le {0} à {1}', 'Relevé aujourd’hui à {0}', 'Tire pour rafraîchir', 'Relâche pour rafraîchir', 'Pas de réseau. Derniers relevés gardés.', 'eau, moyenne en {0}', 'Saison : {0}', 'Aucun relevé pour l’instant', 'Niveau modélisé, sans horaire', 'Vent en nœuds', 'Houle en pieds', 'Températures en °F', 'Unités']) {
    assert.ok(en[k] && es[k], k);
    for (const t of [k, en[k], es[k]]) assert.doesNotMatch(t, /[→←↗—·]/, t);
  }
});
