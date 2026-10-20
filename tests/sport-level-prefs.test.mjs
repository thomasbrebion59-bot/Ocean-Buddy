/* Sport et niveau : enregistrés dès qu’ils sont choisis, jamais redemandés au lancement suivant, restaurés depuis la
   copie native (@capacitor/preferences) si le WebView a vidé son stockage, et modifiables dans Réglages.
   Les fonctions sont extraites telles quelles d’app.js et de mobile/client.js, exécutées dans un contexte isolé. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const slice = (from, to) => { const a = app.indexOf(from), b = app.indexOf(to, a); assert.ok(a >= 0 && b > a, `extrait introuvable : ${from}`); return app.slice(a, b); };
const persistence = slice('const STORE_KEY=', '/* ================= RENDER');
const sports = slice('function renderSportFilters(){', '/* ====== GÉOLOCALISATION');
const onboarding = slice('/* ================= ONBOARDING', '/* ================= XP');
const SPORT_IDS = ['surf', 'bodyboard', 'baignade', 'paddle', 'kayak', 'snorkeling', 'plongee', 'kitesurf', 'windsurf'];

class MemoryStorage {
  constructor(seed) { this.m = new Map(Object.entries(seed)); }
  get length() { return this.m.size; } key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(String(k), String(v)); } removeItem(k) { this.m.delete(k); }
}
/* Une classe par contexte : mobile/client.js remplace Storage.prototype.setItem/removeItem. */
const storage = (seed = {}) => new (class extends MemoryStorage {})(seed);
function el(attrs = {}) {
  const cls = new Set();
  return { ...attrs, value: '', innerHTML: '', textContent: '', style: {}, dataset: attrs.dataset || {}, attrs: {},
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k] ?? null; },
    classList: { add: c => cls.add(c), remove: c => cls.delete(c), toggle: (c, on) => (on ?? !cls.has(c)) ? cls.add(c) : cls.delete(c), contains: c => cls.has(c) },
    scrollIntoView() {}, focus() {} };
}
function env(seed = {}) {
  const calls = [], toasts = [], els = new Map();
  const get = id => { if (!els.has(id)) els.set(id, el()); return els.get(id); };
  const ctx = {
    localStorage: storage(seed), calls, toasts, els, JSON, Set, Map, Array, Object, String, Promise, setTimeout: () => 0,
    CustomEvent: class { constructor(type, o) { this.type = type; this.detail = o?.detail; } },
    document: { body: el(), getElementById: get, querySelector: () => null, querySelectorAll: () => [], dispatchEvent: e => calls.push('event:' + e.type + ':' + e.detail) },
    window: { OceanLegacySpots: null, OceanNavigation: { begin() {} }, OceanTransition: null,
      OceanTheme: { current: '', set(id) { this.current = id || ''; calls.push('theme:' + (id || '')); }, preview() {} } },
    SPORTS: SPORT_IDS.map(id => ({ id, label: id, desc: id, color: '#000' })), sportIcon: () => '', levelIcon: () => '',
    esc: s => String(s), toast: m => toasts.push(m), realHomeForecast() {},
    go: s => calls.push('go:' + s), backToWorlds() {}, renderSpots() {}, renderHome: () => calls.push('renderHome')
  };
  vm.createContext(ctx);
  vm.runInContext(`var xp=0,favs=new Set(),sessions=[],userName='T',ecoLog=[];
    var activeSport=null,currentFilter='all',currentSearch='',favOnly=false,nearMode=false;
    const SPORTMAP={};SPORTS.forEach(x=>SPORTMAP[x.id]=x);\n${persistence}\n${sports}\n${onboarding}
    this.api={saveState,loadState,pickSport,pickLevel,finishOnb,openActivityGate:typeof openActivityGate==='function'?openActivityGate:null,
      chooseMySport:typeof chooseMySport==='function'?chooseMySport:null,chooseMyLevel:typeof chooseMyLevel==='function'?chooseMyLevel:null,
      renderMyChoice:typeof renderMyChoice==='function'?renderMyChoice:null,
      setQuick:v=>{quickGate=v;},get:()=>({activeSport,chosenSport,chosenLevel,onbDone})};`, ctx);
  return ctx;
}
const stored = c => JSON.parse(c.localStorage.getItem('oceanbuddy_v1'));
const card = (sp) => el({ dataset: sp ? { sp } : {} });
const lvl = (l) => el({ dataset: { lvl: l } });
/* Même règle que le rideau de démarrage (index.html) et qu’app.js : onboarding passé ou non. */
const onboarded = s => !!s && typeof s === 'object' && (s.onboarded === true || !!s.level || !!s.sport);

test('sport puis niveau choisis : enregistrés tout de suite, sans attendre « Plonger dans l’app »', () => {
  const a = env();
  a.api.pickSport(card('surf'), 'surf');
  assert.equal(a.localStorage.getItem('oceanbuddy_v1'), null, 'un sport seul ne suffit pas : le niveau reste à demander');
  a.api.pickLevel(lvl('expert'));
  assert.deepEqual({ sport: stored(a).sport, level: stored(a).level, onboarded: stored(a).onboarded }, { sport: 'surf', level: 'expert', onboarded: true });
  /* L’app est fermée sur l’écran « C’est parti » : au lancement suivant, ni onboarding ni question. */
  const b = env({ oceanbuddy_v1: a.localStorage.getItem('oceanbuddy_v1') });
  assert.equal(b.api.loadState(), true);
  assert.deepEqual({ ...b.api.get() }, { activeSport: 'surf', chosenSport: 'surf', chosenLevel: 'expert', onbDone: true });
  assert.ok(onboarded(stored(b)), 'le rideau masque aussi l’onboarding (html.ob-onboarded)');
});

test('onboarding terminé : le choix survit à chaque redémarrage', () => {
  for (const id of [...SPORT_IDS, 'all']) {
    const a = env();
    a.api.pickSport(card(id), id); a.api.pickLevel(lvl('intermediaire')); a.api.finishOnb();
    const b = env({ oceanbuddy_v1: a.localStorage.getItem('oceanbuddy_v1') }); b.api.loadState();
    assert.equal(b.api.get().onbDone, true, id);
    assert.equal(b.api.get().chosenLevel, 'intermediaire', id);
    assert.equal(b.api.get().activeSport, id === 'all' ? null : id, id);
  }
});

test('porte rapide (« changer » depuis l’accueil) : rien n’est écrit avant sa validation', () => {
  const a = env({ oceanbuddy_v1: JSON.stringify({ sport: 'surf', level: 'debutant', onboarded: true }) });
  a.api.loadState(); a.api.setQuick(true);
  a.api.pickSport(card('kayak'), 'kayak');
  assert.equal(stored(a).sport, 'surf', 'un aperçu annulé ne change pas l’activité enregistrée');
});

/* ---------- Copie native (mobile/client.js) ---------- */
async function native(seed = {}, saved = null, options = {}) {
  const localStorage = storage(seed); const writes = []; let reloads = 0, gets = 0;
  const context = { localStorage, Storage: localStorage.constructor, URL, Promise, JSON, Date, setTimeout: options.setTimeout || setTimeout, clearTimeout,
    location: { reload() { reloads++; } }, history: { state: null }, document: { documentElement: { classList: { add() {} } }, querySelector: () => null, addEventListener() {} },
    Capacitor: { isNativePlatform: () => true }, App: { addListener() {} }, Browser: { open() {} }, Geolocation: {}, Share: {}, Filesystem: {}, Directory: {}, Encoding: {},
    StatusBar: { setStyle: async () => {} }, Style: { Light: 'LIGHT' }, __OB_BUNDLE__: { seq: 1 }, __OB_UPDATE_BASE__: 'https://updates.test/',
    CapacitorHttp: { get: async () => ({ status: 404, data: '' }) }, CapacitorUpdater: { notifyAppReady: async () => ({}) },
    Preferences: { get: options.get || (async () => { gets++; return { value: saved && JSON.stringify(saved) }; }), set: async ({ value }) => { writes.push(JSON.parse(value)); } } };
    context.window = context;
  const source = fs.readFileSync(new URL('../mobile/client.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
  vm.createContext(context); vm.runInContext(source, context);
  await context.OceanMobile.boot();
  return { context, writes, reloads: () => reloads, gets: () => gets };
}

test('stockage du WebView vidé : le choix revient de la copie native avant le chargement de l’app', async () => {
  const profile = JSON.stringify({ sport: 'kayak', level: 'expert', onboarded: true });
  const n = await native({}, { oceanbuddy_v1: profile });
  assert.equal(n.context.localStorage.getItem('oceanbuddy_v1'), profile);
  assert.equal(n.reloads(), 0, 'restauré avant les scripts : aucun rechargement');
  const b = env({ oceanbuddy_v1: n.context.localStorage.getItem('oceanbuddy_v1') }); b.api.loadState();
  assert.deepEqual({ ...b.api.get() }, { activeSport: 'kayak', chosenSport: 'kayak', chosenLevel: 'expert', onbDone: true });
});

test('profil déjà présent : le démarrage n’attend pas le pont natif (rideau jamais retardé)', async () => {
  let answer;
  const t0 = Date.now();
  const n = await native({ oceanbuddy_v1: JSON.stringify({ sport: 'surf', level: 'debutant', onboarded: true }) }, null,
    { get: () => new Promise(r => { answer = r; }) });
  assert.ok(Date.now() - t0 < 500, 'boot() rend la main sans attendre Preferences.get');
  /* La copie native arrive ensuite : elle complète les clés manquantes sans écraser ni recharger. */
  answer({ value: JSON.stringify({ oceanbuddy_v1: '{"sport":"vieux"}', oceanbuddy_trips_v1: '[1]' }) });
  await new Promise(r => setTimeout(r, 0)); await new Promise(r => setTimeout(r, 0));
  assert.equal(JSON.parse(n.context.localStorage.getItem('oceanbuddy_v1')).sport, 'surf');
  assert.equal(n.context.localStorage.getItem('oceanbuddy_trips_v1'), '[1]');
  assert.equal(n.reloads(), 0);
  /* Puis chaque écriture de l’app suit dans la copie native. */
  n.context.localStorage.setItem('oceanbuddy_v1', JSON.stringify({ sport: 'paddle', level: 'expert', onboarded: true }));
  await n.context.OceanMobile.persist();
  assert.equal(JSON.parse(n.writes.at(-1).oceanbuddy_v1).sport, 'paddle');
});
