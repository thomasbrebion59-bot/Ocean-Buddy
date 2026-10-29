const test = require('node:test'), assert = require('node:assert/strict');
const { load, read } = require('./src-extract.cjs');
/* explorer-carte-spots-1 : la recherche trouve aussi par pays (« États-Unis »). */
const spots = [{ id: 'pipeline', name: 'Pipeline', loc: 'Hawaï (USA)', country: 'États-Unis' }, { id: 'biarritz', name: 'Côte des Basques', loc: 'Biarritz', country: 'France' }];
test('exploreSpots : « États-Unis » trouve Pipeline malgré loc « Hawaï (USA) »', () => {
  const c = load('app.js', ['exploreSpots', 'searchable', 'inSeason'], { SPOTS: spots, SPOT_WORLD: {}, spotWorld: 'all', spotCountry: '', activeSport: null, currentFilter: 'all',
    currentSearch: '', favOnly: false, favs: new Set(), countryOf: s => s.country, spotSports: () => [], SPORTMAP: {}, OceanPlan: undefined });
  assert.deepEqual(c.exploreSpots('all', { search: 'États-Unis' }).map(s => s.id), ['pipeline']);
  assert.deepEqual(c.exploreSpots('all', { search: 'etats-unis' }).map(s => s.id), ['pipeline']);
  assert.deepEqual(c.exploreSpots('all', { search: 'france' }).map(s => s.id), ['biarritz']);
  assert.deepEqual(c.exploreSpots('all', { search: 'pipeline' }).map(s => s.id), ['pipeline']);
});
test('sélecteur de voyage : la recherche inclut le pays', () => {
  assert.ok(read('trips.js').includes("normal(s.name+' '+s.loc+' '+countryOf(s))"));
});
/* Traits d'union et apostrophes comptent comme des espaces des deux côtés. */
test('exploreSpots : « saint gilles » et « l estacade » trouvent les noms avec trait d\'union ou apostrophe', () => {
  const list = [{ id: 'sgcv', name: 'Grande Plage — Saint-Gilles-Croix-de-Vie', loc: 'Vendée, France', country: 'France' }, { id: 'estacade', name: 'L’Estacade — Capbreton', loc: 'Landes, France', country: 'France' }];
  const c = load('app.js', ['exploreSpots', 'searchable', 'inSeason'], { SPOTS: list, SPOT_WORLD: {}, spotWorld: 'all', spotCountry: '', activeSport: null, currentFilter: 'all',
    currentSearch: '', favOnly: false, favs: new Set(), countryOf: s => s.country, spotSports: () => [], SPORTMAP: {}, OceanPlan: undefined });
  const ids = q => c.exploreSpots('all', { search: q }).map(s => s.id);
  assert.deepEqual(ids('saint gilles'), ['sgcv']);
  assert.deepEqual(ids('Saint-Gilles-Croix-de-Vie'), ['sgcv']);
  assert.deepEqual(ids('croix de vie'), ['sgcv']);
  assert.deepEqual(ids('l estacade'), ['estacade']);
  assert.deepEqual(ids("l'estacade"), ['estacade']);
  assert.deepEqual(ids('L’Estacade'), ['estacade']);
  assert.deepEqual(ids('estacade'), ['estacade']);
});
