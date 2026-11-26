/* Verdict « pour toi » de plusieurs spots à la fois (spot-verdict.js, interface v2) : tests purs, sans réseau.
   - le calcul est celui de « Ton créneau » de la fiche (SpotWeatherModel.bestSlot puis SpotFitModel.slotSummary) ;
   - bon / possible / non, null sans seuil (plongée, surf expert, niveau non choisi), le créneau de demain le soir ;
   - une demande groupée par lot (plusieurs latitudes et longitudes), mer et plans d’eau séparés, 2 jours ;
   - cache de 30 min par spot et par adresse, pause de 2 min après un refus 429 ou 503 ;
   - la ligne affichée : pictogrammes au trait de la fiche, libellés, « Conditions indisponibles » sans donnée ;
   - aucun texte en dur hors de la chaîne de traduction ;
   - ajouts du 23 novembre : entrée.next (le meilleur créneau de demain quand la journée est « non »), son rendu, et le
     départ d’un chiffre depuis sa valeur d’avant (data-ui-from). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const W = require('../spot-weather-model.js');
const F = require('../spot-fit-model.js');
const V = require('../spot-verdict.js');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const src = read('spot-verdict.js');

const pad = n => String(n).padStart(2, '0');
/* Réponses Open-Meteo factices : 48 heures locales à partir du 10 juillet 2026, jour de 7 h à 21 h, décalage UTC+2. */
const BASE = Date.UTC(2026, 6, 10), OFF = 7200;
const iso = i => { const d = new Date(BASE + i * 36e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`; };
const times = Array.from({ length: 48 }, (_, i) => iso(i));
const col = f => times.map((_, i) => f(i % 24, i));
function weather(o = {}) {
  return {
    utc_offset_seconds: OFF, timezone: 'Europe/Paris',
    current: o.current === null ? undefined : Object.assign({ time: iso(10), wind_speed_10m: 22.4, wind_direction_10m: 250 }, o.current),
    hourly: {
      time: times, wind_speed_10m: col(o.wind || (() => 6)), wind_gusts_10m: col(() => 12), wind_direction_10m: col(o.dir || (() => 90)),
      weather_code: col(o.code || (() => 1)), is_day: col(h => (h >= 7 && h <= 21 ? 1 : 0))
    }
  };
}
function marine(o = {}) {
  return {
    utc_offset_seconds: OFF,
    current: Object.assign({ time: iso(10), wave_height: 2.84, wave_period: 11.6, sea_surface_temperature: 15.4 }, o.current),
    hourly: { time: times, wave_height: col(o.wave || (() => 1)), wave_period: col(() => 10), wave_direction: col(() => 280) }
  };
}
/* Heure réelle (ms) d’une heure locale du spot : jour 0 ou 1, heure h. */
const at = (h, day = 0) => BASE + (day * 24 + h) * 36e5 - OFF * 1000 + 5 * 60 * 1000;

const SPOTS = {
  surf: { id: 'surf', sports: ['surf'], wind: 'Offshore E', waterType: 'sea', coords: { lat: 43.66, lon: -1.44 }, gauge: 3 },
  multi: { id: 'multi', sports: ['snorkeling', 'surf'], waterType: 'sea', coords: { lat: -8.72, lon: 115.17 }, gauge: 1 },
  dive: { id: 'dive', sports: ['plongee'], waterType: 'sea', coords: { lat: 17.3, lon: -87.5 }, gauge: 4 },
  lake: { id: 'lake', sports: ['paddle', 'kayak'], waterType: 'lake', coords: { lat: 45.86, lon: 6.17 }, gauge: null },
  nowhere: { id: 'nowhere', sports: ['surf'], waterType: 'sea', coords: null, gauge: 2 }
};
for (let i = 0; i < 14; i++) SPOTS['s' + i] = { id: 's' + i, sports: ['surf'], waterType: 'sea', coords: { lat: 40 + i, lon: -9 - i }, gauge: 2 };
/* Monde factice : horloge, chargeur compté, langue. Chaque test repart de caches vides. */
function world(o = {}) {
  const w = { now: o.now == null ? at(10) : o.now, calls: [], lang: o.lang || 'fr', answer: o.answer || null };
  const dict = { en: { 'à': 'to', Demain: 'Tomorrow' }, es: { 'à': 'a', Demain: 'Mañana' } };
  V.reset().setup({
    now: () => w.now, spot: id => SPOTS[id] || null, coords: s => s.coords, inland: s => ['lake', 'inland'].includes(s.waterType), sports: s => s.sports,
    gauge: s => s.gauge, sport: () => (o.sport === undefined ? 'surf' : o.sport), level: () => (o.level === undefined ? 'intermediaire' : o.level),
    lang: () => w.lang, locale: () => (w.lang === 'fr' ? 'fr-FR' : w.lang), t: s => (dict[w.lang] && dict[w.lang][s]) || s, num: (v, d) => (+v).toFixed(d).replace('.', ','),
    stamp: () => 0, reduced: () => true,
    load: url => {
      w.calls.push(url);
      if (w.answer) return Promise.resolve(w.answer(url));
      const n = /latitude=([^&]*)/.exec(url)[1].split(',').length, one = /marine-api/.test(url) ? marine(o.marine) : weather(o.weather);
      return Promise.resolve(n === 1 ? one : Array.from({ length: n }, () => one));
    }
  });
  return w;
}
const rec = (w, m) => ({ weather: w, marine: m, at: 1 });

/* ---------- Contrat ---------- */
test('contrat : forSpots, cached et html ; une entrée a exactement les champs annoncés', async () => {
  const head = src.slice(0, src.indexOf('(function (root)'));
  for (const s of ['OceanVerdict.forSpots(ids, opts?) -> Promise<Map<id, entrée>>', 'OceanVerdict.cached(id, opts?) -> entrée | null', 'OceanVerdict.html(entrée) -> chaîne HTML',
    "now:     { windKmh, windDir, swellM, swellS, waterC } | null", "verdict: 'bon' | 'possible' | 'non' | null", "slot:    '10 h à 13 h' | null", "day:     'today' | 'tomorrow'", 'danger:  0 à 4 | null', 'at:      horodatage de la mesure (ms)'])
    assert.ok(head.includes(s), 'contrat inchangé : ' + s);
  assert.doesNotMatch(head, /ÉTAT : bouchon/);
  world();
  assert.equal(V.cached('surf'), null, 'rien en cache avant la première demande');
  const map = await V.forSpots(['surf']);
  assert.ok(map instanceof Map && map.has('surf'));
  const e = map.get('surf');
  for (const k of ['now', 'verdict', 'slot', 'day', 'danger', 'at']) assert.ok(k in e, k);
  assert.deepEqual(Object.keys(e.now).sort(), ['swellM', 'swellS', 'waterC', 'windDir', 'windKmh']);
  assert.deepEqual(e.now, { windKmh: 22.4, windDir: 250, swellM: 2.84, swellS: 11.6, waterC: 15.4 }, 'valeurs du moment : celles de « current », jamais arrondies ni inventées');
  assert.equal(e.danger, 3);
  assert.ok(e.at > 0);
  assert.deepEqual(V.cached('surf'), e, 'lecture immédiate du cache ensuite');
  assert.equal(typeof V.html(e), 'string');
});

/* ---------- Le calcul est celui de « Ton créneau » ---------- */
test('verdict : bon, possible, non, comme bestSlot et slotSummary de la fiche', () => {
  world();
  const s = SPOTS.surf, o = { sport: 'surf', level: 'intermediaire' };
  const cases = [
    ['bon', weather({ wind: () => 6 }), marine({ wave: () => 1 })],                 // houle modeste, vent presque nul : « dans tes repères »
    ['possible', weather({ wind: () => 6 }), marine({ wave: () => 1.5 })],          // houle moyenne : « possible, sans plus »
    ['non', weather({ wind: () => 6 }), marine({ wave: () => 2.6 })]                // grosse houle : aucun créneau
  ];
  for (const [want, w, m] of cases) {
    const e = V.compute(s, rec(w, m), o, at(10));
    assert.equal(e.verdict, want);
    /* Même calcul, fait à la main avec les fonctions de la fiche. */
    const list = W.hours(w, m, { inland: false }), nowIso = W.localHourIso(OFF, at(10));
    const rule = W.rule('surf', false, 'intermediaire'), r = W.bestSlot(list, { act: 'surf', inland: false, level: 'intermediaire', date: nowIso.slice(0, 10), nowIso, catalogWind: s.wind });
    const x = F.slotSummary(rule, r);
    assert.equal(x.status, want === 'non' ? 'none' : 'ok');
    if (x.status === 'ok') { assert.equal(x.quality, want === 'bon' ? 'good' : 'ok'); assert.equal(e.slot, `${x.start} h à ${x.end} h`, 'mêmes heures que la fiche'); assert.equal(e.day, 'today'); }
    else assert.equal(e.slot, null);
  }
  /* Créneau d’aujourd’hui : à partir de l’heure locale du spot, en heures de jour (7 h à 21 h ici). */
  assert.equal(V.compute(s, rec(weather(), marine()), o, at(10)).slot, '10 h à 21 h');
  assert.equal(V.compute(s, rec(weather(), marine()), o, at(16)).slot, '16 h à 21 h');
  /* Une seule heure bonne : « 12 h », sans « à ». */
  const one = V.compute(s, rec(weather(), marine({ wave: h => (h === 12 ? 1 : 3) })), o, at(8));
  assert.deepEqual([one.verdict, one.slot], ['bon', '12 h']);
});

test('sans seuil dans le modèle : verdict null, on ne garde que les chiffres', () => {
  world();
  const w = weather(), m = marine();
  const dive = V.compute(SPOTS.dive, rec(w, m), { sport: 'plongee', level: 'intermediaire' }, at(10));
  assert.equal(dive.verdict, null, 'plongée : pas de seuil');
  assert.ok(dive.now && dive.now.waterC === 15.4, 'les chiffres restent');
  assert.equal(dive.danger, 4, 'le danger reste');
  assert.equal(V.compute(SPOTS.surf, rec(w, m), { sport: 'surf', level: 'expert' }, at(10)).verdict, null, 'surf expert : pas de seuil');
  assert.equal(V.compute(SPOTS.surf, rec(w, m), { sport: 'surf', level: null }, at(10)).verdict, null, 'surf sans niveau choisi');
  /* Prévision incomplète (houle absente pour du surf) : rien à affirmer. */
  assert.equal(V.compute(SPOTS.surf, rec(w, null), { sport: 'surf', level: 'intermediaire' }, at(10)).verdict, null);
  assert.equal(V.hasVerdict('dive', { sport: 'plongee', level: 'intermediaire' }), false);
  assert.equal(V.hasVerdict('surf', { sport: 'surf', level: 'expert' }), false);
  assert.equal(V.hasVerdict('surf', { sport: 'surf', level: 'debutant' }), true);
  assert.equal(V.hasVerdict('lake', { sport: 'all', level: null }), true, 'paddle sur un lac : jugé au vent, même sans niveau');
});

test('activité jugée : le sport demandé si le spot le propose, sinon sa première activité (comme la fiche)', () => {
  world();
  const calm = weather({ wind: () => 6 }), m = marine({ wave: () => 2.6 });
  /* « multi » : snorkeling puis surf. Grosse houle : pas de surf, mais le snorkeling se juge au vent (presque nul : bon). */
  assert.equal(V.compute(SPOTS.multi, rec(calm, m), { sport: 'surf', level: 'intermediaire' }, at(10)).verdict, 'non');
  assert.equal(V.compute(SPOTS.multi, rec(calm, m), { sport: 'all', level: 'intermediaire' }, at(10)).verdict, 'bon');
  assert.equal(V.compute(SPOTS.multi, rec(calm, m), { sport: 'kitesurf', level: 'intermediaire' }, at(10)).verdict, 'bon', 'sport absent du spot : sa première activité');
});

test('le soir : plus d’heure de jour aujourd’hui, le créneau de demain avec day = tomorrow', () => {
  world();
  const s = SPOTS.surf, o = { sport: 'surf', level: 'intermediaire' };
  const e = V.compute(s, rec(weather(), marine()), o, at(22));
  assert.deepEqual([e.verdict, e.slot, e.day], ['bon', '7 h à 21 h', 'tomorrow']);
  /* Demain sans créneau : « non », toujours pour demain. */
  const none = V.compute(s, rec(weather(), marine({ wave: () => 3 })), o, at(22));
  assert.deepEqual([none.verdict, none.slot, none.day], ['non', null, 'tomorrow']);
  /* Dans la journée, un jour sans créneau reste « non » pour aujourd’hui (le créneau de demain va dans next, plus bas). */
  const day = V.compute(s, rec(weather(), marine({ wave: (h, i) => (i < 24 ? 3 : 1) })), o, at(10));
  assert.deepEqual([day.verdict, day.slot, day.day], ['non', null, 'today']);
  /* Le soir du deuxième jour : aucune heure de demain dans la réponse, rien à affirmer. */
  assert.equal(V.compute(s, rec(weather(), marine()), o, at(22, 1)).verdict, null);
});

test('plan d’eau intérieur : le vent seulement, ni houle ni eau de mer', () => {
  world();
  const e = V.compute(SPOTS.lake, rec(weather({ wind: () => 6 }), marine()), { sport: 'all', level: null }, at(10));
  assert.deepEqual(e.now, { windKmh: 22.4, windDir: 250, swellM: null, swellS: null, waterC: null });
  assert.equal(e.verdict, 'bon');
  assert.equal(e.danger, null, 'danger non évalué : null, jamais 0');
  const h = V.html(e);
  assert.match(h, /aria-label="Vent"/);
  assert.doesNotMatch(h, /aria-label="Houle"|aria-label="Eau"/);
});

test('sans donnée : now null, aucun chiffre inventé', async () => {
  const w = world({ answer: () => null });
  const map = await V.forSpots(['surf', 'nowhere', 'inconnu']);
  /* Lot 1 : l'entrée porte aussi son id et l'eau et la saison du mois (null ici : aucune normale chargée dans ce monde factice). */
  assert.deepEqual(map.get('surf'), { now: null, verdict: null, slot: null, day: 'today', danger: 3, at: 0, id: 'surf', climate: null });
  assert.equal(map.get('nowhere').now, null, 'position non vérifiée : aucune demande, aucune valeur');
  assert.equal(map.get('nowhere').danger, 2);
  assert.equal(map.get('inconnu').now, null);
  assert.ok(w.calls.every(u => !/latitude=[^&]*(null|undefined|NaN)/.test(u)));
  assert.equal(V.cached('surf'), null, 'un refus n’est pas gardé : la prochaine demande réessaie');
  assert.equal(V.html(map.get('surf')), '<p class="ui-cond"><span class="is-none">Aucun relevé pour l’instant</span></p>', 'ni relevé gardé ni normale : la ligne le dit');
  assert.equal(V.html(null), '<p class="ui-cond"><span class="is-none">Conditions indisponibles</span></p>');
  /* Réponse d’erreur du service ({error:true}) : comme une absence. */
  world({ answer: () => ({ error: true, reason: 'x' }) });
  assert.equal((await V.forSpots(['surf'])).get('surf').now, null);
});

/* ---------- Demandes groupées ---------- */
test('une demande groupée par lot : plusieurs latitudes et longitudes, variables du calcul, 2 jours', async () => {
  const w = world();
  await V.forSpots(['surf', 'multi', 'dive']);
  assert.equal(w.calls.length, 2, 'une demande « prévision » et une demande « marine » pour trois spots');
  const [f, m] = [w.calls.find(u => /api\.open-meteo\.com\/v1\/forecast/.test(u)), w.calls.find(u => /marine-api\.open-meteo\.com\/v1\/marine/.test(u))];
  assert.match(f, /latitude=43\.66,-8\.72,17\.3&longitude=-1\.44,115\.17,-87\.5&/);
  assert.match(m, /latitude=43\.66,-8\.72,17\.3&longitude=-1\.44,115\.17,-87\.5&/);
  for (const v of ['wind_speed_10m', 'wind_gusts_10m', 'wind_direction_10m', 'weather_code', 'is_day']) assert.ok(new RegExp('hourly=[^&]*' + v).test(f), v);
  for (const v of ['wave_height', 'wave_period', 'wave_direction']) assert.ok(new RegExp('hourly=[^&]*' + v).test(m), v);
  assert.match(f, /current=wind_speed_10m,wind_direction_10m/);
  assert.match(m, /current=wave_height,wave_period,sea_surface_temperature/);
  for (const u of [f, m]) { assert.match(u, /forecast_days=2(&|$)/); assert.match(u, /timezone=auto/); assert.match(u, /cell_selection=sea/); }
  assert.match(f, /wind_speed_unit=kmh/);
  /* Dix variables au plus par demande : au-delà, Open-Meteo compte plus d’un appel par lieu. */
  const vars = u => [...u.matchAll(/(?:hourly|current)=([^&]*)/g)].flatMap(x => x[1].split(',')).length;
  assert.ok(vars(f) <= 10 && vars(m) <= 10);
});

test('lots : au plus LOT spots par demande ; mer et plans d’eau séparés (chacun garde la maille de sa fiche)', async () => {
  const w = world();
  assert.equal(V.LOT, 10);
  const ids = Array.from({ length: 14 }, (_, i) => 's' + i).concat('lake');
  const map = await V.forSpots(ids);
  assert.equal(map.size, 15);
  const fc = w.calls.filter(u => /\/v1\/forecast/.test(u)), mr = w.calls.filter(u => /\/v1\/marine/.test(u));
  const n = u => /latitude=([^&]*)/.exec(u)[1].split(',').length;
  assert.deepEqual(fc.map(n).sort((a, b) => b - a), [10, 4, 1], 'deux lots de mer (10 + 4) et un lot de plan d’eau');
  assert.deepEqual(mr.map(n).sort((a, b) => b - a), [10, 4], 'pas de demande marine pour un plan d’eau');
  const lake = fc.find(u => n(u) === 1);
  assert.match(lake, /cell_selection=land/);
  assert.match(lake, /latitude=45\.86&longitude=6\.17/);
  assert.ok(fc.filter(u => n(u) > 1).every(u => /cell_selection=sea/.test(u)));
  assert.ok([...map.values()].every(e => e.now), 'chaque spot reçoit sa réponse');
  /* L’ordre des réponses suit l’ordre des lieux : le spot i reçoit la réponse i. */
  const w2 = world({ answer: url => { const lats = /latitude=([^&]*)/.exec(url)[1].split(','); return lats.map(la => (/marine/.test(url) ? marine({ current: { sea_surface_temperature: +la } }) : weather())); } });
  const m2 = await V.forSpots(['s3', 's0', 's7']);
  assert.deepEqual(['s3', 's0', 's7'].map(id => m2.get(id).now.waterC), [43, 40, 47]);
  assert.equal(w2.calls.length, 2);
});

test('cache de 30 min par spot : rien n’est redemandé, puis une nouvelle demande après 30 min', async () => {
  const w = world();
  await V.forSpots(['surf', 'multi']);
  assert.equal(w.calls.length, 2);
  await V.forSpots(['surf']); await V.forSpots(['multi', 'surf']);
  assert.equal(w.calls.length, 2, 'spots déjà reçus : aucun appel');
  await V.forSpots(['surf', 'dive']);
  assert.equal(w.calls.length, 4, 'seul le nouveau spot est demandé');
  assert.match(w.calls[2], /latitude=17\.3&/);
  w.now += 29 * 60 * 1000;
  assert.ok(V.cached('surf'), 'encore valable à 29 min');
  await V.forSpots(['surf']);
  assert.equal(w.calls.length, 4);
  w.now += 2 * 60 * 1000;
  assert.equal(V.cached('surf'), null, 'périmé à 31 min : plus servi comme « du moment »');
  await V.forSpots(['surf']);
  assert.equal(w.calls.length, 6, 'redemandé après 30 min');
  /* Deux demandes en même temps pour le même spot : un seul appel. */
  const w3 = world();
  await Promise.all([V.forSpots(['surf']), V.forSpots(['surf', 'multi'])]);
  assert.equal(w3.calls.filter(u => /\/v1\/forecast/.test(u) && /43\.66/.test(u)).length, 1);
  assert.equal(w3.calls.length, 4, 'surf une fois, multi une fois (prévision et marine)');
});

test('le verdict suit l’heure et le profil sans nouvelle demande', async () => {
  const w = world();
  const a = (await V.forSpots(['surf'])).get('surf');
  assert.equal(a.slot, '10 h à 21 h');
  w.now = at(10) + 20 * 60 * 1000 + 3 * 36e5;
  assert.equal(V.cached('surf'), null, 'après 30 min, plus de cache');
  w.now = at(10) + 20 * 60 * 1000;
  assert.equal(V.cached('surf', { sport: 'surf', level: 'expert' }).verdict, null, 'niveau changé : recalculé sur les mêmes données');
  assert.equal(V.cached('surf', { sport: 'surf', level: 'intermediaire' }).verdict, 'bon');
  assert.equal(w.calls.length, 2);
});

test('sans meteoCached : mêmes règles, 30 min par adresse et pause de 2 min après un refus 429 ou 503', async () => {
  for (const status of [429, 503]) {
    let now = at(10), n = 0, mode = 'refuse';
    V.reset().setup({
      now: () => now, spot: id => SPOTS[id] || null, coords: s => s.coords, inland: () => false, sports: s => s.sports, gauge: s => s.gauge, sport: () => 'surf', level: () => 'intermediaire',
      lang: () => 'fr', t: s => s, num: (v, d) => (+v).toFixed(d), stamp: () => 0, load: V.ownLoad,
      fetch: url => { n++; return Promise.resolve(mode === 'refuse' ? { status, ok: false } : { status: 200, ok: true, json: () => Promise.resolve(/marine/.test(url) ? marine() : weather()) }); }
    });
    /* Dans l’app, meteoCached (app.js) d’abord ; sans lui (ici), le chargeur du module avec les mêmes règles. */
    assert.match(src, /load: \(url, force\) => \(typeof meteoCached === 'function' \? meteoCached\(url, force\) : ownLoad\(url, force\)\)/);
    assert.equal((await V.forSpots(['surf'])).get('surf').now, null);
    const refused = n;
    assert.ok(refused >= 1);
    mode = 'ok';
    await V.forSpots(['surf']);
    assert.equal(n, refused, 'pendant la pause, aucune demande');
    now += 119 * 1000; await V.forSpots(['surf']);
    assert.equal(n, refused, 'toujours en pause à 1 min 59');
    now += 2 * 1000;
    const e = (await V.forSpots(['surf'])).get('surf');
    assert.ok(e.now, 'après 2 min, la demande repart');
    const after = n;
    V.reset({ keepOwn: true });
    await V.forSpots(['surf']);
    assert.equal(n, after, 'même adresse dans la demi-heure : réponse gardée');
    now += 31 * 60 * 1000;
    await V.forSpots(['surf']);
    assert.ok(n > after, 'au-delà de 30 min : redemandée');
  }
  assert.match(src, /const TTL = 30 \* 60 \* 1000, PAUSE = 2 \* 60 \* 1000/);
  /* Dans l’app : le cache et la pause sont ceux de meteoCached (app.js), partagés avec les aperçus de conditions. */
  assert.match(read('app.js'), /Date\.now\(\)-hit\.t<18e5/);
  assert.match(read('app.js'), /r\.status===429\|\|r\.status===503\)\{meteoPauseUntil=Date\.now\(\)\+12e4/);
});

/* ---------- Affichage ---------- */
test('html : ligne .ui-cond (vent, houle, eau, pictogrammes de la fiche) puis ligne .ui-verdict', () => {
  world();
  const e = V.compute(SPOTS.surf, rec(weather(), marine()), { sport: 'surf', level: 'intermediaire' }, at(10));
  const h = V.html(e);
  assert.match(h, /^<p class="ui-cond">.*<\/p><p class="ui-verdict" data-v="bon"><b>Bon pour toi<\/b><span>10 h à 21 h<\/span><\/p>$/);
  /* Valeurs : vent arrondi, houle à une décimale, eau arrondie ; unités à part. */
  assert.match(h, /data-ui-n="22" data-ui-d="0">22<\/span><small>km\/h<\/small>/);
  assert.match(h, /data-ui-n="2\.8" data-ui-d="1">2,8<\/span><small>m<\/small>/);
  assert.match(h, /data-ui-n="15" data-ui-d="0">15<\/span><small>°C<\/small>/);
  /* Mêmes tracés que la fiche (spot-before.js, ICON) : vent, houle, eau. */
  const before = read('spot-before.js');
  for (const k of ['wind', 'wave', 'temp']) {
    const d = new RegExp(k + ": '([^']+)'").exec(before)[1];
    assert.ok(h.includes(d), 'pictogramme ' + k);
  }
  assert.equal((h.match(/class="ui-ic"/g) || []).length, 3);
  assert.match(h, /stroke-width="1\.6"/);
  for (const n of ['Vent', 'Houle', 'Eau']) assert.ok(h.includes(`aria-label="${n}"`), n);
  /* Libellés. */
  const label = (v, day, slot) => V.html(Object.assign({}, e, { verdict: v, day: day || 'today', slot: slot === undefined ? null : slot }));
  assert.match(label('possible', 'today', '14 h à 16 h'), /<p class="ui-verdict" data-v="possible"><b>Possible<\/b><span>14 h à 16 h<\/span><\/p>$/);
  assert.match(label('non'), /<p class="ui-verdict" data-v="non"><b>Pas aujourd’hui<\/b><\/p>$/);
  assert.match(label('bon', 'tomorrow', '9 h à 12 h'), /<b>Bon pour toi<\/b><span>Demain 9 h à 12 h<\/span>/);
  assert.match(label('non', 'tomorrow'), /<b>Pas demain<\/b><\/p>$/);
  assert.doesNotMatch(label(null), /ui-verdict/, 'sans verdict : seulement les chiffres');
  /* En mer, une valeur manquante s’écrit « — », jamais 0. */
  const part = V.html(Object.assign({}, e, { now: Object.assign({}, e.now, { waterC: null }) }));
  assert.match(part, /<span class="is-none"><svg[^>]*aria-label="Eau"[\s\S]*?<\/svg>—<\/span>/);
  assert.doesNotMatch(src.slice(src.indexOf('api.html')), /[→←↗]|—[^<`']*—/, 'ni flèche ni tiret décoratif');
});

test('place réservée : mêmes lignes que html(), sans texte', () => {
  world();
  const p = V.pending('surf');
  assert.equal((p.match(/class="ui-ic"/g) || []).length, 3);
  assert.match(p, /<p class="ui-cond is-wait" aria-hidden="true">/);
  assert.match(p, /<p class="ui-verdict is-wait" aria-hidden="true"><b class="ui-skel"><\/b><\/p>$/);
  assert.doesNotMatch(V.pending('dive', { sport: 'plongee' }), /ui-verdict/, 'pas de ligne de verdict réservée sans seuil');
  assert.equal((V.pending('lake').match(/class="ui-ic"/g) || []).length, 1, 'plan d’eau : le vent seulement');
});

test('heures et « Demain » dans la langue ; le mot de liaison vient du dictionnaire', () => {
  const o = { sport: 'surf', level: 'intermediaire' };
  const w = world({ lang: 'en' });
  let e = V.compute(SPOTS.surf, rec(weather(), marine()), o, at(22));
  assert.equal(e.slot, '7 AM to 9 PM');
  assert.match(V.html(e), /<span>Tomorrow 7 AM to 9 PM<\/span>/);
  w.lang = 'es'; V.setup({});
  e = V.compute(SPOTS.surf, rec(weather(), marine()), o, at(22));
  assert.equal(e.slot, '7 h a 21 h');
  assert.match(V.html(e), /<span>Mañana 7 h a 21 h<\/span>/);
});

test('aucun texte en dur hors de la chaîne de traduction : chaque libellé est une clé, traduite en anglais et en espagnol', () => {
  const fr = new Set(JSON.parse(read('locales/source/fr.json'))), en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json'));
  for (const k of ['Bon pour toi', 'Possible', 'Pas aujourd’hui', 'Pas demain', 'Conditions indisponibles', 'Demain', 'à', 'Vent', 'Houle', 'Eau']) {
    assert.ok(src.includes(k), 'libellé présent dans spot-verdict.js : ' + k);
    assert.ok(fr.has(k), 'clé extraite (locales/source/fr.json) : ' + k);
    assert.ok(typeof en[k] === 'string' && en[k].trim(), 'EN : ' + k);
    assert.ok(typeof es[k] === 'string' && es[k].trim(), 'ES : ' + k);
  }
  /* « à » et « Demain » passent par obT (écrits dans la langue avant d’être posés) : l’extracteur ne relève « à » que sous cette forme. */
  assert.match(src, /obT\('à'\)/);
  assert.match(src, /obT\('Demain'\)/);
  /* Tout texte français du rendu (entre balises ou dans un attribut lu) est l’une de ces clés. */
  const code = src.slice(src.indexOf('(function (root)')).replace(/\/\*[\s\S]*?\*\//g, '');
  const lits = [...code.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map(m => m[1]).filter(s => /[A-Za-zÀ-ÿ]{2}/.test(s) && /(^[A-ZÀ-Ö][a-zà-ÿ’ ]+$)|[à-ÿ’]/.test(s) && !/[<>=;{}()]/.test(s));
  for (const s of lits) assert.ok(fr.has(s) || ['fr-FR'].includes(s), 'texte hors dictionnaire : ' + s);
  assert.ok(lits.length >= 8);
});

test('mouvement réduit : les chiffres ne montent pas, les valeurs restent écrites', () => {
  world();
  const n = { dataset: { uiN: '22', uiD: '0' }, textContent: '22', style: {}, getBoundingClientRect: () => ({ width: 20 }) };
  const el = { querySelectorAll: () => [n] };
  V.animate(el);
  assert.equal(n.textContent, '22');
  assert.equal(n.dataset.uiDone, undefined);
  assert.match(src, /env\.reduced\(\)/);
  assert.match(src, /document\.body\.classList\.contains\('reduce-motion'\) \|\| matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/);
  /* Le décompte est fini (600 ms) : aucune boucle permanente. */
  assert.match(src, /if \(p < 1\) requestAnimationFrame\(step\)/);
  assert.doesNotMatch(src, /setInterval/);
});

test('index.html : spot-verdict.js chargé après ses modèles et app.js, avant l’accueil', () => {
  const html = read('index.html'), at2 = s => html.indexOf(`src="${s}`);
  for (const dep of ['app.js', 'spot-fit-model.js', 'spot-data-model.js', 'spot-weather-model.js']) assert.ok(at2(dep) > 0 && at2(dep) < at2('spot-verdict.js'), dep);
  assert.ok(at2('spot-verdict.js') < at2('home-feed.js'));
});

/* ================= Ajouts du 23 novembre 2026 ================= */
test('next : journée « non », le meilleur créneau de demain, même calcul que la fiche ; absent dans tous les autres cas', () => {
  world();
  const s = SPOTS.surf, o = { sport: 'surf', level: 'intermediaire' };
  /* Grosse houle aujourd’hui, houle modeste demain. */
  const w = weather(), m = marine({ wave: (h, i) => (i < 24 ? 3 : 1) });
  const e = V.compute(s, rec(w, m), o, at(10));
  assert.deepEqual([e.verdict, e.slot, e.day], ['non', null, 'today'], 'verdict, slot et day ne changent pas : la journée reste « non »');
  assert.deepEqual(e.next, { verdict: 'bon', slot: '7 h à 21 h', day: 'tomorrow' });
  /* Même calcul, fait à la main avec les fonctions de la fiche, sur la date du lendemain. */
  const list = W.hours(w, m, { inland: false }), rule = W.rule('surf', false, 'intermediaire');
  const r = W.bestSlot(list, { act: 'surf', inland: false, level: 'intermediaire', date: iso(24).slice(0, 10), nowIso: null, catalogWind: s.wind });
  const x = F.slotSummary(rule, r);
  assert.deepEqual([x.status, x.quality], ['ok', 'good']);
  assert.equal(e.next.slot, `${x.start} h à ${x.end} h`, 'mêmes heures que la fiche');
  /* Demain « possible, sans plus ». */
  const maybe = V.compute(s, rec(weather(), marine({ wave: (h, i) => (i < 24 ? 3 : 1.5) })), o, at(10));
  assert.deepEqual([maybe.verdict, maybe.next.verdict, maybe.next.day], ['non', 'possible', 'tomorrow']);
  /* Une seule bonne heure demain : « 12 h », sans « à ». */
  assert.equal(V.compute(s, rec(weather(), marine({ wave: (h, i) => (i >= 24 && h === 12 ? 1 : 3) })), o, at(10)).next.slot, '12 h');
  /* Rien demain non plus : pas de champ (jamais null, jamais une valeur inventée). */
  const none = V.compute(s, rec(weather(), marine({ wave: () => 3 })), o, at(10));
  assert.equal(none.verdict, 'non');
  assert.ok(!('next' in none));
  /* Un créneau aujourd’hui : pas de next. */
  for (const wave of [() => 1, () => 1.5]) assert.ok(!('next' in V.compute(s, rec(weather(), marine({ wave })), o, at(10))));
  /* Le soir, le verdict porte déjà sur demain (day = tomorrow) : pas de next. */
  const night = V.compute(s, rec(weather(), marine({ wave: () => 3 })), o, at(22));
  assert.deepEqual([night.verdict, night.day], ['non', 'tomorrow']);
  assert.ok(!('next' in night));
  /* Deuxième jour de la réponse : aucune heure du lendemain, rien à affirmer. */
  const last = V.compute(s, rec(weather(), marine({ wave: (h, i) => (i >= 24 ? 3 : 1) })), o, at(10, 1));
  assert.equal(last.verdict, 'non');
  assert.ok(!('next' in last));
  /* Sans seuil (plongée) ou sans donnée : pas de next. */
  assert.ok(!('next' in V.compute(SPOTS.dive, rec(w, m), { sport: 'plongee', level: 'intermediaire' }, at(10))));
  assert.ok(!('next' in V.compute(s, null, o, at(10))));
  /* Le contrat d’origine est toujours écrit dans l’en-tête, et l’ajout y est documenté. */
  const head = src.slice(0, src.indexOf('(function (root)'));
  assert.match(head, /AJOUTS DU 23 NOVEMBRE 2026/);
  assert.ok(head.includes("entrée.next = { verdict: 'bon' | 'possible', slot: '9 h à 12 h', day: 'tomorrow' }"));
  assert.ok(head.includes('data-ui-from'));
});

test('next par forSpots et cached : la même entrée, sans nouvelle demande', async () => {
  const w = world({ marine: { wave: (h, i) => (i < 24 ? 3 : 1) } });
  const e = (await V.forSpots(['surf'])).get('surf');
  assert.deepEqual(e.next, { verdict: 'bon', slot: '7 h à 21 h', day: 'tomorrow' });
  const calls = w.calls.length;
  assert.deepEqual(V.cached('surf').next, e.next);
  assert.equal(w.calls.length, calls);
});

test('html : le repère de demain après la pastille « Pas aujourd’hui », à la couleur de son verdict, dans la langue', () => {
  const o = { sport: 'surf', level: 'intermediaire' }, m = () => marine({ wave: (h, i) => (i < 24 ? 3 : 1) });
  const w = world();
  let e = V.compute(SPOTS.surf, rec(weather(), m()), o, at(10));
  let h = V.html(e);
  assert.match(h, /<p class="ui-verdict" data-v="non"><b>Pas aujourd’hui<\/b><span class="ui-next" data-v="bon"><svg class="ui-ic"[^>]*aria-hidden="true">[\s\S]*?<\/svg><span><em>Demain<\/em> 7 h à 21 h<\/span><\/span><\/p>$/);
  assert.equal((h.match(/class="ui-ic"/g) || []).length, 4, 'vent, houle, eau, et le soleil levant');
  /* Sans next : le rendu d’avant, à l’identique. */
  const plain = Object.assign({}, e); delete plain.next;
  assert.match(V.html(plain), /<p class="ui-verdict" data-v="non"><b>Pas aujourd’hui<\/b><\/p>$/);
  /* next ne s’écrit que pour une journée « non » d’aujourd’hui, avec un verdict connu et des heures. */
  for (const bad of [{ verdict: 'bon', slot: '10 h à 12 h' }, { verdict: 'non', day: 'tomorrow' }, { next: { verdict: 'non', slot: '9 h', day: 'tomorrow' } }, { next: { verdict: 'bon', slot: null, day: 'tomorrow' } }])
    assert.doesNotMatch(V.html(Object.assign({}, e, bad)), /ui-next/, JSON.stringify(bad));
  assert.match(V.html(Object.assign({}, e, { next: { verdict: 'possible', slot: '9 h à 12 h', day: 'tomorrow' } })), /<span class="ui-next" data-v="possible">/);
  /* Langues : « Demain » par le dictionnaire, les heures de la langue. */
  w.lang = 'en'; V.setup({});
  e = V.compute(SPOTS.surf, rec(weather(), m()), o, at(10));
  assert.match(V.html(e), /<em>Tomorrow<\/em> 7 AM to 9 PM<\/span>/);
  w.lang = 'es'; V.setup({});
  e = V.compute(SPOTS.surf, rec(weather(), m()), o, at(10));
  assert.match(V.html(e), /<em>Mañana<\/em> 7 h a 21 h<\/span>/);
  /* Style commun (ui-v2.css, ajout) : couleur du verdict de demain, et repli sur deux lignes quand la place manque. */
  const ui = read('ui-v2.css'), add = ui.slice(ui.indexOf('Ajouts du 23 novembre 2026'));
  assert.ok(ui.indexOf('Ajouts du 23 novembre 2026') > ui.indexOf('Ajouts du 20 novembre 2026'), 'ajout en fin de feuille');
  assert.match(add, /\.ocean-v2 \.ui-verdict>\.ui-next\[data-v=bon\]\{color:var\(--ui-good\)\}/);
  assert.match(add, /\.ocean-v2 \.ui-verdict>\.ui-next\[data-v=possible\]\{color:var\(--ui-maybe\)\}/);
  assert.match(add, /\.ocean-v2 \.ui-live \.ui-verdict\[data-fit="2"\]>\.ui-next>span\{display:grid;/);
  assert.doesNotMatch(add.replace(/\/\*[\s\S]*?\*\//g, ''), /#[0-9a-fA-F]{3,8}\b|rgba?\(|infinite|will-change/);
});

test('animate : un chiffre part de sa valeur d’avant (data-ui-from) ; inchangé, il ne bouge pas', () => {
  world();
  V.setup({ reduced: () => false });
  const frames = [];
  const had = global.requestAnimationFrame;
  global.requestAnimationFrame = f => { frames.push(f); };
  try {
    const node = (ds, text) => { const n = { dataset: ds, style: {}, isConnected: true, getBoundingClientRect: () => ({ width: 20 }) }; let t = text; Object.defineProperty(n, 'textContent', { get: () => t, set: v => { t = v; } }); return n; };
    const up = node({ uiN: '22', uiD: '0', uiFrom: '20' }, '22'), same = node({ uiN: '16', uiD: '0', uiFrom: '16' }, '16'), wave = node({ uiN: '1.4', uiD: '1', uiFrom: '2.4' }, '1,4'), zero = node({ uiN: '9', uiD: '0' }, '9');
    V.animate({ querySelectorAll: () => [up, same, wave, zero] });
    assert.equal(up.textContent, '20', 'départ : la valeur d’avant');
    assert.equal(wave.textContent, '2,4');
    assert.equal(zero.textContent, '0', 'sans valeur d’avant : départ à 0, comme avant');
    assert.equal(same.textContent, '16');
    assert.equal(same.dataset.uiDone, undefined, 'un chiffre inchangé n’est pas animé');
    const tick = t => { const f = frames.shift(); f(t); };
    tick(1000); tick(1300);
    assert.ok(+up.textContent > 20 && +up.textContent <= 22, 'en chemin : ' + up.textContent);
    assert.ok(parseFloat(wave.textContent.replace(',', '.')) < 2.4 && parseFloat(wave.textContent.replace(',', '.')) >= 1.4, 'il descend : ' + wave.textContent);
    tick(1600);
    assert.deepEqual([up.textContent, wave.textContent, zero.textContent], ['22', '1,4', '9'], 'arrivée : le texte exact');
    assert.equal(frames.length, 0, 'décompte fini : plus aucune image demandée');
  } finally { if (had) global.requestAnimationFrame = had; else delete global.requestAnimationFrame; }
});

