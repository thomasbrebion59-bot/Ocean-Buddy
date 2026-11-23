const test = require('node:test'), assert = require('node:assert/strict');
const { read, i18nContext } = require('./src-extract.cjs');
/* Interface v2, Explorer : la liste d’abord (explore-list.js, ui-listes.css). Calculs purs du module, branchement dans
   app.js et app-shell.js, respect du contrat de OceanVerdict, images, mouvement réduit et textes traduits. */
const M = require('../explore-list.js');
const src = read('explore-list.js'), css = read('ui-listes.css'), app = read('app.js'), shell = read('app-shell.js'), html = read('index.html');

test('tri : bon, puis possible, puis le reste, sans changer l’ordre du classement dans un même rang', () => {
  const v = { b: 'bon', d: 'possible', e: 'bon', f: 'non', g: null };
  assert.deepEqual(M.sortByVerdict(['a', 'b', 'c', 'd', 'e', 'f', 'g'], id => v[id]), ['b', 'e', 'd', 'a', 'c', 'f', 'g']);
  assert.deepEqual(M.sortByVerdict(['a', 'b'], () => null), ['a', 'b'], 'sans verdict connu, l’ordre reçu est gardé');
  assert.equal(M.rank('bon'), 0); assert.equal(M.rank('possible'), 1);
  for (const x of ['non', null, undefined, 'autre']) assert.equal(M.rank(x), 2);
});

test('rendu sans rien déplacer : les lignes présentes gardent leur ordre, les nouvelles suivent', () => {
  assert.deepEqual(M.keepOrder(['c', 'a', 'b'], ['a', 'b', 'c', 'd']), ['c', 'a', 'b', 'd']);
  assert.deepEqual(M.keepOrder(['c', 'a', 'b'], ['b', 'c']), ['c', 'b']);
  assert.ok(M.sameOrder(['a', 'b'], ['a', 'b'])); assert.ok(!M.sameOrder(['a', 'b'], ['b', 'a'])); assert.ok(!M.sameOrder(['a'], ['a', 'b']));
});

test('liste virtualisée : hauteur finale connue d’avance, seules les lignes proches de l’écran sont rendues', () => {
  const g = M.grid({ count: 774, cols: 1, rowH: 140, gap: 10, width: 414 });
  assert.equal(g.height, 774 * 140 + 773 * 10); assert.equal(g.y(0), 0); assert.equal(g.y(3), 450); assert.equal(g.x(3), 0);
  const g2 = M.grid({ count: 5, cols: 2, rowH: 100, gap: 10, width: 410 });
  assert.equal(g2.colW, 200); assert.equal(g2.height, 320); assert.equal(g2.x(1), 210); assert.equal(g2.y(2), 110);
  assert.equal(M.grid({ count: 0, cols: 1, rowH: 100, gap: 10, width: 400 }).height, 0);
  /* Écran de 932 px en haut de la liste : une marge d’un écran après, rien avant. */
  const [a, b] = M.range({ top: 0, view: 932, rowH: 140, gap: 10, cols: 1, count: 774, over: 932 });
  assert.equal(a, 0); assert.ok(b >= 11 && b <= 13, 'environ deux écrans de lignes : ' + b);
  /* Au milieu : une fenêtre courte, jamais les 774 lignes. */
  const [c, d] = M.range({ top: 50000, view: 932, rowH: 140, gap: 10, cols: 1, count: 774, over: 932 });
  assert.ok(c > 300 && d - c < 24);
  assert.deepEqual(M.range({ top: 0, view: 900, rowH: 140, gap: 10, cols: 1, count: 0, over: 900 }), [0, -1]);
  assert.deepEqual(M.range({ top: -5000, view: 900, rowH: 140, gap: 10, cols: 1, count: 50, over: 900 }), [0, -1], 'liste sous l’écran');
  assert.deepEqual(M.range({ top: 900000, view: 900, rowH: 140, gap: 10, cols: 1, count: 50, over: 900 }), [0, -1], 'liste au-dessus de l’écran');
  const [e, f] = M.range({ top: 0, view: 820, rowH: 132, gap: 14, cols: 2, count: 7, over: 820 });
  assert.deepEqual([e, f], [0, 6], 'deux colonnes : la dernière ligne incomplète est comprise');
});

test('colonnes : une sur téléphone, deux ou trois quand chaque ligne garde 400 px', () => {
  assert.deepEqual([359, 414, 714, 884, 1148, 1408, 2400].map(w => M.columns(w, 400, 14)), [1, 1, 1, 2, 2, 3, 3]);
});

test('branchement : chargé avant app.js, renderSpots lui confie la liste, Explorer s’ouvre sur la liste', () => {
  assert.ok(html.indexOf('<script src="explore-list.js') > 0 && html.indexOf('<script src="explore-list.js') < html.indexOf('<script src="app.js'));
  assert.match(app, /window\.OceanExploreList\?\.render\(list,\{keep:!!keep\}\);/);
  assert.match(app, /window\.OceanExploreList\?\.view\(v\);/);
  assert.ok(!/function spotRow\(|function moreSpots\(|function watchMoreSpots\(/.test(app), 'l’ancienne liste par pages est retirée');
  assert.match(app, /var SPOT_PAGE=30, spotShown=SPOT_PAGE;/, 'gardés pour les routes de navigation.js');
  assert.match(app, /var on=!!spotWorld;/, 'une région choisie affiche tout de suite sa liste');
  assert.match(shell, /function toList\(\)\{\s*if\(typeof openWorld!=='function'\)return;\s*if\(spotWorld!=='all'\|\|spotCountry\)openWorld\('all'\);\s*\}/);
  assert.ok(!/setView\('map'\)/.test(shell.slice(shell.indexOf('function toList'), shell.indexOf('const wrapFn'))), 'la planète n’est plus le mode par défaut');
  assert.match(shell, /OceanExploreList\?\.sheetOpen\?\.\(\)\)\{window\.OceanExploreList\.closeSheet\(\);return true;\}/, 'le Retour ferme d’abord la feuille des filtres');
  assert.match(shell, /data-ex="list" aria-label="Voir les spots en liste">.*<span>Liste<\/span><\/button>/, 'mode Carte : retour à la liste écrit en clair');
});

test('en-tête : Explorer, Liste / Carte, recherche, trois pastilles, autres filtres, nombre de résultats', () => {
  assert.match(src, /<h1 class="exl-title">Explorer<\/h1><div class="exl-seg" role="group" aria-label="Affichage des spots"><button type="button" data-exl-view="list" aria-pressed="true">Liste<\/button><button type="button" data-exl-view="map" aria-pressed="false">Carte<\/button>/);
  assert.match(src, /placeholder="Spot, pays, île"/);
  for (const k of ['data-exl="sport"', 'data-exl="level"', 'data-map-plan', 'data-exl="more"']) assert.ok(src.includes(k), k);
  assert.match(src, /const countLabel = v => \{ const t = v === 1 \? `\$\{v\} spot` : `\$\{v\} spots`; return typeof obT === 'function' \? obT\(t\) : t; \};/);
  assert.match(src, /const last = countLabel\(n\);\s*count\.textContent = last;/);
  assert.match(src, /window\.setView\(b\.dataset\.exlView\)/, 'le sélecteur passe par setView : la carte reste celle d’avant');
  /* Les filtres ne sont pas recopiés : la liste lit et change l’état d’app.js, que la carte lit aussi. */
  assert.ok(!/localStorage|sessionStorage/.test(src));
  assert.ok(!src.includes('fetch('), 'aucun appel réseau ici : les chiffres viennent de OceanVerdict');
});

test('lignes .ui-spot : photo, nom, pays, points de danger connus, place réservée aux conditions et au verdict', () => {
  assert.match(src, /<div class="ui-spot exl-row" role="button" tabindex="0" data-spot-id="\$\{esc\(s\.id\)\}"/);
  assert.match(src, /<p class="ui-spot-name"><span translate="no" data-no-i18n>\$\{esc\(nm\.main\)\}<\/span>\$\{dotsHTML\(g\.n, g\.basis\)\}<\/p>/);
  assert.match(src, /<p class="ui-spot-sub">/); assert.match(src, /<div class="exl-live" data-state="wait"><\/div>/);
  assert.match(src, /function dotsHTML\(n, basis\) \{\s*if \(n == null\) return '';/, 'pas de points quand le danger n’est pas connu');
  assert.match(src, /class="ui-dots" role="img" data-n="\$\{k\}" aria-label="\$\{label\}"/);
  /* Images : paresseuses, décodées hors du fil principal, avec srcset comme ailleurs dans l’app. */
  assert.match(src, /<img src="\$\{esc\(photo\)\}"\$\{typeof spotPhotoSrcset === 'function' \? spotPhotoSrcset\(s\.id\) : ''\} sizes="[^"]+" alt="" loading="lazy" decoding="async"/);
  assert.match(src, /window\.openSpot\(row\.dataset\.spotId\)/, 'openSpot lue à l’usage : motion.js l’enveloppe pour le vol de la photo');
  /* Hauteur fixe : une ligne sans donnée garde sa place. */
  assert.match(css, /\.ocean-v2 \.exl-item\{position:absolute;top:0;left:0;[^}]*height:var\(--exl-row\)/);
  assert.match(css, /\.ocean-v2 \.exl-live\{[^}]*height:56px/);
});

test('verdict : strictement le contrat de spot-verdict.js, par lots, pour les lignes visibles ou proches', () => {
  const stub = read('spot-verdict.js');
  for (const k of ['OceanVerdict.forSpots(ids, opts?) -> Promise<Map<id, entrée>>', 'OceanVerdict.cached(id, opts?) -> entrée | null', 'OceanVerdict.html(entrée) -> chaîne HTML']) assert.ok(stub.includes(k), 'contrat inchangé : ' + k);
  assert.ok(!/OceanVerdict\s*=/.test(src), 'la liste n’implémente ni ne remplace OceanVerdict');
  const used = [...src.matchAll(/V\(\)\?\.(\w+)|api\.(\w+)/g)].map(m => m[1] || m[2]);
  /* animate : hors du contrat de base (ajouté par l’accueil pour faire monter les chiffres). La liste ne l’appelle que
     s’il existe ; avec le bouchon ou une implémentation qui ne l’a pas, rien ne manque. */
  assert.deepEqual([...new Set(used)].sort(), ['animate', 'cached', 'forSpots', 'html']);
  assert.match(src, /if \(arrive\) \{ try \{ V\(\)\?\.animate\?\.\(it\.live\); \} catch \(_\) \{\} \}/, 'appel facultatif, jamais bloquant');
  assert.match(src, /const seen = it\.y \+ S\.rowH > S\.viewTop && it\.y < S\.viewTop \+ S\.viewH, still = performance\.now\(\) - scrolledAt > 300;/, 'seulement à l’écran, jamais pendant un défilement');
  assert.equal([...src.matchAll(/\.animate\?\.\(/g)].length, 1);
  assert.ok(!/data-ui-n|ui-n\b/.test(src), 'la liste ne lit ni n’écrit les chiffres du verdict : c’est OceanVerdict qui les anime');
  assert.match(src, /new IntersectionObserver\(list => \{ list\.forEach\(e => \{ if \(e\.isIntersecting && e\.target\.dataset\.spotId\) ask\(e\.target\.dataset\.spotId\); \}\); \}, \{ root: wrap, rootMargin: '60% 0px' \}\)/);
  const batch = +src.match(/BATCH = (\d+)/)[1]; assert.ok(batch >= 6 && batch <= 16);
  assert.match(src, /const ids = \[\.\.\.queue\]\.filter\(id => S\.mounted\.has\(id\)\)\.slice\(0, BATCH\);/);
  assert.match(src, /api\.forSpots\(ids, vOpts\(\)\)/);
  assert.match(src, /if \(performance\.now\(\) - scrolledAt < 200\) \{ flushTimer = setTimeout\(flush, 200\); return; \}/, 'les demandes attendent la fin du défilement');
  /* Champs de l’entrée lus : ceux du contrat. */
  const fields = [...src.matchAll(/entry\.(\w+)|knownEntry\(id\)\?\.(\w+)/g)].map(m => m[1] || m[2]);
  for (const f of new Set(fields)) assert.ok(['now', 'verdict', 'slot', 'day', 'danger', 'at'].includes(f), 'champ hors contrat : ' + f);
});

test('tri jamais sous le doigt : une seule fois après les réponses, si l’écran n’a pas été touché', () => {
  assert.match(src, /function settled\(\) \{\s*if \(!S\.settle \|\| !visible\(\)\) return;\s*if \(S\.touched \|\| Math\.abs\(wrap\.scrollTop - S\.placedY\) > 4\) \{ S\.settle = false; return; \}\s*S\.settle = false;/);
  assert.match(src, /wrap\.addEventListener\('pointerdown', touch, \{ passive: true, capture: true \}\)/);
  assert.match(src, /if \(queue\.size\) \{ if \(!flushTimer\) flushTimer = setTimeout\(flush, 60\); \} else if \(!inflight\) settled\(\);/, 'le tri attend que toutes les réponses demandées soient là');
  assert.match(src, /if \(p\.keep && S\.order\.length\) \{\s*next = M\.keepOrder\(S\.order, S\.base\);/);
});

test('vie et mouvement réduit : transform et opacity seulement, rien si l’utilisateur réduit les animations', () => {
  assert.match(src, /const reduced = \(\) => body\.classList\.contains\('reduce-motion'\) \|\| !!\(window\.matchMedia && matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\);/);
  assert.match(src, /const calm = \(\) => !canAnimate \|\| reduced\(\)/);
  /* Chaque animation est derrière calm() (directement ou par `move`). */
  const calls = [...src.matchAll(/\.animate\(/g)].length;
  assert.equal(calls, 7, 'pastille qui change, choix d’une feuille, glissé, arrivée, départ, entrée, liste vide');
  assert.match(src, /move = animate && !calm\(\)/); assert.match(src, /if \(S\.entered\) return; S\.entered = true;\s*if \(calm\(\)\) return;/, 'entrée décalée : une seule fois');
  /* Arrivée des conditions : une classe, posée seulement hors mouvement réduit et jamais au premier rendu depuis le cache. */
  assert.match(src, /const arrive = !!\(fade && html && seen && still && !calm\(\)\);\s*it\.live\.classList\.toggle\('ui-arrive', arrive\);/);
  assert.match(src, /const known = knownEntry\(it\.id\); if \(known\) paint\(it, known, false\);/);
  /* Elle ne reste que le temps de jouer : une animation CSS rejouerait au retour d’une fiche (élément réaffiché). */
  assert.match(src, /if \(arrive\) \{ const live = it\.live; setTimeout\(\(\) => live\.classList\.remove\('ui-arrive'\), 900\); \}/);
  const props = [...src.matchAll(/\.animate\(\[([^\]]+)\]/g)].flatMap(m => [...m[1].matchAll(/(\w+):/g)].map(x => x[1]));
  for (const p of new Set(props)) assert.ok(['transform', 'opacity'].includes(p), 'propriété animée : ' + p);
  assert.ok(!/setInterval|iterations|infinite/.test(src) && !/infinite/.test(css), 'aucune boucle permanente');
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.ocean-v2 :is\(\.exl-pill,\.exl-more,\.exl-seg button\)\{transition:none\}/);
  assert.match(css, /\.ocean-v2\.reduce-motion :is\(\.exl-pill,\.exl-more,\.exl-seg button\)\{transition:none\}/);
});

test('liste vide et repère de niveau : des actions utiles, « Au-dessus de ton niveau » toujours dit', () => {
  /* Recherche sans résultat : on la garde et on cherche partout, ou on l’efface ; sinon on efface les filtres. */
  assert.match(src, /data-exl="everywhere">Chercher dans tous les spots<\/button>/); assert.match(src, /data-exl="clear-q">Effacer la recherche<\/button>/);
  assert.match(src, /data-exl="reset">Effacer les filtres<\/button>/); assert.match(src, /data-exl="archived">Voir mes favoris archivés<\/button>/);
  assert.match(src, /else if \(t\.closest\('\[data-exl=everywhere\]'\)\) resetAll\(\{ keepSearch: true, sport: true \}\);/);
  /* Repère de sécurité des anciennes lignes, calculé par le même modèle (spot-rank-model.js). */
  assert.match(src, /const aboveLevel = s => !!\(myLevel\(\) && window\.SpotRank && SpotRank\.levelTier\(s\.level, myLevel\(\), gaugeOf\(s\)\.n\) === 0\);/);
  assert.match(src, /\$\{above \? '<span class="exl-warn">Au-dessus de ton niveau<\/span>' : ''\}/);
  const R = require('../spot-rank-model.js');
  assert.equal(R.levelTier('expert', 'debutant', 2), 0); assert.equal(R.levelTier('debutant', 'debutant', 4), 0, 'danger fort pour un débutant');
  assert.equal(R.levelTier('intermediaire', 'intermediaire', 2), 3); assert.equal(R.levelTier('expert', null, 4), 2, 'sans niveau enregistré : pas de repère');
});

test('anciens blocs d’Explorer masqués (ils restent dans la page pour navigation.js), carte inchangée', () => {
  assert.match(css, /\.ocean-v2 #spots>:is\(\.explore-path,#spotsTop,#worldPick,#wBack,#spotTools,#sportFilters\),\s*\.ocean-v2 #listView>:is\(#filters,#sdPlanChip,#spotResultCount,#spotDangerLegend\)\{display:none!important\}/);
  for (const id of ['spotSearch', 'favChip', 'nearBtn', 'exploreSportLabel', 'exploreWorldLabel', 'spotsSub', 'mapView', 'spotList', 'listView']) assert.ok(html.includes(`id="${id}"`), id);
  assert.ok(!/#mapView|\.omap-(?!sr)/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), 'ui-listes.css ne restyle ni la carte ni la planète');
});

test('textes nouveaux d’Explorer : dans la chaîne de traduction, en anglais et en espagnol', () => {
  const fr = JSON.parse(read('locales/source/fr.json')), en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json'));
  for (const k of ['Spot, pays, île', 'Liste', 'Carte', 'Sport', 'Niveau', 'Quand ?', 'Filtres', 'Autres filtres', 'Affichage des spots', 'Danger estimé', '{0} niveaux', '{0} spots', '{0} spot', 'En saison', 'Nouveautés', 'Favoris', 'Près de moi', 'Région', 'Monde', 'Voir les spots', 'Effacer les filtres', 'Voir tous les spots', 'Retirer le filtre {0}', 'Aucun spot ici.', 'Tous les sports', 'Tous les niveaux']) {
    assert.ok(fr.includes(k), 'source FR : ' + k);
    assert.ok(typeof en[k] === 'string' && en[k].trim(), 'EN : ' + k); assert.ok(typeof es[k] === 'string' && es[k].trim(), 'ES : ' + k);
  }
  const t = i18nContext('en');
  assert.equal(t.obT('36 spots'), '36 spots'); assert.equal(t.obT('2 niveaux'), '2 levels'); assert.equal(t.obT('Spot, pays, île'), 'Spot, country, island');
  assert.equal(i18nContext('es').obT('Danger estimé'), 'Peligro estimado');
  /* Aucune chaîne technique (classes, tailles d’image) ne part à la traduction. */
  for (const k of fr) assert.ok(!/exl-|ui-ic|sd-sheet|\(min-width/.test(k), 'clé technique extraite : ' + k);
});

/* ---------- Passe du 23 novembre 2026 ---------- */
test('pastilles sur écran étroit : jamais coupées (compactes, puis mois abrégé, puis sans pictogramme, sinon défilement)', () => {
  /* Le mois porte ses deux libellés ; la feuille de style choisit selon data-fit. */
  assert.match(src, /<b translate="no" data-no-i18n><bdi class="exl-long">\$\{esc\(monthName\(plan\.m\)\)\}<\/bdi><bdi class="exl-short">\$\{esc\(monthShort\(plan\.m\)\)\}<\/bdi><\/b>/);
  /* Aucun <span> dans la pastille du mois : spot-plan.js réécrit le premier <span> de tout bouton [data-map-plan]. */
  const planPill = src.slice(src.indexOf('data-map-plan aria-haspopup="dialog">'), src.indexOf("`<b${own}>${said('Quand ?')}</b>`}</button>"));
  assert.ok(planPill.length > 50 && !/<span/.test(planPill), 'pastille du mois sans <span>');
  assert.match(read('spot-plan.js'), /document\.querySelectorAll\('\[data-map-plan\]'\)\.forEach\(b => \{ b\.classList\.toggle\('on', active\(\)\); const sp = b\.querySelector\('span'\); if \(sp\) sp\.textContent = label\(\); \}\);/);
  assert.match(src, /: `<b\$\{own\}>\$\{said\('Quand \?'\)\}<\/b>`\}/, 'sans mois choisi : « Quand ? » (comportement gardé, question posée au fondateur)');
  /* Les libellés sont écrits dans la langue de l’app avant la mesure : la largeur mesurée est celle qui s’affiche. */
  assert.match(src, /const said = t => esc\(typeof obT === 'function' \? obT\(t\) : t\), own = ' translate="no" data-no-i18n';/);
  for (const k of ['said(scope)', 'said(sportLabel)', 'said(lv)']) assert.ok(src.includes('<b${own}>${' + k + '}</b>'), k);
  const es = i18nContext('es'); assert.equal(es.obT('Quand ?'), '¿Cuándo?'); assert.equal(es.obT('Intermédiaire'), 'Intermedio'); assert.equal(i18nContext('en').obT('Niveau'), 'Level');
  assert.match(src, /const base = innerWidth < 400 \? 1 : 0, key = innerWidth \+ '\|' \+ row\.textContent, known = fits\.get\(key\);/);
  assert.match(src, /for \(let f = base; f <= 3; f\+\+\) \{ pills\.dataset\.fit = String\(f\); if \(row\.scrollWidth <= row\.clientWidth \+ 1\) \{ fit = String\(f\); break; \} \}/);
  /* Une seule mesure par jeu de libellés et par largeur ; rien n’est mesuré quand la liste n’est pas à l’écran. */
  assert.match(src, /if \(known != null\) \{ pills\.dataset\.fit = known; fitDue = false; return; \}/);
  assert.match(src, /if \(!onScreen\(\) \|\| !row\.clientWidth\) \{ pills\.dataset\.fit = String\(base\); fitDue = true; return; \}/);
  assert.match(src, /const onScreen = \(\) => body\.dataset\.screen === 'spots' && listView\.style\.display !== 'none';/);
  assert.match(css, /\.ocean-v2 \.exl-short\{display:none\}/);
  assert.match(css, /\.ocean-v2 \.exl-pills:is\(\[data-fit="2"\],\[data-fit="3"\],\[data-fit=s\]\) \.exl-long\{display:none\}/);
  assert.match(css, /\.ocean-v2 \.exl-pills:is\(\[data-fit="2"\],\[data-fit="3"\],\[data-fit=s\]\) \.exl-short\{display:inline\}/);
  assert.match(css, /\.ocean-v2 \.exl-pills:is\(\[data-fit="1"\],\[data-fit="2"\],\[data-fit="3"\]\) \.exl-scroll\{padding-right:2px;-webkit-mask-image:none;mask-image:none\}/, 'sans débordement, pas de fondu au bord');
  assert.match(css, /\.ocean-v2 \.exl-pills:is\(\[data-fit="3"\],\[data-fit=s\]\) \.exl-pill:is\(\[data-exl=level\],\[data-map-plan\]\)>\.ui-ic\{display:none\}/, 'le sport garde toujours son pictogramme');
  /* Mois abrégés par la langue : jamais une liste écrite à la main. */
  /* Contexte neuf : i18n.js, chargé par d’autres tests, fait écrire les dates « fr-FR » dans la langue choisie. */
  const short = m => require('node:vm').runInNewContext(`(()=>{const t=new Intl.DateTimeFormat('fr-FR',{month:'short'}).format(new Date(2026,${m},15));return t.charAt(0).toUpperCase()+t.slice(1)})()`);
  assert.equal(short(10), 'Nov.'); assert.equal(short(4), 'Mai'); assert.equal(short(8), 'Sept.');
  assert.match(src, /const monthShort = m => \{ const t = new Intl\.DateTimeFormat\(window\.OB_LOCALE \|\| 'fr-FR', \{ month: 'short' \}\)/);
});

test('commandes actives de l’en-tête : le bleu pétrole de la maquette, pas la couleur du sport', () => {
  assert.match(css, /\.ocean-v2 \.exl-head\{[^}]*--exl-on:color-mix\(in srgb,var\(--t-petrol\) 62%,var\(--a-baignade\)\);--exl-on-ink:var\(--t-cream\)\}/);
  assert.match(css, /\.ocean-v2 \.exl-pill\.is-on\{background:var\(--exl-on\);color:var\(--exl-on-ink\)\}/);
  assert.match(css, /\.ocean-v2 \.exl-more\.is-on\{background:var\(--exl-on\);box-shadow:none;color:var\(--exl-on-ink\)\}/);
  assert.match(css, /\.ocean-v2 \.exl-seg::before\{[^}]*background:var\(--exl-on\)/);
  /* Les deux couleurs mélangées sont des constantes de marque, hors des palettes par sport. */
  const theme = read('activity-theme.css'), root = theme.slice(theme.indexOf(':root{'), theme.indexOf('html[data-act="surf"]'));
  const hex = k => root.match(new RegExp(k + ':(#[0-9a-f]{6})'))[1];
  const palettes = theme.slice(theme.indexOf('html[data-act="surf"]'));
  for (const k of ['--t-petrol', '--a-baignade', '--t-cream']) assert.ok(!palettes.includes(k + ':'), k + ' ne change pas avec le sport');
  /* Contraste du texte crème sur ce pétrole : AA (4,5) au moins. */
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  const lum = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
  const a = rgb(hex('--t-petrol')), b = rgb(hex('--a-baignade')), mix = a.map((v, i) => v * .62 + b[i] * .38);
  const ratio = (lum(rgb(hex('--t-cream'))) + .05) / (lum(mix) + .05);
  assert.ok(ratio >= 4.5, 'contraste ' + ratio.toFixed(2));
});

test('sélecteur Liste / Carte : un curseur qui glisse ; nombre de résultats qui défile sans bavarder au lecteur d’écran', () => {
  assert.match(src, /seg\.dataset\.view = map \? 'map' : 'list';/);
  assert.match(css, /\.ocean-v2 \.exl-seg::before\{[^}]*transition:transform \.34s/);
  assert.match(css, /\.ocean-v2 \.exl-seg\[data-view=map\]::before\{transform:translateX\(100%\)\}/);
  /* Le nombre affiché défile ; le texte annoncé (aria-live) ne reçoit que la valeur finale. */
  assert.match(src, /<p class="exl-count"><span class="exl-count-n" translate="no" data-no-i18n aria-hidden="true"><\/span><span class="exl-sr" translate="no" data-no-i18n aria-live="polite"><\/span><\/p>/);
  assert.match(src, /count = \$\('\.exl-count \.exl-sr', head\); countShown = \$\('\.exl-count-n', head\);/);
  assert.match(src, /if \(from == null \|\| from === n \|\| calm\(\) \|\| !onScreen\(\)\) \{ countShown\.textContent = last; return; \}/, 'premier affichage, même valeur, mouvement réduit : la valeur est posée');
  assert.match(src, /if \(!countMany\) countMany = countLabel\(7\);/, 'une seule traduction pendant le défilement du nombre');
  assert.match(src, /if \(calm\(\)\) return;\s*paintCount\(S\.order\.length, 0\);/, 'première entrée : le nombre monte depuis zéro, sauf en mouvement réduit');
  const en = i18nContext('en'); assert.equal(en.obT('7 spots'), '7 spots'); assert.equal(i18nContext('es').obT('1 spot'), '1 spot');
  assert.ok(!/setInterval/.test(src));
});

test('photo d’une ligne : dans un cadre qui garde sa place pendant le vol, fondu à l’arrivée', () => {
  assert.match(src, /`<span class="ui-ph exl-frame"><img src=/);
  assert.match(src, /if \(img && !S\.entered && !img\.complete && !calm\(\)\) \{ img\.classList\.add\('is-wait'\); img\.addEventListener\('load', \(\) => img\.classList\.remove\('is-wait'\), \{ once: true \}\); \}/, 'fondu à la première entrée seulement : jamais en défilant');
  assert.match(css, /\.ocean-v2 \.exl-row>\.exl-frame\{overflow:visible;background:var\(--ui-hair\)\}/, 'cadre sans rognage : pas de masque pendant le défilement');
  assert.match(css, /\.ocean-v2 \.exl-row>\.exl-frame>img\{[^}]*transition:opacity \.3s ease\}/);
  assert.match(css, /\.ocean-v2 \.exl-row>\.exl-frame>img\.is-wait\{opacity:0\}/);
  /* Photo introuvable : jamais un cadre vide, la silhouette du sport. */
  assert.match(src, /frame\.classList\.add\('exl-ph'\);[^;]*; frame\.innerHTML = sportMark\(/);
});

test('arrivée des conditions : chiffres en fondu, pastille qui se pose, heures jamais coupées ; rien en mouvement réduit', () => {
  assert.match(css, /@keyframes exl-arrive\{from\{opacity:0\}\}/);
  assert.match(css, /@keyframes exl-pop\{from\{opacity:0;transform:scale\(\.86\)\}\}/);
  assert.match(css, /\.ocean-v2 \.exl-live\.ui-arrive>\.ui-verdict>b\{animation:exl-pop /);
  assert.match(css, /\.ocean-v2 \.exl-live\.ui-arrive :is\(\.ui-n,small,\.is-none\)\{animation:none\}/, 'une seule animation par élément après la fusion avec l’accueil');
  assert.match(css, /\.ocean-v2 \.exl-row \.ui-verdict>span\{min-width:0;max-height:26px;overflow:hidden;white-space:normal;line-height:13px\}/);
  for (const sel of ['.exl-live.ui-arrive>.ui-cond', '.exl-live.ui-arrive>.ui-verdict>b', '.exl-live.ui-arrive>.ui-verdict>span']) {
    assert.ok(css.includes(`.ocean-v2.reduce-motion ${sel}`), 'body.reduce-motion : ' + sel);
  }
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{[^@]*\.ocean-v2 \.exl-live\.ui-arrive>\.ui-cond,[^{]*\{animation:none\}\}/);
  assert.match(css, /\.ocean-v2\.reduce-motion \.exl-seg::before,\.ocean-v2\.reduce-motion \.exl-row>\.exl-frame>img\{transition:none\}/);
  /* Animations CSS : opacity et transform seulement. */
  for (const k of [...css.matchAll(/@keyframes (?:exl|tv)-[\w-]+\{([^@]*?\})\}/g)]) for (const p of [...k[1].matchAll(/([\w-]+):/g)].map(m => m[1])) assert.ok(['opacity', 'transform'].includes(p), 'propriété animée : ' + p);
});

test('retour d’une fiche : les lignes hors de l’écran sont mises de côté, sans rien mesurer', () => {
  const park = src.slice(src.indexOf('function park() {'), src.indexOf('function unpark() {'));
  assert.match(park, /if \(S\.parked \|\| !S\.grid \|\| !S\.mounted\.size \|\| !S\.viewH\) return;/);
  assert.match(park, /S\.mounted\.forEach\(it => \{ if \(it\.y \+ S\.rowH < a \|\| it\.y > b\) it\.el\.classList\.add\('is-parked'\); \}\);/);
  assert.ok(!/getBoundingClientRect|clientHeight|clientWidth|offset|scrollTop|getComputedStyle/.test(park), 'aucune lecture de mise en page en quittant l’écran');
  assert.match(src, /S\.viewTop = wr\.top - lr\.top; S\.viewH = view;/, 'position connue depuis le dernier défilement');
  assert.match(src, /if \(e\.detail !== 'spots'\) \{ clearTimeout\(parkTimer\); if \(head\) park\(\); return; \}\s*requestAnimationFrame\(\(\) => requestAnimationFrame\(sync\)\);\s*clearTimeout\(parkTimer\); parkTimer = setTimeout\(unpark, 420\);/, 'au retour, elles reviennent après la transition, hors de l’image du retour');
  /* Jamais une ligne vide sous le doigt : elles reviennent tout de suite si l’écran est touché, si la fenêtre des lignes change ou si la liste est reposée. */
  assert.match(src, /const touch = \(\) => \{ S\.touched = true; if \(S\.parked\) unpark\(\); \};/);
  assert.match(src, /if \(key === lastRange\) return; lastRange = key;\s*if \(S\.parked\) unpark\(\);/);
  assert.match(src, /function place\(order, \{ animate = false \} = \{\}\) \{\s*if \(S\.parked\) unpark\(\);/);
  const onScroll = src.slice(src.indexOf("wrap.addEventListener('scroll', () => {"), src.indexOf("const touch = () => {"));
  assert.ok(onScroll.length > 50 && !/unpark|classList/.test(onScroll), 'rien n’est écrit dans la page pendant l’événement de défilement');
  assert.match(css, /\.ocean-v2 \.exl-item\.is-parked\{content-visibility:hidden\}/);
});

test('cartes des deux écrans : blanches à filet, par le jeton commun --ui-surface (repli tant qu’il n’est pas fusionné ici)', () => {
  for (const sel of ['.exl-row', '.exl-empty', '.tv-card', '.tv-empty']) {
    const rule = css.match(new RegExp('\\.ocean-v2 \\' + sel + '\\{[^}]*\\}'));
    assert.ok(rule, sel);
    assert.ok(rule[0].includes('background:var(--ui-surface,var(--t-card));box-shadow:inset 0 0 0 1px var(--ui-hair)'), sel + ' : ' + rule[0].slice(0, 80));
  }
  assert.ok(!/box-shadow:0 10px 22px -20px/.test(css), 'plus d’ombre douce sous les cartes');
  /* ui-v2.css n’est pas modifiée ici : le jeton arrive par la fusion de la branche iv-nav. */
  assert.ok(!read('ui-v2.css').includes('--ui-surface') || /--ui-surface:var\(--t-card\)/.test(read('ui-v2.css')));
});
