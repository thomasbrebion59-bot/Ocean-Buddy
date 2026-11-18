/* Météo de la fiche (open-meteo répond parfois 503) : un essai, UN seul nouvel essai automatique quelques secondes plus
   tard, puis plus rien tant qu’on ne touche pas « Réessayer » ; un toucher = un essai, jamais deux à la fois.
   SpotWeatherModel.retrier (pur, minuteries injectées) et les conditions du moment de la fiche (app.js fetchConditions). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { fnSource, read } = require('./src-extract.cjs');
const W = require('../spot-weather-model.js');

/* Horloge factice : minuteries rangées par échéance, tâches de fond vidées entre deux échéances. */
function clock() {
  let now = 0;
  const timers = [];
  const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
  return {
    setTimeout: (fn, ms) => { const t = { at: now + (+ms || 0), fn }; timers.push(t); return t; },
    clearTimeout: t => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); },
    pending: () => timers.length,
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

test('retrier : un essai, un seul nouvel essai automatique après RETRY_MS, puis plus rien sans toucher', async () => {
  const ck = clock(), states = [];
  let runs = 0;
  const r = W.retrier(() => { runs++; return Promise.reject(Error('503')); }, s => states.push(s), { setTimeout: ck.setTimeout, clearTimeout: ck.clearTimeout });
  assert.equal(W.RETRY_MS >= 2000 && W.RETRY_MS <= 8000, true, 'quelques secondes');
  assert.equal(r.start(), true);
  assert.equal(r.start(), false, 'pas de second essai pendant le premier');
  await ck.advance(0);
  assert.equal(runs, 1);
  assert.deepEqual(states, ['busy', 'wait']);
  assert.equal(r.again(), false, 'pas d’essai pendant qu’un nouvel essai est programmé');
  await ck.advance(W.RETRY_MS);
  assert.equal(runs, 2);
  assert.deepEqual(states, ['busy', 'wait', 'busy', 'failed']);
  await ck.advance(60 * 60 * 1000);
  assert.equal(runs, 2, 'aucune boucle de requêtes');
  assert.equal(ck.pending(), 0);
  assert.equal(r.again(), true, 'un toucher = un essai');
  assert.equal(r.again(), false, 'deuxième toucher pendant l’essai : ignoré');
  await ck.advance(60 * 60 * 1000);
  assert.equal(runs, 3, 'après un toucher, pas de nouvelle reprise automatique');
  assert.equal(states.at(-1), 'failed');
});

test('retrier : réussite = rien d’autre ; stop() (autre spot) annule le nouvel essai programmé', async () => {
  const ck = clock(), opts = { setTimeout: ck.setTimeout, clearTimeout: ck.clearTimeout };
  let runs = 0;
  const ok = W.retrier(() => { runs++; return Promise.resolve({ fine: true }); }, null, opts);
  ok.start(); await ck.advance(60000);
  assert.equal(runs, 1);
  let later = 0; const states = [];
  const r = W.retrier(() => { later++; return Promise.reject(Error('503')); }, s => states.push(s), opts);
  r.start(); await ck.advance(0);
  r.stop(); await ck.advance(60000);
  assert.equal(later, 1, 'le spot a changé : aucune demande de plus');
  assert.deepEqual(states, ['busy', 'wait']);
});

/* app.js : conditions du moment de la fiche, avec un faux fetch qui répond 503. */
function nowContext({ status = 503, inland = false } = {}) {
  const ck = clock(), calls = [], before = [];
  const head = { textContent: '', innerHTML: '', querySelector: s => (s === '[data-weather-retry]' && /data-weather-retry/.test(head.innerHTML) ? {} : null) };
  const ctx = vm.createContext({
    console, Promise, Math, Date, JSON, Error, setTimeout: ck.setTimeout, clearTimeout: ck.clearTimeout,
    COORDS: { x: { lat: 43.6, lon: -1.4 } }, LIVE: {}, currentSpot: 'x', nowTry: null,
    renderConditions() {}, tideFromMarine: () => null, cardinal: () => 'O', num1: v => String(v),
    document: { getElementById: id => (id === 'dCondHead' ? head : null), addEventListener() {} },
    fetch: url => { calls.push(url); return Promise.resolve({ ok: status === 200, status, json: () => Promise.resolve({ error: true }) }); }
  });
  ctx.window = ctx;
  ctx.SpotDataModel = require('../spot-data-model.js');
  ctx.OceanBefore = { live: (s, l) => before.push(['live', l]), retry: (s, k, f) => before.push(['retry', k, f]), wait: (s, k) => before.push(['wait', k]) };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'spot-weather-model.js'), 'utf8'), ctx);
  const app = read('app.js');
  vm.runInContext(['isInland', 'meteoCell', 'fetchConditions', 'conditionsNone', 'conditionsFailed', 'conditionsWait', 'showConditions'].map(n => fnSource(app, n)).join('\n'), ctx);
  const spot = { id: 'x', name: 'X', waterType: inland ? 'lake' : 'sea' };
  const count = () => ({ forecast: calls.filter(u => /api\.open-meteo\.com\/v1\/forecast/.test(u)).length, marine: calls.filter(u => /marine-api/.test(u)).length });
  return { ck, ctx, spot, count, before, head };
}

test('conditions du moment : 503 partout, exactement deux demandes automatiques puis aucune jusqu’au toucher', async () => {
  const { ck, ctx, spot, count, before, head } = nowContext();
  ctx.fetchConditions(spot);
  await ck.advance(0);
  assert.deepEqual(count(), { forecast: 1, marine: 1 });
  assert.ok(!before.some(b => b[0] === 'retry' || (b[0] === 'live' && b[1] === null)), 'premier refus : « Chargement… » reste affiché');
  await ck.advance(W.RETRY_MS);
  assert.deepEqual(count(), { forecast: 2, marine: 2 }, 'un seul nouvel essai automatique');
  assert.deepEqual(before.filter(b => b[0] === 'retry'), [['retry', 'live', 'now']], '« Indisponible » + « Réessayer » dans « Maintenant »');
  assert.match(head.innerHTML, /<span>Indisponible<\/span><button type="button" class="ob-retry" data-weather-retry="now">Réessayer<\/button>/);
  await ck.advance(30 * 60 * 1000);
  assert.deepEqual(count(), { forecast: 2, marine: 2 }, 'zéro demande jusqu’au toucher');
  /* Le toucher (délégation de clic d’app.js) appelle nowTry.again() : un essai, et rien pendant qu’il tourne. */
  assert.equal(ctx.nowTry.again(), true);
  assert.equal(ctx.nowTry.again(), false);
  assert.equal(head.textContent, 'Chargement…', 'la tête repasse à « Chargement… » pendant l’essai');
  await ck.advance(30 * 60 * 1000);
  assert.deepEqual(count(), { forecast: 3, marine: 3 });
  assert.match(read('app.js'), /closest\?\.\('\[data-weather-retry="now"\]'\)&&nowTry\)nowTry\.again\(\)/);
});

test('conditions du moment : le spot change pendant l’attente, le nouvel essai n’a pas lieu ; lac = une seule demande par essai', async () => {
  const a = nowContext();
  a.ctx.fetchConditions(a.spot);
  await a.ck.advance(0);
  a.ctx.fetchConditions({ id: 'y', name: 'Y', waterType: 'sea' });
  await a.ck.advance(30 * 60 * 1000);
  assert.equal(a.count().forecast, 1, 'l’essai programmé pour l’ancien spot est annulé (COORDS absent pour y)');
  const lake = nowContext({ inland: true });
  lake.ctx.fetchConditions(lake.spot);
  await lake.ck.advance(30 * 60 * 1000);
  assert.deepEqual(lake.count(), { forecast: 2, marine: 0 });
});
