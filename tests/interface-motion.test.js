/* Interface : motion et netteté (motion.css, motion.js, règle de mouvement réduit de design.css, go() de app.js).
   - mouvement réduit : plus aucun déplacement, des fondus courts restent ;
   - pas de décalage de mise en page : seuls transform, opacity et les rayons du calque volant sont animés ;
   - compatibilité iOS 16.4 (WKWebView) des règles ajoutées : ni View Transitions, ni @starting-style, ni animation liée
     au défilement, linear() seulement derrière @supports ;
   - netteté : cartes servies à la densité de l’écran, texte jamais laissé sur un calque transformé, flocons hors
     de la planète d’Explorer. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const motionCss = read('motion.css'), motionJs = read('motion.js'), design = read('design.css'), app = read('app.js'), noel = read('noel.css');
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

/* Corps d’un bloc CSS à partir de son ouverture (accolades équilibrées). */
function block(css, start) {
  const open = css.indexOf('{', start); let depth = 0;
  for (let i = open; i < css.length; i++) { if (css[i] === '{') depth++; else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i); }
  throw new Error('bloc non fermé');
}
function keyframes(css) {
  const out = {};
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
    const body = block(css, m.index);
    out[m[1]] = [...body.matchAll(/\{([^{}]*)\}/g)].flatMap(x => x[1].split(';').map(d => d.split(':')[0].trim()).filter(Boolean));
  }
  return out;
}

/* ---------- Mouvement réduit ---------- */
const reduceMedia = block(design, design.indexOf('@media(prefers-reduced-motion:reduce){*,') >= 0 ? design.indexOf('@media(prefers-reduced-motion:reduce){*,') : design.indexOf('@media(prefers-reduced-motion:reduce){\n  *,'));
const reduceClass = design.slice(design.indexOf('.reduce-motion *,.reduce-motion *::before'), design.indexOf('/* Final interaction and responsive refinements. */'));

test('mouvement réduit : la règle générale ne coupe plus les fondus, seulement les déplacements', () => {
  for (const [nom, css] of [['réglage du téléphone', reduceMedia], ['réglage de l’app', reduceClass]]) {
    assert.doesNotMatch(css, /transition:none/, nom + ' : plus de transition:none global');
    const props = css.match(/transition-property:([^;!]+)!important/);
    assert.ok(props, nom + ' : propriétés de transition restreintes');
    const list = props[1].split(',').map(s => s.trim());
    assert.ok(list.includes('opacity'), nom + ' : l’opacité garde sa transition');
    for (const moving of ['transform', 'translate', 'scale', 'rotate', 'top', 'left', 'right', 'bottom', 'width', 'height', 'margin', 'padding', 'all', 'inset', 'max-height', 'grid-template-rows'])
      assert.ok(!list.includes(moving), nom + ' : « ' + moving + ' » ne transite plus');
    const dur = css.match(/transition-duration:([\d.]+)s!important/);
    assert.ok(dur && +dur[1] > 0 && +dur[1] <= 0.2, nom + ' : fondu court (200 ms au plus)');
    assert.match(css, /animation:none!important/, nom + ' : les animations qui bougent sont coupées');
    assert.match(css, /scroll-behavior:auto!important/, nom);
  }
});

test('mouvement réduit : les seules animations gardées sont des fondus purs de 160 ms', () => {
  const kf = keyframes(motionCss);
  assert.deepEqual(kf['ob-fade-in'], ['opacity']);
  assert.deepEqual(kf['ob-fade-out'], ['opacity']);
  for (const css of [reduceMedia, reduceClass]) {
    const kept = [...css.matchAll(/animation:([^;}]+)!important/g)].map(m => m[1].trim()).filter(v => v !== 'none');
    assert.ok(kept.length >= 2, 'des fondus sont gardés');
    for (const v of kept) assert.match(v, /^ob-fade-(in|out) \.16s ease-out (backwards|forwards)$/, 'fondu pur : ' + v);
    for (const sel of ['.quiz-modal.open', '#detail .dcat', '.obf-zone:not([hidden])', '.cult-sheet.is-in', '.ob-fade'])
      assert.ok(css.includes(sel), 'fondu gardé pour ' + sel);
  }
});

test('mouvement réduit : motion.js ne lance ni vol de photo, ni pastille, ni glissement de replis', () => {
  const guards = (motionJs.match(/reduced\(\)/g) || []).length;
  assert.ok(guards >= 6, 'chaque mouvement consulte reduced() (' + guards + ')');
  assert.match(motionJs, /if\(!t\|\|!h\|\|!canAnimate\|\|performance\.now\(\)-t\.at>1500\|\|\(t\.id&&t\.id!==id\)\|\|reduced\(\)\|\|blocked\(\)\)return original\.apply/, 'ouverture de fiche : pas de vol en mouvement réduit');
  assert.match(motionJs, /const calm=!canAnimate\|\|reduced\(\)\|\|blocked\(\)/, 'go : ni pastille ni retour de photo');
  assert.match(motionJs, /if\(!t\|\|!canAnimate\|\|reduced\(\)\)return;/, 'replis : pas de glissement');
});

/* go() réel, avec un DOM minimal (même principe que tests/activity-transition.test.js). */
function navigationEnv({ reduce = false, restore = null } = {}) {
  const section = app.slice(app.indexOf('function resetScreenLive('), app.indexOf('function countUp('));
  const elements = {}; let timeout = null; const frames = [], anims = [];
  const make = (id, classes = []) => { const set = new Set(classes); const el = { id, style: {}, classList: { add: (...c) => c.forEach(x => set.add(x)), remove: (...c) => c.forEach(x => set.delete(x)), contains: c => set.has(c) }, contains: () => false, focus() {}, get active() { return set.has('active'); } };
    el.animate = (kf, opts) => { const a = { id, frames: kf, opts, cancel() {} }; anims.push(a); return a; }; return el; };
  for (const id of ['home', 'detail', 'profile']) elements[id] = make(id, id === 'home' ? ['active'] : []);
  const wrap = make('screenWrap'); wrap.scrollTop = 0; wrap.querySelectorAll = () => Object.values(elements).filter(x => x.active); elements.screenWrap = wrap;
  const context = { window: { OceanNavigation: { begin() {}, settled() {}, restoreScroll: () => restore }, dispatchEvent() {} },
    document: { body: { dataset: {}, classList: { contains: c => reduce && c === 'reduce-motion' } }, getElementById: id => elements[id], querySelector: () => elements.home, querySelectorAll: () => [] },
    CustomEvent: class {}, getComputedStyle: () => ({ paddingTop: '8px', paddingLeft: '16px', paddingRight: '16px', maxWidth: '1240px' }),
    setTimeout: fn => { timeout = fn; return 1; }, clearTimeout: () => { timeout = null; }, requestAnimationFrame: fn => frames.push(fn), HEADBUB: {}, SCREEN_ORDER: { home: 0, detail: 2, profile: 4 }, vibrate() {}, bubbles() {}, animateCounts() {}, renderProfile() {} };
  vm.runInNewContext(section + ';this.navigate=go;', context);
  return { elements, wrap, anims, go: context.navigate, drain() { while (frames.length) frames.shift()(); timeout?.(); } };
}

test('mouvement réduit : go() passe d’un écran à l’autre en fondu enchaîné de 160 ms, sans aucun glissement', () => {
  const e = navigationEnv({ reduce: true }); e.go('profile');
  assert.equal(e.elements.home.active, true, 'l’ancien écran reste dessous pendant le fondu (pas d’écran vide)');
  assert.ok(e.anims.length >= 2);
  assert.ok(e.anims.every(a => a.frames.every(f => Object.keys(f).every(k => k === 'opacity'))), 'opacité seulement');
  assert.ok(e.anims.every(a => a.opts.duration <= 160), '160 ms au plus');
  e.drain(); assert.equal(e.elements.home.active, false); assert.equal(e.elements.profile.active, true);
});

test('mouvement normal : go() garde son glissement court, en transform et opacity seulement', () => {
  const e = navigationEnv(); e.go('profile');
  assert.ok(e.anims.some(a => 'transform' in a.frames[0]), 'glissement présent');
  assert.ok(e.anims.every(a => a.frames.every(f => Object.keys(f).every(k => k === 'transform' || k === 'opacity'))));
  assert.ok(e.anims.every(a => a.opts.duration <= 350));
});

/* ---------- Retour arrière : au bon endroit du défilement ---------- */
test('retour arrière : l’écran retrouvé s’affiche dès le début à sa position de défilement', () => {
  const nav = read('navigation.js');
  assert.match(nav, /restoreScroll:\(\)=>restoring&&restoreTarget\?Math\.max\(0,Number\(restoreTarget\.scroll\)\|\|0\):null/);
  const e = navigationEnv({ restore: 956 }); e.go('profile');
  assert.equal(e.wrap.scrollTop, 956, 'position posée dès le début de la transition (avant : 0, puis saut à la fin)');
  assert.equal(e.elements.home.style.top, 'calc(8px + 956px)', 'l’écran qui part reste là où on le regardait');
  e.drain(); assert.equal(e.wrap.scrollTop, 956, 'pas de retour en haut en fin de transition');
  const f = navigationEnv(); f.go('profile'); assert.equal(f.wrap.scrollTop, 0); assert.equal(f.elements.home.style.top, '8px');
});

/* ---------- Pas de décalage de mise en page ---------- */
const LAYOUT = /^(width|height|min-|max-|top|left|right|bottom|inset|margin|padding|font|line-height|grid|flex|gap|border-width|display)/;
test('motion.css : les images clés n’animent que transform et opacity', () => {
  const kf = keyframes(motionCss);
  assert.ok(Object.keys(kf).length >= 6);
  for (const [name, props] of Object.entries(kf))
    for (const p of props) assert.ok(p === 'opacity' || p === 'transform', `@keyframes ${name} : ${p}`);
});

test('motion.css : aucune transition sur une propriété de mise en page', () => {
  for (const m of noComments(motionCss).matchAll(/transition:([^;}]+)/g)) {
    for (const part of m[1].split(/,(?![^(]*\))/)) {
      const prop = part.trim().split(/\s+/)[0];
      assert.ok(!LAYOUT.test(prop) && prop !== 'all', 'transition sur « ' + prop + ' »');
    }
  }
});

test('motion.js : les animations ne portent que sur transform, opacity et le rayon du calque volant', () => {
  const keys = new Set([...noComments(motionJs).matchAll(/\{(transform|opacity|borderRadius|width|height|top|left|right|bottom|margin\w*|padding\w*|maxHeight|gridTemplateRows)\s*:/g)].map(m => m[1]));
  assert.deepEqual([...keys].sort(), ['borderRadius', 'opacity', 'transform']);
  /* Le calque volant est hors flux et ne retient aucun toucher. */
  assert.match(motionCss, /\.ob-zoom\{position:fixed;[^}]*pointer-events:none/);
  assert.match(motionCss, /\.ob-tab-ink\{position:absolute;[^}]*pointer-events:none/);
});

test('« Avant d’y aller » : l’attente est un habillage de hauteur fixe, le mot reste pour les lecteurs d’écran', () => {
  assert.match(read('spot-before.js'), /db-v db-wait">Chargement…</, 'le mot est toujours dans la page');
  const rule = motionCss.match(/#detail \.db-v\.db-wait\{([^}]+)\}/); assert.ok(rule);
  assert.match(rule[1], /color:transparent/); assert.doesNotMatch(rule[1], /display|height:(?!18px)|font-size/);
  const bar = motionCss.match(/#detail \.db-v\.db-wait::before\{([^}]+)\}/); assert.ok(bar);
  assert.match(bar[1], /position:absolute/, 'la barre est hors flux : rien ne bouge quand la valeur arrive');
});

/* ---------- Compatibilité iOS 16.4 (WKWebView) ---------- */
test('iOS 16.4 : ni View Transitions, ni @starting-style, ni animation liée au défilement dans le système de motion', () => {
  for (const [nom, src] of [['motion.css', motionCss], ['motion.js', motionJs], ['mouvement réduit (design.css)', reduceMedia + reduceClass]]) {
    const code = noComments(src);
    assert.doesNotMatch(code, /view-transition|startViewTransition|viewTransitionName/i, nom + ' : View Transitions (Safari 18)');
    assert.doesNotMatch(code, /@starting-style/, nom + ' : @starting-style (Safari 17.5)');
    assert.doesNotMatch(code, /animation-timeline|scroll-timeline|view-timeline|animation-range/, nom + ' : animations liées au défilement');
    assert.doesNotMatch(code, /@container|transition-behavior|allow-discrete|interpolate-size|calc-size/, nom + ' : CSS trop récent');
  }
  assert.doesNotMatch(noComments(motionCss), /:has\(/, 'motion.css : pas de :has()');
});

test('iOS 16.4 : linear() seulement derrière @supports, avec une courbe de Bézier en repli', () => {
  const css = noComments(motionCss);
  const i = css.indexOf('@supports (transition-timing-function:linear(0,1))'); assert.ok(i > 0);
  const guarded = block(css, i), rest = css.replace('@supports (transition-timing-function:linear(0,1))', '').replace(guarded, '');
  assert.doesNotMatch(rest, /linear\(/, 'linear() hors de @supports');
  assert.match(rest, /--ob-snap:cubic-bezier\(/); assert.match(rest, /--ob-spring:cubic-bezier\(/);
  /* motion.js : courbe linear() seulement si le navigateur la comprend ; le vol de la photo écrit les points du
     ressort en images clés et garde la courbe « linear ». */
  assert.match(motionJs, /M\.snap=linearOK\?'linear\('\+SNAP\.join\(','\)\+'\)':'cubic-bezier\(\.2,\.9,\.25,1\)'/);
  assert.match(motionJs, /const opt=\{duration:ZOOM_MS,easing:'linear',fill:'both'\}/);
  assert.match(motionJs, /const canAnimate=typeof Element!=='undefined'&&typeof Element\.prototype\.animate==='function'/);
});

test('polish.css : la parallaxe liée au défilement reste derrière @supports (repli en script)', () => {
  const polish = noComments(read('polish.css'));
  const i = polish.indexOf('@supports (animation-timeline:--ob-wrap)'); assert.ok(i > 0);
  const body = block(polish, i), outside = polish.slice(0, i) + polish.slice(polish.indexOf(body, i) + body.length);
  assert.match(body, /animation-timeline:--ob-wrap/);
  assert.doesNotMatch(outside, /animation-timeline:/, 'animation-timeline hors de @supports');
  assert.match(read('polish.js'), /if \(cssParallax \|\| document\.body\.dataset\.screen !== 'detail' \|\| calm\(\)\) return;/, 'repli en script quand le navigateur ne sait pas');
});

/* ---------- Netteté ---------- */
test('netteté : aucun bloc d’écran ne reste sur un calque transformé après son entrée', () => {
  assert.match(read('base.css'), /\.screen\.active>\*\{animation:fadeUp \.55s both/, 'règle d’origine (état final gardé)');
  assert.match(motionCss, /\.screen\.active>\*,\.ocean-hub\{animation-fill-mode:backwards\}/, 'corrigée : l’état final n’est plus gardé');
  const order = [...read('index.html').matchAll(/href="([\w-]+\.css)/g)].map(m => m[1]);
  assert.ok(order.indexOf('motion.css') > order.indexOf('base.css') && order.indexOf('motion.css') > order.indexOf('ocean-hub.css'), 'motion.css passe après');
});

test('netteté : les cartes prennent la photo entière quand l’écran le demande, la vignette sinon', () => {
  const Photos = require('../spot-photos.js')({}, {});
  assert.equal(Photos.sharp({ src: 'assets/spots/a-cover.webp', thumb: 'assets/spots/thumbs/a.webp', width: 1600 }, '432px'),
    ' srcset="assets/spots/thumbs/a.webp 640w,assets/spots/a-cover.webp 1600w" sizes="432px"');
  assert.equal(Photos.sharp({ src: 'assets/spots/a.webp', thumb: 'assets/spots/thumbs/a.webp', w: 1280 }, '335px'),
    ' srcset="assets/spots/thumbs/a.webp 640w,assets/spots/a.webp 1280w" sizes="335px"', 'largeur lue dans w (accueil, cultures)');
  assert.equal(Photos.sharp({ src: 'x.webp', thumb: 'x.webp' }, '432px'), '', 'pas de vignette distincte : rien');
  assert.equal(Photos.sharp(null, '432px'), '');
  assert.match(Photos.sharp({ src: 'a"b.webp', thumb: 't.webp' }, '1px'), /a&#34;b\.webp 1280w/, 'adresse échappée, largeur par défaut');
  const home = read('home-feed.js');
  assert.match(home, /<img src="\$\{esc\(big\?p\.src:p\.thumb\)\}"\$\{big\?'':sharp\(p,'432px'\)\} alt="" loading="lazy" decoding="async">/, 'carte : vignette par défaut, lazy');
  assert.match(home, /\$\{pp\?sharp\(pp,'300px'\):''\} alt="" loading="lazy" decoding="async">/, 'tuiles d’ambiance');
  assert.match(read('cultures-boot.js'), /\$\{window\.OceanPhotos\?\.sharp\?\.\(c\.p,'335px'\)\|\|''\} alt="" loading="lazy"/);
  assert.match(read('cultures.js'), /\$\{window\.OceanPhotos\?\.sharp\?\.\(x\.p,'344px'\)\|\|''\} alt="" loading="lazy" decoding="async"/);
  assert.match(read('spot-experience.js'), /\$\{window\.OceanPhotos\?\.sharp\?\.\(image,'400px'\)\|\|''\} alt="" loading="lazy"/);
  /* Rien de plus au démarrage : la grande photo du haut de l’accueil reste la seule en priorité haute. */
  assert.equal((home.match(/fetchpriority="high"/g) || []).length, 1);
  /* Le jeu : canevas des personnages dessiné à la densité de l’écran. */
  assert.match(read('surf-tab.js'), /const px=Math\.min\(Math\.round\(cell\),Math\.round\(96\*\(window\.devicePixelRatio\|\|1\)\)\);/);
});

test('traductions : aucun texte perdu ni fragment technique ajouté par la motion', () => {
  const fr = JSON.parse(read('locales/source/fr.json'));
  const keys = Array.isArray(fr) ? fr : Object.keys(fr);
  assert.ok(keys.includes('{3} spots'), 'la clé des tuiles d’ambiance est intacte');
  for (const k of keys) assert.ok(!/srcset=|scaleX\(|^px[,)]|\] img/.test(k), 'fragment technique dans les textes à traduire : ' + k);
});

test('netteté : le thermomètre du héros prend la couleur du texte de sa pastille', () => {
  assert.match(read('app-shell.css'), /\.ocean-v2 #detail \.detail-hero \.dfact \.sd-ic\{color:inherit\}/);
});

/* ---------- Noël ---------- */
test('Noël : pas de flocons sur la planète d’Explorer, pas de guirlande dans le grand titre', () => {
  assert.match(noel, /html\.ob-noel:has\(body\[data-screen="spots"\]\)::after\{display:none\}/);
  assert.match(noel, /html\.ob-noel body:not\(\.is-scrolled\) \.app-chrome::after\{display:none\}/);
});
