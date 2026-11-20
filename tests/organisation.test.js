/* Organisation de l’app : ordre de l’accueil, raccourcis en un geste, repli des rangées (home-layout-model.js),
   plus des garde-fous d’intégration (accueil, Réglages par rubriques, ordre du profil, Défis, traductions). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../home-layout-model.js');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('ordre de l’accueil : six sections au plus, le reste replié sous « Plus d’idées de départ », rien de perdu', () => {
  const o = L.ORDER, f = L.FOLDED, at = k => o.indexOf(k), fat = k => f.indexOf(k);
  assert.equal(o[0], 'pourtoi', '« Pour toi aujourd’hui » ouvre le fil');
  assert.ok(o.length <= 6, 'six sections visibles au plus (le repli compris)');
  assert.equal(o[o.length - 1], 'plus', 'le repli ferme le fil');
  assert.equal(new Set([...o, ...f]).size, o.length + f.length, 'pas de doublon, aucun bloc à la fois visible et replié');
  /* Tous les blocs d’avant restent atteignables : visibles, ou repliés (un toucher). */
  for (const k of ['pourtoi', 'noel', 'mois', 'plan', 'cultures', 'espace', 'planete', 'envies', 'immersion', 'donnees', 'collections', 'nouveautes', 'jeu', 'poulpy']) assert.ok(at(k) >= 0 || fat(k) >= 0, k);
  assert.ok(at('noel') < at('mois') && at('mois') < at('cultures') && at('cultures') < at('espace'), 'Noël, le mois, les cultures puis ton espace');
  assert.ok(fat('envies') < fat('collections'), 'les tuiles « Envies du moment » précèdent les collections');
  assert.ok(fat('plan') === 0, '« Choisis ton mois » ouvre le repli');
  assert.equal(f[f.length - 1], 'poulpy');
});

test('rangées dépliées : seulement celles de ton sport ; collections toujours repliées', () => {
  for (const sp of ['all', null, 'surf', 'plongee', 'kitesurf']) assert.equal(L.railShown('chaud', sp), true, 'mer chaude : ' + sp);
  assert.equal(L.railShown('houle', 'surf'), true);
  assert.equal(L.railShown('houle', 'bodyboard'), true);
  assert.equal(L.railShown('houle', 'all'), true);
  assert.equal(L.railShown('houle', 'plongee'), false, 'pas de houle dépliée pour un plongeur');
  assert.equal(L.railShown('vent', 'surf'), false, 'pas de vent déplié pour un surfeur');
  assert.equal(L.railShown('vent', 'kitesurf'), true);
  assert.equal(L.railShown('vent', 'windsurf'), true);
  for (const c of ['lagons', 'legendes', 'plongees', 'nord', 'debut', 'iles']) assert.equal(L.railShown(c, 'all'), false, c);
});

test('raccourcis : favoris toujours, dernier spot connu, prochain voyage', () => {
  const known = id => ['a', 'b', 'c'].includes(id);
  assert.deepEqual(L.quick({ favs: new Set(), recent: [], known }), [{ kind: 'favs', count: 0 }], 'nouvel utilisateur : seulement « Mes favoris »');
  const q = L.quick({ favs: new Set(['a', 'zz', 'b']), recent: [{ id: 'gone', ts: 2 }, { id: 'c', ts: 1 }], known });
  assert.equal(q[0].count, 2, 'un favori sorti du catalogue ne compte pas');
  assert.deepEqual(q[1], { kind: 'recent', id: 'c' }, 'le premier spot encore au catalogue');
  assert.equal(q.length, 2, 'sans voyage, pas de tuile voyage');
  const t = L.quick({ favs: ['a'], recent: ['b'], known, next: { trip: { id: 't1', name: 'Côte basque' }, when: { state: 'upcoming', days: 12 } } });
  assert.deepEqual(t[2], { kind: 'trip', id: 't1', name: 'Côte basque', state: 'upcoming', days: 12 });
  const u = L.quick({ next: { trip: { id: 't2', name: 'Bali' }, when: { state: 'undated', days: null } } });
  assert.equal(u[1].days, null);
  assert.deepEqual(L.quick(), [{ kind: 'favs', count: 0 }]);
});

const feed = read('home-feed.js'), html = read('index.html'), css = read('organisation.css'), hfcss = read('home-feed.css');

test('accueil : raccourcis posés avec l’ouverture, à hauteur fixe, mis à jour sur place', () => {
  const hero = feed.slice(feed.indexOf('function hero(){'), feed.indexOf('function syncHero'));
  assert.match(hero, /\$\{quickRow\(\)\}/, 'rangée rendue dans l’ouverture (sous le rideau)');
  assert.ok(hero.indexOf('quickRow()') < hero.indexOf('acts()'), 'sous la recherche, avant les activités');
  const sync = feed.slice(feed.indexOf('function syncQuick(){'), feed.indexOf('/* ---------- Fin des raccourcis'));
  assert.match(sync, /row\.innerHTML=h/);
  assert.doesNotMatch(sync, /insertAdjacent|\.after\(|\.before\(|\.remove\(|prepend|append/, 'aucune insertion ni retrait');
  assert.match(css, /\.hf-quick\{[^}]*height:60px/, 'hauteur fixe');
  assert.match(css, /\.hf-q\{[^}]*height:56px/);
  assert.ok(html.indexOf('src="home-layout-model.js') > 0 && html.indexOf('src="home-layout-model.js') < html.indexOf('src="home-feed.js'), 'modèle chargé avant home-feed.js');
  assert.ok(html.includes('href="organisation.css'), 'organisation.css lié');
  assert.match(read('app.js'), /function openFavorites\(\)\{go\('spots'\);try\{openWorld\('all'\);setView\('list'\);if\(!favOnly\)toggleFavFilter\(\);\}catch\(e\)\{\}\}/);
});

test('accueil : un seul ordre (HomeLayout.ORDER), blocs des autres scripts à leur place réservée, repli fermé au départ', () => {
  const render = feed.slice(feed.indexOf('function render(){'), feed.indexOf('function order(){'));
  assert.match(render, /Layout\?\.ORDER/);
  assert.match(render, /Layout\?\.FOLDED/);
  assert.match(render, /B\.plus=plusSection\(FOLDED\.map/, 'les blocs repliés sont posés dans le repli, à la construction (sous le rideau)');
  assert.match(render, /noelSection\(all,used\)[\s\S]*forYouSection\(used\)/, 'mêmes spots qu’avant : Noël puis « Pour toi » calculés dans cet ordre');
  assert.match(feed, /<div class="hf-plus-body" id="hfPlusBody" hidden>/);
  assert.match(feed, /aria-expanded="false" aria-controls="hfPlusBody"/);
  const order = feed.slice(feed.indexOf('function order(){'), feed.indexOf('/* Ouverture (recherche'));
  assert.match(order, /mark\.replaceWith\(el\)/);
  for (const sel of ['#oceanHub', '#obDive', '.field-arrivals', '#poulpySpotlight']) assert.ok(feed.includes(`'${sel}'`), sel);
  /* l’ancien tableau de bord du bas est masqué par CSS dès le premier rendu */
  assert.match(hfcss, /#home\.hf-on #homeTabs,#home\.hf-on \.hcat\{display:none!important\}/);
});

test('Réglages : quatre rubriques dans l’ordre, chaque réglage à sa place', () => {
  const card = html.slice(html.indexOf('<div class="quiz-card set-card">'), html.indexOf('<div class="aqi" id="ecoInfo"'));
  const at = s => card.indexOf(s);
  const groups = ['>Mon profil</h3>', '>Affichage et son</h3>', '>Mes données</h3>', '>À propos</h3>'].map(at);
  assert.ok(groups.every(i => i > 0) && groups.every((v, i) => !i || v > groups[i - 1]), 'Mon profil, Affichage et son, Mes données, À propos');
  assert.ok(at('id="setName"') > groups[0] && at('id="setMine"') > groups[0] && at('id="setMine"') < groups[1]);
  assert.ok(at('id="setLang"') > groups[1] && at('id="setReduce"') > groups[1] && at('id="setNoelRow"') > groups[1] && at('id="setNoelRow"') < groups[2]);
  assert.ok(at('resetProgress()') > groups[2] && at('resetProgress()') < groups[3]);
  assert.ok(at('class="set-about"') > groups[3]);
  /* « Effacer toutes mes données » rejoint « Mes données » ; l’ambiance sonore suit « Réduire les animations ». */
  assert.match(read('privacy.js'), /const reset=document\.querySelector\('#settingsModal \.set-reset'\);\s*if\(reset\)reset\.after\(erase\)/);
  assert.match(read('ocean-sound.js'), /document\.querySelector\('#settingsModal \.set-toggle'\)/);
});

test('Profil : ton sport, ton passeport et tes chiffres avant la vitrine des trophées ; Réglages en bas', () => {
  const prof = html.slice(html.indexOf('<section class="screen" id="profile">'), html.indexOf('<!-- ============ JEU'));
  const at = s => prof.indexOf(s);
  assert.ok(at('id="profMine"') < at('Mes statistiques') && at('Mes statistiques') < at('Mon carnet de sessions') && at('Mon carnet de sessions') < at('Mes trophées'));
  assert.ok(at('id="profSettings"') > at('id="quizBadgesProfile"'), 'entrée Réglages après la vitrine');
  assert.match(read('poulpy.js'), /getElementById\('profSettings'\);if\(profSet\)profSet\.before\(profileCard\)/);
  assert.match(read('app.js'), /favs\.size,'Favoris','openFavorites\(\)'\)/, 'la tuile Favoris ouvre tes favoris');
});

test('Défis : le Quiz juste sous l’en-tête, le bandeau écolo avant les défis écolo', () => {
  assert.match(read('poulpy.js'), /const gsw=document\.querySelector\('#challenges \.gsw'\);if\(gsw\)gsw\.before\(eco\)/);
});

test('états vides : favoris vides avec une action ; textes nouveaux traduits en anglais et en espagnol', () => {
  /* Interface v2 : la liste d’Explorer et son état vide sont dans explore-list.js (bouton relié à toggleFavFilter). */
  const list = read('explore-list.js');
  assert.match(list, /: none \? '<button type="button" class="ui-btn is-soft" data-exl="favs-off">Voir tous les spots<\/button>'/);
  assert.match(list, /if \(t\.closest\('\[data-exl=favs-off\]'\)\) \{ if \(typeof toggleFavFilter === 'function'\) toggleFavFilter\(\); \}/);
  const en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json')), src = JSON.parse(read('locales/source/fr.json'));
  for (const k of ['Mes favoris', 'Reprendre', 'Mon voyage', 'Aucun pour l’instant', 'Accès rapide', 'En voyage', 'Plus d’idées de départ', 'Ton espace', 'Ta semaine, ton prochain départ et tes spots', 'Mon profil', 'Affichage et son', 'Mes données', 'À propos', 'Réglages', 'Prénom, langue, animations, mes données', 'Ouvrir', 'Voir tous les spots', 'Reprendre : {1}']) {
    assert.ok(src.includes(k), 'source FR : ' + k);
    assert.ok(typeof en[k] === 'string' && en[k].trim(), 'EN : ' + k);
    assert.ok(typeof es[k] === 'string' && es[k].trim(), 'ES : ' + k);
  }
});
