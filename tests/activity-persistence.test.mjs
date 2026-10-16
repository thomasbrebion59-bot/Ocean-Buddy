/* Activité choisie : mémorisation (oceanbuddy_v1.sport, « all » pour Tous), stockage indisponible, source de vérité
   unique (activeSport → thème + événement « ocean:sport ») et choix depuis l’accueil sans saut vers Explorer (A-02).
   Les fonctions sont extraites telles quelles d’app.js et exécutées dans un contexte isolé. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const slice = (from, to) => { const a = app.indexOf(from), b = app.indexOf(to, a); assert.ok(a >= 0 && b > a, `extrait introuvable : ${from}`); return app.slice(a, b); };
const persistence = slice('const STORE_KEY=', '/* ================= RENDER');
const sports = slice('function renderSportFilters(){', '/* ====== GÉOLOCALISATION');
const SPORT_IDS = ['surf', 'bodyboard', 'baignade', 'paddle', 'kayak', 'snorkeling', 'plongee', 'kitesurf', 'windsurf'];

function storage({ broken = false } = {}) {
  const m = new Map();
  return { m, getItem: k => { if (broken) throw Error('SecurityError'); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (broken) throw Error('QuotaExceededError'); m.set(k, String(v)); } };
}
function env({ broken = false, transition = null } = {}) {
  const calls = [], events = [];
  const el = () => ({ value: '', innerHTML: '', classList: { remove() {}, add() {}, toggle() {} } });
  const ctx = {
    localStorage: storage({ broken }), calls, events, JSON, Set, Map, Array, Promise, setTimeout: () => 0,
    CustomEvent: class { constructor(type, o) { this.type = type; this.detail = o?.detail; } },
    document: { getElementById: () => el(), querySelectorAll: () => [], dispatchEvent: e => events.push([e.type, e.detail]) },
    window: { OceanLegacySpots: null, OceanNavigation: { begin() {} }, OceanTransition: transition,
      OceanTheme: { current: '', set(id) { this.current = id || ''; calls.push('theme:' + (id || '')); } } },
    SPORTS: SPORT_IDS.map(id => ({ id, label: id, color: '#000' })), sportIcon: () => '',
    go: s => calls.push('go:' + s), backToWorlds: () => calls.push('backToWorlds'), renderSpots: () => {}, renderHome: () => {}
  };
  vm.createContext(ctx);
  vm.runInContext(`var xp=0,favs=new Set(),sessions=[],chosenLevel=null,chosenSport=null,userName='T',ecoLog=[],onbDone=false;
    var activeSport=null,currentFilter='all',currentSearch='',favOnly=false,nearMode=false;
    const SPORTMAP={};SPORTS.forEach(x=>SPORTMAP[x.id]=x);\n${persistence}\n${sports}
    this.api={saveState,loadState,setSport,applySport,renderSportFilters,get:()=>({activeSport,chosenSport}),set:(a,c)=>{activeSport=a;chosenSport=c;}};`, ctx);
  return ctx;
}

test('« Tous » est mémorisé comme « all » et relu sans activité', () => {
  const a = env(); a.api.set(null, 'all'); a.api.saveState();
  assert.equal(JSON.parse(a.localStorage.m.get('oceanbuddy_v1')).sport, 'all');
  const b = env(); b.localStorage.m.set('oceanbuddy_v1', a.localStorage.m.get('oceanbuddy_v1'));
  assert.equal(b.api.loadState(), true);
  assert.deepEqual({ ...b.api.get() }, { activeSport: null, chosenSport: 'all' });
});

test('chaque activité survit à un redémarrage', () => {
  for (const id of SPORT_IDS) {
    const a = env(); a.api.set(id, id); a.api.saveState();
    const b = env(); b.localStorage.m.set('oceanbuddy_v1', a.localStorage.m.get('oceanbuddy_v1')); b.api.loadState();
    assert.deepEqual({ ...b.api.get() }, { activeSport: id, chosenSport: id }, id);
  }
});

test('stockage indisponible : ni plantage à l’écriture ni à la lecture', () => {
  const a = env({ broken: true }); a.api.set('surf', 'surf');
  assert.doesNotThrow(() => a.api.saveState());
  assert.equal(a.api.loadState(), false);
  assert.doesNotThrow(() => a.api.setSport('kayak', { stay: true }));
  assert.equal(a.api.get().activeSport, 'kayak');
});

test('source unique : redessiner la barre des sports aligne le thème et prévient l’accueil', () => {
  const a = env(); a.api.set('kitesurf', 'kitesurf'); a.api.renderSportFilters();
  assert.equal(a.window.OceanTheme.current, 'kitesurf');
  assert.deepEqual(a.events.at(-1), ['ocean:sport', 'kitesurf']);
  /* Changement venu d’ailleurs (carte d’Explorer, navigation) : même chemin. */
  a.api.set(null, 'all'); a.api.renderSportFilters();
  assert.equal(a.window.OceanTheme.current, '');
  assert.deepEqual(a.events.at(-1), ['ocean:sport', 'all']);
});

test('A-02 : un choix fait depuis l’accueil reste sur l’accueil ; ailleurs il ouvre Explorer', () => {
  const a = env(); a.api.setSport('surf', { stay: true });
  assert.equal(a.calls.filter(c => c.startsWith('go:')).length, 0);
  assert.equal(JSON.parse(a.localStorage.m.get('oceanbuddy_v1')).sport, 'surf');
  const b = env(); b.api.setSport('surf');
  assert.ok(b.calls.includes('go:spots'));
});

test('avec la scène de transition, le thème change sous le voile et l’accueil reste affiché', async () => {
  let swap;
  const transition = { play: (id, fn) => { swap = fn; }, neutral: fn => fn(), cancel() {} };
  const a = env({ transition });
  a.api.setSport('plongee', { stay: true });
  assert.equal(a.window.OceanTheme.current, '', 'rien ne change avant que la scène couvre l’écran');
  await swap({ nextFrame: () => Promise.resolve(), isCurrent: () => true });
  assert.equal(a.window.OceanTheme.current, 'plongee');
  assert.equal(a.calls.filter(c => c.startsWith('go:')).length, 0);
  /* Retour à « Tous » : fondu neutre, toujours sur place. */
  a.api.setSport(null, { stay: true });
  assert.equal(a.window.OceanTheme.current, '');
  assert.equal(JSON.parse(a.localStorage.m.get('oceanbuddy_v1')).sport, 'all');
});
