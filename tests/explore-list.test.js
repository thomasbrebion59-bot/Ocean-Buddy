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
  assert.match(src, /count\.textContent = n === 1 \? `\$\{n\} spot` : `\$\{n\} spots`;/);
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
  assert.deepEqual([...new Set(used)].sort(), ['cached', 'forSpots', 'html']);
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
  assert.equal(calls, 5, 'entrée, glissé, arrivée, départ, fondu des conditions');
  assert.match(src, /move = animate && !calm\(\)/); assert.match(src, /if \(S\.entered\) return; S\.entered = true;\s*if \(calm\(\)\) return;/, 'entrée décalée : une seule fois');
  assert.match(src, /if \(fade && html && !calm\(\)\) it\.live\.animate\(\[\{ opacity: 0 \}, \{ opacity: 1 \}\]/);
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
