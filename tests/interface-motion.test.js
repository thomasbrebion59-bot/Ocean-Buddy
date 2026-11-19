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
  /* Plus de calque de neige sur la page : flocons et houx posés seulement au-dessus des titres de l’accueil (#home). */
  const css = noel.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(css, /html\.ob-noel(?::has\([^)]*\))?::after/);
  for (const m of css.matchAll(/([^{}]+)\{[^{}]*var\(--noel-(?:snow|holly)\)/g)) for (const sel of m[1].split(',')) assert.match(sel.trim(), /^html\.ob-noel #home /);
  assert.match(noel, /html\.ob-noel body:not\(\.is-scrolled\) \.app-chrome::after\{display:none\}/);
});

/* ---------- Vol de la photo (carte vers fiche) : départ différé et robustesse ---------- */
function flightEnv({ failAt = 0 } = {}) {
  const src = motionJs.slice(motionJs.indexOf('  let flight=null;'), motionJs.indexOf('  /* Carte du spot dans l’écran retrouvé'));
  const consts = motionJs.match(/const SNAP=\[[^\]]+\];/)[0] + motionJs.match(/const ZOOM_MS=\d+,TAB_MS=\d+,FOLD_MS=\d+,SP=String\.fromCharCode\(32\);/)[0];
  let created = 0; const anims = [], frames = [], timers = [];
  const el = tag => ({
    tag, style: {}, children: [], parentNode: null, nextSibling: null, isConnected: true, removed: false, className: '',
    classList: { add() {}, remove() {}, contains: () => false }, setAttribute() {},
    append(...kids) { for (const k of kids) { if (k.parentNode) k.parentNode.children = k.parentNode.children.filter(c => c !== k); k.parentNode = this; this.children.push(k); } },
    insertBefore(k) { this.append(k); }, after() {}, remove() { this.removed = true; },
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 420, bottom: 450, width: 420, height: 450 }),
    animate() {
      if (++created === failAt) throw new Error('animation refusée');
      const a = { paused: 0, played: 0, cancelled: 0, pause() { this.paused++; }, play() { this.played++; }, cancel() { this.cancelled++; }, finished: new Promise(() => {}) };
      anims.push(a); return a;
    }
  });
  const card = el('div'), img = el('img'); img.naturalWidth = 1200; img.naturalHeight = 800; img.style.objectPosition = '40% 60%'; card.append(img);
  img.getBoundingClientRect = () => ({ left: 25, top: 472, right: 93, bottom: 540, width: 68, height: 68 });
  const hero = el('div'), photo = el('img'), body = el('body'); body.dataset = { screen: 'detail' };
  const context = {
    window: { openSpot: () => 'ouvert' }, performance: { now: () => 1000 },
    document: { createElement: el, body, getElementById: id => (id === 'detailHero' ? hero : id === 'dHeroPhoto' ? photo : null) },
    getComputedStyle: () => ({ backgroundImage: 'none' }),
    requestAnimationFrame: fn => frames.push(fn),
    setTimeout: (fn, ms) => { timers.push(ms); return timers.length; }, clearTimeout() {}, setInterval: () => 1, clearInterval() {}
  };
  const prelude = consts + 'const root={classList:{add(){},remove(){}}},M={},canAnimate=true,reduced=()=>false,blocked=()=>false,inView=()=>true,' +
    'objPos=()=>[.5,.5],radii=()=>[0,0,0,0],box=r=>({l:r.left,t:r.top,w:r.width,h:r.height}),lerp=(a,b,t)=>a+(b-a)*t;var tap=null;';
  vm.runInNewContext(prelude + src + ';this.arm=()=>{tap={img:IMG,id:"x",rect:IMG.getBoundingClientRect(),at:1000};};this.wrap=wrapOpenSpot;this.end=endFlight;this.resumeAt=resumeAt;this.snapAt=snapAt;this.backTime=backTime;this.drive=drive;this.setFlight=f=>{flight=f;};', Object.assign(context, { IMG: img }));
  context.wrap();
  return { context, anims, frames, timers, card, img, body };
}

test('vol de la photo : il attend que la fiche soit peinte, puis avance d’image en image sans jamais sauter', () => {
  const env = flightEnv();
  env.context.arm();
  assert.equal(env.context.window.openSpot('x'), 'ouvert');
  assert.equal(env.anims.length, 4, 'les quatre animations du vol sont créées');
  assert.ok(env.anims.every(a => a.paused === 1 && a.played === 0), 'en pause : c’est le pilote qui les fait avancer');
  assert.equal(env.timers.at(-1), 380 + 1200, 'filet si aucune image ne vient');
  const frame = now => { assert.equal(env.frames.length, 1, 'une seule boucle d’images'); env.frames.shift()(now); };
  frame(1000); frame(1250);
  assert.ok(env.anims.every(a => a.currentTime === undefined), 'deux images laissées à la fiche : le calque attend sur la carte');
  frame(1400);
  assert.ok(env.anims.every(a => a.currentTime === 34), 'une image lente de 150 ms ne fait avancer le vol que de 34 ms');
  frame(1416);
  assert.ok(env.anims.every(a => a.currentTime === 50), 'à 60 images par seconde, le vol avance à l’heure réelle');
  let now = 1416, steps = 0, before = 50;
  while (env.frames.length && steps < 200) {
    now += 16; steps++; frame(now);
    const t = env.anims[0].currentTime;
    assert.ok(t - before <= 34 && t >= before, 'aucun saut de plus de 34 ms');
    before = t;
    if (env.anims[0].cancelled) break;
  }
  assert.equal(before, 380, 'le vol va jusqu’au bout');
  assert.ok(env.anims.every(a => a.cancelled === 1), 'atterrissage : les animations sont libérées');
  assert.equal(env.frames.length, 0, 'la boucle d’images s’arrête');
});

test('vol de la photo : interrompu avant son départ, il ne repart pas et la photo est rendue à sa carte', () => {
  const env = flightEnv();
  env.context.arm();
  env.context.window.openSpot('x');
  assert.notEqual(env.img.parentNode, env.card, 'la photo est empruntée par le calque');
  env.context.end();
  assert.equal(env.img.parentNode, env.card, 'photo rendue');
  assert.equal(env.img.style.objectPosition, '40% 60%', 'cadrage d’origine rendu');
  let now = 1000;
  while (env.frames.length) env.frames.shift()(now += 16);
  assert.ok(env.anims.every(a => a.currentTime === undefined), 'aucune avancée après l’interruption');
});

test('vol de la photo : si le moteur refuse une animation, la photo retourne à sa carte et la fiche s’ouvre quand même', () => {
  for (const failAt of [1, 2, 3, 4]) {
    const env = flightEnv({ failAt });
    env.context.arm();
    assert.equal(env.context.window.openSpot('x'), 'ouvert', 'la fiche s’ouvre (échec à l’animation ' + failAt + ')');
    assert.equal(env.img.parentNode, env.card, 'photo rendue à sa carte (échec à l’animation ' + failAt + ')');
    assert.equal(env.img.style.objectPosition, '40% 60%');
    assert.ok(env.body.children.every(c => c.removed), 'aucun calque orphelin dans la page');
  }
});

test('retour pendant le vol d’ouverture : le vol de retour repart de la taille que la photo a déjà', () => {
  const env = flightEnv(), c = env.context;
  assert.equal(c.resumeAt(), 0, 'aucun vol en cours : le retour part du héros');
  c.arm(); c.window.openSpot('x');
  const frame = now => env.frames.shift()(now);
  /* Avant le départ (photo encore sur la carte) : le vol de retour n’a rien à montrer, il commence à sa fin. */
  assert.equal(c.resumeAt(), 380);
  frame(1000); frame(1016); frame(1032); frame(1048); frame(1064); frame(1080);
  const t = env.anims[0].currentTime;
  assert.equal(t, 16 + 16 * 3, 'vol d’ouverture à 64 ms');
  const at = c.resumeAt(), p = c.snapAt(t);
  assert.ok(p > .3 && p < .6, 'photo à mi-chemin : ' + p);
  assert.ok(at > 0 && at < 380);
  assert.ok(Math.abs((1 - c.snapAt(at)) - p) < .002, 'même taille au départ du retour : ' + (1 - c.snapAt(at)) + ' contre ' + p);
  /* Aller et retour : la correspondance tient sur toute la courbe, sans jamais dépasser la durée du vol. */
  for (let ms = 0; ms <= 380; ms += 5) {
    const b = c.backTime(c.snapAt(ms));
    assert.ok(b >= 0 && b <= 380);
    assert.ok(Math.abs((1 - c.snapAt(b)) - c.snapAt(ms)) < .002, 'à ' + ms + ' ms');
  }
  /* Le pilote démarre à cet instant, dès la pose du calque (aucune image au héros plein cadre). */
  const anims = [0, 1].map(() => ({ pause() { this.paused = true; }, cancel() {} }));
  const f = { anims, open: false, t: 0 }; let landed = 0;
  c.setFlight(f); env.frames.length = 0;
  c.drive(f, () => { landed++; }, 1, at);
  assert.ok(anims.every(a => a.paused && a.currentTime === at), 'calque posé à l’instant repris');
  frame(2000); assert.ok(anims.every(a => a.currentTime === at), 'une image d’attente, sans bouger');
  frame(2016); assert.ok(anims.every(a => a.currentTime === at + 16), 'puis il avance d’image en image');
  assert.equal(landed, 0);
  /* Fiche posée (le calque sert de doublure, plus d’animation) : un retour repart du héros, comme avant. */
  c.setFlight({ anims: [], open: true, t: 380 });
  assert.equal(c.resumeAt(), 0);
  /* motion.js : l’instant est lu avant que le vol en cours soit arrêté, et passé au pilote du retour. */
  const go = motionJs.slice(motionJs.indexOf('  function wrapGo(){'), motionJs.indexOf('  /* ================= Onglets de la fiche'));
  assert.ok(go.indexOf('resumeAt()') > 0 && go.indexOf('resumeAt()') < go.indexOf('if(!nested)endFlight();'), 'lu avant endFlight');
  assert.match(go, /drive\(f,land,1,at\);/);
});

test('anneau de focus : masqué après un toucher, entier dès que le clavier sert, jamais sur les champs', () => {
  const src = motionJs.slice(motionJs.indexOf('  const FOCUS_KEYS='), motionJs.indexOf('  function wrapAll(){'));
  const classes = new Set(), on = {};
  const ctx = { root: { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } }, window: { addEventListener: (n, fn, o) => { on[n] = { fn, o }; } } };
  vm.runInNewContext(src, ctx);
  assert.ok(on.pointerdown.o.capture && on.keydown.o.capture, 'en phase de capture : avant tout arrêt de propagation');
  assert.ok(!classes.has('ob-touch'), 'au départ (clavier possible) : anneaux visibles');
  on.pointerdown.fn({ pointerType: 'touch', isPrimary: true });
  assert.ok(classes.has('ob-touch'), 'un toucher : anneaux masqués');
  for (const key of ['a', 'Enter', ' ', 'Escape', 'Backspace']) { on.keydown.fn({ key }); assert.ok(classes.has('ob-touch'), 'saisie ou validation, pas un déplacement : ' + key); }
  on.keydown.fn({ key: 'Tab' });
  assert.ok(!classes.has('ob-touch'), 'Tab : anneaux de retour');
  on.pointerdown.fn({ pointerType: 'mouse', isPrimary: true }); assert.ok(classes.has('ob-touch'));
  on.keydown.fn({ key: 'ArrowDown' }); assert.ok(!classes.has('ob-touch'), 'flèches : anneaux de retour');
  on.pointerdown.fn({ pointerType: 'touch', isPrimary: false }); assert.ok(!classes.has('ob-touch'), 'second doigt ignoré');
  /* CSS : seule la couleur de l’anneau s’efface (aucune règle d’anneau n’est retirée), et pas sur les champs. */
  const css = read('motion.css');
  const rule = css.match(/html\.ob-touch :focus-visible([^{]*)\{([^}]*)\}/);
  assert.ok(rule, 'règle présente');
  assert.equal(rule[2], 'outline-color:transparent!important');
  for (const field of ['input', 'textarea', 'select', '[contenteditable]']) assert.ok(rule[1].includes(':not(' + field + ')'), 'champ épargné : ' + field);
  assert.doesNotMatch(css + read('design.css'), /:focus-visible[^{]*\{[^}]*outline:\s*(0|none)\b/, 'aucun anneau supprimé pour le clavier');
});
