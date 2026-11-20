/* Interface v2, barre d’onglets et Profil (maquette validée le 19 novembre 2026).
   - la barre a quatre onglets, Accueil, Explorer, Voyages, Profil ; Jeu et Défis s’ouvrent depuis Profil > Jouer et
     gardent le Profil comme onglet actif ;
   - le Profil court suit la maquette (mon niveau, mes spots, jouer, passeport, réglages), sans grande affiche ni sur-titre ;
   - le sélecteur de niveau écrit le même réglage que les Réglages (chooseMyLevel) ;
   - aucun texte en dur hors de la chaîne de traduction ; mouvements en transform et opacity, coupés en mouvement réduit. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { read } = require('./src-extract.cjs');

const html = read('index.html'), app = read('app.js'), shell = read('app-shell.js'), design = read('design.js');
const js = read('ui-nav.js'), css = read('ui-nav.css');
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const profile = html.slice(html.indexOf('<section class="screen" id="profile">'), html.indexOf('<!-- ============ JEU'));
/* Profil court : tout ce qui précède le passeport complet. */
const short = profile.slice(0, profile.indexOf('<!-- Passeport complet'));
/* Découpe une liste séparée par des virgules sans couper dans les parenthèses (var(--x,cubic-bezier(…))). */
function splitTop(list) {
  const out = []; let depth = 0, cur = '';
  for (const ch of list) { if (ch === '(') depth++; else if (ch === ')') depth--; if (ch === ',' && !depth) { out.push(cur); cur = ''; } else cur += ch; }
  out.push(cur); return out.map(x => x.trim()).filter(Boolean);
}

/* ---------- Barre d’onglets ---------- */
test('barre d’onglets : quatre onglets dans l’ordre Accueil, Explorer, Voyages, Profil ; plus de Jeu ni de Défis', () => {
  const navAt = html.indexOf('<nav class="nav"'), nav = html.slice(navAt, html.indexOf('</nav>', navAt));
  assert.deepEqual([...nav.matchAll(/data-s="(\w+)"/g)].map(m => m[1]), ['home', 'spots', 'trips', 'profile', 'community']);
  const tabs = shell.slice(shell.indexOf('const TABS={'), shell.indexOf('for(const b of $$('));
  assert.deepEqual([...tabs.matchAll(/^\s{4}(\w+):\{label:'([^']+)'/gm)].map(m => m[1] + ':' + m[2]), ['home:Accueil', 'spots:Explorer', 'trips:Voyages', 'profile:Profil']);
  assert.match(shell, /\['home','spots','trips','profile'\]\.forEach/);
  assert.doesNotMatch(shell, /TAB_PIC|tab-pic/, 'pictogrammes au trait, plus de silhouettes en masque');
  for (const m of tabs.matchAll(/off:'([^']+)'/g)) assert.doesNotMatch(m[1], /fill=/, 'pictogramme au repos : tracé seul');
  assert.match(tabs, /spots:\{label:'Explorer',off:'<circle cx="11" cy="11" r="6\.6"\/>/, 'Explorer : une loupe');
});

test('menu latéral (ordinateur) : les quatre mêmes entrées ; Communauté rangée en bas avec les Réglages', () => {
  assert.match(design, /profile:'Profil'/);
  assert.doesNotMatch(design, /insertBefore\(\$\('\.n-trips'/);
  assert.match(design, /const c=\$\('\.n-community',nav\),s=\$\('\.sidebar-settings',nav\);if\(c&&s\)\{c\.classList\.add\('sidebar-community'\);s\.before\(c\);\}/);
  assert.match(shell, /\$\(`:scope>button\[data-s="\$\{id\}"\]`,nav\)/, 'la coque ne ressort pas Communauté du bas du menu');
  assert.match(css, /@media\(min-width:960px\)\{[\s\S]*\.ocean-v2 \.nav \.sidebar-community\{/);
});

/* go() réel, avec un DOM minimal (même principe que tests/interface-motion.test.js). */
function navigationEnv({ reduce = false } = {}) {
  const part = app.slice(app.indexOf('function resetScreenLive('), app.indexOf('function countUp('));
  const elements = {}; let timeout = null; const frames = [], anims = [];
  const make = (id, classes = []) => { const set = new Set(classes); const el = { id, style: {}, dataset: {}, classList: { add: (...c) => c.forEach(x => set.add(x)), remove: (...c) => c.forEach(x => set.delete(x)), contains: c => set.has(c), toggle: (c, on) => { on ? set.add(c) : set.delete(c); } }, contains: () => false, focus() {}, get active() { return set.has('active'); } };
    el.animate = (kf, opts) => { const a = { id, frames: kf, opts, cancel() {} }; anims.push(a); return a; }; return el; };
  for (const id of ['home', 'spots', 'trips', 'profile', 'surf', 'challenges', 'detail']) elements[id] = make(id, id === 'home' ? ['active'] : []);
  const buttons = ['home', 'spots', 'trips', 'profile'].map(s => { const b = make('tab-' + s, s === 'home' ? ['active'] : []); b.dataset.s = s; return b; });
  const wrap = make('screenWrap'); wrap.scrollTop = 0; wrap.querySelectorAll = () => Object.values(elements).filter(x => x.active && x.id !== 'screenWrap'); elements.screenWrap = wrap;
  const context = { window: { OceanNavigation: { begin() {}, settled() {}, restoreScroll: () => null }, dispatchEvent() {} },
    document: { body: { dataset: {}, classList: { contains: c => reduce && c === 'reduce-motion' } }, getElementById: id => elements[id] || null, querySelector: () => null, querySelectorAll: s => s === '.nav button' ? buttons : [] },
    CustomEvent: class {}, getComputedStyle: () => ({ paddingTop: '8px', paddingLeft: '16px', paddingRight: '16px', maxWidth: '1240px', display: 'none' }),
    setTimeout: fn => { timeout = fn; return 1; }, clearTimeout: () => { timeout = null; }, requestAnimationFrame: fn => frames.push(fn), HEADBUB: {},
    SCREEN_ORDER: vm.runInNewContext('(' + app.match(/const SCREEN_ORDER=(\{[^}]+\});/)[1] + ')'), vibrate() {}, bubbles() {}, animateCounts() {}, renderProfile() {} };
  vm.runInNewContext(part + ';this.navigate=go;this.tabOf=tabOf;', context);
  const activeTab = () => buttons.filter(b => b.active).map(b => b.dataset.s).join(',');
  return { elements, anims, go: context.navigate, tabOf: context.tabOf, activeTab, drain() { while (frames.length) frames.shift()(); timeout?.(); } };
}

test('Jeu et Défis : ouverts depuis le Profil, l’onglet actif reste le Profil ; les autres écrans gardent le leur', () => {
  const e = navigationEnv();
  assert.equal(e.tabOf('surf'), 'profile'); assert.equal(e.tabOf('challenges'), 'profile');
  for (const s of ['home', 'spots', 'trips', 'profile', 'detail']) assert.equal(e.tabOf(s), s);
  e.go('profile'); e.drain(); assert.equal(e.activeTab(), 'profile');
  e.go('surf'); e.drain(); assert.equal(e.activeTab(), 'profile', 'Jeu : onglet Profil'); assert.equal(e.elements.surf.active, true);
  e.go('profile'); e.drain(); assert.equal(e.activeTab(), 'profile');
  e.go('challenges'); e.drain(); assert.equal(e.activeTab(), 'profile', 'Défis : onglet Profil'); assert.equal(e.elements.challenges.active, true);
  e.go('trips'); e.drain(); assert.equal(e.activeTab(), 'trips');
  /* Menu latéral et barre native iOS lisent aria-current : même règle dans design.js. */
  assert.match(design, /typeof tabOf==='function'\?tabOf\(page\):page/);
});

test('Jeu et Défis : les écrans restent, leurs anciens liens aussi (accueil, Poulpy, réouverture de l’app)', () => {
  assert.match(html, /<section class="screen" id="challenges">/); assert.match(html, /<section class="screen" id="surf"/);
  assert.match(read('navigation.js'), /const screens=\['home','spots','detail','surf','trips','challenges','community','profile'\];/, 'une ancienne session rouverte sur Jeu ou Défis reste valide');
  assert.match(read('home-feed.js'), /if\(surf\)\{go\('surf'\);return;\}/, 'mini-jeu de l’accueil');
  assert.match(app, /onclick:"openFromChat\('challenges'\)"/, 'Poulpy : « Voir mes défis »');
  assert.match(js, /if\(k==='quiz'\)\{if\(typeof openQuiz==='function'\)openQuiz\(\);\}\s*else if\(typeof go==='function'\)go\(k\);/, 'tuiles Jouer : quiz, puis go(surf) et go(challenges)');
  assert.deepEqual([...short.matchAll(/data-pv-play="(\w+)"/g)].map(m => m[1]), ['quiz', 'surf', 'challenges']);
});

test('Retour de Jeu et de Défis : il mène au Profil (par l’historique s’ils en viennent)', () => {
  assert.match(js, /if\(fromProfile&&window\.OceanNavigation\?\.index\?\.\(\)>0\)window\.OceanNavigation\.back\(\);\s*else if\(typeof go==='function'\)go\('profile'\);/);
  assert.match(js, /if\(SUB\[to\]&&to!==last\)fromProfile=last==='profile';/);
  assert.match(js, /back\.id='pvBack';back\.className='app-back';back\.hidden=true;/, 'bouton Retour de la barre du haut, caché ailleurs');
  /* Retour du téléphone ou du navigateur : le passeport complet se referme d’abord (app-shell.js). */
  assert.match(shell, /if\(body\.dataset\.screen==='profile'&&window\.OceanProfile\?\.isFullOpen\?\.\(\)\)\{window\.OceanProfile\.closeFull\(\);return true;\}/);
});

/* ---------- Changement d’onglet : fondu court ---------- */
test('changement d’onglet : fondu de 160 à 220 ms, en transform et opacity seulement ; la fiche garde sa poussée', () => {
  const e = navigationEnv(); e.go('profile');
  assert.ok(e.anims.length >= 3);
  for (const a of e.anims) for (const f of a.frames) for (const k of Object.keys(f)) assert.ok(k === 'transform' || k === 'opacity', 'propriété animée : ' + k);
  const fades = e.anims.filter(a => 'opacity' in a.frames[0]).map(a => a.opts.duration);
  assert.ok(fades.length === 2 && fades.every(d => d >= 160 && d <= 220), 'fondus : ' + fades.join(', ') + ' ms');
  assert.ok(e.anims.every(a => a.opts.duration <= 220), 'rien ne dépasse 220 ms');
  const slide = e.anims.find(a => a.id === 'profile' && 'transform' in a.frames[0]);
  assert.match(slide.frames[0].transform, /^translate3d\(10px,0,0\)$/, 'déplacement de 10 px seulement');
  e.drain();
  const f = navigationEnv(); f.go('detail');
  assert.ok(f.anims.some(a => a.opts.duration === 340), 'fiche : 340 ms');
  const r = navigationEnv({ reduce: true }); r.go('profile');
  assert.ok(r.anims.every(a => a.frames.every(fr => Object.keys(fr).every(k => k === 'opacity')) && a.opts.duration <= 160), 'mouvement réduit : fondu seul, 160 ms');
});

test('indicateur coulissant : motion.js inchangé le trouve avec quatre onglets ; ui-nav.css lui donne la pastille de l’onglet actif', () => {
  const motion = read('motion.js');
  assert.match(motion, /nav=document\.querySelector\('\.ocean-v2 \.nav'\);\s*const a=nav&&nav\.querySelector\('button\[data-s\]\.active'\),b=nav&&nav\.querySelector\('button\[data-s="'\+s\+'"\]'\);/);
  assert.match(motion, /if\(a&&b&&a!==b&&a\.getClientRects\(\)\.length&&b\.getClientRects\(\)\.length\)/, 'Jeu et Défis n’ont pas de bouton : pas de trajet vers eux');
  const pill = css.match(/\.ocean-v2 \.nav\.ob-tab-move>\.nav-pill\{([^}]+)\}/);
  assert.ok(pill, 'pastille en mouvement stylée par ui-nav.css');
  const rest = css.match(/\.ocean-v2 \.nav>button\[data-s\]\.active,\.ocean-v2 \.nav>button\[aria-current=page\]\{([^}]+)\}/);
  assert.ok(rest, 'onglet actif');
  const bg = s => s.match(/background:([^;!]+)/)[1];
  assert.equal(bg(pill[1]), bg(rest[1]), 'même fond au repos et en mouvement');
  assert.match(rest[1], /color:var\(--t-main\)!important/, 'onglet actif dans le bleu de l’app');
  /* Les règles de motion.css (plus précises) doivent garder la main pendant le trajet : mêmes sélecteurs qu’app-shell.css. */
  assert.doesNotMatch(noComments(css), /body\.ocean-v2 \.nav>button/);
  assert.ok(html.indexOf('href="ui-nav.css') > html.indexOf('href="motion.css'), 'ui-nav.css après motion.css');
});

/* ---------- Profil court ---------- */
test('Profil : titre et avatar, puis mon niveau, mes spots, jouer, passeport, réglages, dans cet ordre', () => {
  const at = s => { const i = short.indexOf(s); assert.ok(i > 0, 'présent : ' + s); return i; };
  const order = ['<h1 class="pv-h1"', 'class="ph-avatar"', 'id="pvLevelT">Mon niveau', 'id="pvSeg"', 'id="pvSpotsT">Mes spots', 'id="pvTabFav"', 'id="pvTabBeen"', 'id="pvSpots"', 'id="pvPlayT">Jouer', 'id="pvPassT">Passeport', 'id="pvPassAll">Voir tout', 'id="pvMap"', 'id="pvNCountries"', 'id="pvNSpots"', 'id="pvNTrophies"', 'id="pvSettings"', 'id="pvHelp"'].map(at);
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.match(short, /<span class="ph-avatar"><svg viewBox="0 0 140 140" id="octoProfile"><\/svg><\/span>/, 'avatar : .ph-avatar (le bonnet de Noël s’y pose)');
  assert.deepEqual([...short.matchAll(/role="radio" aria-checked="false" data-lvl="(\w+)">([^<]+)</g)].map(m => m[1] + ':' + m[2]), ['debutant:Débutant', 'intermediaire:Intermédiaire', 'expert:Expert']);
  assert.match(short, /id="profMine" onclick="openSettings\('sport'\)"/, 'le sport se change par le choix existant');
  assert.match(short, /<a class="pv-row" id="pvHelp" href="support\.html"/, 'Aide : la page d’assistance existante');
  assert.doesNotMatch(short, /Notifications/, 'pas de ligne Notifications : ce réglage n’existe pas');
});

test('Profil, Défis et Jeu : plus de grande affiche ni de sur-titre en capitales', () => {
  for (const gone of ['id="profTop"', 'prof-hero', 'id="chalTop"', 'class="sf-hero"', 'ph-chips', 'id="profXpFill"', 'class="prof-settings"'])
    assert.ok(!html.includes(gone), 'retiré : ' + gone);
  const large = shell.slice(shell.indexOf('const LARGE={'), shell.indexOf('function largeTitles()'));
  assert.doesNotMatch(large, /^\s*(profile|surf|challenges):/m, 'pas de grand titre à sur-titre pour ces écrans');
  assert.doesNotMatch(design, /TON AVENTURE|À TOI DE JOUER|chalTop|profTop/);
  assert.doesNotMatch(read('passport.js'), /pp-head|pp-stamp|Ocean Buddy · Passeport/, 'passeport : plus de grande affiche');
  for (const id of ['challenges', 'surf']) {
    const a = html.indexOf(`<section class="screen" id="${id}"`), head = html.slice(a, a + 420);
    assert.match(head, /<header class="pv-sub-head"><h1 tabindex="-1"( data-i18n)?>[^<]+<\/h1>/, id + ' : en-tête simple');
  }
  assert.match(profile, /<header class="pv-sub-head" id="pvFullHead"><h1 tabindex="-1">Passeport<\/h1><\/header>/);
  assert.doesNotMatch(noComments(css), /text-transform:uppercase/);
  assert.match(css, /\.ocean-v2 #challenges \.poulpy-eco-banner \.section-kicker\{display:none\}/);
});

test('niveau : le sélecteur à trois segments écrit le même réglage que les Réglages (chooseMyLevel, saveState)', () => {
  assert.match(js, /function pickLevel\(id\)\{if\(typeof chooseMyLevel==='function'\)chooseMyLevel\(id\);renderLevel\(\);\}/);
  assert.doesNotMatch(noComments(js), /chosenLevel\s*=[^=]/, 'ui-nav.js n’écrit jamais chosenLevel lui-même');
  assert.doesNotMatch(noComments(js), /localStorage|saveState/, 'ni stockage à part');
  const fn = app.slice(app.indexOf('function chooseMyLevel(id){'), app.indexOf('/* ================= XP ================= */'));
  assert.match(fn, /chosenLevel=id;onbDone=true;saveState\(\);renderMyChoice\(\);/);
  assert.match(fn, /new CustomEvent\('ocean:level',\{detail:id\}\)/, 'les verdicts des autres écrans sont prévenus');
  assert.match(js, /document\.addEventListener\('ocean:level',\(\)=>renderLevel\(\)\);/);
});

test('passeport : chiffres réels (ceux de passport.js et de la vitrine), carte au trait tirée de la carte du passeport', () => {
  assert.match(read('passport.js'), /window\.OceanPassport=\{render,data\};/);
  assert.match(js, /d=window\.OceanPassport\?\.data\?\.\(\);/);
  assert.match(js, /trophies=\(window\.OceanBadges\?\.list\?\.\(\)\|\|\[\]\)\.filter\(b=>b\.unlocked\)\.length;/);
  assert.match(js, /target=\{countries:m\.countries,spots:m\.been\.length,trophies:m\.trophies\};/);
  assert.doesNotMatch(noComments(js), /Math\.random/, 'aucune valeur au hasard');
  const svg = read('assets/ui/monde-trait.svg');
  assert.match(svg, /viewBox="0 0 2400 946"/, 'même repère que assets/globe/world-card.webp');
  assert.match(read('scripts/build-world-trait.py'), /assets\/globe\/world-card\.webp/);
  assert.match(css, /mask:url\("assets\/ui\/monde-trait\.svg"\)/);
  /* Même projection que passport.js : 84° N à 58° S. */
  const pos = s => s.match(/const pos=c=>\(\{x:\(c\.lon\+180\)\/360\*100,y:\(84-c\.lat\)\/142\*100\}\);/);
  assert.ok(pos(js) && pos(read('passport.js')));
});

/* ---------- Langues ---------- */
test('aucun texte en dur hors de la chaîne de traduction : chaque texte du Profil a sa clé et ses traductions', () => {
  const src = new Set(JSON.parse(read('locales/source/fr.json')));
  const en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json'));
  const need = new Set();
  /* index.html : textes et libellés d’accessibilité du Profil court et des en-têtes rattachés. */
  const blocks = [short, profile.match(/<header class="pv-sub-head" id="pvFullHead">.*?<\/header>/)[0]];
  for (const id of ['challenges', 'surf']) { const a = html.indexOf(`<section class="screen" id="${id}"`); blocks.push(html.slice(a, html.indexOf('</header>', a))); }
  for (const b of blocks) {
    const clean = b.replace(/<!--[\s\S]*?-->/g, '').replace(/<span id="profName"[^>]*>[^<]*<\/span>/, '');
    for (const m of clean.matchAll(/aria-label="([^"]+)"/g)) need.add(m[1]);
    for (const part of clean.split(/<[^>]*>/)) { const t = part.replace(/\s+/g, ' ').trim(); if (t && /[A-Za-zÀ-ÿ]{2}/.test(t)) need.add(t); }
  }
  /* ui-nav.js : toute chaîne qui se lit comme du texte (une majuscule ou un accent, pas de code). */
  const literals = [...noComments(js).matchAll(/'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)].map(m => m[1] ?? m[2]);
  for (const lit of literals) for (const part of lit.replace(/\$\{[^}]*\}/g, '{0}').split(/<[^>]*>/)) {
    const t = part.replace(/\s+/g, ' ').trim();
    if (!t || /[#.\[\]=(){};:/_]|^[a-z-]+$|^\d/.test(t.replace('{0}', ''))) continue;
    if (!/\s/.test(t) && /[A-Z][a-z]+[A-Z]/.test(t)) continue;   /* noms de code (ArrowRight), comme le filtre de l’extraction */
    if (/[A-ZÀ-Ö]/.test(t[0]) || /[à-ÿ’]/.test(t)) need.add(t);
  }
  for (const k of ['spot', 'spots', 'trophée', 'trophées', 'pays', 'un seul pays']) need.add(k);
  assert.ok(need.size >= 28, 'textes relevés : ' + need.size);
  for (const k of need) {
    assert.ok(src.has(k), 'clé absente de locales/source/fr.json : « ' + k + ' »');
    assert.ok(typeof en[k] === 'string' && en[k].trim(), 'anglais manquant : « ' + k + ' »');
    assert.ok(typeof es[k] === 'string' && es[k].trim(), 'espagnol manquant : « ' + k + ' »');
  }
  /* Les mots isolés en minuscules ne passent le filtre de l’extraction que marqués data-i18n ou appelés par obT('…'). */
  for (const k of ['spot', 'spots', 'trophée', 'trophées', 'pays', 'un seul pays']) assert.match(js, new RegExp("obT\\('" + k + "'\\)"));
  assert.match(short, /<b data-i18n>Mini-jeu<\/b>/);
});

/* ---------- Mouvement ---------- */
test('mouvement : transform et opacity seulement, rien en boucle, rien en mouvement réduit', () => {
  const c = noComments(css), j = noComments(js);
  assert.doesNotMatch(c, /@keyframes|animation\s*:/, 'aucune animation CSS (donc aucune boucle)');
  for (const m of c.matchAll(/transition:([^;}]+)/g)) for (const part of splitTop(m[1])) {
    const prop = part.split(/\s+/)[0];
    assert.ok(['transform', 'opacity', 'color', 'none'].includes(prop), 'transition sur « ' + prop + ' »');
  }
  assert.doesNotMatch(j, /setInterval|iterations|Infinity/, 'aucune boucle');
  for (const m of j.matchAll(/\.animate\(\[\{([^}]+)\},\{([^}]+)\}\]/g)) for (const frame of [m[1], m[2]])
    for (const k of splitTop(frame.replace(/`[^`]*`|'[^']*'/g, 'x')).map(x => x.split(':')[0].trim())) assert.ok(k === 'opacity' || k === 'transform', 'image clé : ' + k);
  assert.ok((j.match(/\.animate\(/g) || []).length >= 4);
  /* Chaque mouvement lancé par ui-nav.js passe d’abord par calm() ou reduced(). */
  for (const name of ['swap', 'enter', 'play']) {
    const a = j.indexOf('function ' + name + '('), body = j.slice(a, j.indexOf('\n  }', a));
    assert.match(body.slice(0, body.indexOf('.animate(') > 0 ? body.indexOf('.animate(') : body.indexOf('requestAnimationFrame')), /calm\(\)|reduced\(\)/, name + '() : garde de mouvement réduit');
  }
  assert.match(j, /if\(host&&!calm\(\)\)host\.animate/, 'changement d’onglet de « Mes spots »');
  assert.match(j, /const reduced=\(\)=>body\.classList\.contains\('reduce-motion'\)\|\|!!\(window\.matchMedia&&matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\);/, 'les deux réglages : système et « Réduire les animations »');
  /* Chiffres du passeport : une seule montée (played), et la valeur directe en mouvement réduit. */
  assert.match(j, /if\(played\)return;played=true;\s*if\(!canAnimate\|\|reduced\(\)\)\{setNums\(target\);return;\}/);
  /* CSS : chaque élément qui porte une transition la perd avec les deux réglages. */
  const moving = new Set();
  for (const m of c.matchAll(/([^{}]+)\{[^}]*transition:(?!none)[^}]*\}/g)) for (const sel of m[1].split(',')) { const k = sel.match(/\.pv-[\w-]+(?:>button)?(?:::after)?/); if (k) moving.add(k[0]); }
  assert.ok(moving.size >= 7, [...moving].join(' '));
  const media = c.match(/@media \(prefers-reduced-motion:reduce\)\{([\s\S]*?)\n\}/)[1], cls = c.slice(c.indexOf('.ocean-v2.reduce-motion :is('));
  for (const sel of moving) { assert.ok(media.includes(sel), 'réglage du système : ' + sel); assert.ok(cls.includes(sel), 'body.reduce-motion : ' + sel); }
});

test('pas de saut de mise en page : la rangée « Mes spots » garde sa hauteur, les chiffres leur largeur', () => {
  assert.match(css, /\.ocean-v2 \.pv-spots\{--pv-th:min\(calc\(\(100vw - 56px\)\/3\),190px\);[^}]*min-height:calc\(var\(--pv-th\) \+ 41\.6px\)/);
  assert.match(css, /\.ocean-v2 \.pv-spot-n\{[^}]*-webkit-line-clamp:2;[^}]*min-height:33\.6px/);
  assert.match(css, /\.ocean-v2 \.pv-n\{[^}]*min-width:1\.25ch;[^}]*font-variant-numeric:tabular-nums/);
  assert.match(css, /\.ocean-v2 \.pv-tabs>button\{[^}]*font:700 16px/, 'onglets Favoris et Visités : même graisse, actif ou non');
  assert.match(js, /if\(sig===spotsSig\)return;/, 'vignettes laissées en place si rien n’a changé');
  assert.match(js, /loading="lazy" decoding="async"/);
  assert.match(js, /spotPhotoSrcset\(s\.id\)/, 'srcset comme ailleurs dans l’app');
});

test('ui-nav.js : chargé après la coque et les modules du Profil ; ui-nav.css avant fiche.css', () => {
  const at = f => { const i = html.indexOf(`<script src="${f}`); assert.ok(i > 0, f); return i; };
  for (const f of ['app.js', 'poulpy.js', 'passport.js', 'badges.js', 'app-shell.js']) assert.ok(at(f) < at('ui-nav.js'), f + ' avant ui-nav.js');
  assert.ok(html.indexOf('href="ui-nav.css') < html.indexOf('href="fiche.css'));
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets/ui/monde-trait.svg')));
});
