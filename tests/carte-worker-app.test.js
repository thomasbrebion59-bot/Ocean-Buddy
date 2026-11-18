/* Carte dans l’app iOS (WKWebView, page en capacitor://) : MapLibre ne déduit l’adresse de son worker que d’une page
   http(s). Sans adresse explicite il lance new Worker(""), qui échoue ; ses workers sont gardés à vie, donc aucune carte
   n’atteint « load » (essai du 18 nov. sur simulateur iOS 27 : chaque carte abandonnée au bout de 20 s, pas de plongée).
   loadEngine() doit poser l’adresse absolue du worker dès le chargement du moteur, et seulement hors http(s). */
const test = require('node:test'), assert = require('node:assert');
const vm = require('node:vm');
const { read, fnSource } = require('./src-extract.cjs');

const src = read('ocean-map.js');

function engine({ protocol, baseURI, already = '' }) {
  const calls = [];
  const ml = {
    url: already,
    getWorkerUrl() { return this.url; },
    setWorkerUrl(u) { calls.push(u); this.url = u; }
  };
  const ctx = vm.createContext({
    URL, Promise, engine: null,
    location: { protocol },
    document: {
      baseURI,
      querySelector: () => ({}),
      createElement: () => ({ dataset: {} }),
      head: { append() {} }
    },
    /* import() dynamique remplacé : le module MapLibre factice. */
    __import: () => Promise.resolve(ml)
  });
  const code = ['workerUrl', 'loadEngine'].map(n => fnSource(src, n)).join('\n').replace(/\bimport\(/g, '__import(');
  vm.runInContext(code, ctx);
  return { ctx, ml, calls };
}

test('app iOS (capacitor://) : adresse absolue du worker posée avant la première carte', async () => {
  const { ctx, ml, calls } = engine({ protocol: 'capacitor:', baseURI: 'capacitor://oceanbuddy.localhost/' });
  const got = await ctx.loadEngine();
  assert.strictEqual(got, ml, 'loadEngine rend le module MapLibre');
  assert.deepStrictEqual(calls, ['capacitor://oceanbuddy.localhost/vendor/maplibre/maplibre-gl-worker.mjs']);
  assert.strictEqual(ml.getWorkerUrl(), 'capacitor://oceanbuddy.localhost/vendor/maplibre/maplibre-gl-worker.mjs');
  /* Moteur gardé : un second appel ne repose rien. */
  await ctx.loadEngine();
  assert.strictEqual(calls.length, 1);
});

test('site (http/https) : MapLibre garde son propre calcul, rien n’est posé', async () => {
  for (const protocol of ['https:', 'http:']) {
    const { ctx, calls } = engine({ protocol, baseURI: 'https://oceanbuddy.app/' });
    await ctx.loadEngine();
    assert.deepStrictEqual(calls, [], protocol);
  }
});

test('adresse déjà réglée ailleurs : jamais écrasée', async () => {
  const { ctx, calls, ml } = engine({ protocol: 'capacitor:', baseURI: 'capacitor://oceanbuddy.localhost/', already: 'blob:x' });
  await ctx.loadEngine();
  assert.deepStrictEqual(calls, []);
  assert.strictEqual(ml.getWorkerUrl(), 'blob:x');
});

test('le seul chargeur du moteur passe par workerUrl', () => {
  const imports = src.match(/import\(new URL\('vendor\/maplibre\/maplibre-gl\.mjs'[^\n]*/g) || [];
  assert.strictEqual(imports.length, 1, 'un seul import du moteur dans ocean-map.js');
  assert.match(imports[0], /\.then\(workerUrl\)/);
});
