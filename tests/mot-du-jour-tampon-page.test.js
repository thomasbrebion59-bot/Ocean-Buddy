const test = require('node:test'), assert = require('node:assert/strict');
const { read, load } = require('./src-extract.cjs');
/* Contrôle final 3 (mineur) : mauvaise réponse au mot du jour, puis tampon gagné en ouvrant la page du pays : le compteur
   passait à « 2 tampons » mais la carte gardait le rond « ? » et « Ouvre sa page pour gagner son tampon. ». syncStamps
   remplace sur place le bloc du tampon (le bouton « Découvrir… » et son focus restent, hauteur inchangée). */
function run({ empty = true, stampedNow = true, answered = 'Japon' } = {}) {
  const calls = { replaced: null, fit: 0 };
  const res = { querySelector: s => (s === '.cult-stamp.is-empty' && empty ? {} : null), replaceWith: n => { calls.replaced = n; } };
  const done = { querySelector: s => (s === '.cult-quiz-res' ? res : null) };
  const next = { id: 'nouveau tampon' };
  const ctx = load('cultures.js', ['syncQuizStamp'], {
    $: s => (s === '[data-cult-quiz-body].is-done' ? done : null),
    today: () => ({ country: 'Japon' }), read: () => ({}), stamped: () => stampedNow,
    M: { answered: () => (answered ? { c: answered, ok: false } : null) },
    doneHTML: (q, a) => `res:${q.country}:${a.ok}`, fitDone: () => { calls.fit++; },
    document: { createElement: () => ({ set innerHTML(v) { this.v = v; }, querySelector: s => (s === '.cult-quiz-res' ? next : null) }) }
  });
  ctx.syncQuizStamp();
  return { calls, next };
}
test('mot du jour : tampon gagné par la page du pays, le résultat le montre aussitôt', () => {
  const { calls, next } = run();
  assert.equal(calls.replaced, next); assert.equal(calls.fit, 1);
});
test('mot du jour : rien ne change si le tampon est déjà affiché, pas encore gagné, ou si le jeu n’est pas répondu', () => {
  assert.equal(run({ empty: false }).calls.replaced, null);
  assert.equal(run({ stampedNow: false }).calls.replaced, null);
  assert.equal(run({ answered: 'Fidji' }).calls.replaced, null);
  assert.match(read('cultures.js'), /syncQuizStamp\(\);syncMeta\(\);renderPassport\(\);syncBanner\(\);/);
});
