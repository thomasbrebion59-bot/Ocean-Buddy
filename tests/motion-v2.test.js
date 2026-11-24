/* Motion des interactions, seconde passe (23 novembre 2026, « la motion des interactions manque ») :
   - jetons communs : trois courbes (fondu, ressort léger, ressort vif) et des durées entre 120 et 380 ms ;
   - retour au toucher joué par motion.js : enfoncement franc, relâché en ressort, toucher bref compris, rien quand le
     doigt fait défiler, onde depuis le point de contact sur les grandes surfaces ;
   - aucune mesure de mise en page au toucher, aucune boucle, rien en mouvement réduit ni sous le rideau ;
   - récompenses courtes (cœur, défi), feuilles en ressort, interrupteurs à curseur, titre replié, profondeur des photos. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const motionCss = read('motion.css'), motionJs = read('motion.js'), app = read('app.js');
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const css = noComments(motionCss), js = noComments(motionJs);
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + a.length); assert.ok(i >= 0 && j > i, 'repères : ' + a + ' … ' + b); return src.slice(i, j); };

/* ---------- Jetons ---------- */
const points = name => { const m = css.match(new RegExp('--ob-' + name + ':linear\\(([^)]*)\\)')); assert.ok(m, 'courbe linear() : ' + name); return m[1].split(',').map(Number); };
test('jetons : trois courbes communes (fondu, ressort léger, ressort vif), plus l’amorti et la sortie déjà là', () => {
  const base = css.slice(css.indexOf(':root{'), css.indexOf('@supports'));
  for (const t of ['ease-out', 'spring', 'pop', 'snap', 'ease-in']) assert.match(base, new RegExp('--ob-' + t + ':cubic-bezier\\('), 'repli en courbe de Bézier : ' + t);
  const spring = points('spring'), pop = points('pop'), snap = points('snap');
  for (const p of [spring, pop, snap]) { assert.equal(p[0], 0); assert.equal(p[p.length - 1], 1); assert.ok(p.every(Number.isFinite)); }
  assert.ok(Math.max(...spring) > 1.015 && Math.max(...spring) < 1.04, 'ressort léger : dépasse de 2 à 3 % (' + Math.max(...spring) + ')');
  assert.ok(Math.max(...pop) > 1.07 && Math.max(...pop) < 1.14, 'ressort vif : dépasse d’environ 10 % (' + Math.max(...pop) + ')');
  assert.ok(Math.max(...snap) <= 1, 'amorti : aucun rebond');
  assert.ok(Math.min(...pop.slice(pop.indexOf(Math.max(...pop)))) > .97, 'le ressort vif ne repart pas loin en arrière');
});

test('jetons : motion.js expose les mêmes courbes que motion.css (OceanMotion.spring, .pop, .snap, .easeOut)', () => {
  const list = name => js.match(new RegExp("const " + name + "='linear\\(([^)]*)\\)'"))[1].split(',').map(Number);
  assert.deepEqual(list('LINEAR'), points('spring'));
  assert.deepEqual(list('POP'), points('pop'));
  assert.match(js, /M\.spring=linearOK\?LINEAR:'cubic-bezier\(\.34,1\.2,\.64,1\)'/);
  assert.match(js, /M\.pop=linearOK\?POP:'cubic-bezier\(\.34,1\.56,\.64,1\)'/);
  assert.match(css, /--ob-spring:cubic-bezier\(\.34,1\.2,\.64,1\)/); assert.match(css, /--ob-pop:cubic-bezier\(\.34,1\.56,\.64,1\)/);
  assert.match(js, /M\.easeOut='cubic-bezier\(\.22,\.8,\.3,1\)'/); assert.match(css, /--ob-ease-out:cubic-bezier\(\.22,\.8,\.3,1\)/);
});

test('jetons : les nouvelles règles passent par les courbes communes, jamais par une courbe à rebond écrite sur place', () => {
  const fresh = css.slice(css.indexOf('.ob-ink-box{'));
  for (const m of fresh.matchAll(/cubic-bezier\(([^)]*)\)/g)) {
    const [, y1, , y2] = m[1].split(',').map(Number);
    assert.ok(y1 <= 1 && y2 <= 1, 'courbe à rebond hors jeton : cubic-bezier(' + m[1] + ')');
  }
  for (const use of ['.sd-sheet.in{transition:transform var(--ob-t-sheet) var(--ob-spring)}', 'ob-rise var(--ob-t-sheet) var(--ob-spring) backwards', 'transition:transform var(--ob-t-release) var(--ob-spring)'])
    assert.ok(css.includes(use), use);
});

/* ---------- Durées : entre 120 et 380 ms ---------- */
test('durées : tous les jetons et toutes les durées écrites tiennent entre 120 et 380 ms', () => {
  const tokens = [...css.matchAll(/--ob-t-[\w-]+:(\.?\d*\.?\d+)s/g)].map(m => +m[1]);
  assert.ok(tokens.length >= 9, 'jetons de durée : ' + tokens.length);
  for (const t of tokens) assert.ok(t >= .12 && t <= .38, 'jeton de durée : ' + t + ' s');
  /* motion.css : durées écrites en dur dans une transition ou une animation. Seule exception : l’habillage d’attente
     d’une valeur en cours de chargement (ob-wait), qui n’est pas une réponse à un geste. */
  for (const m of css.matchAll(/(?:transition|animation)(?:-duration)?:([^;}]*)/g)) {
    if (/ob-wait/.test(m[1])) continue;
    for (const d of m[1].matchAll(/(?:^|[\s,])(\.?\d*\.?\d+)s\b/g)) assert.ok(+d[1] >= .1 && +d[1] <= .38, 'motion.css : ' + m[0]);
  }
  /* motion.js : constantes et durées écrites en chiffres. */
  const consts = [...js.matchAll(/\b([A-Z]+_MS)=(\d+)/g)].map(m => [m[1], +m[2]]);
  assert.ok(consts.length >= 8);
  for (const [name, v] of consts) if (name !== 'HOLD_MS') assert.ok(v >= 120 && v <= 380, name + ' = ' + v);
  assert.equal(new Map(consts).get('HOLD_MS'), 70, 'attente avant l’appui au doigt (ce n’est pas une animation)');
  for (const m of js.matchAll(/duration:(\d+)/g)) assert.ok(+m[1] >= 120 && +m[1] <= 380, 'motion.js : durée ' + m[1]);
  /* go() : constantes de l’écran. */
  const go = app.match(/const GO_MS=(\d+),GO_ZOOM_MS=(\d+),TAB_GO_MS=(\d+),/); assert.ok(go);
  for (const v of go.slice(1)) assert.ok(+v >= 120 && +v <= 380, 'durée de go() : ' + v);
  assert.equal(+go[2], 300, 'avec le vol de la photo, le fondu enchaîné garde ses 300 ms (l’ancien écran ne s’attarde pas pendant que la fiche se construit)');
  assert.match(app, /const goMs=reduce\?160:zoom\?GO_ZOOM_MS:far\?GO_MS:TAB_GO_MS;/);
  assert.match(app, /const fadeIn=reduce\?goMs:Math\.max\(120,/, 'fondu d’arrivée : jamais sous 120 ms');
});

/* ---------- motion.js réel dans un DOM minimal ---------- */
function env({ booting = false, reduce = false, io = true } = {}) {
  const anims = [], listeners = {}, timers = [], frames = [], made = [], ioQueue = [];
  const rootClasses = new Set(booting ? ['ob-booting'] : []), bodyClasses = new Set(reduce ? ['reduce-motion'] : []);
  const cl = set => ({ add: (...c) => c.forEach(x => set.add(x)), remove: (...c) => c.forEach(x => set.delete(x)), contains: c => set.has(c) });
  const node = (tag, opts = {}) => {
    const n = { tagName: tag, children: [], style: {}, hidden: false, isConnected: true, className: '', attrs: {}, removed: false, dataset: {}, ...opts,
      setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k] ?? null; }, removeAttribute(k) { delete this.attrs[k]; },
      append(...k) { this.children.push(...k); }, remove() { this.removed = true; this.isConnected = false; },
      querySelector: () => null, querySelectorAll: () => [],
      animate(kf, o) { const a = { el: this, frames: kf, opts: o, cancelled: false, reversed: false, cancel() { this.cancelled = true; }, reverse() { this.reversed = true; }, finished: { then() {} } }; anims.push(a); return a; } };
    n.classList = cl(new Set()); return n;
  };
  /* Élément touché : `is` liste les sélecteurs auxquels il répond (grande surface, photo…). */
  const pressable = (is = []) => { const el = node('BUTTON'); el.matches = sel => is.some(k => sel.split(',').includes(k)); el.closest = sel => (sel.includes('button') ? el : null); return el; };
  const body = { dataset: { screen: 'home' }, classList: cl(bodyClasses), children: [], append(...k) { this.children.push(...k); } };
  const document = { documentElement: { classList: cl(rootClasses) }, body, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    createElement(tag) { const n = node(tag.toUpperCase()); made.push(n); return n; } };
  const window = { addEventListener(type, fn) { (listeners['w:' + type] = listeners['w:' + type] || []).push(fn); }, matchMedia: () => ({ matches: false }), innerHeight: 932, go() { return 'ok'; } };
  const context = { window, document, Element: function () {}, CSS: { supports: () => false, escape: s => s }, performance: { now: () => 0 }, innerWidth: 430, innerHeight: 932,
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; }, setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    getComputedStyle: () => ({ borderRadius: '18px' }), HTMLDialogElement: undefined };
  if (io) context.IntersectionObserver = function (cb) { this.observe = el => ioQueue.push(() => cb([{ target: el, boundingClientRect: { left: 16, top: 400, width: 398, height: 100 } }])); this.unobserve = () => {}; };
  context.Element.prototype.animate = function () {};
  vm.runInNewContext(motionJs, context);
  const fire = (type, e) => (listeners[type] || []).forEach(fn => fn(e));
  const pointer = (type, target, extra = {}) => fire(type, { target, isPrimary: true, pointerId: 1, pointerType: 'touch', button: 0, clientX: 215, clientY: 450, ...extra });
  return { window, anims, listeners, timers, frames, made, body, rootClasses, bodyClasses, pressable, node, pointer, fire, flushIO() { while (ioQueue.length) ioQueue.shift()(); }, M: window.OceanMotion };
}
const scales = a => Array.from(a.frames, f => +f.scale); /* tableau du contexte de test (les images clés viennent de la machine virtuelle) */

test('retour au toucher : appui franc en « scale » (0,96), relâché en ressort qui dépasse d’un rien, 120 puis 320 ms', () => {
  const e = env(), btn = e.pressable();
  e.pointer('pointerdown', btn);
  assert.equal(e.anims.length, 0, 'au doigt, l’appui attend : rien tant que le doigt peut partir en défilement');
  assert.equal(e.timers.at(-1).ms, 70);
  e.timers.at(-1).fn();
  assert.equal(e.anims.length, 1);
  assert.deepEqual(scales(e.anims[0]), [1, .96]); assert.equal(e.anims[0].opts.duration, 120); assert.equal(e.anims[0].opts.fill, 'both');
  e.pointer('pointerup', btn);
  assert.equal(e.anims.length, 2);
  const rel = scales(e.anims[1]);
  assert.equal(rel[0], .96); assert.ok(rel[1] > 1 && rel[1] <= 1.03, 'dépassement léger : ' + rel[1]); assert.equal(rel[2], 1);
  assert.equal(e.anims[1].opts.duration, 320);
  for (const a of e.anims) assert.ok(a.frames.every(f => Object.keys(f).every(k => k === 'scale' || k === 'offset' || k === 'easing')), 'scale seulement');
  assert.ok(!e.anims.some(a => a.opts.iterations), 'jamais en boucle');
});

test('retour au toucher : un toucher très bref joue quand même tout l’aller et retour', () => {
  const e = env(), btn = e.pressable();
  e.pointer('pointerdown', btn); e.pointer('pointerup', btn);
  assert.equal(e.anims.length, 2, 'appui puis relâché');
  assert.deepEqual(scales(e.anims[0]), [1, .96]);
  assert.ok(e.anims[1].opts.delay >= 100 && e.anims[1].opts.delay <= 120, 'le relâché attend la fin de l’appui (' + e.anims[1].opts.delay + ' ms)');
});

test('retour au toucher : rien quand le doigt part en défilement ; appui déjà parti, il se défait sans ressort', () => {
  const a = env(), btn = a.pressable();
  a.pointer('pointerdown', btn); a.pointer('pointercancel', btn);
  assert.equal(a.anims.length, 0, 'défilement avant l’appui : rien ne bouge');
  a.pointer('pointerup', btn); assert.equal(a.anims.length, 0, 'et le relâché ne joue rien non plus');
  const b = env(), row = b.pressable();
  b.pointer('pointerdown', row); b.pointer('pointermove', row, { clientY: 480 });
  assert.equal(b.anims.length, 0, 'le doigt a bougé de plus de 10 px');
  const c = env(), el = c.pressable();
  c.pointer('pointerdown', el); c.timers.at(-1).fn(); c.pointer('pointercancel', el);
  assert.equal(c.anims.length, 1); assert.equal(c.anims[0].reversed, true, 'l’appui revient en arrière, sans rebond');
  /* À la souris, l’appui part tout de suite. */
  const d = env(), m = d.pressable();
  d.pointer('pointerdown', m, { pointerType: 'mouse' }); assert.equal(d.anims.length, 1);
  d.pointer('pointerdown', d.pressable(), { pointerType: 'mouse', button: 2 }); assert.equal(d.anims.length, 1, 'clic droit ignoré');
});

test('retour au toucher : grande surface, enfoncement plus léger (0,975) et onde depuis le point de contact', () => {
  const e = env(), card = e.pressable(['.ui-spot']);
  e.pointer('pointerdown', card, { clientX: 300, clientY: 450 });
  e.flushIO();
  assert.equal(e.body.children.length, 0, 'pas d’onde avant l’appui');
  e.timers.find(t => t.ms === 70).fn();
  assert.deepEqual(scales(e.anims[0]), [1, .975]);
  const box = e.body.children[0]; assert.ok(box, 'onde posée');
  assert.equal(box.className, 'ob-ink-box'); assert.equal(box.attrs['aria-hidden'], 'true');
  const st = Object.fromEntries(box.style.cssText.split(';').map(d => d.split(':')));
  /* Le cadre tient dans la surface enfoncée : il ne déborde jamais. */
  assert.ok(parseFloat(st.left) > 16 && parseFloat(st.top) > 400 && parseFloat(st.left) + parseFloat(st.width) < 16 + 398 && parseFloat(st.top) + parseFloat(st.height) < 500, box.style.cssText);
  assert.equal(st['border-radius'], '18px', 'rogné aux coins de la surface');
  const ink = e.anims.find(a => a.el === box.children[0]); assert.ok(ink);
  assert.equal(ink.opts.duration, 380);
  assert.ok(ink.frames.every(f => Object.keys(f).every(k => k === 'transform' || k === 'opacity' || k === 'offset')), 'transform et opacity seulement');
  const first = ink.frames[0].transform, last = ink.frames.at(-1).transform;
  assert.match(first, /^translate3d\(2\d\d\.\dpx,4\d\.\dpx,0\) scale\(\.35\)$/, 'part du point de contact : ' + first);
  assert.ok(+/scale\(([\d.]+)\)$/.exec(last)[1] > 4, 'grandit jusqu’au coin le plus loin');
  assert.equal(ink.frames.at(-1).opacity, 0, 'et s’efface');
  /* Photo : onde claire. Changement d’écran : l’onde s’efface avec l’écran. */
  const p = env(), photo = p.pressable(['.ac-card']);
  p.pointer('pointerdown', photo); p.flushIO(); p.pointer('pointerup', photo);
  assert.equal(p.body.children[0].className, 'ob-ink-box is-light');
  p.fire('w:ocean:navigate', {});
  assert.ok(p.anims.some(a => a.el === p.body.children[0] && a.frames.at(-1).opacity === 0 && a.opts.duration <= 200), 'fondu court à la navigation');
});

test('retour au toucher : ni champ de saisie, ni carte, ni manette du jeu, ni bouton désactivé', () => {
  const src = between(js, "const PRESS='", "let hold=null");
  const no = src.match(/const NO_PRESS='([^']*)'/)[1].split(',');
  for (const sel of ['[disabled]', '[aria-disabled=true]', '[class*=maplibregl]', '.omap-ctrls *', '.sf-pad *', 'input', 'select', 'textarea']) assert.ok(no.includes(sel), sel);
  const press = src.match(/const PRESS='([^']*)'/)[1].split(',');
  for (const sel of ['button', '[role=button]', 'summary', 'a[href]', 'label.set-toggle', '.ui-spot']) assert.ok(press.includes(sel), sel);
  const large = src.match(/const LARGE='([^']*)'/)[1].split(',');
  for (const sel of ['.ui-spot', '.ui-card', '.ac-card', '.tv-idea', '.pv-tile', '.pv-pass']) assert.ok(large.includes(sel), 'grande surface : ' + sel);
  const e = env(), off = e.pressable(['[disabled]']);
  e.pointer('pointerdown', off); e.pointer('pointerup', off); assert.equal(e.anims.length, 0);
});

test('aucune mesure de mise en page au toucher : la place d’une surface vient d’un IntersectionObserver', () => {
  const touch = between(js, '================= Retour au toucher'.length ? "const PRESS='" : '', 'document.addEventListener(\'click\',e=>{');
  assert.doesNotMatch(touch, /getBoundingClientRect|getClientRects|offset(?:Width|Height|Top|Left|Parent)|client(?:Width|Height|Top|Left)|scroll(?:Top|Left|Width|Height)|inner(?:Width|Height)/, 'aucune lecture de mise en page');
  /* Le rayon est lu avec la place, dans le rappel de l’observateur (hors du fil du toucher). */
  assert.equal((touch.match(/getComputedStyle\(/g) || []).length, 1);
  assert.match(touch, /rectOf\(el,\(r,node\)=>\{h\.rect=r;try\{const cs=getComputedStyle\(node\)\.borderRadius/);
  const rect = between(js, 'function rectOf(el,cb){', 'const PRESS=');
  assert.match(rect, /new IntersectionObserver\(/); assert.match(rect, /e\.boundingClientRect/);
  assert.doesNotMatch(rect, /getBoundingClientRect/);
  /* Les récompenses passent par le même chemin, et le cœur ne force plus de mise en page pour rejouer. */
  const rewards = between(js, 'function burst(el,ok){', 'M.enter=function');
  assert.doesNotMatch(rewards, /getBoundingClientRect|offsetWidth|offsetHeight/);
  /* Sans IntersectionObserver : l’appui joue, l’onde est simplement absente. */
  const e = env({ io: false }), card = e.pressable(['.ui-spot']);
  e.pointer('pointerdown', card); e.pointer('pointerup', card);
  assert.equal(e.anims.length, 2); assert.equal(e.body.children.length, 0);
});

test('aucune boucle : ni setInterval, ni animation infinie, ni image redemandée par elle-même dans la seconde passe', () => {
  const fresh = between(js, 'let rectIO=null', 'const FOCUS_KEYS=');
  assert.doesNotMatch(fresh, /setInterval|iterations|Infinity/);
  /* Chaque requestAnimationFrame est une image unique : une fonction fléchée écrite sur place, jamais une fonction qui se rappelle. */
  const raf = [...fresh.matchAll(/requestAnimationFrame\((.{0,5})/g)].map(m => m[1]);
  assert.ok(raf.length >= 3); for (const r of raf) assert.match(r, /^\(\)=>/, 'requestAnimationFrame(' + r);
  /* motion.css : « infinite » seulement pour l’habillage d’attente d’une valeur en chargement. */
  const loops = [...css.matchAll(/animation:[^;}]*infinite/g)].map(m => m[0]);
  assert.equal(loops.length, 1); assert.match(loops[0], /ob-wait/);
  /* Les écouteurs de toucher ne retiennent rien : passifs, aucun preventDefault. */
  for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'pointermove']) assert.match(js, new RegExp("document\\.addEventListener\\('" + type + "',pointer\\w+,\\{capture:true,passive:true\\}\\)"));
  assert.doesNotMatch(js, /preventDefault\(/);
});

test('mouvement réduit et rideau de démarrage : ni appui, ni onde, ni rebond, ni particule, ni vue qui glisse', () => {
  for (const opts of [{ reduce: true }, { booting: true }]) {
    const e = env(opts), card = e.pressable(['.ui-spot']);
    e.pointer('pointerdown', card, { pointerType: 'mouse' }); e.flushIO(); e.pointer('pointerup', card, { pointerType: 'mouse' });
    assert.equal(e.anims.length, 0, JSON.stringify(opts) + ' : aucun appui');
    assert.equal(e.body.children.length, 0, 'aucune onde');
    e.M.burst(card, false); e.flushIO(); assert.equal(e.body.children.length, 0, 'aucune particule');
    assert.equal(e.M.enter(e.node('DIV'), 1), false, 'aucune vue poussée');
    assert.equal(e.anims.length, 0);
  }
  /* Chaque nouveau mouvement consulte le réglage et le rideau. */
  for (const fn of ['function pointerDown(e){', 'function burst(el,ok){', 'M.enter=function(el,dir,fade){']) {
    const body = js.slice(js.indexOf(fn), js.indexOf('\n  }', js.indexOf(fn)));
    assert.match(body, /reduced\(\)\|\|blocked\(\)/, fn);
  }
  /* CSS : les calques posés par le script sont cachés, les feuilles ne glissent plus (fondu court seulement). */
  const media = css.slice(css.lastIndexOf('@media (prefers-reduced-motion:reduce){'));
  for (const rule of ['.ob-ink-box,.ob-burst{display:none}', 'body .sd-sheet:not(.in){opacity:0}']) assert.ok(media.includes(rule), rule);
  assert.ok(css.includes('.reduce-motion .ob-ink-box,.reduce-motion .ob-burst{display:none}'));
  assert.ok(css.includes('body.reduce-motion .sd-sheet:not(.in){opacity:0}'));
  /* La profondeur des photos ne s’applique ni au réglage du téléphone ni à celui de l’app. */
  const depth = css.slice(css.indexOf('@supports (view-timeline:--ob-idea inline)'));
  assert.match(depth, /@media \(prefers-reduced-motion:no-preference\)\{\s*body:not\(\.reduce-motion\) \.tv-idea\{view-timeline:--ob-idea inline\}\s*body:not\(\.reduce-motion\) \.tv-idea>img\{scale:1\.1;animation:ob-depth-x linear both;animation-timeline:--ob-idea;animation-range:cover\}/);
});

/* ---------- Récompenses ---------- */
test('favori : le cœur bat et éclate en huit particules courtes, une fois ; le cœur de la fiche est pris en compte', () => {
  assert.match(js, /const HEART='\.hf-fav,\.fav,\[data-fav\],\.spot-bar-fav'/);
  const e = env(), heart = e.node('BUTTON');
  e.M.burst(heart, false);
  assert.equal(e.body.children.length, 0, 'rien avant de connaître la place du cœur');
  e.flushIO();
  const g = e.body.children[0]; assert.equal(g.className, 'ob-burst');
  assert.equal(g.children.length, 9, 'un anneau et huit points');
  assert.equal(g.children[0].className, 'ob-ring');
  assert.equal(g.style.transform, 'translate3d(215.0px,450.0px,0)', 'au centre du cœur');
  const parts = e.anims.filter(a => g.children.includes(a.el)); assert.equal(parts.length, 9);
  for (const a of parts) {
    assert.ok(a.opts.duration >= 120 && a.opts.duration <= 380 && !a.opts.iterations, 'court, jamais en boucle');
    assert.ok(a.frames.every(f => Object.keys(f).every(k => k === 'transform' || k === 'opacity' || k === 'offset')));
    assert.equal(a.frames.at(-1).opacity, 0, 'chaque particule s’efface');
  }
  const reach = parts.slice(1).map(a => { const m = /translate3d\((-?[\d.]+)px,(-?[\d.]+)px/.exec(a.frames.at(-1).transform); return Math.hypot(+m[1], +m[2]); });
  assert.ok(Math.max(...reach) <= 36 && Math.min(...reach) >= 12, 'particules proches du cœur : ' + reach.map(Math.round));
  assert.ok(e.timers.some(t => t.ms <= 500), 'le calque est retiré');
  const ok = env(); ok.M.burst(ok.node('BUTTON'), true); ok.flushIO();
  assert.equal(ok.body.children[0].className, 'ob-burst is-ok', 'défi validé : particules vertes');
  for (const rule of ['.ob-burst{position:fixed;', '.ob-dot{position:absolute;', '.ob-burst.is-ok>.ob-dot{background:var(--t-ok)}']) assert.ok(css.includes(rule), rule);
  assert.ok(Array.from(g.children).slice(1).every(d => /^ob-dot( is-sun)?$/.test(d.className)), 'particules stylées par leur classe');
});

test('verdict « Bon pour toi » qui se pose, tampon qui s’imprime : une fois, sous 380 ms', () => {
  assert.match(css, /@keyframes ob-land\{0%\{opacity:0;transform:translate3d\(0,-9px,0\) scale\(1\.2\)\}55%\{opacity:1;transform:translate3d\(0,1px,0\) scale\(\.95\)\}100%\{opacity:1;transform:translate3d\(0,0,0\) scale\(1\)\}\}/);
  assert.match(css, /:root \.ocean-v2 \.ui-arrive \.ui-verdict\[data-v=bon\]>b\{animation:ob-land var\(--ob-t-pop\) var\(--ob-ease-out\) \.1s backwards\}/, 'seulement « bon », seulement à l’arrivée des conditions');
  assert.match(css, /:root \.cult-stamp\.is-fresh\{animation:ob-stamp var\(--ob-t-pop\) var\(--ob-ease-out\) both\}/);
  assert.match(css, /@keyframes ob-stamp\{0%\{opacity:0;transform:scale\(1\.8\) rotate\(-24deg\)\}/);
  /* Plus précises que les règles des écrans (ui-v2.css, ui-listes.css, cultures.css), chargées après motion.css. */
  assert.match(read('ui-listes.css'), /\.ocean-v2 \.exl-live\.ui-arrive>\.ui-verdict>b\{animation:exl-pop/);
  assert.match(read('cultures.css'), /\.cult-stamp\.is-fresh\{animation:cult-thump/);
});

test('changement d’état : la pastille qui change rebondit ; les segments à curseur glissent, sans rebond en plus', () => {
  const src = between(js, "const STATE='", 'function burst(el,ok){');
  const state = src.match(/const STATE='([^']*)'/)[1].split(',');
  for (const sel of ['[aria-pressed]', '[aria-checked]', '[aria-selected]', '.exl-pill', '.dtab']) assert.ok(state.includes(sel), sel);
  assert.match(src, /const NO_STATE='\.pv-seg>button,\.exl-seg button'/);
  assert.match(src, /if\(!el\.isConnected\|\|stateOf\(el\)===before\)return;/, 'seulement si l’état a changé');
  assert.match(src, /el\.animate\(\[\{scale:'\.93'\},\{scale:'1\.045',offset:\.55\},\{scale:'1'\}\],\{duration:POP_MS,easing:M\.easeOut\}\)/);
  assert.match(css, /:root \.ocean-v2 \.pv-seg-ink\{transition:transform var\(--ob-t-release\) var\(--ob-spring\),opacity var\(--ob-t-fade\)\}/);
  assert.match(css, /:root \.ocean-v2 \.exl-seg::before\{transition:transform var\(--ob-t-release\) var\(--ob-spring\)\}/);
});

test('interrupteurs des réglages : un curseur qui glisse en transform, le rail change de couleur en fondu', () => {
  const sw = '.ocean-v2 label.set-toggle>input[type=checkbox]';
  const rule = sel => { const i = css.indexOf(sel + '{'); assert.ok(i >= 0, sel); return css.slice(i + sel.length + 1, css.indexOf('}', i)); };
  assert.match(rule(sw), /appearance:none/); assert.match(rule(sw), /transition:background-color \.2s ease/);
  assert.match(rule(sw + '::before'), /transition:transform var\(--ob-t-release\) var\(--ob-spring\)/);
  assert.match(rule(sw + ':checked::before'), /^transform:translate3d\(18px,0,0\)$/);
  assert.match(rule(sw + ':focus-visible'), /outline:2px solid var\(--t-main\)/, 'repère au clavier gardé');
  assert.match(read('index.html'), /<label class="set-toggle"><span>Réduire les animations<\/span><input type="checkbox" id="setReduce"/, 'la case reste une vraie case à cocher');
});

/* ---------- Feuilles, fenêtres, vues poussées ---------- */
test('feuilles et fenêtres : montée en ressort, fond qui s’assombrit, sortie franche par le même chemin', () => {
  assert.ok(css.includes('body .sd-sheet.in{transition:transform var(--ob-t-sheet) var(--ob-spring)}'));
  assert.match(css, /body \.sd-sheet\{transition:transform var\(--ob-t-exit\) var\(--ob-ease-in\);box-shadow:[^}]*,0 64px 0 0 var\(--t-card\)\}/, 'sortie franche ; le ressort ne laisse jamais voir le fond sous la feuille');
  assert.ok(css.includes('body .sd-sheet-back.in{transition:opacity var(--ob-t-sheet) var(--ob-ease-out)}'));
  assert.ok(css.includes('.quiz-modal.open>.quiz-card,.aqi.open>.aqi-card{animation:ob-fade-in var(--ob-t-fade) ease-out backwards,ob-rise var(--ob-t-sheet) var(--ob-spring) backwards}'));
  assert.ok(css.includes(':root .ocean-v2 .trip-dialog[open]{animation:ob-fade-in var(--ob-t-fade) ease-out backwards,ob-rise var(--ob-t-sheet) var(--ob-spring) backwards}'));
  assert.ok(css.includes(':root .ocean-v2 .trip-dialog[open]::backdrop{animation:ob-fade-in var(--ob-t-sheet) var(--ob-ease-out)}'));
  assert.match(css, /@keyframes ob-rise\{from\{transform:translate3d\(0,44px,0\) scale\(\.96\)\}\}/, 'la montée ne touche pas à l’opacité : passer en mouvement réduit fenêtre ouverte ne rejoue rien');
  /* Les feuilles d’Explorer sont retirées 320 ms après la fermeture : la sortie (200 ms) tient dedans. */
  assert.match(read('explore-list.js'), /setTimeout\(\(\) => \{ s\.back\.remove\(\); s\.el\.remove\(\); \}, 320\);/);
  assert.match(css, /--ob-t-exit:\.2s/);
});

test('formulaire de voyage : close() ferme tout de suite, une copie inerte redescend 200 ms', () => {
  const src = between(js, 'const proto=typeof HTMLDialogElement', 'const FOCUS_KEYS=');
  let closed = 0; const made = [], appended = [], timers = [];
  const el = tag => { const n = { tag, attrs: {}, classes: new Set(), scrollTop: 0, anims: [], setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }, querySelectorAll: () => [], remove() { this.removed = true; },
    animate(kf, o) { this.anims.push({ kf, o }); return {}; } }; n.classList = { add: c => n.classes.add(c) }; made.push(n); return n; };
  function Dialog() {} Dialog.prototype.close = function () { closed++; this.open = false; };
  const ctx = { HTMLDialogElement: Dialog, canAnimate: true, reduced: () => ctx.reduce, blocked: () => false, SP: ' ', reduce: false,
    document: { createElement: el, body: { append: (...k) => appended.push(...k) } }, setTimeout: (fn, ms) => timers.push(ms) };
  vm.runInNewContext('(function(){' + src.slice(0, src.lastIndexOf('})();')) + '})();', ctx);
  const dialog = (cls) => Object.assign(new Dialog(), { open: true, scrollTop: 40, matches: sel => sel === cls, cloneNode: () => el('dialog') });
  const d = dialog('.trip-dialog'); d.close('x');
  assert.equal(closed, 1, 'la vraie fermeture a lieu tout de suite'); assert.equal(d.open, false);
  const [back, ghost] = appended; assert.ok(back && ghost);
  assert.equal(back.className, 'ob-ghost-back'); assert.ok(ghost.classes.has('ob-ghost'));
  for (const k of ['open', 'aria-hidden', 'inert']) assert.ok(k in ghost.attrs, 'copie inerte : ' + k);
  assert.equal(ghost.scrollTop, 40, 'même position de lecture');
  assert.deepEqual(Object.keys(ghost.anims[0].kf[1]).sort(), ['opacity', 'transform']); assert.equal(ghost.anims[0].o.duration, 200);
  assert.equal(back.anims[0].kf[1].opacity, 0, 'le voile s’éclaircit');
  assert.ok(timers.some(ms => ms > 200 && ms <= 260), 'copie retirée juste après');
  /* Autre fenêtre, ou mouvement réduit : fermeture simple. */
  appended.length = 0; dialog('.autre').close(); assert.equal(appended.length, 0);
  ctx.reduce = true; dialog('.trip-dialog').close(); assert.equal(appended.length, 0); assert.equal(closed, 3);
  /* Posée une seule fois. */
  assert.match(src, /if\(!proto\|\|typeof proto\.close!=='function'\|\|proto\.close\.__motion\)return;/);
});

test('vue ouverte dans le même écran (passeport complet, voyage ouvert) : elle arrive par le côté', () => {
  const e = env(), view = e.node('SECTION');
  assert.equal(e.M.enter(view, 1), true);
  const slide = e.anims.find(a => 'transform' in a.frames[0]), fade = e.anims.find(a => 'opacity' in a.frames[0]);
  assert.match(slide.frames[0].transform, /^translate3d\(72px,0,0\)$/, 'en avant : par la droite'); assert.equal(slide.frames[1].transform, 'translate3d(0,0,0)');
  assert.ok(slide.opts.duration <= 380 && fade.opts.duration >= 120 && fade.opts.duration < slide.opts.duration);
  assert.ok(!slide.opts.fill, 'aucun état gardé : le texte revient sur le calque de la page');
  const back = env(); back.M.enter(back.node('SECTION'), -1);
  assert.match(back.anims.find(a => 'transform' in a.frames[0]).frames[0].transform, /^translate3d\(-72px,0,0\)$/, 'en revenant : par la gauche');
  /* Voyage ouvert : ses blocs ont déjà leur entrée en fondu (trips.js), la vue glisse sans second fondu. */
  const trip = env(); assert.equal(trip.M.enter(trip.node('DIV'), 1, false), true);
  assert.equal(trip.anims.length, 1); assert.ok('transform' in trip.anims[0].frames[0]);
  assert.match(js, /requestAnimationFrame\(\(\)=>M\.enter\(document\.getElementById\('tripContent'\),dir,dir<0\)\);/);
  /* Branchements : le Profil demande la vue poussée à motion.js (repli sur son fondu) ; les voyages passent par un clic. */
  assert.match(read('ui-nav.js'), /if\(window\.OceanMotion\?\.enter\?\.\(profile,dir\)\)return;/);
  assert.match(js, /closest\('#tripContent \[data-action=select\],#tripContent \[data-action=overview\]'\)/);
  assert.match(read('trips.js'), /if\(a==='select'\)\{window\.OceanNavigation\?\.begin\(\);selected=id;/, 'trips.js inchangé');
});

/* ---------- Défilement ---------- */
test('grand titre replié en barre : transform et opacity seulement, ressort léger pour le titre de la barre', () => {
  const part = css.slice(css.indexOf('@media(max-width:959px){\n  :root .ocean-v2 .app-page-title'), css.indexOf('@supports (view-timeline:--ob-idea inline)'));
  assert.match(part, /:root \.ocean-v2 \.app-page-title,:root \.ocean-v2 \.pv-chrome-title\{transform:translate3d\(0,12px,0\) scale\(\.9\);transition:opacity var\(--ob-t-fade\) var\(--ob-ease-out\),transform var\(--ob-t-release\) var\(--ob-spring\)\}/);
  assert.match(part, /body\.is-scrolled\.ocean-v2 :is\(\.ac-top,\.exl-head,\.pv-top,\.pv-sub-head,\.as-large\) h1,body\.is-scrolled\.ocean-v2 \.ac-top \.ac-date\{opacity:0;transform:translate3d\(0,-10px,0\) scale\(\.86\)\}/);
  for (const d of [...part.matchAll(/\{([^{}]*)\}/g)].flatMap(m => m[1].split(';')).filter(Boolean)) assert.match(d.split(':')[0].trim(), /^(transform|transform-origin|opacity|transition)$/, d);
  /* Plus précis que la règle de base de la barre, moins que la règle « défilé » : le titre se pose bien à sa place. */
  assert.match(read('app-shell.css'), /body\.is-scrolled \.ocean-v2 \.app-page-title,body\.ocean-v2\.is-scrolled \.app-page-title\{opacity:1;transform:none\}/);
  assert.match(read('ui-nav.css'), /body\.is-scrolled\.pv-sub \.pv-chrome-title\{opacity:1;transform:none\}/);
});

test('double enfoncement évité : les composants de l’interface v2 laissent motion.js jouer l’appui', () => {
  const rule = css.match(/((?:html\.ob-tactile \.ocean-v2 [^,{]+:active,?\s*)+)\{transform:none\}/); assert.ok(rule);
  const list = rule[1].split(',').map(x => x.trim().replace(/^html\.ob-tactile \.ocean-v2 /, '').replace(/:active$/, ''));
  for (const sel of ['.ui-spot', '.ui-btn', '.ui-pill', '.pv-tile', '.tv-idea', '.nav>button[data-s]']) assert.ok(list.includes(sel), sel);
  assert.match(js, /if\(canAnimate\)\{\s*root\.classList\.add\('ob-tactile'\);/, 'classe posée seulement si le script peut animer');
  const e = env(); assert.ok(e.rootClasses.has('ob-tactile'));
});

/* ---------- Coût du style : aucune règle à essayer sur chaque élément ---------- */
test('sélecteurs de la seconde passe : rangés sous une classe, un identifiant ou une balise (jamais « tout élément »)', () => {
  /* Une règle dont le dernier maillon n’a ni classe, ni identifiant, ni balise (par exemple « :is(.a,.b):active ») est
     essayée sur chaque élément à chaque calcul de style. Une première version de cette passe en contenait : l’ouverture
     d’une fiche comptait alors une tâche longue de plus qu’avant (médiane 3 contre 2, CPU x4). Corrigé en même temps
     que la durée du fondu avec le vol de la photo ; les deux causes n’ont pas été mesurées séparément. */
  const fresh = css.slice(css.indexOf('html.ob-tactile .ocean-v2 .ui-spot:active'));
  for (const m of fresh.matchAll(/(?:^|\})\s*([^{}@]+)\{/g)) {
    for (const sel of m[1].split(/,(?![^(]*\))/)) {
      const last = sel.trim().split(/[\s>+~]+(?![^(]*\))/).pop();
      if (/^(from|to|\d+%)$/.test(last)) continue;
      if (sel.trim().startsWith('html.ob-touch :focus-visible')) continue; /* anneau de focus, règle d’avant (les moteurs rangent :focus-visible à part) */
      assert.match(last, /^(?:[a-z][\w-]*|\.[\w-]+|#[\w-]+)/i, 'dernier maillon sans classe ni balise : « ' + sel.trim() + ' »');
    }
  }
});
