/* Motion des interactions (23 novembre 2026) : retour au toucher par une règle commune, sens des transitions entre
   les pages, petites touches à l’arrivée d’un écran. Mouvement réduit respecté, rien avant la levée du rideau, aucun
   calque animé qui retienne un toucher, enveloppes posées une seule fois. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const motionCss = read('motion.css'), motionJs = read('motion.js'), design = read('design.css'), app = read('app.js');
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

/* ---------- Retour au toucher ---------- */
test('retour au toucher : une règle commune couvre boutons, liens en forme de bouton, replis et interrupteurs', () => {
  const css = noComments(motionCss);
  const rule = css.match(/:where\(\.ocean-v2,[^)]*\) :where\(([^)]*)\):where\(:not\(([^)]*)\)\):active\{([^}]*)\}/);
  assert.ok(rule, 'règle commune présente');
  for (const sel of ['button', '[role=button]', 'summary', 'a[href]', 'label.set-toggle']) assert.ok(rule[1].split(',').includes(sel), sel + ' couvert');
  assert.match(rule[3], /scale:\.97/, 'enfoncement léger (0,97)');
  assert.match(rule[3], /transition-duration:var\(--ob-t-press\)/, 'appui court');
  assert.doesNotMatch(rule[3], /delay/, 'aucun délai');
  assert.doesNotMatch(rule[1], /input|textarea|select/, 'jamais un champ de saisie');
  assert.match(rule[2], /\[disabled\]/, 'un bouton désactivé ne répond pas');
  assert.match(css, /--ob-t-press:\.11s;--ob-t-release:\.34s/, 'durées partagées');
  assert.match(design, /button,a\{transition:[^}]*scale var\(--ob-t-release,\.34s\) var\(--ob-snap,ease\)\}/, 'relâché souple des boutons et des liens');
  assert.match(css, /label\.set-toggle\{transition:scale var\(--ob-t-release\) var\(--ob-snap\)\}/, 'relâché souple des interrupteurs');
});

test('retour au toucher : les enfoncements restent entre 0,92 et 0,985 et ne passent que par transform ou scale', () => {
  const css = noComments(motionCss);
  for (const m of css.matchAll(/([^{}]+):active\{([^}]*)\}/g)) {
    for (const d of m[2].split(';').filter(Boolean)) {
      const [prop, value] = d.split(':').map(x => x.trim());
      assert.ok(['scale', 'transform', 'transition-duration', 'transition-timing-function'].includes(prop), m[1].trim() + ' : ' + prop);
      const k = /^scale$/.test(prop) ? +value : /scale\(([\d.]+)\)/.test(value) ? +RegExp.$1 : null;
      if (k != null) assert.ok(k >= .92 && k <= .985, m[1].trim() + ' : échelle ' + k);
    }
  }
});

test('retour au toucher : l’iPhone applique :active grâce à un écouteur de toucher passif, sans délai au clic', () => {
  assert.match(motionJs, /document\.addEventListener\('touchstart',function\(\)\{\},\{passive:true\}\);/);
  assert.doesNotMatch(noComments(motionJs), /preventDefault\(/, 'motion.js ne retient aucun événement');
  assert.doesNotMatch(noComments(motionJs), /addEventListener\('click',[^)]*setTimeout/, 'aucun clic différé');
});

test('mouvement réduit : l’enfoncement ne s’anime plus (scale et transform sortent des transitions)', () => {
  for (const css of [design.slice(design.indexOf('@media(prefers-reduced-motion:reduce){')), design.slice(design.indexOf('.reduce-motion *,'))]) {
    const props = css.match(/transition-property:([^!;]+)!important/)[1].split(',');
    for (const p of ['scale', 'transform', 'translate']) assert.ok(!props.includes(p), p + ' ne transite plus');
  }
});

/* ---------- Transitions entre les pages : go() réel, DOM minimal ---------- */
function navigationEnv({ reduce = false, from = 'home' } = {}) {
  const section = app.slice(app.indexOf('function resetScreenLive('), app.indexOf('function countUp('));
  const elements = {}; let timeout = null; const anims = [];
  const make = (id, classes = []) => { const set = new Set(classes); const el = { id, style: {}, classList: { add: (...c) => c.forEach(x => set.add(x)), remove: (...c) => c.forEach(x => set.delete(x)), contains: c => set.has(c) }, contains: () => false, focus() {}, get active() { return set.has('active'); } };
    el.animate = (kf, opts) => { const a = { id, frames: kf, opts, cancel() {} }; anims.push(a); return a; }; return el; };
  for (const id of ['home', 'spots', 'trips', 'detail', 'profile', 'surf', 'challenges']) elements[id] = make(id, id === from ? ['active'] : []);
  const wrap = make('screenWrap'); wrap.scrollTop = 0; wrap.querySelectorAll = () => Object.values(elements).filter(x => x.active); elements.screenWrap = wrap;
  const context = { window: { OceanNavigation: { begin() {}, settled() {}, restoreScroll: () => null }, dispatchEvent() {} },
    document: { body: { dataset: {}, classList: { contains: c => reduce && c === 'reduce-motion' } }, getElementById: id => elements[id], querySelector: () => elements[from], querySelectorAll: () => [] },
    CustomEvent: class {}, getComputedStyle: () => ({ paddingTop: '8px', paddingLeft: '16px', paddingRight: '16px', maxWidth: '1240px' }),
    setTimeout: fn => { timeout = fn; return 1; }, clearTimeout: () => { timeout = null; }, requestAnimationFrame: () => 0, HEADBUB: {}, vibrate() {}, bubbles() {}, animateCounts() {}, renderProfile() {} };
  vm.runInNewContext(app.slice(app.indexOf('const SCREEN_ORDER='), app.indexOf('function resetScreenLive(')) + section + ';this.navigate=go;', context);
  return { elements, anims, go: context.navigate, end() { timeout?.(); } };
}
const slideOf = (e, id) => { const a = e.anims.find(x => x.id === id && 'transform' in x.frames[0]); return a ? a.frames.map(f => +/translate3d\((-?[\d.]+)(?:px)?,/.exec(f.transform)[1]) : null; };

test('transitions : d’un onglet à l’autre, fondu sur place (aucun glissement), 200 ms au plus', () => {
  for (const [from, to] of [['home', 'spots'], ['home', 'profile'], ['profile', 'trips'], ['trips', 'home']]) {
    const e = navigationEnv({ from }); e.go(to);
    assert.ok(e.anims.length >= 2, from + ' vers ' + to + ' : fondu de l’écran qui arrive et de celui qui part');
    assert.ok(e.anims.every(a => a.frames.every(f => Object.keys(f).every(k => k === 'opacity'))), from + ' vers ' + to + ' : opacité seulement');
    assert.ok(e.anims.every(a => a.opts.duration <= 200));
    assert.equal(e.elements[from].active, true, 'l’ancien écran reste dessous pendant le fondu (jamais d’écran vide)');
    e.end(); assert.equal(e.elements[from].active, false); assert.equal(e.elements[to].active, true);
  }
});

test('transitions : une fiche arrive toujours par la droite et repart toujours vers la droite, d’où qu’on vienne', () => {
  for (const from of ['home', 'profile', 'trips']) {
    const open = navigationEnv({ from }); open.go('detail');
    const inn = slideOf(open, 'detail'); assert.ok(inn && inn[0] > 0 && inn[1] === 0, from + ' vers la fiche : elle entre par la droite');
    assert.ok(slideOf(open, from)[1] < 0, 'l’écran quitté recule vers la gauche');
    const back = navigationEnv({ from: 'detail' }); back.go(from);
    const ret = slideOf(back, from); assert.ok(ret && ret[0] < 0 && ret[1] === 0, 'retour vers ' + from + ' : l’écran retrouvé revient par la gauche');
    assert.ok(slideOf(back, 'detail')[1] > 0, 'la fiche repart vers la droite');
    for (const e of [open, back]) {
      assert.ok(e.anims.every(a => a.frames.every(f => Object.keys(f).every(k => k === 'transform' || k === 'opacity'))), 'transform et opacity seulement');
      assert.ok(e.anims.every(a => a.opts.duration >= 100 && a.opts.duration <= 300), '300 ms au plus');
    }
  }
});

test('transitions : Jeu et Défis s’ouvrent en avant depuis le Profil et reviennent en arrière', () => {
  for (const page of ['surf', 'challenges']) {
    const open = navigationEnv({ from: 'profile' }); open.go(page);
    assert.ok(slideOf(open, page)[0] > 0, page + ' entre par la droite');
    const back = navigationEnv({ from: page }); back.go('profile');
    assert.ok(slideOf(back, 'profile')[0] < 0, 'le Profil revient par la gauche');
  }
});

test('transitions : en mouvement réduit, fondu de 160 ms sans aucun déplacement, même vers une fiche', () => {
  const e = navigationEnv({ reduce: true, from: 'profile' }); e.go('detail');
  assert.ok(e.anims.length >= 2);
  assert.ok(e.anims.every(a => a.frames.every(f => Object.keys(f).every(k => k === 'opacity')) && a.opts.duration <= 160));
});

/* ---------- Petites touches : motion.js réel, DOM minimal ---------- */
function motionEnv({ booting = false, reduce = false } = {}) {
  const anims = []; const rootClasses = new Set(booting ? ['ob-booting'] : []); const bodyClasses = new Set(reduce ? ['reduce-motion'] : []);
  const cl = set => ({ add: (...c) => c.forEach(x => set.add(x)), remove: (...c) => c.forEach(x => set.delete(x)), contains: c => set.has(c) });
  const node = (tag, kids = []) => ({ tagName: tag, children: kids, hidden: false, style: {}, animate(kf, opts) { const a = { el: this, frames: kf, opts }; anims.push(a); return a; }, querySelector: () => null });
  const icons = { home: node('SPAN'), profile: node('SPAN') };
  const tabs = { home: { querySelector: () => icons.home }, profile: { querySelector: () => icons.profile } };
  const blocksOf = { challenges: [node('HEADER'), node('DIV'), node('ASIDE'), node('DIV'), node('DIV'), node('DETAILS'), node('DIV')], surf: [node('HEADER'), node('DIV', [node('SECTION'), node('SECTION'), node('SECTION')])] };
  const screens = Object.fromEntries(Object.entries(blocksOf).map(([id, kids]) => [id, node('SECTION', kids)]));
  const body = { dataset: { screen: 'home' }, classList: cl(bodyClasses), append() {} };
  let tab = 'home', calls = 0;
  const document = { documentElement: { classList: cl(rootClasses) }, body, addEventListener() {}, getElementById: id => screens[id] || null,
    querySelector: sel => /\.nav>button\[data-s\]\.active/.test(sel) ? tabs[tab] : null, querySelectorAll: () => [] };
  const window = { addEventListener() {}, matchMedia: () => ({ matches: false }), go(s) { calls++; body.dataset.screen = s; tab = { surf: 'profile', challenges: 'profile' }[s] || s; return 'ok'; } };
  const context = { window, document, Element: function () {}, CSS: { supports: () => false, escape: s => s }, performance: { now: () => 0 }, innerWidth: 1280, innerHeight: 900,
    requestAnimationFrame: () => 0, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, getComputedStyle: () => ({}) };
  context.Element.prototype.animate = function () {};
  vm.runInNewContext(motionJs, context);
  return { window, anims, icons, screens, rootClasses, calls: () => calls };
}

test('petites touches : l’icône de l’onglet choisi fait un petit saut, une fois, quand l’onglet change', () => {
  const e = motionEnv();
  assert.equal(e.window.go('profile'), 'ok', 'la fonction précédente est toujours appelée');
  const hop = e.anims.filter(a => a.el === e.icons.profile);
  assert.equal(hop.length, 1, 'un saut');
  assert.ok(hop[0].opts.duration <= 400 && !hop[0].opts.iterations, 'court, jamais en boucle');
  assert.ok(hop[0].frames.every(f => Object.keys(f).every(k => k === 'transform' || k === 'offset')), 'transform seulement');
  e.anims.length = 0; e.window.go('surf');
  assert.equal(e.anims.filter(a => a.el === e.icons.profile).length, 0, 'Jeu garde l’onglet Profil : pas de nouveau saut');
});

test('petites touches : à la première arrivée sur Défis ou Jeu, les blocs entrent l’un après l’autre, une seule fois', () => {
  const e = motionEnv();
  e.window.go('challenges');
  const first = e.anims.filter(a => e.screens.challenges.children.includes(a.el));
  assert.equal(first.length, 7, 'les blocs de l’écran');
  first.forEach((a, i) => {
    assert.equal(a.opts.delay, i * 26, 'décalage court');
    assert.ok(a.opts.delay + a.opts.duration <= 600 && a.opts.fill === 'backwards' && !a.opts.iterations, 'bref, sans boucle, sans état gardé');
    assert.ok(a.frames.every(f => Object.keys(f).every(k => k === 'transform' || k === 'opacity')));
  });
  e.window.go('home'); e.anims.length = 0; e.window.go('challenges');
  assert.equal(e.anims.filter(a => e.screens.challenges.children.includes(a.el)).length, 0, 'pas de seconde entrée');
  e.window.go('surf');
  const surf = e.anims.filter(a => a.opts.fill === 'backwards').map(a => a.el.tagName);
  assert.deepEqual(surf, ['HEADER', 'SECTION', 'SECTION', 'SECTION'], 'un conteneur unique laisse entrer ses cartes');
  assert.match(motionJs, /const ARRIVE=\{challenges:1,surf:1,community:1\}/, 'les écrans qui ont déjà leur entrée ne sont pas doublés');
});

test('mouvement réduit : ni saut d’icône ni entrée des blocs', () => {
  const e = motionEnv({ reduce: true });
  e.window.go('profile'); e.window.go('challenges');
  assert.equal(e.anims.length, 0);
});

test('rien avant la levée du rideau : aucune animation tant que html.ob-booting est posé, l’entrée reste à jouer', () => {
  const e = motionEnv({ booting: true });
  e.window.go('profile'); e.window.go('challenges');
  assert.equal(e.anims.length, 0, 'rien ne bouge sous le rideau');
  e.rootClasses.delete('ob-booting'); e.window.go('home'); e.anims.length = 0; e.window.go('challenges');
  assert.equal(e.anims.filter(a => a.opts.fill === 'backwards').length, 7, 'la première arrivée visible est animée');
  assert.match(motionJs, /function blocked\(\)\{\s*return root\.classList\.contains\('ob-booting'\)/);
  for (const fn of ['hopTab', 'arrive']) {
    const body = motionJs.slice(motionJs.indexOf('function ' + fn + '('), motionJs.indexOf('\n  }', motionJs.indexOf('function ' + fn + '(')));
    assert.match(body, /reduced\(\)\|\|blocked\(\)/, fn + ' consulte le mouvement réduit et le rideau');
  }
  assert.doesNotMatch(noComments(motionCss), /ob-booting[^{]*\{[^}]*animation:(?!none)/, 'aucune animation CSS sous le rideau');
});

test('enveloppes : posées une seule fois, sans remplacer une fonction enveloppée ensuite par un autre module', () => {
  const e = motionEnv();
  const mine = e.window.go; let outer = 0;
  e.window.go = function (s) { outer++; return mine.apply(this, arguments); };
  /* Rappels de wrapAll (load, setTimeout) : ils ne doivent plus toucher à window.go. */
  const src = motionJs;
  assert.match(src, /if\(typeof original!=='function'\|\|original\.__motion\|\|wrappedOnce\.go\)return;/);
  assert.match(src, /if\(typeof original!=='function'\|\|original\.__motion\|\|wrappedOnce\.openSpot\)return;/);
  assert.match(src, /if\(typeof original!=='function'\|\|original\.__motion\|\|wrappedOnce\[name\]\)return;/);
  const before = e.calls(); e.window.go('profile');
  assert.equal(outer, 1); assert.equal(e.calls(), before + 1, 'la fonction d’origine est appelée une fois');
});

test('aucun calque animé ne retient un toucher', () => {
  const css = noComments(motionCss);
  for (const layer of ['.ob-zoom', '.ob-tab-ink']) assert.match(css, new RegExp(layer.replace('.', '\\.') + '\\{[^}]*pointer-events:none'), layer);
  assert.doesNotMatch(noComments(motionJs), /document\.createElement\('div'\)[^;]*;(?![^\n]*ob-zoom)/, 'un seul calque créé par le script : celui du vol, traversé par les touchers');
});
