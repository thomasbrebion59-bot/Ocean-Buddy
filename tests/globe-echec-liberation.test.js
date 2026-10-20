/* explorer-carte-spots-5 : un globe dont la création échoue (textures 4K introuvables) ne laisse rien derrière lui. */
const test = require('node:test'), assert = require('node:assert');
const vm = require('vm');
const { read, load } = require('./src-extract.cjs');
const M = require('../ocean-map-model.js');

/* Objet « tout-venant » : toute propriété existe, tout appel ou new renvoie un autre tout-venant. */
function any(over = {}) {
  const store = Object.assign(Object.create(null), over);
  return new Proxy(function () {}, {
    get(_, k) {
      if (k in store) return store[k];
      if (k === 'then') return undefined;
      if (k === Symbol.toPrimitive) return () => 0;
      if (typeof k === 'symbol') return undefined;
      return (store[k] = any());
    },
    set(_, k, v) { store[k] = v; return true; },
    apply: () => any(), construct: () => any(), has: () => true
  });
}

/* Horloge simulée : minuteries, images (rAF) et performance.now() du globe avancent à la demande du test, sans attente réelle. */
function horloge() {
  let now = 0, seq = 0;
  const file = new Map(), tick = () => new Promise(r => setImmediate(r));
  return {
    get now() { return now; },
    poser(fn, ms, genre) { const id = ++seq; file.set(id, { id, at: now + Math.max(0, ms || 0), fn, ms, genre }); return id; },
    annuler(id) { file.delete(id); },
    /* Minuteries et images du globe encore en attente (hors faux monde et simples résolutions de promesse : polices, pauses entre tâches). */
    attente() { return [...file.values()].filter(t => t.genre !== 'monde' && !/\[native code\]/.test(Function.prototype.toString.call(t.fn))); },
    async avancer(ms) {
      const fin = now + ms;
      for (let tours = 0; ; tours++) {
        await tick(); /* les promesses en cours se résolvent avant la minuterie suivante */
        let n = null;
        for (const t of file.values()) if (t.at <= fin && (!n || t.at < n.at || (t.at === n.at && t.id < n.id))) n = t;
        if (!n) break;
        if (tours > 50000) throw Error('horloge emballée : des minuteries se réarment sans fin');
        file.delete(n.id); now = Math.max(now, n.at); n.fn();
      }
      now = fin; await tick();
    }
  };
}

/* Exécute le vrai ocean-globe.js avec un faux DOM, un faux three.js (import() remplacé par le chargeur) et une horloge simulée.
   day / norm : 'ok', '404' (introuvable) ou 'lent' (grande texture envoyée par bandes). piege8k : create() échoue juste après la pose de la minuterie 8K. */
function globe({ day = 'ok', norm = 'ok', piege8k = false } = {}) {
  const h = horloge(), docListeners = new Map(), observers = [];
  const st = { rendus: 0, copies: 0, fetches: [], piege: false, fin: null };
  const listen = (map, t, f) => { if (!map.has(t)) map.set(t, new Set()); map.get(t).add(f); };
  const unlisten = (map, t, f) => map.get(t)?.delete(f);
  const emit = t => [...(docListeners.get(t) || [])].forEach(f => f({}));
  const el = tag => {
    const own = new Map();
    const e = {
      tagName: tag, children: [], parent: null, style: { setProperty() {} }, clientWidth: 400, hidden: false,
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      setAttribute() {}, querySelector: () => el('b'), getContext: () => any({ getImageData: () => ({ data: [0, 0, 255, 255] }) }),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }),
      append(...k) { for (const c of k) { c.parent = e; e.children.push(c); } },
      remove() { if (e.parent) { e.parent.children = e.parent.children.filter(c => c !== e); e.parent = null; } },
      addEventListener: (t, f) => listen(own, t, f), removeEventListener: (t, f) => unlisten(own, t, f)
    };
    return e;
  };
  /* GPU simulé : le rendu et l'envoi des bandes de texture sont comptés ; géométries et matériaux savent s'ils ont été libérés. */
  const renderer = any({
    calls: [], capabilities: any({ maxTextureSize: 16384, getMaxAnisotropy: () => 8 }),
    render() { st.rendus++; }, copyTextureToTexture() { st.copies++; },
    setPixelRatio() { if (st.piege) { st.piege = false; throw Error('piège : mise en place interrompue'); } }
  });
  for (const k of ['dispose', 'forceContextLoss']) renderer[k] = () => renderer.calls.push(k);
  const gpu = { geometries: [], materials: [], scenes: [], liberes: new Set() };
  const suivre = (liste, o) => { liste.push(o); o.dispose = () => gpu.liberes.add(o); return o; };
  const noeud = (geometry, material) => {
    const kids = [], o = any({ children: kids, geometry, material, add(...k) { kids.push(...k); return o; }, traverse(f) { f(o); kids.forEach(k => k.traverse?.(f)); } });
    return o;
  };
  const mode = url => /earth-day/.test(url) ? day : /earth-normal/.test(url) ? norm : 'ok';
  const THREE = new Proxy({
    WebGLRenderer: function () { return renderer; },
    TextureLoader: function () { return { load(url, ok, _, fail) { h.poser(() => mode(url) === '404' ? fail(Error('404 ' + url)) : ok(any()), 40, 'monde'); } }; },
    Scene: function () { const s = noeud(); gpu.scenes.push(s); return s; }
  }, {
    get(t, k) {
      if (typeof k === 'symbol' || k === 'then') return undefined;
      if (k in t) return t[k];
      if (/Geometry$/.test(k)) return function () { return suivre(gpu.geometries, any()); };
      if (/Material$/.test(k)) return function (p) { return suivre(gpu.materials, any({ uniforms: p?.uniforms })); };
      if (/^(Mesh|Points|Line|LineSegments|Sprite|Group|Object3D)$/.test(k)) return function (g, m) { return noeud(g, m); };
      return function () { return any(); };
    },
    has: () => true
  });
  const document = {
    baseURI: 'http://x/', hidden: false, body: {}, documentElement: { classList: { contains: () => false } },
    createElement: el,
    addEventListener: (t, f) => listen(docListeners, t, f), removeEventListener: (t, f) => unlisten(docListeners, t, f)
  };
  /* Réseau simulé : textures 4K vite, étoiles et frontières tard (elles arrivent souvent après l'échec), le reste hors ligne. */
  const fetch = url => {
    st.fetches.push(url);
    return new Promise((ok, ko) => h.poser(() => {
      const tex = /earth-(day|normal)-4k/.exec(url);
      if (/stars\.bin/.test(url)) return ok({ ok: true, arrayBuffer: async () => new ArrayBuffer(6 * 40) });
      if (/borders\.json/.test(url)) return ok({ ok: true, json: async () => [] });
      if (tex) {
        const m = mode(url);
        return ok(m === '404' ? { ok: false, status: 404 } : { ok: true, blob: async () => m === 'lent' ? { w: 4096, h: 2048 } : { w: 1024, h: 512 } });
      }
      ko(Error('hors ligne'));
    }, /earth-/.test(url) ? 20 : 300, 'monde'));
  };
  const ctx = vm.createContext({
    console, document, OceanMapModel: M, navigator: {}, URL, devicePixelRatio: 1, fetch,
    performance: { now: () => h.now },
    setTimeout: (fn, ms) => { if (piege8k && ms >= 1200) st.piege = true; return h.poser(fn, ms, 'minuterie'); },
    clearTimeout: id => h.annuler(id),
    requestAnimationFrame: f => h.poser(() => f(h.now), 16, 'image'),
    cancelAnimationFrame: id => h.annuler(id),
    matchMedia: () => ({ matches: false }),
    getComputedStyle: () => ({ fontFamily: 'Inter', getPropertyValue: () => '' }),
    createImageBitmap: (src, ...a) => new Promise(ok => h.poser(() => ok(a.length ? { close() {} } : { width: src.w || 1, height: src.h || 2, close() {} }), 5, 'monde')),
    /* Comme un vrai navigateur : le rappel part au cadre suivant l'observe(), puis à la demande ; un observateur coupé ne notifie plus. */
    ResizeObserver: class {
      constructor(cb) { this.cb = cb; this.on = false; observers.push(this); }
      observe() { this.on = true; h.poser(() => this.fire(), 16, 'monde'); }
      fire() { if (this.on) this.cb([]); }
      disconnect() { this.on = false; }
    },
    __import: async () => THREE
  });
  ctx.window = ctx;
  vm.runInContext(read('ocean-globe.js').replace(/\bimport\(/g, '__import('), ctx);
  const host = el('div');
  const live = () => [...docListeners].filter(([, s]) => s.size).map(([t]) => t);
  /* Instantané : rendus, bandes envoyées, minuteries en attente et ce que les scènes contiennent à cet instant. */
  const instantane = () => {
    const geo = new Set(), mat = new Set();
    for (const s of gpu.scenes) s.traverse(o => { if (o.geometry) geo.add(o.geometry); for (const m of [].concat(o.material || [])) mat.add(m); });
    return { rendus: st.rendus, copies: st.copies, attente: h.attente(), geo, mat };
  };
  /* Lance create() et fait tourner l'horloge jusqu'à son verdict ; l'instantané est pris à l'instant même du verdict. */
  async function creer(opts = {}) {
    const p = ctx.OceanGlobe.create(host, opts);
    let fini = false;
    const fin = () => { fini = true; st.fin = instantane(); };
    p.then(fin, fin);
    h.poser(() => emit('ocean:sport'), 30, 'monde'); /* le sport change pendant le chargement */
    for (let i = 0; i < 700 && !fini; i++) await h.avancer(16);
    if (!fini) throw Error('create() ne se termine pas');
    return p;
  }
  return { ctx, host, renderer, observers, st, gpu, live, emit, creer, instantane, avancer: h.avancer, attente: h.attente };
}

/* Le globe est fini (échec de create() ou destroy()) : tout est rendu, et un monde qui continue ne le réveille pas. */
async function assertLibere(g, fin) {
  const noms = l => l.map(t => t.genre === 'image' ? 'image' : 'minuterie ' + t.ms + ' ms');
  assert.deepStrictEqual(noms(fin.attente), [], 'minuteries ou images du globe encore en attente');
  assert.deepStrictEqual(g.live(), [], 'écouteurs du document encore actifs : ' + g.live().join(', '));
  assert.ok(g.observers.length && g.observers.every(o => !o.on), 'ResizeObserver toujours branché sur l’hôte');
  assert.ok(g.renderer.calls.includes('dispose'), 'renderer.dispose() non appelé');
  assert.ok(g.renderer.calls.includes('forceContextLoss'), 'contexte WebGL gardé');
  assert.strictEqual(g.host.children.length, 0, 'canevas ou calque laissé dans l’hôte');
  assert.ok(fin.geo.size && fin.mat.size, 'doublure : aucune géométrie ni matériau dans les scènes');
  assert.strictEqual([...fin.geo].filter(x => !g.gpu.liberes.has(x)).length, 0, 'géométries non libérées (mémoire GPU)');
  assert.strictEqual([...fin.mat].filter(x => !g.gpu.liberes.has(x)).length, 0, 'matériaux non libérés (mémoire GPU)');
  /* Le monde continue : l'observateur se déclenche, la page revient au premier plan, le sport change, puis 15 s passent (la 8K aurait été posée à ~9 s). */
  g.observers.forEach(o => o.fire()); g.emit('visibilitychange'); g.emit('ocean:sport');
  await g.avancer(15000);
  assert.strictEqual(g.st.rendus - fin.rendus, 0, 'le globe fermé redessine encore (' + (g.st.rendus - fin.rendus) + ' rendus)');
  assert.deepStrictEqual(noms(g.attente()), [], 'le globe fermé a repris des minuteries ou des images');
  assert.strictEqual(g.st.copies - fin.copies, 0, 'des bandes de texture partent encore vers le GPU après la fermeture');
  assert.deepStrictEqual(g.st.fetches.filter(u => /8k/.test(u)), [], 'texture 8K demandée par un globe fermé');
  assert.deepStrictEqual(g.live(), [], 'écouteurs réinstallés après la fermeture');
}

test('explorer-carte-spots-5 : échec des textures 4K → écouteurs retirés, observateur coupé, contexte WebGL rendu', async () => {
  const g = globe({ day: '404', norm: '404' });
  await assert.rejects(g.creer(), /404/);
  assert.ok(g.st.fin.rendus > 0, 'doublure : le globe aurait dû dessiner avant l’échec (observateur, images)');
  await assertLibere(g, g.st.fin);
});

test('explorer-carte-spots-5 : échec pendant l’envoi par bandes d’une texture → l’envoi s’arrête', async () => {
  /* La carte de relief arrive par bandes pendant que la carte du jour est introuvable : dead doit couper les bandes restantes. */
  const g = globe({ day: '404', norm: 'lent' });
  await assert.rejects(g.creer(), /404/);
  assert.ok(g.st.fin.copies > 0 && g.st.fin.copies < 32, 'doublure : l’échec doit tomber en plein envoi (' + g.st.fin.copies + ' bandes sur 32)');
  await assertLibere(g, g.st.fin);
});

test('explorer-carte-spots-5 : échec tardif (après les textures) → la minuterie 8K est retirée', async () => {
  const g = globe({ piege8k: true });
  await assert.rejects(g.creer(), /piège/);
  await assertLibere(g, g.st.fin);
});

test('explorer-carte-spots-5 : création réussie puis destroy() libère toujours tout', async () => {
  const g = globe();
  const api = await g.creer();
  assert.strictEqual(g.host.children.length, 2);
  assert.ok(g.live().includes('visibilitychange') && g.live().includes('ocean:sport'));
  assert.strictEqual(g.renderer.calls.length, 0, 'rien ne doit être libéré quand la création réussit');
  assert.ok(g.attente().some(t => t.ms >= 1200), 'doublure : la minuterie 8K doit être posée avant destroy()');
  api.destroy();
  assert.deepStrictEqual(g.renderer.calls, ['dispose', 'forceContextLoss']);
  await assertLibere(g, g.instantane());
});

/* ensurePlanet() de ocean-map.js avec un globe p dont la mise en place échoue (planetPad() lève). */
function carte(p, host) {
  return load('ocean-map.js', ['ensurePlanet'], {
    planet: null, planetStarting: null, planetFailed: false, planetTries: 0, DIVE_KM: 600, WORLD_KM: 20000, rows: [],
    stage: { querySelector: () => host }, localStorage: { getItem: () => null },
    window: { OceanGlobe: { create: async () => p } },
    planetPad() { throw Error('marges'); },
    wrap: { classList: { add() {}, remove() {} } }, watchGestures() {}, loadEngine: async () => {}, scheduleWarm() {},
    console: { warn() {} }
  });
}

test('explorer-carte-spots-5 : ensurePlanet détruit le globe si la suite de sa mise en place échoue', async () => {
  let destroyed = 0;
  const ctx = carte({ destroy() { destroyed++; }, setPadding() {} }, { replaceChildren() {} });
  await assert.rejects(ctx.ensurePlanet(), /marges/);
  await new Promise(r => setImmediate(r));
  assert.strictEqual(destroyed, 1, 'globe à moitié branché non détruit');
  assert.strictEqual(ctx.planet, null, 'planet garde un globe sans canevas : le nouvel essai le reprendrait');
});

test('explorer-carte-spots-5 : ensurePlanet — un destroy() qui lève ne sacrifie ni planet, ni l’hôte, ni le nouvel essai', async () => {
  let destroyed = 0, vidages = 0;
  const ctx = carte({ destroy() { destroyed++; throw Error('contexte déjà perdu'); }, setPadding() {} }, { replaceChildren() { vidages++; } });
  await assert.rejects(ctx.ensurePlanet(), /marges/);
  await new Promise(r => setImmediate(r));
  assert.strictEqual(destroyed, 1, 'destroy() non appelé');
  assert.strictEqual(ctx.planet, null, 'planet reste sur le globe mort : ensurePlanet() le rendrait tel quel');
  assert.strictEqual(vidages, 1, 'hôte non vidé : la suite du nettoyage a été sautée');
  assert.strictEqual(ctx.planetTries, 1, 'essai non compté : la carte à plat ne prendrait jamais le relais');
  assert.strictEqual(ctx.planetStarting, null);
});
