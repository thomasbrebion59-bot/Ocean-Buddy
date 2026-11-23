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
test('changement d’onglet : fondu sur place de 160 à 220 ms, sans glissement (23 nov.) ; la fiche garde sa poussée', () => {
  const e = navigationEnv(); e.go('profile');
  assert.ok(e.anims.length >= 2);
  for (const a of e.anims) for (const f of a.frames) for (const k of Object.keys(f)) assert.ok(k === 'transform' || k === 'opacity', 'propriété animée : ' + k);
  const fades = e.anims.filter(a => 'opacity' in a.frames[0]).map(a => a.opts.duration);
  assert.ok(fades.length === 2 && fades.every(d => d >= 160 && d <= 220), 'fondus : ' + fades.join(', ') + ' ms');
  assert.ok(e.anims.every(a => a.opts.duration <= 220), 'rien ne dépasse 220 ms');
  assert.ok(!e.anims.some(a => 'transform' in a.frames[0]), 'd’un onglet à l’autre : aucun déplacement, fondu sur place');
  e.drain();
  const f = navigationEnv(); f.go('detail');
  assert.ok(f.anims.some(a => a.opts.duration === 300), 'fiche : 300 ms');
  assert.match(f.anims.find(a => a.id === 'detail' && 'transform' in a.frames[0]).frames[0].transform, /^translate3d\(44px,0,0\)$/, 'la fiche entre par la droite');
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
  for (const name of ['swap', 'reveal', 'enter', 'play']) {
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

/* ================= Passe du 23 novembre 2026 : plus beau, plus vivant ================= */
const v2 = read('ui-v2.css');
/* Largeur et hauteur d’un fichier WebP (en-têtes VP8, VP8L et VP8X). */
function webpSize(file) {
  const b = fs.readFileSync(path.join(__dirname, '..', file));
  assert.equal(b.toString('ascii', 0, 4) + b.toString('ascii', 8, 12), 'RIFFWEBP', file + ' : fichier WebP');
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (kind === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
}

test('cartes blanches à filet : jetons communs de ui-v2.css, repris par le Profil', () => {
  assert.match(v2, /--ui-surface:var\(--t-card\);/, 'fond d’une carte : le blanc cassé du thème');
  assert.match(v2, /--ui-wash:color-mix\(in srgb,var\(--t-ink\) 6%,var\(--t-page\)\);/, 'pastilles : la page à peine assombrie (chaud sur le crème)');
  assert.doesNotMatch(noComments(v2), /--ui-wash:[^;]*--t-main/, 'plus de bleu du thème dans le fond des pastilles');
  for (const sel of ['.ui-card', '.ui-spots'])
    assert.match(v2, new RegExp('\\.ocean-v2 \\' + sel + '\\{[^}]*background:var\\(--ui-surface\\)[^}]*box-shadow:inset 0 0 0 1px var\\(--ui-hair\\)'), sel + ' : blanche, avec son filet');
  /* Aucun renommage : les jetons et les classes d’avant existent toujours. */
  for (const k of ['--ui-wash:', '--ui-hair:', '--ui-radius:', '.ui-card{', '.ui-spots{', '.ui-pill{', '.ui-btn.is-soft{']) assert.ok(v2.includes(k), 'toujours là : ' + k);
  /* Profil : tuiles, liste et chiffres du passeport complet sur le même fond ; --ui-wash seulement pour le sélecteur. */
  assert.match(css, /\.ocean-v2 \.pv-tile\{[^}]*background:var\(--ui-surface\)/);
  assert.match(css, /\.ocean-v2 \.pv-tile::after\{[^}]*box-shadow:inset 0 0 0 1px var\(--ui-hair\)/, 'filet par-dessus l’illustration');
  assert.match(css, /\.ocean-v2 \.pv-list\{[^}]*background:var\(--ui-surface\);box-shadow:inset 0 0 0 1px var\(--ui-hair\)/);
  assert.match(css, /\.ocean-v2 #profile \.pp-stat\{background:var\(--ui-surface\);box-shadow:inset 0 0 0 1px var\(--ui-hair\)\}/);
  assert.deepEqual([...noComments(css).matchAll(/([^{}]+)\{[^}]*background:var\(--ui-wash\)/g)].map(m => m[1].trim()), ['.ocean-v2 .pv-seg']);
});

test('tuiles Jouer : une illustration par tuile (assets/ui, WebP 4:3), le libellé gardé, plus de pictogramme', () => {
  const play = short.slice(short.indexOf('<div class="pv-play">'), short.indexOf('</div>', short.indexOf('<div class="pv-play">')));
  const tiles = [...play.matchAll(/<button type="button" class="pv-tile" data-pv-play="(\w+)"><span class="pv-tile-art"><img src="(assets\/ui\/[\w-]+\.webp)" alt="" width="(\d+)" height="(\d+)" loading="lazy" decoding="async"><\/span><b(?: data-i18n)?>([^<]+)<\/b><\/button>/g)];
  assert.deepEqual(tiles.map(m => m[1] + ':' + m[2] + ':' + m[5]), ['quiz:assets/ui/jouer-quiz.webp:Quiz', 'surf:assets/ui/jouer-mini-jeu.webp:Mini-jeu', 'challenges:assets/ui/jouer-defis.webp:Défis']);
  assert.doesNotMatch(play, /<svg/, 'plus de pictogramme dans les tuiles');
  for (const m of tiles) {
    const [w, h] = webpSize(m[2]);
    assert.deepEqual([w, h], [+m[3], +m[4]], m[2] + ' : dimensions annoncées dans la page');
    assert.equal(w * 3, h * 4, 'rapport 4:3');
    assert.ok(w >= 900, 'assez de pixels pour une tuile de 225 px à ×3');
  }
  assert.match(css, /\.ocean-v2 \.pv-tile-art\{[^}]*aspect-ratio:4\/3/, 'place réservée avant l’arrivée de l’image');
});

test('« Mes spots » vide : une scène dessinée pour cet état, à la hauteur de la rangée de vignettes', () => {
  assert.match(js, /<span class="pv-ph pv-empty-art"><img src="assets\/ui\/mes-spots-vide\.webp" alt="" width="800" height="800" loading="lazy" decoding="async"><\/span>/);
  assert.doesNotMatch(noComments(js), /assets\/poulpy\/scenes/, 'plus d’image de Poulpy réutilisée');
  assert.deepEqual(webpSize('assets/ui/mes-spots-vide.webp'), [800, 800]);
  /* Même hauteur que la rangée de vignettes (photo et nom) : aucun saut en passant de Favoris à Visités. */
  assert.match(css, /\.ocean-v2 \.pv-spots\.is-empty\{[^}]*grid-template-columns:calc\(var\(--pv-th\) \+ 41\.6px\) minmax\(0,1fr\)/);
});

test('passeport plus parlant : terres teintées, halo des spots visités, pays visités en tampons (données réelles)', () => {
  /* Les tampons sont les pays des spots visités, ceux qui font le chiffre « pays » (passport.js). */
  assert.match(js, /countries:d\?d\.countries\.size:0,countryNames:d\?\[\.\.\.d\.countries\]:\[\]/);
  const fn = js.slice(js.indexOf('function renderStamps(m){'), js.indexOf('\n  }', js.indexOf('function renderStamps(m){')));
  assert.match(fn, /const names=m\.countryNames,sig=names\.join\('\|'\);\s*if\(sig===stampsSig\)return;/, 'rien n’est réécrit si rien n’a changé');
  assert.match(fn, /names\.slice\(0,STAMPS\)\.map\(n=>`<span class="pv-stamp">\$\{esc\(n\)\}<\/span>`\)/, 'noms échappés');
  assert.match(fn, /<span class="pv-stamp is-more" translate="no" data-no-i18n>\+\$\{more\}<\/span>/);
  assert.match(fn, /<span class="pv-stamp is-todo">Note ta première session<\/span>/, 'sans pays visité : comment gagner le premier');
  assert.match(short, /<span class="pv-stamps" id="pvStamps"><\/span>/);
  /* Hauteur réservée : une ligne de tampons, présente dès le premier rendu. */
  assert.match(css, /\.ocean-v2 \.pv-stamps\{[^}]*min-height:46px;/);
  assert.doesNotMatch(css.match(/\.ocean-v2 \.pv-stamps\{[^}]*\}/)[0], /overflow:hidden/, 'un tampon qui se pose n’est pas rogné');
  /* Terres pleines : mêmes contours que la carte au trait (même script), donc même repère pour les points. */
  const trait = read('assets/ui/monde-trait.svg'), terres = read('assets/ui/monde-terres.svg');
  const d = s => s.match(/<path d="([^"]+)"\/>/)[1];
  assert.equal(d(terres), d(trait)); assert.match(terres, /viewBox="0 0 2400 946" fill="#000" fill-rule="evenodd"/);
  assert.match(read('scripts/build-world-trait.py'), /assets\/ui\/monde-terres\.svg/);
  assert.match(css, /\.ocean-v2 \.pv-map-fill\{[^}]*background:var\(--t-tint\);[^}]*mask:url\("assets\/ui\/monde-terres\.svg"\)/);
  assert.match(css, /\.ocean-v2 \.pv-dot\.been\{[^}]*box-shadow:0 0 0 2px var\(--ui-surface\),0 0 0 5px color-mix\(in srgb,var\(--t-main\) 20%,transparent\)/);
  /* L’onde d’un spot visité est retirée du document à la fin : rien ne reste, rien ne tourne en boucle. */
  assert.match(js, /wave\.onfinish=wave\.oncancel=\(\)=>ring\.remove\(\);/);
});

test('ordinateur large : deux colonnes (niveau et spots ; jouer, passeport, réglages), une seule suite sur téléphone', () => {
  const cols = [...short.matchAll(/<div class="pv-col( pv-side)?">/g)];
  assert.equal(cols.length, 2);
  const [a, b] = cols.map(m => m.index), first = short.slice(a, b), second = short.slice(b);
  for (const id of ['pvLevelT', 'pvSpotsT']) assert.ok(first.includes('id="' + id + '"'), 'colonne de gauche : ' + id);
  for (const id of ['pvPlayT', 'pvPassT', 'pvSettings', 'pvHelp']) assert.ok(second.includes('id="' + id + '"') && !first.includes('id="' + id + '"'), 'colonne de droite : ' + id);
  assert.match(css, /\.ocean-v2 \.pv-col\{display:contents\}/, 'téléphone : les blocs restent des éléments de la grille du Profil');
  const wide = css.match(/@media\(min-width:1200px\)\{([\s\S]*?)\n\}/);
  assert.ok(wide, 'règles de l’ordinateur large');
  assert.match(wide[1], /\.ocean-v2 \.pv\{max-width:1240px!important;grid-template-columns:minmax\(0,1\.7fr\) minmax\(0,1fr\);/);
  assert.match(wide[1], /\.ocean-v2 \.pv-top\{grid-column:1\/-1\}/);
  assert.match(wide[1], /\.ocean-v2 \.pv-col\{display:grid;gap:var\(--ui-gap\)/);
  /* Ordinateur : les vignettes passent à la ligne ; la carte du passeport complet n’est plus une affiche. */
  assert.match(css, /@media\(min-width:960px\)\{\.ocean-v2 \.pv-spots:not\(\.is-empty\)\{grid-auto-flow:row;grid-template-columns:repeat\(auto-fill,minmax\(150px,1fr\)\)/);
  assert.match(css, /\.ocean-v2 #profile \.pp\{display:grid;grid-template-columns:minmax\(0,1\.5fr\) minmax\(0,1fr\)/);
});

test('entrée des blocs : chacun entre en arrivant à l’écran, une fois ; jamais caché en mouvement réduit', () => {
  const j = noComments(js);
  const enter = j.slice(j.indexOf('function enter(){'), j.indexOf('\n  }', j.indexOf('function enter(){')));
  assert.match(enter, /^function enter\(\)\{\s*if\(entered\|\|fullOpen\|\|calm\(\)\)return;entered=true;/, 'une seule fois, jamais en mouvement réduit');
  assert.ok(enter.indexOf('calm()') < enter.indexOf("classList.add('pv-wait')"), 'un bloc n’attend caché que si le mouvement est permis');
  assert.match(enter, /if\(!\('IntersectionObserver' in window\)\)\{blocks\.forEach\(reveal\);return;\}/, 'sans observateur : rien n’est caché');
  assert.match(enter, /if\(e\.isIntersecting\)\{seen\.unobserve\(e\.target\);reveal\(e\.target,n\+\+\);\}/);
  const reveal = j.slice(j.indexOf('function reveal(el,i){'), j.indexOf('\n  }', j.indexOf('function reveal(el,i){')));
  assert.match(reveal, /^function reveal\(el,i\)\{\s*el\.classList\.remove\('pv-wait'\);\s*if\(calm\(\)\)return;/, 'le bloc redevient visible avant tout, même sans mouvement');
  /* Filet de sécurité en CSS : avec l’un ou l’autre réglage, un bloc en attente reste visible. */
  assert.match(css, /\.ocean-v2 \.pv-wait\{opacity:0\}/);
  const media = css.match(/@media \(prefers-reduced-motion:reduce\)\{([\s\S]*?)\n\}/)[1];
  assert.match(media, /\.ocean-v2 \.pv-wait\{opacity:1\}/);
  assert.match(css, /\.ocean-v2\.reduce-motion \.pv-wait\{opacity:1\}/);
  assert.match(css, /\.ocean-v2\.reduce-motion :is\([^)]*\.pv-tile-art>img[^)]*\)[^{]*\{transition:none\}/);
});

test('plus aucun sur-titre en capitales : menu latéral, Communauté, vitrine des trophées, dates des compétitions', () => {
  assert.match(css, /@media\(min-width:960px\)\{[\s\S]*\.ocean-v2 \.nav \.sidebar-label\{display:none\}/);
  assert.match(css, /\.ocean-v2 #community \.community-kicker\{display:none\}/);
  for (const sel of ['#community \\.community-hero h1', '#community \\.community-panel :is\\(h2,h3\\)', '#profile \\.tb-title', '#profile \\.sub-lab', '#challenges \\.evt-m'])
    assert.match(css, new RegExp('\\.ocean-v2 ' + sel + '\\{[^}]*text-transform:none'), sel.replace(/\\/g, ''));
  assert.match(css, /\.ocean-v2 #community \.community-hero\{[^}]*background:none;box-shadow:none/, 'plus de grande affiche sombre');
  assert.match(css, /\.ocean-v2 #community \.community-panel\{[^}]*background:var\(--ui-surface\);box-shadow:inset 0 0 0 1px var\(--ui-hair\)\}/);
  /* Communauté garde son entrée en bas du menu (ordinateur) : l’accès n’est pas retiré. */
  assert.match(design, /c\.classList\.add\('sidebar-community'\);s\.before\(c\);/);
  assert.doesNotMatch(noComments(css), /text-transform:uppercase/);
});
