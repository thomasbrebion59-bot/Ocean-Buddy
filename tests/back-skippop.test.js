/* demarrage-navigation-3 : la fermeture d’une couche par Retour/Avancer ne doit jamais avaler
   un vrai popstate plus tard (skipPop resté armé). */
const test = require('node:test'), assert = require('node:assert');
const vm = require('vm');
const { read } = require('./src-extract.cjs');

/* Le bloc popstate de app-shell.js, entre son commentaire et la confirmation. */
function popBlock() {
  const src = read('app-shell.js');
  const a = src.indexOf('/* Le retour du navigateur a déjà reculé'), b = src.indexOf('/* ---------- Confirmation');
  assert.ok(a > 0 && b > a, 'bloc popstate introuvable');
  return src.slice(a, b);
}
/* Faux navigateur : historique d’entrées 0..last, popstate asynchrone, listener de navigation.js simulé. */
function browser({ cur, last, overlays }) {
  const listeners = [], received = [], timers = [];
  let navIndex = cur, open = overlays;
  const fire = index => {
    let stopped = false;
    const e = { state: { index }, stopImmediatePropagation() { stopped = true; } };
    for (const l of listeners) { if (stopped) break; l(e); }
    return stopped;
  };
  const history = { go(n) { const t = cur + n; if (n === 0 || t < 0 || t > last) return; cur = t; setImmediate(() => fire(t)); } };
  const win = { addEventListener: (t, f) => { if (t === 'popstate') listeners.push(f); } };
  const ctx = vm.createContext({ window: win, history, setTimeout: (f) => { timers.push(f); return timers.length; }, clearTimeout: () => {},
    closeTopOverlay: () => (open > 0 ? (open--, true) : false) });
  win.OceanNavigation = { index: () => navIndex };
  vm.runInContext(popBlock(), ctx);
  /* navigation.js écoute après app-shell.js. */
  listeners.push(e => { received.push(e.state.index); navIndex = e.state.index; });
  const tick = () => new Promise(r => setImmediate(() => setImmediate(r)));
  return {
    async user(step) { const t = cur + step; if (t < 0 || t > last) return null; cur = t; const s = fire(t); await tick(); return s; },
    received, timers, get cur() { return cur; }, open: () => { open++; }
  };
}

test('Avancer avec une couche ouverte, puis Retour : le Retour atteint la navigation', async () => {
  const b = browser({ cur: 2, last: 3, overlays: 1 });
  await b.user(+1);                 /* Avancer : ferme la couche */
  assert.strictEqual(b.received.length, 0, 'l’écran ne doit pas changer en fermant la couche');
  const stopped = await b.user(-1); /* vrai Retour */
  assert.strictEqual(stopped, false, 'le Retour suivant a été avalé');
  assert.strictEqual(b.received.length, 1);
  assert.strictEqual(b.received[0], b.cur, 'écran et historique désynchronisés');
});

test('Retour avec une couche ouverte : la couche se ferme, l’historique revient où il était', async () => {
  const b = browser({ cur: 2, last: 2, overlays: 1 });
  await b.user(-1);
  assert.strictEqual(b.cur, 2);
  assert.deepStrictEqual(b.received, []);
  const stopped = await b.user(-1);
  assert.strictEqual(stopped, false);
  assert.deepStrictEqual(b.received, [1]);
});

test('Si le popstate de retour n’arrive jamais, skipPop retombe tout seul (minuterie)', async () => {
  const b = browser({ cur: 0, last: 0, overlays: 1 });
  /* Aucune entrée d’historique ici : simulons un popstate isolé qui ferme la couche. */
  await b.user(0);
  assert.ok(b.timers.length >= 1, 'aucune minuterie de repli');
  b.timers.forEach(f => f());
  const stopped = await b.user(0);
  assert.strictEqual(stopped, false);
});
