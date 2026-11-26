/* app-update-model.js : quand proposer la mise à jour (logique pure, sans DOM).
   Écran « store » (nouvelle version sur l’App Store) : à chaque lancement, puis à chaque retour au premier plan après au
   moins 10 minutes ailleurs ; « Plus tard » ne le ferme que pour ce moment-là ; plus de silence de 3 jours.
   Mise à jour directe (« live ») : comme avant, au lancement puis au plus une fois par demi-heure. */
const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../app-update-model.js');

const MIN = 60 * 1000;

test('constantes : 10 minutes d’absence, 30 minutes entre deux vérifications directes, premier contrôle à 4 s', () => {
  assert.equal(U.AWAY_MIN, 10 * MIN);
  assert.equal(U.LIVE_EVERY, 30 * MIN);
  assert.equal(U.FIRST_CHECK, 4000);
  assert.equal(U.LEGACY_SNOOZE, 'oceanbuddy_update_store_snooze');
});

test('lancement : tout est à vérifier (mise à jour directe puis App Store)', () => {
  const s = U.initial();
  assert.deepEqual(U.plan(s, 4000, null), { live: true, store: true });
});

test('retour après 9 min 59 s : même moment, l’App Store n’est pas revérifié', () => {
  let s = U.storeChecked(U.liveChecked(U.initial(), 0), true);
  s = U.hidden(s, 1 * MIN);
  s = U.visible(s, 1 * MIN + 10 * MIN - 1000, null);
  assert.deepEqual(U.plan(s, 11 * MIN, null), { live: false, store: false });
});

test('retour après 10 min pile : nouveau moment, l’App Store est revérifié (la mise à jour directe attend ses 30 min)', () => {
  let s = U.storeChecked(U.liveChecked(U.initial(), 0), true);
  s = U.hidden(s, 2 * MIN);
  s = U.visible(s, 12 * MIN, null);
  assert.deepEqual(U.plan(s, 12 * MIN, null), { live: false, store: true });
});

test('mise à jour directe : vérifiée de nouveau après plus de 30 min, même après une courte absence', () => {
  let s = U.storeChecked(U.liveChecked(U.initial(), 0), true);
  s = U.hidden(s, 40 * MIN);
  s = U.visible(s, 41 * MIN, null);
  assert.deepEqual(U.plan(s, 41 * MIN, null), { live: true, store: false });
  assert.deepEqual(U.plan(U.liveChecked(s, 41 * MIN), 50 * MIN, null), { live: false, store: false });
});

test('« Plus tard » ne vaut que pour le moment : rien au retour suivant court, l’écran revient après 10 min', () => {
  let s = U.initial();
  assert.equal(U.plan(s, 0, null).store, true);
  s = U.storeChecked(U.liveChecked(s, 0), true);           // écran montré, puis « Plus tard »
  for (const away of [30 * 1000, 3 * MIN, 9 * MIN]) {
    s = U.visible(U.hidden(s, 0), away, null);
    assert.equal(U.plan(s, away, null).store, false, 'absence de ' + away / 1000 + ' s');
  }
  s = U.visible(U.hidden(s, 0), 10 * MIN, null);
  assert.equal(U.plan(s, 10 * MIN, null).store, true);
});

test('écran déjà ouvert (ou en attente) : rien à vérifier, et il compte pour le nouveau moment', () => {
  let s = U.storeChecked(U.liveChecked(U.initial(), 0), true);
  s = U.visible(U.hidden(s, 0), 15 * MIN, 'store');
  assert.equal(s.storeDue, false, 'l’écran ouvert sert ce moment-là');
  assert.deepEqual(U.plan(s, 15 * MIN, 'store'), { live: false, store: false });
  assert.deepEqual(U.plan(U.initial(), 0, 'live'), { live: false, store: false });
  /* Fenêtre « live » ouverte pendant une longue absence : l’App Store reste à vérifier une fois qu’elle sera fermée. */
  const t = U.visible(U.hidden(U.storeChecked(U.initial(), true), 0), 20 * MIN, 'live');
  assert.equal(t.storeDue, true);
});

test('échec réseau de l’App Store : on réessaie au retour suivant, même court', () => {
  let s = U.storeChecked(U.liveChecked(U.initial(), 0), false);
  assert.equal(s.storeDue, true);
  s = U.visible(U.hidden(s, 1 * MIN), 2 * MIN, null);
  assert.equal(U.plan(s, 2 * MIN, null).store, true);
});

test('retour sans départ connu (premier événement) : pas de nouveau moment inventé', () => {
  const s = U.visible(U.storeChecked(U.initial(), true), 60 * MIN, null);
  assert.equal(s.storeDue, false);
  assert.equal(s.hiddenAt, null);
});

test('decide : la mise à jour directe passe d’abord, puis l’App Store, sinon rien', () => {
  assert.deepEqual(U.decide({ kind: 'live', id: 'x' }, { kind: 'store', version: '1.5.0' }), { kind: 'live' });
  assert.deepEqual(U.decide(null, { kind: 'store', version: '1.5.0' }), { kind: 'store', version: '1.5.0' });
  /* App sous native_min : checkLive répond { kind:'store' } sans version ; seule la réponse de l’App Store ouvre l’écran. */
  assert.equal(U.decide({ kind: 'store' }, null), null);
  assert.deepEqual(U.decide({ kind: 'store' }, { kind: 'store', version: '1.5.1' }), { kind: 'store', version: '1.5.1' });
  assert.equal(U.decide(null, null), null);
  assert.equal(U.decide(undefined, undefined), null);
});

test('cleanVersion : seulement un numéro de version, rien d’autre venu du réseau', () => {
  assert.equal(U.cleanVersion('1.5.0'), '1.5.0');
  assert.equal(U.cleanVersion(' 1.5 '), '1.5');
  assert.equal(U.cleanVersion('2.0.1.3'), '2.0.1.3');
  for (const bad of ['', null, undefined, '1.5.0 (2)', '<img src=x onerror=alert(1)>', 'v1.5', '1..5', '1.5.0.0.1']) {
    assert.equal(U.cleanVersion(bad), '', String(bad));
  }
  assert.deepEqual(U.decide(null, { kind: 'store', version: '<b>' }), { kind: 'store', version: '' });
});

test('ancien silence de 3 jours : la clé est effacée si elle existe, rien sinon, jamais d’erreur', () => {
  const store = (init) => {
    const m = new Map(Object.entries(init)), removed = [];
    return { removed, getItem: k => (m.has(k) ? m.get(k) : null), removeItem: k => { removed.push(k); m.delete(k); }, has: k => m.has(k) };
  };
  const a = store({ oceanbuddy_update_store_snooze: '{"v":"1.5.0","until":9e15}', oceanbuddy_v1: '{}' });
  assert.equal(U.forgetLegacySnooze(a), true);
  assert.deepEqual(a.removed, ['oceanbuddy_update_store_snooze']);
  assert.ok(a.has('oceanbuddy_v1'), 'les autres données restent');
  const b = store({ oceanbuddy_v1: '{}' });
  assert.equal(U.forgetLegacySnooze(b), false);
  assert.deepEqual(b.removed, [], 'pas d’écriture inutile (la copie native suit chaque écriture)');
  assert.equal(U.forgetLegacySnooze(null), false);
  assert.equal(U.forgetLegacySnooze({ getItem() { throw new Error('stockage bloqué'); } }), false);
});

test('le module s’expose sur window comme les autres *-model.js', () => {
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  const ctx = vm.createContext({}); ctx.window = ctx;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app-update-model.js'), 'utf8'), ctx);
  assert.equal(typeof ctx.AppUpdateModel.plan, 'function');
  assert.equal(ctx.AppUpdateModel.AWAY_MIN, 10 * MIN);
});
