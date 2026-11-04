/* Classement « pour toi » et filtres combinables (spot-rank-model.js), plus quelques garde-fous d’intégration
   (accueil, recherche, Explorer, planète, historique). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = require('../spot-rank-model.js');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const spot = (id, o = {}) => ({ id, name: id, country: o.country || id, sports: o.sports || ['surf'], level: o.level || 'debutant', coords: o.coords || { lat: 0, lon: 0 }, ...o });

test('accord de niveau : à ton niveau, un cran au-dessus, déconseillé', () => {
  assert.equal(R.levelTier('debutant', 'debutant', 1), 3);
  assert.equal(R.levelTier('intermediaire', 'debutant', 1), 1);
  assert.equal(R.levelTier('expert', 'debutant', 1), 0, 'deux crans au-dessus');
  assert.equal(R.levelTier('debutant', 'debutant', 3), 0, 'jauge 3 pour un débutant');
  assert.equal(R.levelTier('debutant', 'debutant', null), 3, 'jauge non évaluée : pas pénalisée, pas garantie non plus');
  assert.equal(R.levelTier('variable', 'debutant', 1), 1, 'spot à évaluer : prudence pour un débutant');
  assert.equal(R.levelTier('variable', 'expert', 2), 2);
  assert.equal(R.levelTier('expert', 'intermediaire', 4), 0, 'un cran au-dessus et jauge 4');
  assert.equal(R.levelTier('intermediaire', 'intermediaire', 4), 1);
  assert.equal(R.levelTier('debutant', 'expert', 4), 3);
  assert.equal(R.levelTier('expert', null, 4), 2, 'sans niveau choisi : neutre');
});

test('saison du mois', () => {
  assert.equal(R.seasonTier([10, 11], 10), 2);
  assert.equal(R.seasonTier([5, 6], 10), 0);
  assert.equal(R.seasonTier(null, 10), 1);
  assert.equal(R.seasonTier([], 10), 1);
});

test('classement : sport, puis niveau, puis saison, puis proximité, puis photo', () => {
  const spots = [
    spot('loin-saison', { coords: { lat: -8, lon: 115 } }),
    spot('pres-hors', { coords: { lat: 43.6, lon: -1.4 } }),
    spot('expert', { level: 'expert' }),
    spot('plongee', { sports: ['plongee'] }),
    spot('pres-saison', { coords: { lat: 43.5, lon: -1.5 } }),
    spot('loin-saison-belle', { coords: { lat: -8.5, lon: 115.1 } })
  ];
  const seasons = { 'loin-saison': [10], 'pres-hors': [6], expert: [10], 'pres-saison': [10], 'loin-saison-belle': [10] };
  const ctx = { sport: 'surf', level: 'debutant', month: 10, seasons, pos: { lat: 43.48, lon: -1.55 }, photo: { 'loin-saison-belle': 95, 'loin-saison': 20 } };
  const ids = R.rank(spots, ctx).map(s => s.id);
  assert.ok(!ids.includes('plongee'), 'le sport filtre la liste');
  assert.deepEqual(ids, ['pres-saison', 'loin-saison-belle', 'loin-saison', 'pres-hors', 'expert']);
  /* Sans position : la photo départage les spots en saison. */
  const ids2 = R.rank(spots, { ...ctx, pos: null }).map(s => s.id);
  assert.equal(ids2[0], 'loin-saison-belle');
  assert.equal(ids2.at(-1), 'expert');
  /* Sport « Tous » : tout le catalogue reste, simplement trié. */
  assert.equal(R.rank(spots, { ...ctx, sport: 'all' }).length, spots.length);
  assert.equal(R.rank(spots, { ...ctx, strict: false }).length, spots.length);
});

test('« Pour toi » : jamais un spot déconseillé, un seul par pays, vraie photo exigée', () => {
  const spots = [
    spot('a', { country: 'France' }), spot('b', { country: 'France' }), spot('c', { country: 'Maroc' }),
    spot('d', { country: 'Portugal', level: 'expert' }), spot('e', { country: 'Espagne', noPhoto: true }), spot('f', { country: 'Irlande' })
  ];
  const got = R.forYou(spots, { sport: 'surf', level: 'debutant', month: 0, hasPhoto: s => !s.noPhoto });
  const ids = got.map(x => x.spot.id);
  assert.equal(ids.length, 3);
  assert.ok(!ids.includes('d') && !ids.includes('e'));
  assert.equal(ids.filter(id => id === 'a' || id === 'b').length, 1);
  assert.ok(got.every(x => x.why.tier >= 1));
  /* Spots déjà montrés plus haut : ignorés. */
  const used = new Set(['a', 'c']);
  assert.ok(!R.forYou(spots, { level: 'debutant' }, { used }).some(x => used.has(x.spot.id)));
});

test('tirage du jour : stable dans la journée, ne change jamais le palier', () => {
  assert.equal(R.dayHash('hossegor', 20000), R.dayHash('hossegor', 20000));
  assert.notEqual(R.dayHash('hossegor', 20000), R.dayHash('hossegor', 20001));
  const spots = Array.from({ length: 30 }, (_, i) => spot('s' + i, { level: i % 3 === 0 ? 'intermediaire' : 'debutant' }));
  for (let day = 0; day < 5; day++) {
    const r = R.rank(spots, { level: 'debutant', day, jitter: 30 });
    const firstUp = r.findIndex(s => s.level === 'intermediaire');
    assert.ok(r.slice(firstUp).every(s => s.level === 'intermediaire'), 'les spots au-dessus du niveau restent derrière');
  }
});

test('distance', () => {
  assert.equal(R.distKm({ lat: 0, lon: 0 }, { lat: 0, lon: 0 }), 0);
  assert.ok(Math.abs(R.distKm({ lat: 43.66, lon: -1.44 }, { lat: 48.85, lon: 2.35 }) - 660) < 30);
  assert.equal(R.distKm(null, { lat: 0, lon: 0 }), null);
});

test('filtres combinables : chaîne canonique, anciennes valeurs comprises', () => {
  assert.equal(R.normFilter('all'), 'all');
  assert.equal(R.normFilter(''), 'all');
  assert.equal(R.normFilter('season,debutant'), 'debutant,season');
  assert.equal(R.normFilter('nimporte,expert'), 'expert');
  assert.equal(R.normFilter('new'), 'new');
  let f = 'all';
  f = R.toggleFilter(f, 'debutant'); assert.equal(f, 'debutant');
  f = R.toggleFilter(f, 'season'); assert.equal(f, 'debutant,season');
  f = R.toggleFilter(f, 'intermediaire'); assert.equal(f, 'debutant,intermediaire,season');
  f = R.toggleFilter(f, 'debutant'); assert.equal(f, 'intermediaire,season');
  assert.equal(R.toggleFilter(f, 'season', true), 'intermediaire,season');
  assert.equal(R.toggleFilter(f, 'new', true), 'intermediaire,season,new');
  assert.equal(R.toggleFilter(f, 'all'), 'all');
  assert.equal(R.countParts('debutant,season'), 2);
  assert.equal(R.countParts('all'), 0);
  assert.ok(R.hasPart('debutant,season', 'season'));
  assert.ok(R.hasPart('all', 'all'));
  assert.ok(!R.hasPart('debutant', 'all'));
});

test('filtres combinables : débutant ET en saison', () => {
  const inSeason = s => s.id.endsWith('-s');
  const list = [spot('a-s'), spot('b'), spot('c-s', { level: 'expert' }), spot('d-s', { level: 'bizarre' }), spot('e', { catalogNew: true })];
  const pick = f => list.filter(s => R.matchFilter(s, f, { inSeason })).map(s => s.id);
  assert.deepEqual(pick('all'), ['a-s', 'b', 'c-s', 'd-s', 'e']);
  assert.deepEqual(pick('debutant,season'), ['a-s']);
  assert.deepEqual(pick('debutant,expert'), ['a-s', 'b', 'c-s', 'e']);
  assert.deepEqual(pick('variable'), ['d-s'], 'niveau inconnu = à évaluer');
  assert.deepEqual(pick('new'), ['e']);
  assert.deepEqual(pick('season'), ['a-s', 'c-s', 'd-s']);
});

test('historique : restore() relit les filtres combinés et chaque option de la planète', () => {
  const nav = read('navigation.js');
  assert.match(nav, /currentFilter=window\.SpotRank\?\.normFilter\?\.\(route\.filter\)/, 'navigation.js normalise le filtre restauré');
  const map = read('ocean-map.js');
  const parts = [...map.matchAll(/data-map-filter="([a-z]+)"/g)].map(m => m[1]);
  for (const p of R.PARTS) assert.ok(map.includes(`'${p}'`), `option « ${p} » absente du menu de la planète`);
  for (const p of parts) assert.ok(p === 'all' || R.PARTS.includes(p), `option inconnue « ${p} »`);
});

test('la recherche de l’accueil garde le sport et le thème', () => {
  const d = read('design.js');
  const body = d.slice(d.indexOf('function searchEverywhere('), d.indexOf("$('.mobile-search').onclick"));
  assert.ok(body.length > 50);
  assert.doesNotMatch(body, /activeSport=null/);
  assert.doesNotMatch(body, /chosenSport='all'/);
  assert.doesNotMatch(body, /OceanTheme\?\.set/);
});

test('accueil : bloc « Pour toi aujourd’hui » posé par home-feed.js, sans nouvel appel réseau', () => {
  const h = read('home-feed.js');
  assert.match(h, /data-hf="pourtoi"/);
  assert.match(h, /SpotRank/);
  const block = h.slice(h.indexOf('function forYouSection('), h.indexOf('/* ---------- Fin de « Pour toi'));
  assert.ok(block.length > 100, 'forYouSection introuvable');
  assert.doesNotMatch(block, /fetch\(|getCurrentPosition|requestGeo|queuePreviewCondition|fetchConditions/);
  const html = read('index.html');
  assert.ok(html.indexOf('spot-rank-model.js') > 0 && html.indexOf('spot-rank-model.js') < html.indexOf('app.js?'), 'spot-rank-model.js chargé avant app.js');
});
