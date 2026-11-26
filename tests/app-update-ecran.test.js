/* Écran entier « Mets à jour Ocean Buddy » (app-update.js + app-update.css) : version plus récente sur l’App Store.
   Faux DOM minimal et horloge simulée : le vrai app-update-model.js et le vrai app-update.js tournent dans un contexte vm.
   On vérifie le rappel « tout le temps » (chaque lancement, chaque retour après 10 min), « Plus tard » pour ce moment
   seulement, le bouton qui ouvre l’App Store, l’accessibilité (dialog, focus, piège du focus), le cas « live » inchangé,
   le site web muet, le rappel discret (coque qui reçoit encore le web : une fois par version), puis les styles, les textes et leurs traductions. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { i18nContext } = require('./src-extract.cjs');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const MIN = 60 * 1000;
const flush = () => new Promise(r => setImmediate(r));

/* ---------- Faux DOM ---------- */
function makeDoc() {
  const doc = { hidden: false, activeElement: null, listeners: {}, busy: false,
    createElement: t => makeEl(t, doc),
    getElementById: () => null,
    querySelector: s => (s === '.oba,dialog[open]' && doc.busy ? {} : null),
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter(x => x !== f); },
    fire(t, ev = {}) { for (const f of [...(this.listeners[t] || [])]) f(ev); } };
  doc.body = makeEl('body', doc);
  doc.activeElement = doc.body;
  return doc;
}
function makeEl(tag, doc) {
  const e = {
    tagName: tag.toUpperCase(), children: [], parentNode: null, attrs: {}, listeners: {}, cls: new Set(),
    textContent: '', hidden: false, id: '', type: '', disabled: false,
    get className() { return [...this.cls].join(' '); }, set className(v) { this.cls = new Set(String(v).split(/\s+/).filter(Boolean)); },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    append(...kids) { for (const k of kids) { k.parentNode = this; this.children.push(k); } },
    contains(n) { for (let x = n; x; x = x.parentNode) if (x === this) return true; return false; },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    dispatch(t, extra = {}) { const ev = { type: t, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra }; for (const f of this.listeners[t] || []) f(ev); return ev; },
    click() { this.dispatch('click'); },
    focus() { doc.activeElement = this; doc.fire('focusin', { target: this }); },
    remove() { const p = this.parentNode; if (p) { p.children = p.children.filter(c => c !== this); this.parentNode = null; } },
    get isConnected() { for (let x = this; x; x = x.parentNode) if (x === doc.body) return true; return false; },
    querySelector(sel) { return find(this, sel.replace(/^\./, '')); },
    /* Fenêtre « live » : seuls ses deux boutons servent au code. */
    set innerHTML(html) {
      this.html = html;
      for (const c of ['app-update-go', 'app-update-later']) if (html.includes(`class="${c}"`)) { const b = makeEl('button', doc); b.className = c; this.append(b); }
    },
    get innerHTML() { return this.html || ''; }
  };
  e.classList = { add: (...c) => c.forEach(x => e.cls.add(x)), remove: (...c) => c.forEach(x => e.cls.delete(x)), contains: c => e.cls.has(c) };
  return e;
}
function find(root, cls) {
  for (const c of root.children) { if (c.cls.has(cls)) return c; const d = find(c, cls); if (d) return d; }
  return null;
}

/* ---------- Application simulée ---------- */
function boot(opts = {}) {
  const clock = { t: 1_800_000_000_000 }, timers = [], doc = makeDoc();
  const calls = { live: 0, store: 0, open: 0, apply: 0 }, bars = [], toasts = [], winListeners = {};
  const storage = new Map(Object.entries(opts.storage || {})), removed = [];
  /* Par défaut la coque est sous native_min (checkLive répond { kind:'store' }) : écran entier. Rappel : { live: null }. */
  const env = { live: 'live' in opts ? opts.live : { kind: 'store' }, store: 'store' in opts ? opts.store : { kind: 'store', version: '1.5.0' }, storeFails: false };
  const ctx = {
    document: doc, console,
    localStorage: { getItem: k => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, String(v)), removeItem: k => { removed.push(k); storage.delete(k); } },
    CustomEvent: class { constructor(type, o) { this.type = type; this.detail = o && o.detail; } },
    requestAnimationFrame: f => f(),
    setTimeout: (f, ms) => { timers.push({ f, at: clock.t + (ms || 0) }); return timers.length; },
    Date: { now: () => clock.t },
    getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
    addEventListener: (t, f) => { (winListeners[t] ||= []).push(f); },
    dispatchEvent: ev => { if (ev.type === 'ocean:statusbar') bars.push(ev.detail); for (const f of winListeners[ev.type] || []) f(ev); return true; },
    toast: m => toasts.push(m)
  };
  ctx.window = ctx;
  if (opts.mobile !== false) ctx.OceanMobile = opts.mobile || { native: true, updates: {
    checkLive: async () => { calls.live++; return env.live; },
    checkStore: async () => { calls.store++; if (env.storeFails) throw new Error('hors connexion'); return env.store; },
    openStore: () => { calls.open++; },
    applyLive: async () => { calls.apply++; }
  } };
  vm.createContext(ctx);
  vm.runInContext(read('app-update-model.js'), ctx);
  vm.runInContext(read('app-update.js'), ctx);
  async function advance(ms) {
    const end = clock.t + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const next = timers[0];
      if (!next || next.at > end) break;
      timers.shift(); clock.t = Math.max(clock.t, next.at); next.f(); await flush();
    }
    clock.t = end; await flush();
  }
  async function away(ms) {
    doc.hidden = true; doc.fire('visibilitychange'); await advance(ms);
    doc.hidden = false; doc.fire('visibilitychange'); await flush(); await flush();
  }
  const screens = () => doc.body.children.filter(c => c.cls.has('app-update'));
  const storeScreen = () => screens().find(c => c.cls.has('is-store')) || null;
  return { ctx, doc, clock, timers, calls, bars, toasts, env, storage, removed, advance, away, screens, storeScreen, winListeners };
}

/* ---------- Comportement ---------- */
test('site web (pas d’app native) : rien ne s’affiche, aucune vérification, aucun minuteur', async () => {
  for (const mobile of [false, { native: false, updates: {} }, { native: true }]) {
    const app = boot({ mobile });
    await app.advance(60 * MIN);
    assert.equal(app.screens().length, 0);
    assert.equal(app.timers.length, 0);
    assert.equal(app.doc.listeners.visibilitychange, undefined);
  }
  assert.match(read('app-update.js'), /const M=window\.OceanMobile;\n\s*if\(!M\|\|!M\.native\|\|!M\.updates\)return;/, 'garde du site web conservée');
});

test('lancement : l’écran entier apparaît après 4 s, accessible, focus sur « Mettre à jour »', async () => {
  const app = boot();
  await app.advance(3999);
  assert.equal(app.screens().length, 0, 'rien avant 4 s');
  await app.advance(1);
  assert.equal(app.calls.live, 1, 'mise à jour directe vérifiée d’abord');
  assert.equal(app.calls.store, 1);
  const s = app.storeScreen();
  assert.ok(s, 'écran « store » ouvert');
  assert.ok(s.cls.has('show'));
  assert.equal(s.getAttribute('role'), 'dialog');
  assert.equal(s.getAttribute('aria-modal'), 'true');
  assert.equal(s.getAttribute('aria-labelledby'), 'appUpdateTitle');
  assert.equal(s.getAttribute('aria-describedby'), 'appUpdateText appUpdateVersion');
  const title = find(s, 'app-update-title'), text = find(s, 'app-update-text'), ver = find(s, 'app-update-version');
  assert.equal(title.tagName, 'H2'); assert.equal(title.id, 'appUpdateTitle');
  assert.equal(title.textContent, 'Mets à jour Ocean Buddy');
  assert.equal(text.textContent, 'Une nouvelle version t’attend sur l’App Store.'); assert.equal(text.id, 'appUpdateText');
  assert.equal(ver.textContent, 'Version 1.5.0'); assert.equal(ver.hidden, false);
  const img = find(s, 'app-update-logo').children[0];
  assert.equal(img.getAttribute('src'), 'assets/brand/manta-petrole-512.png');
  assert.equal(img.getAttribute('alt'), '', 'logo décoratif : le titre nomme l’app');
  const go = find(s, 'app-update-go'), later = find(s, 'app-update-later');
  assert.equal(go.textContent, 'Mettre à jour'); assert.equal(go.type, 'button');
  assert.equal(later.textContent, 'Plus tard'); assert.equal(later.type, 'button');
  assert.equal(app.doc.activeElement, go, 'focus sur le grand bouton');
  assert.deepEqual(app.bars, ['light'], 'barre d’état foncée sur le fond crème');
});

test('« Mettre à jour » ouvre la fiche App Store et ferme l’écran', async () => {
  const app = boot();
  app.winListeners['ocean:statusbar'].forEach(f => f({ detail: 'dark' }));  // l’app était sur une page sombre
  await app.advance(4000);
  find(app.storeScreen(), 'app-update-go').click();
  assert.equal(app.calls.open, 1);
  await app.advance(300);
  assert.equal(app.screens().length, 0);
  assert.deepEqual(app.bars, ['light', 'dark'], 'barre d’état rendue à la page');
});

test('« Plus tard » : fermé pour ce moment, rien au retour court, l’écran revient après 10 min ailleurs', async () => {
  const app = boot();
  await app.advance(4000);
  find(app.storeScreen(), 'app-update-later').click();
  await app.advance(300);
  assert.equal(app.screens().length, 0);
  assert.equal(app.calls.open, 0);
  await app.away(3 * MIN);
  assert.equal(app.screens().length, 0, 'retour après 3 min : rien');
  await app.away(9 * MIN + 59 * 1000);
  assert.equal(app.screens().length, 0, 'retour après 9 min 59 s : rien');
  assert.equal(app.calls.store, 1, 'App Store pas réinterrogé dans le même moment');
  await app.away(10 * MIN);
  assert.ok(app.storeScreen(), 'retour après 10 min : l’écran revient');
  assert.equal(app.calls.store, 2);
  find(app.storeScreen(), 'app-update-later').click();
  await app.advance(300);
  await app.away(45 * MIN);
  assert.ok(app.storeScreen(), 'et encore après 45 min');
  assert.equal(app.calls.live, 2, 'mise à jour directe : vérifiée au lancement et après plus de 30 min seulement');
});

test('plus de silence de 3 jours : l’ancienne clé est effacée, « Plus tard » n’écrit rien', async () => {
  const app = boot({ storage: { oceanbuddy_update_store_snooze: JSON.stringify({ v: '1.5.0', until: 1_900_000_000_000 }) } });
  assert.deepEqual(app.removed, ['oceanbuddy_update_store_snooze']);
  await app.advance(4000);
  assert.ok(app.storeScreen(), 'l’ancien silence n’empêche plus l’écran');
  find(app.storeScreen(), 'app-update-later').click();
  assert.equal(app.storage.size, 0, 'aucune clé posée');
  assert.doesNotMatch(read('app-update.js'), /setItem|3\*24\*3600|STORE_SNOOZE/);
});

test('écran laissé ouvert pendant une longue absence : pas de doublon, il sert ce moment-là', async () => {
  const app = boot();
  await app.advance(4000);
  await app.away(15 * MIN);
  assert.equal(app.screens().length, 1);
  assert.equal(app.calls.store, 1);
  find(app.storeScreen(), 'app-update-later').click();
  await app.advance(300);
  await app.away(2 * MIN);
  assert.equal(app.screens().length, 0);
});

test('jamais bloquant : sans réseau rien ne s’affiche, nouvel essai au retour suivant', async () => {
  const app = boot();
  app.env.storeFails = true;
  await app.advance(4000);
  assert.equal(app.screens().length, 0);
  app.env.storeFails = false;
  await app.away(1 * MIN);
  assert.ok(app.storeScreen(), 'App Store joignable au retour : l’écran apparaît');
});

test('app en arrière-plan au moment du premier contrôle : il a lieu au retour', async () => {
  const app = boot();
  app.doc.hidden = true; app.doc.fire('visibilitychange');
  await app.advance(5000);
  assert.equal(app.calls.store, 0);
  app.doc.hidden = false; app.doc.fire('visibilitychange'); await flush(); await flush();
  assert.ok(app.storeScreen());
});

test('app à jour (1.5.0 = App Store) ou réponse sans version utilisable', async () => {
  const upToDate = boot({ store: null });
  await upToDate.advance(4000);
  assert.equal(upToDate.screens().length, 0);
  const odd = boot({ store: { kind: 'store', version: '<img src=x onerror=alert(1)>' } });
  await odd.advance(4000);
  const s = odd.storeScreen();
  assert.ok(s, 'l’écran reste utile');
  assert.equal(find(s, 'app-update-version').hidden, true, 'ligne de version masquée');
  assert.equal(s.getAttribute('aria-describedby'), 'appUpdateText');
});

test('attend la fin de l’accueil, de « Crée ton compte » et des feuilles <dialog>', async () => {
  const app = boot();
  app.doc.busy = true;
  await app.advance(4000);
  await app.advance(20000);
  assert.equal(app.screens().length, 0);
  await app.away(20 * MIN);
  assert.equal(app.calls.store, 1, 'déjà en attente : pas de seconde vérification');
  app.doc.busy = false;
  await app.advance(5000);
  assert.equal(app.screens().length, 1);
});

test('piège du focus : Tab et Maj+Tab restent entre les deux boutons, Échap ferme', async () => {
  const app = boot();
  await app.advance(4000);
  const s = app.storeScreen(), go = find(s, 'app-update-go'), later = find(s, 'app-update-later');
  later.focus();
  assert.equal(s.dispatch('keydown', { key: 'Tab', shiftKey: false }).defaultPrevented, true);
  assert.equal(app.doc.activeElement, go);
  assert.equal(s.dispatch('keydown', { key: 'Tab', shiftKey: true }).defaultPrevented, true);
  assert.equal(app.doc.activeElement, later);
  assert.equal(s.dispatch('keydown', { key: 'Tab', shiftKey: true }).defaultPrevented, false, 'de « Plus tard » à « Mettre à jour » : le navigateur s’en charge');
  const outside = app.doc.createElement('input'); app.doc.body.append(outside);
  outside.focus();
  assert.equal(app.doc.activeElement, go, 'un focus parti sous l’écran revient au bouton');
  s.dispatch('keydown', { key: 'Escape' });
  await app.advance(300);
  assert.equal(app.screens().length, 0);
  outside.focus();
  assert.equal(app.doc.activeElement, outside, 'piège retiré à la fermeture');
});

test('cas « live » inchangé : fenêtre du bas, App Store non interrogé, « Plus tard » annonce l’installation', async () => {
  const app = boot({ live: { kind: 'live', id: 'b1', seq: 1 } });
  await app.advance(4000);
  assert.equal(app.calls.store, 0);
  const w = app.screens()[0];
  assert.ok(w && !w.cls.has('is-store'));
  assert.match(w.innerHTML, /app-update-card/);
  assert.match(w.innerHTML, /<span class="app-update-kicker">Mise à jour prête<\/span>/);
  assert.match(w.innerHTML, /Ocean Buddy a fait peau neuve !/);
  w.querySelector('.app-update-go').click();
  assert.equal(app.calls.apply, 1);
  w.querySelector('.app-update-later').click();
  assert.deepEqual(app.toasts, ['👍 La mise à jour s’installera quand tu quitteras l’app']);
});

test('le Retour (Android) et les autres fenêtres reconnaissent l’écran : classes .app-update et .app-update-later', async () => {
  const app = boot();
  await app.advance(4000);
  const s = app.storeScreen();
  assert.ok(s.cls.has('app-update'));
  assert.ok(find(s, 'app-update-later'));
  assert.match(read('app-shell.js'), /\$\('\.app-update\.show'\);if\(upd\)\{upd\.querySelector\('\.app-update-later'\)\?\.click\(\)/);
  for (const f of ['app.js', 'account-sync.js']) assert.match(read(f), /\.app-update,/, f + ' attend la fermeture de l’écran');
});

/* ---------- Rappel discret (décision 18) ---------- */
const reminder = app => app.doc.body.children.find(c => c.cls.has('app-update-reminder')) || null;

test('coque à jour pour le web mais version plus récente sur l’App Store : simple rappel, pas d’écran entier', async () => {
  const app = boot({ live: null });
  await app.advance(4000);
  assert.equal(app.screens().length, 0, 'aucun écran entier ni fenêtre');
  const r = reminder(app);
  assert.ok(r, 'bannière affichée');
  assert.ok(r.cls.has('show'));
  assert.equal(r.getAttribute('role'), 'status');
  assert.equal(r.getAttribute('aria-modal'), null, 'non bloquante');
  assert.equal(find(r, 'app-update-reminder-title').textContent, 'Une nouvelle version t’attend sur l’App Store.');
  assert.equal(find(r, 'app-update-reminder-version').textContent, 'Version 1.5.0');
  assert.equal(find(r, 'app-update-reminder-go').textContent, 'Mettre à jour');
  assert.equal(find(r, 'app-update-reminder-later').textContent, 'Plus tard');
  assert.equal(app.doc.activeElement, app.doc.body, 'ne prend pas le focus');
  assert.deepEqual(app.bars, [], 'barre d’état intacte');
  assert.equal(app.storage.get('oceanbuddy_update_reminder_version'), '1.5.0');
});

test('rappel : « Mettre à jour » ouvre l’App Store, « Plus tard » ferme, Échap ferme', async () => {
  const a = boot({ live: null });
  await a.advance(4000);
  find(reminder(a), 'app-update-reminder-go').click();
  assert.equal(a.calls.open, 1);
  await a.advance(300);
  assert.equal(reminder(a), null);
  const b = boot({ live: null });
  await b.advance(4000);
  find(reminder(b), 'app-update-reminder-later').click();
  await b.advance(300);
  assert.equal(reminder(b), null);
  assert.equal(b.calls.open, 0);
  const c = boot({ live: null });
  await c.advance(4000);
  reminder(c).dispatch('keydown', { key: 'Escape' });
  await c.advance(300);
  assert.equal(reminder(c), null);
});

test('rappel : une seule fois par version, même après 10 min ailleurs ou un relancement de l’app', async () => {
  const app = boot({ live: null });
  await app.advance(4000);
  find(reminder(app), 'app-update-reminder-later').click();
  await app.advance(300);
  await app.away(15 * MIN);
  assert.equal(reminder(app), null, 'retour après 15 min : rien');
  assert.equal(app.calls.store, 2, 'l’App Store est bien reinterrogé');
  const relaunch = boot({ live: null, storage: Object.fromEntries(app.storage) });
  await relaunch.advance(4000);
  assert.equal(reminder(relaunch), null, 'nouveau lancement : même version, rien');
  /* Une version plus récente de l’App Store : le rappel revient une fois. */
  const next = boot({ live: null, store: { kind: 'store', version: '1.6.0' }, storage: Object.fromEntries(app.storage) });
  await next.advance(4000);
  assert.ok(reminder(next), 'nouvelle version : nouveau rappel');
  assert.equal(find(reminder(next), 'app-update-reminder-version').textContent, 'Version 1.6.0');
  assert.equal(next.storage.get('oceanbuddy_update_reminder_version'), '1.6.0');
});

test('coque sous native_min : l’écran entier revient aussi quand la vérification directe n’a pas lieu au retour', async () => {
  const app = boot();                                 // live : { kind:'store' } au lancement
  await app.advance(4000);
  find(app.storeScreen(), 'app-update-later').click();
  await app.advance(300);
  app.env.live = null;                                // la vérification directe (30 min) ne rejouera pas tout de suite
  await app.away(11 * MIN);
  assert.ok(app.storeScreen(), 'état « coque trop vieille » gardé : écran entier, pas un rappel');
  assert.equal(reminder(app), null);
  assert.equal(app.storage.size, 0, 'aucune clé de rappel posée pour l’écran entier');
});

test('rappel : attend la fin de l’accueil comme l’écran, jamais en même temps qu’une fenêtre, silence sans réseau ni mise à jour', async () => {
  const app = boot({ live: null });
  app.doc.busy = true;
  await app.advance(4000 + 12000);
  assert.equal(reminder(app), null);
  assert.equal(app.storage.size, 0, 'rien retenu tant que la bannière n’est pas montrée');
  app.doc.busy = false;
  await app.advance(5000);
  assert.ok(reminder(app));
  const live = boot({ live: { kind: 'live', id: 'b1', seq: 1 } });
  await live.advance(4000);
  assert.equal(reminder(live), null, 'mise à jour directe prête : sa fenêtre seulement');
  const fail = boot({ live: null }); fail.env.storeFails = true;
  await fail.advance(4000);
  assert.equal(reminder(fail), null);
  const none = boot({ live: null, store: null });
  await none.advance(4000);
  assert.equal(reminder(none), null);
  assert.equal(none.storage.size, 0);
});

test('rappel : stockage bloqué, jamais d’erreur (il peut revenir, il ne bloque rien)', async () => {
  const app = boot({ live: null });
  app.ctx.localStorage.setItem = () => { throw new Error('stockage plein'); };
  await app.advance(4000);
  assert.ok(reminder(app));
});


test('index.html charge le modèle juste avant app-update.js', () => {
  const html = read('index.html');
  const a = html.indexOf('<script src="app-update-model.js'), b = html.indexOf('<script src="app-update.js');
  assert.ok(a > 0 && b > a, 'app-update-model.js avant app-update.js');
  assert.match(html.slice(a, b), /^<script src="app-update-model\.js\?v=[0-9a-f]{12}"><\/script>\n$/);
});

/* ---------- Styles ---------- */
const css = read('app-update.css');
const storeCss = css.slice(css.indexOf('Écran entier « Mets à jour Ocean Buddy »'));
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

test('styles : écran entier crème, zones sûres iPhone, paysage, rien en capitales ni en boucle', () => {
  assert.ok(storeCss.length > 500, 'section de l’écran entier trouvée');
  const c = noComments(storeCss);
  assert.match(c, /\.app-update\.is-store\{display:block;padding:0;[^}]*overflow-y:auto/);
  assert.match(c, /\.app-update-screen\{[^}]*min-height:100%[^}]*background:var\(--t-cream\)/);
  for (const side of ['top', 'right', 'bottom', 'left']) assert.match(c, new RegExp(`env\\(safe-area-inset-${side},0px\\)`), side);
  assert.match(c, /@media \(orientation:landscape\) and \(max-height:540px\)\{/);
  assert.match(c, /\.app-update-title\{[^}]*font:800 clamp\(38px,11\.5vw,52px\)/);
  assert.match(c, /\.app-update\.is-store \.app-update-go\{[^}]*min-height:64px[^}]*background:var\(--t-petrol\);color:var\(--t-cream\)/);
  assert.match(c, /\.app-update\.is-store \.app-update-later\{[^}]*min-height:48px/, 'zone de toucher de « Plus tard »');
  assert.match(c, /:focus-visible\{outline:3px solid var\(--t-petrol\)/);
  assert.doesNotMatch(c, /text-transform:uppercase|letter-spacing:\.?[1-9]|animation|infinite/);
  assert.doesNotMatch(c, /#[0-9a-fA-F]{3,8}\b|rgba?\(/, 'jetons --t-* uniquement');
});

test('styles : mouvement réduit (réglage iOS et réglage de l’app) respecté', () => {
  const c = noComments(storeCss);
  assert.match(c, /\.app-update\.is-store :is\([^)]*\)\{transform:translateY\(14px\);transition:transform \.34s/);
  assert.match(c, /@media \(prefers-reduced-motion:reduce\)\{\n\s*\.app-update\.is-store,\.app-update\.is-store :is\([^)]*\)\{transition:none\}/);
  assert.match(c, /body\.reduce-motion \.app-update\.is-store,body\.reduce-motion \.app-update\.is-store :is\([^)]*\)\{transition:none\}/);
});

test('fenêtre « live » : le sur-titre « Mise à jour prête » n’est plus en capitales', () => {
  const rule = /\.app-update-kicker\{[^}]*\}/.exec(css)[0];
  assert.match(rule, /text-transform:none/);
  assert.match(rule, /letter-spacing:0/);
  assert.doesNotMatch(rule, /uppercase/);
});

/* Contraste AA, couleurs lues dans le fichier de jetons. */
function tokens() {
  const root = /:root\{([^}]*)\}/.exec(read('activity-theme.css'))[1], out = {};
  for (const m of root.matchAll(/(--[\w-]+):(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mix = (a, b, p) => a.map((v, i) => Math.round(v * p + b[i] * (1 - p)));

test('styles : rappel discret, zones de toucher de 44 px, zone sûre, jetons seulement, mouvement réduit', () => {
  const c = noComments(css.slice(css.indexOf('Rappel discret'), css.indexOf('Écran entier « Mets à jour')));
  assert.match(c, /\.app-update-reminder\{position:fixed;[^}]*env\(safe-area-inset-bottom,0px\)/);
  assert.match(c, /\.app-update-reminder-actions button\{min-height:44px/);
  assert.match(c, /@media\(prefers-reduced-motion:reduce\)\{\.app-update-reminder\{transition:none\}\}/);
  assert.match(c, /body\.reduce-motion \.app-update-reminder\{transition:none\}/);
  assert.doesNotMatch(c, /text-transform:uppercase|animation|infinite|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

test('contraste AA sur le fond crème', () => {
  const t = tokens(), cream = rgb(t['--t-cream']), petrol = rgb(t['--t-petrol']), ink = rgb(t['--t-ink']), ink2 = rgb(t['--t-ink2']), sun = rgb(t['--t-sun']);
  assert.ok(ratio(petrol, cream) >= 4.5, 'titre pétrole sur crème');
  assert.ok(ratio(ink, cream) >= 4.5, 'phrase sur crème');
  assert.ok(ratio(ink2, cream) >= 4.5, '« Plus tard » sur crème');
  assert.ok(ratio(cream, petrol) >= 4.5, 'texte du bouton');
  assert.ok(ratio(petrol, mix(sun, cream, 0.38)) >= 4.5, 'numéro de version sur sa pastille soleil');
  assert.ok(ratio(petrol, cream) >= 3, 'contour de focus');
});

/* ---------- Textes et traductions ---------- */
const STRINGS = {
  'Mets à jour Ocean Buddy': ['Update Ocean Buddy', 'Actualiza Ocean Buddy'],
  'Une nouvelle version t’attend sur l’App Store.': ['A new version is waiting for you on the App Store.', 'Una nueva versión te espera en el App Store.'],
  'Version {0}': ['Version {0}', 'Versión {0}'],
  'Mettre à jour': ['Update', 'Actualizar'],
  'Plus tard': ['Later', 'Más tarde']
};

test('textes : tutoiement, ni capitales, ni flèches, ni tirets longs, ni points médians, aucune mention d’IA', () => {
  const src = read('app-update.js'), fr = JSON.parse(read('locales/source/fr.json'));
  const en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json'));
  for (const [k, [e, s]] of Object.entries(STRINGS)) {
    assert.ok(src.includes(k.replace('{0}', '${version}')), 'dans app-update.js : ' + k);
    assert.ok(fr.includes(k), 'extrait : ' + k);
    assert.equal(en[k], e, 'en : ' + k);
    assert.equal(es[k], s, 'es : ' + k);
    for (const text of [k, e, s]) {
      assert.doesNotMatch(text, /[—–·→←↗]|\bIA\b|\bAI\b|intelligence artificielle|artificial|artificial/i, text);
      assert.doesNotMatch(text.replace('{0}', ''), /\b[A-ZÀ-Ö]{2,}\b/, 'pas de mot en capitales : ' + text);
    }
  }
  for (const k of ['Une nouvelle version t’attend sur l’App Store.', 'Version {0}', 'Mettre à jour', 'Plus tard']) assert.ok(src.split(k.replace('{0}', '${version}')).length > 2, 'rappel : texte réutilisé, déjà traduit : ' + k);
  assert.doesNotMatch(src, /\bvous\b|\bvotre\b/i, 'tutoiement');
  assert.ok(!fr.includes('Ocean Buddy évolue !'), 'ancienne fenêtre « store » retirée');
});

test('traduction à l’affichage (vrai moteur i18n.js) : anglais britannique et espagnol', () => {
  const t = (lang, s) => i18nContext(lang).obT(s);
  assert.equal(t('en', 'Mets à jour Ocean Buddy'), 'Update Ocean Buddy');
  assert.equal(t('en', 'Version 1.5.0'), 'Version 1.5.0');
  assert.equal(t('en', 'Une nouvelle version t’attend sur l’App Store.'), 'A new version is waiting for you on the App Store.');
  assert.equal(t('es', 'Mets à jour Ocean Buddy'), 'Actualiza Ocean Buddy');
  assert.equal(t('es', 'Version 1.5.0'), 'Versión 1.5.0');
  assert.equal(t('es', 'Mettre à jour'), 'Actualizar');
  assert.equal(t('es', 'Plus tard'), 'Más tarde');
});
