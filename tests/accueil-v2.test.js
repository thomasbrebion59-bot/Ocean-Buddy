/* Accueil v2 (interface v2, 20 novembre 2026) : home-feed.js (bloc « Accueil v2 »), home-layout-model.js, ui-accueil.css
   et les ajouts de ui-v2.css.
   - structure : le haut (date, salut, pastille, recherche) puis « Mes spots », « Bon aujourd’hui », « En <mois> »,
     « Cultures » ; ce qui est retiré de l’accueil ne s’y affiche plus, mais son code reste ;
   - démarrage : l’étape « feed » toujours signalée, rien d’ajouté ni de déplacé après le montage, hauteurs réservées ;
   - vie : entrée une seule fois, transform et opacity seulement, aucune boucle, rien en mouvement réduit ;
   - Noël : les crochets de noel.css sont gardés, rien n’y est imité ; l’Avent du 1er au 24 décembre seulement ;
   - textes : aucun texte en dur hors de la chaîne de traduction. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../home-layout-model.js');
const { load } = require('./src-extract.cjs');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const feed = read('home-feed.js'), css = read('ui-accueil.css'), ui = read('ui-v2.css'), html = read('index.html');
const v2 = feed.slice(feed.indexOf('/* ================= Accueil v2'), feed.indexOf('/* ================= Fin de l’accueil v2'));
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fn = name => { const i = v2.indexOf('function ' + name + '('); assert.ok(i >= 0, 'fonction ' + name); const j = v2.indexOf('\n  }\n', i); return v2.slice(i, j + 4); };

/* ---------- Modèle pur ---------- */
test('ordre de la v2 : deux colonnes, quatre rubriques et l’Avent ; lues l’une après l’autre sur téléphone', () => {
  assert.deepEqual(L.V2, [['mesSpots', 'bon'], ['avent', 'mois', 'cultures']]);
  assert.deepEqual(L.V2.flat(), ['mesSpots', 'bon', 'avent', 'mois', 'cultures']);
  /* L’ancien fil reste décrit (code gardé). */
  assert.ok(L.ORDER.includes('pourtoi') && L.FOLDED.includes('planete'));
});

test('salut : « Bonjour » le jour, « Bonsoir » le soir ; l’après-midi a son salut hors du français', () => {
  for (const h of [5, 9, 12, 15, 17]) assert.equal(L.hello(h, 'fr'), 'Bonjour', h + ' h');
  for (const h of [18, 21, 23, 0, 4]) assert.equal(L.hello(h, 'fr'), 'Bonsoir', h + ' h');
  assert.equal(L.hello(9, 'en'), 'Bonjour');
  assert.equal(L.hello(15, 'en'), 'Bon après-midi', '« Good morning » à 15 h serait faux');
  assert.equal(L.hello(15, 'es'), 'Bon après-midi');
  assert.equal(L.hello(20, 'es'), 'Bonsoir');
  const en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json'));
  for (const k of ['Bonjour', 'Bon après-midi', 'Bonsoir']) assert.ok(en[k] && es[k], k);
});

test('« Mes spots » : les favoris, sinon les derniers spots vus, trois lignes au plus', () => {
  const known = id => id !== 'parti';
  assert.deepEqual(L.mine(), { kind: 'none', ids: [], total: 0 });
  assert.deepEqual(L.mine({ favs: new Set(['a', 'b']), recent: [{ id: 'z', ts: 3 }], known }), { kind: 'favs', ids: ['a', 'b'], total: 2 }, 'des favoris : eux seuls');
  assert.deepEqual(L.mine({ favs: [], recent: [{ id: 'x' }, { id: 'parti' }, 'y', { id: 'x' }, { id: 'w' }, { id: 'v' }], known }), { kind: 'recent', ids: ['x', 'y', 'w'], total: 3 }, 'sinon les trois derniers vus encore au catalogue');
  /* Plus de trois favoris : ceux regardés le plus récemment, dans l’ordre où ils ont été ajoutés. */
  const m = L.mine({ favs: ['a', 'b', 'c', 'd', 'e'], recent: [{ id: 'e' }, { id: 'q' }, { id: 'b' }], known });
  assert.deepEqual(m, { kind: 'favs', ids: ['a', 'b', 'e'], total: 5 });
  assert.deepEqual(L.mine({ favs: ['a', 'parti', 'b'], known }).ids, ['a', 'b'], 'un favori sorti du catalogue ne compte pas');
  assert.equal(L.mine({ favs: ['a', 'b', 'c', 'd'], n: 2 }).ids.length, 2);
});

test('« Bon aujourd’hui » : les créneaux d’abord, puis ce dont on ne sait rien dire, « pas aujourd’hui » en dernier', () => {
  const c = (id, country, verdict, day) => ({ id, country, e: verdict === undefined ? null : { now: {}, verdict, day: day || 'today' } });
  assert.deepEqual(L.good([c('n1', 'A', 'non'), c('p1', 'B', 'possible'), c('b1', 'C', 'bon'), c('u1', 'D', null), c('b2', 'E', 'bon')]), ['b1', 'b2', 'p1']);
  assert.deepEqual(L.good([c('bt', 'A', 'bon', 'tomorrow'), c('b', 'B', 'bon'), c('p', 'C', 'possible')]), ['b', 'bt', 'p'], 'aujourd’hui avant demain');
  assert.deepEqual(L.good([c('n1', 'A', 'non'), c('u1', 'B', null), c('n2', 'C', 'non'), c('u2', 'D')]), ['u1', 'u2', 'n1'], '« non » seulement pour compléter');
  /* Un spot par pays tant qu’il y a le choix dans la même classe ; un créneau du même pays passe avant un spot sans verdict. */
  assert.deepEqual(L.good([c('f1', 'France', 'bon'), c('f2', 'France', 'bon'), c('p', 'Portugal', 'bon'), c('e', 'Espagne', 'bon')]), ['f1', 'p', 'e']);
  assert.deepEqual(L.good([c('f1', 'France', 'bon'), c('f2', 'France', 'possible'), c('x', 'Chili', null)]), ['f1', 'f2', 'x']);
  assert.deepEqual(L.good([c('a', 'A', 'bon')], { n: 3 }), ['a']);
  assert.deepEqual(L.good([c('a', 'A', 'bon'), c('b', 'B', 'bon')], { n: 1 }), ['a']);
  /* Sans donnée du moment (now null), un verdict ne compte pas. */
  assert.deepEqual(L.good([{ id: 'vide', country: 'A', e: { now: null, verdict: 'bon' } }, c('p', 'B', 'possible')], { n: 1 }), ['p']);
  assert.equal(L.goodProven([{ now: {}, verdict: 'non' }, { now: {}, verdict: null }, null]), false);
  assert.equal(L.goodProven([{ now: {}, verdict: 'possible' }]), true);
  assert.equal(L.goodProven([{ now: null, verdict: 'bon' }]), false);
});

/* ---------- Structure ---------- */
test('haut : date, salut, pastille sport et niveau, recherche ; plus de raccourcis, de filtres de sport ni de spot de rêve', () => {
  assert.match(feed, /function hero\(\)\{\n    if\(V2\)return topV2\(\);/);
  const top = fn('topV2');
  const at = s => { const i = top.indexOf(s); assert.ok(i >= 0, s); return i; };
  assert.ok(at('data-ac-date') < at('data-ac-hi') && at('data-ac-hi') < at('data-ac-me') && at('data-ac-me') < at('data-hf-search'));
  assert.match(top, /class="hf-top ac-top"/, 'le haut garde .hf-top (contrôle du démarrage : premier bloc visible à la levée)');
  assert.match(top, /Où veux-tu aller \?/);
  assert.doesNotMatch(top, /quickRow\(\)|acts\(\)|heroBox\(\)|\$\{n\} spots/);
  /* Salut : la règle du modèle, le prénom comme avant. */
  assert.match(fn('helloText'), /Layout\?\.hello\?Layout\.hello\(new Date\(\)\.getHours\(\),lang\(\)\)/);
  assert.match(fn('helloText'), /userName!=='Explorateur'/);
  /* La pastille ouvre le choix existant (« Mon sport et mon niveau » des Réglages). */
  assert.match(feed, /if\(e\.target\.closest\('\[data-ac-me\]'\)\)\{if\(typeof openSettings==='function'\)openSettings\('sport'\);return;\}/);
  /* La recherche existante. */
  assert.match(feed, /if\(search\)\{document\.querySelector\('\.mobile-search'\)\?\.click\(\);return;\}/);
  assert.match(css, /\.ocean-v2 #home\.hf-on>\.as-large\{display:none\}/, 'le grand titre de la coque ne double pas le salut');
});

test('rubriques : Mes spots, Bon aujourd’hui, En <mois>, Cultures ; trois lignes au plus, une seule rangée de photos', () => {
  assert.match(feed, /function render\(\)\{\n    if\(V2\)return renderV2\(\);/);
  const r = fn('renderV2');
  for (const k of ['B.mesSpots=mineSection()', 'B.bon=goodSection(used)', 'B.avent=adventV2(all)', 'B.mois=monthSection(pool,used)', 'B.cultures=culturesV2()']) assert.ok(r.includes(k), k);
  assert.match(r, /Layout\?\.V2/);
  /* Retiré de l’accueil : aucun de ces blocs n’est rendu par la v2… */
  assert.doesNotMatch(r, /noelSection|forYouSection|planCard|surfCard|worldCard|plusSection|culturesSection|rail\(|moods\(|heroBox/);
  /* …mais leur code reste. */
  for (const f of ['heroBox', 'forYouSection', 'noelSection', 'plusSection', 'worldCard', 'planCard', 'surfCard', 'moods', 'quickRow']) assert.ok(feed.includes('function ' + f + '('), 'code gardé : ' + f);
  /* Les blocs des autres scripts (Ton espace, immersion, nouveautés, Poulpy) : places réservées cachées. */
  assert.match(r, /<div class="ac-off" hidden>\$\{Object\.keys\(OWNED\)\.map\(slot\)\.join\(''\)\}<\/div>/);
  assert.match(css, /\.ocean-v2 #home \.ac-off\{display:none!important\}/);
  /* Photo et vidéo d’ambiance du haut. */
  assert.match(css, /\.ocean-v2 #home\.hf-on>\.mm-band\{display:none\}/);
  assert.doesNotMatch(html, /class="hf-ambient"/);
  /* Titres de 1 à 3 mots, liens à droite. */
  assert.match(fn('mineSection'), /<h2 class="ui-title" id="acMineT">Mes spots<\/h2><button type="button" class="ui-link" data-ac-edit\$\{m\.spots\.length\?'':' hidden'\}>Modifier<\/button>/);
  assert.match(fn('goodInner'), /data-ac-good-title>\$\{goodTitle\(picks,map,!ready\)\}<\/h2><button type="button" class="ui-link" data-hf-more="bon">Tout voir<\/button>/);
  assert.match(fn('monthSection'), /const title=`En \$\{monthName\(m\)\}`;/);
  assert.match(fn('monthSection'), /data-hf-more="mois">Tout voir<\/button>/);
  assert.match(fn('culturesV2'), /<h2 class="ui-title" id="acCultT">Cultures<\/h2>/);
  /* Trois lignes au plus. */
  assert.match(fn('mineData'), /known,n:3\}/);
  assert.match(fn('goodInner'), /goodN=Math\.min\(3,cands\.length\)/);
  /* Une seule rangée .ui-row, avec les données de « Où partir en <mois> ? » (même tri). */
  assert.equal((v2.match(/class="ui-row/g) || []).length, 1);
  assert.match(fn('monthSection'), /pick\(ordered,\{n:8,perCountry:1,used\}\)/);
  const old = feed.slice(feed.indexOf('function render(){'));
  const score = /const score=s=>\{const ms=seasons\[s\.id\];return [^\n]+\};/;
  assert.equal(fn('monthSection').match(score)[0], old.match(score)[0], 'même classement que l’ancienne rangée du mois');
  /* « Tout voir » : Explorer filtré sur la saison du mois (comportement existant). */
  assert.match(feed, /const more=e\.target\.closest\('\[data-hf-more\]'\);\n    if\(more\)\{[\s\S]{0,200}currentFilter='season'/);
});

test('lignes de spot : photo, nom, points de danger, conditions, verdict ; toucher ouvre la fiche avec le vol de la photo', () => {
  const row = fn('spotRow');
  assert.match(row, /class="ui-spot \$\{cls\}"\$\{rise\(i\)\} data-spot="\$\{esc\(s\.id\)\}" role="button" tabindex="0"/);
  assert.match(row, /\$\{p\?`<span class="ui-ph"><img src="\$\{esc\(p\.thumb\)\}"\$\{sharp\(p,'114px'\)\} alt="" decoding="async"/, 'vraie photo du spot, vignette et srcset de l’app');
  assert.match(row, /:noPhoto\(s\)\}/, 'sans vraie photo : le pictogramme de l’activité, jamais une illustration');
  assert.match(v2, /const noPhoto=s=>`<span class="ui-ph is-none" style="--ic:url\('assets\/pictos\/sports\/\$\{esc\(\(s\.sports\|\|\[\]\)\.find\(a=>sportLabel\(a\)\)\|\|'all'\)\}-mono\.webp'\)"><\/span>`;/);
  assert.match(row, /\$\{rowName\(s\)\}\$\{dotsHTML\(g\)\}/);
  assert.match(row, /window\.dangerGauge\?\.\(s\)\?\.n\?\?null/, 'danger : la jauge de la fiche');
  assert.match(row, /\$\{liveHTML\(s\.id\)\}/);
  /* Points de danger : jamais cachés quand le danger est connu. */
  const c = load('home-feed.js', ['dotsHTML'], {});
  assert.equal(c.dotsHTML(null), '');
  assert.equal(c.dotsHTML(3), '<span class="ui-dots" role="img" aria-label="Danger 3 sur 4"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></span>');
  assert.equal((c.dotsHTML(1).match(/class="on"/g) || []).length, 1);
  assert.equal((c.dotsHTML(4).match(/class="on"/g) || []).length, 4);
  /* Conditions et verdict : OceanVerdict, à une place réservée. */
  assert.match(fn('liveHTML'), /<div class="ui-live\$\{Verdict\.hasVerdict\(id\)\?'':' is-solo'\}" data-ac-live="\$\{esc\(id\)\}">\$\{Verdict\.pending\(id\)\}<\/div>/);
  assert.match(fn('paintLive'), /const h=Verdict\.html\(e\);/);
  assert.match(fn('loadLive'), /Verdict\.forSpots\(ids\)\.then\(/);
  /* Le vol de la photo : motion.js suit les cartes [data-spot] qui portent une image, puis openSpot ; rien à lui ajouter. */
  assert.match(read('motion.js'), /const CARD='\[data-spot\],\[data-spot-id\],\[data-cult-spot\],\.field-nearby-card';/);
  assert.match(feed, /const card=e\.target\.closest\('\.hf-card\[data-spot\],\.hf-fy\[data-spot\],\.ui-spot\[data-spot\],\.ac-card\[data-spot\]'\);\n    if\(card&&typeof openSpot==='function'\)\{openSpot\(card\.dataset\.spot\);\}/);
  assert.match(feed, /e\.target\.matches\('\.hf-card,\.hf-fy,\.ui-spot\[data-spot\]'\)/, 'Entrée et Espace ouvrent aussi la ligne');
  /* La photo empruntée par le vol laisse le texte à sa place : cadre .ui-ph. */
  assert.match(ui, /\.ocean-v2 \.ui-spot>\.ui-ph\{display:block;position:relative;overflow:hidden\}/);
});

test('sans favori ni spot vu : une carte courte avec une illustration existante et « Trouver un spot »', () => {
  const b = fn('mineBody');
  assert.match(b, /<img src="assets\/poulpy\/scenes\/travel-v2\.webp" alt="" width="960" height="640" decoding="async">/);
  assert.ok(fs.existsSync(path.join(root, 'assets/poulpy/scenes/travel-v2.webp')));
  assert.match(b, /<span class="ui-num">\$\{SPOTS\.length\}<\/span><span class="ui-unit">spots à explorer<\/span>/, 'le grand chiffre est le vrai nombre de spots');
  assert.match(b, /<button type="button" class="ui-btn" data-ac-find>Trouver un spot<\/button>/);
  assert.match(feed, /if\(e\.target\.closest\('\[data-ac-find\]'\)\)\{go\('spots'\);return;\}/);
  assert.match(feed, /if\(e\.target\.closest\('\[data-ac-edit\]'\)\)\{if\(typeof openFavorites==='function'\)openFavorites\(\);return;\}/);
});

test('« Bon aujourd’hui » : mêmes données que « Pour toi aujourd’hui », en saison, jamais au-dessus du niveau ; titre honnête', () => {
  const c = fn('goodCands');
  assert.match(c, /Rank\.forYou\(SPOTS,rankCtx\(\),\{n:10,perCountry:2,used\}\)/);
  assert.match(c, /SpotFitModel\.fit\(s\.level,window\.dangerGauge\?\.\(s\)\?\.n\?\?null,curLevel\(\)\)\.kind!=='above'/);
  assert.match(c, /const season=list\.filter\(p=>p\.why\.inSeason\);/);
  assert.match(fn('goodPicks'), /Layout\.good\(c,\{n:goodN,perCountry:1\}\)/);
  /* « Bon aujourd’hui » ne se dit que si un spot montré a un créneau. */
  assert.match(fn('goodTitle'), /Layout\?\.goodProven\?\.\(picks\.map\(s=>map\.get\(s\.id\)\)\)\?'Bon aujourd’hui':goodFallback\(picks\)/);
  /* Une seule demande groupée pour les lignes de l’accueil : au plus 3 + 10 spots. */
  assert.match(fn('loadLive'), /ids=\[\.\.\.new Set\(mineIds\.concat\(goodIds\)\)\]/);
});

test('« Cultures » : une carte, le mot du jour de cultures.js à hauteur fixe, et « Tour du monde » vers le carnet', () => {
  const c = fn('culturesV2');
  assert.match(c, /view\?\.quizHTML\?\.\(\)/);
  assert.match(c, /<div class="cult-quiz-body is-wait" data-cult-quiz-body aria-busy="true">/, 'place du jeu, remplie sur place par cultures.js (fillHome)');
  assert.match(c, /data-cult-quiz-meta/);
  assert.match(c, /<button type="button" class="ui-btn ac-guess" data-ac-guess>Deviner le pays<\/button>/);
  assert.match(c, /<button type="button" class="ac-tour" data-cult-index>\$\{GLOBE\}<span>Tour du monde<\/span><\/button>/);
  assert.match(read('cultures-boot.js'), /if\(t\.hasAttribute\('data-cult-index'\)\)\{ensure\(\)\.then\(v=>v\.openIndex\(t\)\)/, 'data-cult-index ouvre le carnet de tampons');
  assert.equal((c.match(/class="ui-card/g) || []).length, 1, 'une seule carte');
  assert.doesNotMatch(c, /cult-rail|cardHTML|homePicks/, 'plus de rangée de pays sur l’accueil');
  /* cultures.js garde le jeu : remplissage, réponse et mesure (fitDone). */
  const view = read('cultures.js');
  assert.match(view, /if\(body&&body\.classList\.contains\('is-wait'\)\)\{const t=document\.createElement\('div'\);t\.innerHTML=quizHTML\(\);if\(t\.firstElementChild\)\{body\.replaceWith\(t\.firstElementChild\);fitDone\(\);\}\}/);
  /* Hauteur fixe pour les quatre états. */
  const rule = /\.ocean-v2 \.ac-cult \.ac-quiz\{[^}]*\}/.exec(css)[0];
  assert.match(rule, /height:128px/);
  assert.match(css, /\.ocean-v2 \.ac-quiz-main\{[^}]*grid-template-rows:18px 28px 62px;row-gap:6px;align-content:center;min-width:0;height:128px\}/, 'trois rangées fixes : le libellé et le mot ne bougent pas d’un état à l’autre');
  assert.match(css, /\.ocean-v2 \.ac-cult \.cult-quiz-body\{display:contents\}/);
  for (const st of ['wait', 'closed', 'open', 'done']) assert.ok(v2.includes(`'${st}'`), 'état ' + st);
  assert.match(css, /\.ocean-v2 \.ac-quiz\[data-ac-quiz=open\] \.cult-quiz-choices\{[^}]*height:54px/);
  assert.match(css, /\.ocean-v2 \.ac-quiz\[data-ac-quiz=done\] \.cult-quiz-done\{[^}]*height:44px/);
  /* Photo du pays : une vraie photo de spot (jamais une illustration), posée en fondu dans son cadre. */
  assert.match(fn('syncQuizPic'), /SPOTS\.filter\(s=>s\.country===c&&!s\.custom\)\.map\(s=>\(\{s,p:photo\(s\)\}\)\)\.filter\(x=>x\.p\)/);
  assert.match(css, /\.ocean-v2 \.ac-quiz-pic\{[^}]*width:104px;height:104px/);
});

/* ---------- Démarrage et fluidité ---------- */
test('démarrage : l’étape « feed » est toujours signalée ; un seul montage, rien d’ajouté ni de déplacé ensuite', () => {
  assert.match(feed, /function ready\(\)\{const g=\+\+gen;Boot\?\.wait\('feed'\);return settle\(\)\.then\(\(\)=>\{if\(g===gen\)Boot\?\.done\('feed'\);\}\);\}/);
  assert.match(feed, /\}\)\.catch\(e=>\{setTimeout\(\(\)=>\{throw e;\}\);Boot\?\.done\('feed'\);\}\);/, 'même en cas d’erreur');
  assert.match(html, /B\.wait\('shell'\);B\.wait\('feed'\);/);
  /* Photo d’ambiance : plus rien n’est préchargé par le script de démarrage. */
  const boot = [...html.slice(0, html.indexOf('</head>')).matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('OceanBoot'));
  assert.match(boot, /\/\*\/ambient\*\/,mo;\n\/\*[^*]*\*\/\nA=\[\];/);
  /* Accueil prêt : les photos des premières lignes et les polices, avec le même plafond. */
  assert.match(feed, /const imgs=V2\?\[\.\.\.home\.querySelectorAll\('\.hf-feed \[data-ac-mine\] img'\)\]\.slice\(0,3\):\[home\.querySelector\('\.hf-slide img'\)\];/);
  assert.match(feed, /return Promise\.race\(\[Promise\.all\(jobs\),wait\(1500\)\]\);/);
  /* Après le montage, la v2 ne fait que remplacer le contenu de places réservées : aucune insertion, aucun retrait. */
  assert.doesNotMatch(noComments(v2), /insertAdjacent|\.after\(|\.before\(|\.prepend\(|\.append\(|\.appendChild\(|\.remove\(\)|replaceWith|scrollIntoView|scrollTo\(|scrollTop/);
  /* Niveau changé : la rubrique « Bon aujourd’hui » est remplie à sa place (elle existe toujours, cachée sans candidat). */
  assert.match(fn('goodSection'), /<section class="ac-sec ac-good hf-foryou" data-hf="bon" aria-labelledby="acGoodT"\$\{inner\?'':' hidden'\}>/);
  assert.match(fn('relevelV2'), /sec\.innerHTML=inner;sec\.hidden=!inner;/);
  for (const f of ['fillGood', 'paintLive', 'syncMine', 'lateV2', 'syncTop', 'relevelV2']) assert.doesNotMatch(fn(f), /feed\.innerHTML|\.hf-feed'\)\.innerHTML/, f + ' ne refait pas le fil');
  /* Données arrivées après la levée : seules les pastilles des cartes du mois changent. */
  assert.match(feed, /if\(!Boot\|\|!Boot\.lifted\)\{mount\(\);ready\(\);return;\}\n    if\(V2\)\{lateV2\(\);return;\}/);
});

test('aucun saut : places réservées pour les conditions, les lignes, les pastilles et les photos', () => {
  assert.match(ui, /\.ocean-v2 \.ui-live\{display:grid;gap:6px;align-content:center;min-width:0;min-height:50px\}/);
  assert.match(ui, /\.ocean-v2 \.ui-live \.ui-cond\{flex-wrap:nowrap;min-height:18px;overflow:hidden\}/);
  assert.match(ui, /\.ocean-v2 \.ui-live \.ui-verdict\{flex-wrap:nowrap;min-height:26px;overflow:hidden\}/);
  /* Le verdict trop long se réduit, il ne passe jamais à la ligne. */
  const c = load('home-feed.js', ['fitLive'], {});
  const verdict = w => { const v = { dataset: {}, clientWidth: 200, removeAttribute(k) { if (k === 'data-fit') delete this.dataset.fit; } }; Object.defineProperty(v, 'scrollWidth', { get: () => w[+v.dataset.fit || 0] }); return v; };
  const run = w => { const v = verdict(w); c.fitLive({ querySelector: () => v }); return v.dataset.fit; };
  assert.equal(run([180, 180, 180]), undefined);
  assert.equal(run([260, 195, 195]), '1');
  assert.equal(run([300, 240, 190]), '2');
  /* Lignes de « Bon aujourd’hui » : réservées au montage (même hauteur qu’une ligne), remplies à l’arrivée. */
  assert.match(fn('goodInner'), /Array\.from\(\{length:goodN\},waitRow\)\.join\(''\)/);
  assert.match(v2, /const waitRow=\(\)=>`<div class="ui-spot is-wait" aria-hidden="true"><span class="ui-ph"><\/span>/);
  /* Cartes du mois : proportion fixe, pastilles à hauteur fixe (l’eau du mois peut arriver après). */
  assert.match(css, /\.ocean-v2 \.ac-card\{[^}]*aspect-ratio:3\/4/);
  assert.match(css, /\.ocean-v2 \.ac-card-chips\{display:flex;gap:5px;height:23px;overflow:hidden\}/);
  assert.match(css, /\.ocean-v2 \.ac-top \.hf-noel-top\{[^}]*height:20px/);
  /* Chiffres : la largeur finale est gardée pendant qu’ils montent, calés à gauche. */
  assert.match(ui, /\.ocean-v2 \.ui-cond \.ui-n\{display:inline-block;text-align:start\}/);
  /* Images : paresseuses et décodées hors du fil principal sous le premier écran ; srcset de l’app. */
  assert.match(fn('monthCard'), /<img src="\$\{esc\(p\.thumb\)\}"\$\{sharp\(p,'300px'\)\} alt="" loading="lazy" decoding="async">/);
  assert.match(fn('spotRow'), /decoding="async"\$\{eager\?'':' loading="lazy"'\}/);
});

/* ---------- Vie et mouvement réduit ---------- */
function keyframes(src) {
  const out = {};
  for (const m of src.matchAll(/@keyframes\s+([\w-]+)\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)) out[m[1]] = [...m[2].matchAll(/\{([^{}]*)\}/g)].flatMap(x => x[1].split(';').map(d => d.split(':')[0].trim()).filter(Boolean));
  return out;
}
test('vie : entrée une seule fois, en fondu et glissé décalés ; transform et opacity seulement ; aucune boucle', () => {
  for (const [file, src, names] of [['ui-accueil.css', css, ['ac-in', 'ac-fade']], ['ui-v2.css', ui, ['ui-arrive', 'ui-pop']]]) {
    const kf = keyframes(noComments(src));
    for (const n of names) { assert.ok(kf[n], file + ' : @keyframes ' + n); for (const p of kf[n]) assert.ok(p === 'opacity' || p === 'transform', `${n} : ${p}`); }
    assert.doesNotMatch(noComments(src), /infinite|will-change/, file + ' : aucune boucle permanente, aucun calque forcé');
    for (const m of noComments(src).matchAll(/animation:[^;}]*?(\d*\.?\d+)s/g)) assert.ok(+m[1] <= 0.5, file + ' : animation de 500 ms au plus');
    for (const m of noComments(src).matchAll(/transition:([^;}]*)/g)) assert.match(m[1], /^(transform|opacity|none)\b/, file + ' : transition de transform ou d’opacity seulement (' + m[1] + ')');
  }
  /* Entrée décalée de 35 ms par rang, jouée à la levée du rideau (classe ac-go), retirée ensuite. */
  assert.match(css, /\.ocean-v2 #home\.ac-go \.ac-in\{animation:ac-in \.44s [^;]+ backwards;animation-delay:calc\(var\(--s,0\) \* 70ms \+ var\(--i,0\) \* 35ms\)\}/);
  const enter = fn('enterV2');
  assert.match(enter, /if\(entered\)return;entered=true;/, 'une seule fois');
  assert.match(enter, /home\.classList\.add\('ac-go'\);setTimeout\(\(\)=>home\.classList\.remove\('ac-go'\),1400\)/);
  assert.match(feed, /Boot\?\.after\(\(\)=>\{lastTouch=Date\.now\(\);watchPlanet\(\);if\(V2&&built\)enterV2\(\);\}\);/, 'à la levée du rideau, jamais avant');
  /* Chiffres qui montent et pastilles en douceur, à l’arrivée des conditions. */
  assert.match(fn('showLive'), /el\.classList\.add\('ui-arrive'\);\n?\s*Verdict\.animate\(el\);/);
  assert.match(ui, /\.ocean-v2 \.ui-arrive \.ui-verdict>b\{animation:ui-pop \.32s/);
  /* Aucune minuterie répétée ni boucle d’images dans la v2 de l’accueil. */
  assert.doesNotMatch(noComments(v2), /setInterval|requestAnimationFrame/);
});

test('mouvement réduit : ni entrée, ni chiffres qui montent, ni fondu (réglage du téléphone et réglage de l’app)', () => {
  const enter = fn('enterV2');
  assert.match(enter, /const calm=matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\|\|body\(\)\.classList\.contains\('reduce-motion'\);\n\s*if\(!calm\)\{home\.classList\.add\('ac-go'\)/);
  const media = src => [...noComments(src).matchAll(/@media \(prefers-reduced-motion:reduce\)\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)].map(m => m[1]).join('\n');
  const klass = src => noComments(src).split('\n').filter(l => l.includes('.reduce-motion')).join('\n');
  for (const part of [media(css), klass(css)]) {
    for (const sel of ['#home.ac-go .ac-in', '#home .ac-row-in', '.ac-quiz .cult-quiz-choices', '.ac-quiz .cult-quiz-done']) assert.ok(part.includes(sel), 'ui-accueil.css : ' + sel);
    assert.match(part, /animation:none/);
    assert.match(part, /\.ac-quiz-pic>img[^{]*\{transition:none\}/);
  }
  for (const part of [media(ui), klass(ui)]) {
    assert.ok(part.includes('.ui-arrive'), 'ui-v2.css : .ui-arrive');
    assert.match(part, /\.ui-arrive \.ui-verdict>b\{animation:none\}/);
  }
  /* Filet général de l’app (design.css) : toute animation est coupée dans les deux cas. */
  assert.match(read('design.css'), /animation:none!important/);
});

/* ---------- Noël ---------- */
test('Noël : les crochets de noel.css sont gardés, rien n’y est imité ; l’Avent du 1er au 24 décembre seulement', () => {
  /* Bandeau : mêmes éléments (.hf-noel-top, .hf-noel-garland, .hf-noel-title), posés sous le salut. */
  assert.match(feed, /<div class="hf-noel-top"><span class="hf-noel-garland" aria-hidden="true"><\/span><p class="hf-noel-title">/);
  assert.match(feed, /const head=V2&&\$\('\.ac-head',top\);if\(head\)head\.after\(t\.firstElementChild\);else top\.prepend\(t\.firstElementChild\);/);
  /* Titres de section : .as-sec et h2 (flocons et houx de noel.css), .hf-avent, .cult-home, .hf-foryou. */
  const noel = read('noel.css');
  for (const hook of ['#home .as-sec::before', '#home .hf-avent .as-sec h2::after', '#home .cult-home>.as-sec h2::after', '.hf-noel-garland']) assert.ok(noel.includes(hook), 'noel.css : ' + hook);
  for (const f of ['mineSection', 'goodInner', 'monthSection', 'culturesV2', 'adventV2']) assert.match(fn(f), /<div class="as-sec ui-head[^"]*"[^>]*><h2 class="ui-title"/, f);
  assert.match(fn('culturesV2'), /<section class="ac-sec cult-home"/);
  assert.match(fn('adventV2'), /<section class="ac-sec hf-avent"/);
  assert.match(fn('goodSection'), /<section class="ac-sec ac-good hf-foryou"/);
  /* Marge au-dessus des titres : 30 px, la place des flocons (23 px) et du houx (25 px). */
  assert.match(css, /\.ocean-v2 \.ac-sec\{margin:calc\(var\(--ui-gap\) \+ 4px\) 0 0\}/);
  assert.match(ui, /--ui-gap:26px/);
  /* Rien du décor n’est refait ici : ni image de Noël, ni règle sous html.ob-noel. */
  assert.doesNotMatch(noComments(css) + noComments(ui.slice(ui.indexOf('Ajouts du 20 novembre'))), /ob-noel|assets\/noel|--noel-/);
  /* Avent : une carte compacte, seulement quand le calendrier est ouvert (adventDays : du 1er au 24 décembre). */
  const a = fn('adventV2');
  assert.match(a, /const days=NM\.adventDays\(noel\.date\);if\(!days\)return '';/);
  assert.doesNotMatch(a, /adventSoon/);
  assert.match(a, /<div class="ui-card ac-avent ac-in"/);
  const NM = require('../noel-model.js');
  assert.equal(NM.adventDays(new Date(2026, 10, 30, 12)), null, '30 novembre : pas de carte');
  assert.equal(NM.adventDays(new Date(2026, 11, 1, 12)).length, 24, '1er décembre : la carte');
  assert.equal(NM.adventDays(new Date(2026, 11, 25, 12)), null);
});

/* ---------- Ordinateur ---------- */
test('ordinateur (960 px et plus) : deux colonnes', () => {
  const desk = /@media\(min-width:960px\)\{((?:[^{}]*\{[^{}]*\})*)\s*\}/.exec(noComments(css.slice(css.indexOf('Ordinateur (960'))))[1];
  assert.match(desk, /\.ocean-v2 #home \.hf-feed\{display:grid;grid-template-columns:repeat\(2,minmax\(0,560px\)\)/);
  assert.match(fn('renderV2'), /cols\.map\(c=>`<div class="ac-col">\$\{c\.map\(k=>B\[k\]\|\|''\)\.join\(''\)\}<\/div>`\)/);
});

test('tablette (700 à 959 px) : une colonne de 640 px au centre', () => {
  const tab = /@media\(min-width:700px\) and \(max-width:959px\)\{([^{}]*\{[^{}]*\})\s*\}/.exec(noComments(css));
  assert.ok(tab, 'règle tablette présente');
  assert.match(tab[1], /\.ocean-v2 #home \.ac-top,\.ocean-v2 #home \.hf-feed\{max-width:640px!important;margin-left:auto!important;margin-right:auto!important\}/);
});

/* ---------- Textes ---------- */
test('textes : chaque texte de la v2 est une clé du dictionnaire, traduite en anglais et en espagnol', () => {
  const fr = new Set(JSON.parse(read('locales/source/fr.json'))), en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json'));
  const keys = ['Mes spots', 'Modifier', 'Bon aujourd’hui', 'Tout voir', 'En {0}', 'En saison', 'Pour toi aujourd’hui', 'Cultures', 'Mot du jour', 'Deviner le pays', 'Tour du monde', 'Trouver un spot', 'spots à explorer',
    'Où veux-tu aller ?', 'Calendrier de l’Avent', 'Mon sport', 'Modifier mon sport et mon niveau', 'Danger {0} sur 4', 'Trouve ton spot', 'Bonjour', 'Bonsoir', 'Bon après-midi'];
  for (const k of keys) {
    assert.ok(fr.has(k), 'source FR : ' + k);
    assert.ok(typeof en[k] === 'string' && en[k].trim(), 'EN : ' + k);
    assert.ok(typeof es[k] === 'string' && es[k].trim(), 'ES : ' + k);
  }
  /* Aucun texte en dur hors de la chaîne : tout texte français écrit entre deux balises ou dans un attribut lu
     (aria-label, title) du bloc v2 est une clé extraite. */
  const code = noComments(v2);
  const shown = [...code.matchAll(/>([^<>`]*[A-Za-zÀ-ÿ][^<>`]*)</g)].map(m => m[1].trim())
    .concat([...code.matchAll(/(?:aria-label|title)="([^"]*)"/g)].map(m => m[1].trim()))
    .filter(s => s && !/^\$\{[^{}]*\}$/.test(s) && /[A-Za-zÀ-ÿ]{2}/.test(s.replace(/\$\{[^{}]*\}/g, '')));
  assert.ok(shown.length >= 12, 'le relevé trouve les textes (' + shown.length + ')');
  let seen = 0;
  for (const s of shown) {
    let n = 0; const key = s.replace(/\$\{(?:[^{}]|\{[^{}]*\})*\}/g, () => '{' + (n++) + '}');
    if (/[;=()'|&\[\]]|\$\{/.test(key)) continue;   // du code entre un « > » et un « < » (comparaisons), pas un texte affiché
    seen++;
    assert.ok(fr.has(key) || fr.has(s) || /^\{\d\}(, \{\d\})?$/.test(key), 'texte hors dictionnaire : « ' + s + ' » (' + key + ')');
  }
  assert.ok(seen >= 10, 'textes affichés relevés : ' + seen);
  /* Assemblages écrits dans la langue avant d’être posés (un assemblage n’est pas une clé) : marqués data-no-i18n. */
  for (const a of ['data-ac-date data-no-i18n', 'data-ac-hi data-no-i18n', 'data-ac-me-tx data-no-i18n']) assert.ok(v2.includes(a), a);
  assert.match(fn('meText'), /tr\(String\(sportLabel\(sp\)\)\.replace\(\/\\s\*\\\(\.\*\\\)\/,''\)\)/);
  /* Ni flèche ni tiret décoratif, ni mention d’IA. */
  assert.doesNotMatch(code, /[→←↗»«]\s*<|—|–|\bIA\b|intelligence artificielle/);
});

test('lisibilité : aucun texte sous 12 px dans les feuilles de la v2', () => {
  for (const [file, src, least] of [['ui-accueil.css', css, 12], ['ui-v2.css', ui, 4]]) {
    /* Tailles écrites en px dans font / font-size, et jetons de corps de ui-v2.css (--ui-note, --ui-label…). */
    const sizes = [...noComments(src).matchAll(/font(?:-size)?:([^;}]*)/g)].flatMap(m => [...m[1].matchAll(/(\d*\.?\d+)px/g)].slice(0, 1).map(x => +x[1]))
      .concat([...noComments(src).matchAll(/--ui-(?:num|num-s|unit|title|label|text|note):(\d*\.?\d+)px/g)].map(m => +m[1]));
    assert.ok(sizes.length >= least, file + ' : ' + sizes.length + ' tailles lues');
    assert.ok(Math.min(...sizes) >= 12, file + ' : ' + Math.min(...sizes) + ' px');
  }
});

test('feuilles : ui-accueil.css chargée après ui-v2.css et avant fiche.css ; couleurs du thème seulement', () => {
  const at = f => html.indexOf(`href="${f}`);
  assert.ok(at('ui-v2.css') > 0 && at('ui-v2.css') < at('ui-accueil.css') && at('ui-accueil.css') < at('fiche.css'));
  assert.ok(at('cultures.css') < at('ui-accueil.css') && at('fiches-organisation.css') < at('ui-accueil.css'), 'les règles de la carte Cultures passent après celles du jeu');
  assert.ok(css.startsWith('/* @creme-tokens */'));
  assert.doesNotMatch(noComments(css), /#[0-9a-fA-F]{3,8}\b(?![^{]*\{)|rgba?\(|hsla?\(/);
});
