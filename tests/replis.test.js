/* Moins d’informations d’un coup (replis.js, replis.css) : fiche spot en sommaire de sections repliées, trophées,
   figures du jeu et « Pourquoi ça compte » repliés ; sécurité et sources toujours atteignables ; textes traduits. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const js = read('replis.js'), css = read('replis.css'), html = read('index.html');

/* Groupes de la fiche, lus dans replis.js. */
const groupsSrc = js.slice(js.indexOf('const GROUPS = ['), js.indexOf('const infos = '));
const groups = [...groupsSrc.matchAll(/\{ id: '(\w+)', title: '([^']+)', sub: '([^']+)', members: \[([^\]]+)\] \}/g)]
  .map(m => ({ id: m[1], title: m[2], sub: m[3], members: m[4].split(',').map(s => s.trim().replace(/^'|'$/g, '')) }));

test('fiche : quatre sections, chaque membre replié par CSS quand sa section est fermée', () => {
  assert.deepEqual(groups.map(g => g.id), ['lieu', 'pratique', 'autour', 'images']);
  for (const g of groups) {
    const rule = css.match(new RegExp(`:not\\(\\[data-open~="${g.id}"\\]\\)>:is\\(([^)]+)\\)`));
    assert.ok(rule, 'règle de repli : ' + g.id);
    assert.deepEqual(rule[1].split(',').sort(), [...g.members].sort(), 'mêmes membres en JS et en CSS : ' + g.id);
    assert.match(css, new RegExp(`\\.obf-head\\[data-obf-group="${g.id}"\\]\\{order:`), 'tête ordonnée : ' + g.id);
  }
  assert.match(css, /\{display:none!important\}/);
});

test('fiche : la sécurité reste visible ou à un toucher, les sources restent dans leur section', () => {
  const folded = groups.flatMap(g => g.members).join(' ');
  for (const s of ['#dBefore', '.d-before', '#dDangers', '#dEmerg', '#dCall', 'securite', '#spotSafetyLive', '#dLogBtn']) assert.ok(!folded.includes(s), 'jamais replié : ' + s);
  /* Le danger principal reste lisible en entier dans « Avant d’y aller » (son bloc détaillé est dans « Infos pratiques »). */
  assert.match(css, /#detail \.d-before \.db-danger-text\{-webkit-line-clamp:3\}/);
  assert.ok(groups.find(g => g.id === 'pratique').members.includes('#fieldMainDanger'), 'danger principal replié, pas retiré');
  assert.ok(groups.find(g => g.id === 'pratique').members.includes('#fieldVisit'), 'règles locales et leurs sources : dans « Infos pratiques »');
  /* « Quand partir ? » n’est masqué que dans l’onglet « Le spot » (il double la ligne Saison et l’onglet Saisons). */
  assert.match(css, /dcat\[data-cat="infos"\]\.field-overview>#dSeasonTeaser\{display:none\}/);
  assert.match(html, /<div class="dcat" data-cat="saisons"[^>]*><div id="dSeasons"/, 'l’onglet Saisons garde le détail');
});

test('fiche : têtes accessibles (bouton, aria-expanded, aria-controls), raccourcis qui ouvrent la bonne section', () => {
  assert.match(js, /head\.type = 'button'/);
  assert.match(js, /setAttribute\('aria-expanded', 'false'\)/);
  assert.match(js, /setAttribute\('aria-controls', list\.join\(' '\)\)/);
  /* Phase de capture : la section s’ouvre avant le défilement du module (« Dès … la nuit », aide du vent). */
  assert.match(js, /\[data-guide-jump\][\s\S]*reveal\(document\.getElementById\(jump\.dataset\.guideJump\)\)[\s\S]*\}, true\);/);
  assert.match(js, /\[data-im-open\],#imWeatherHelp/);
  /* Nouveau spot : tout replié ; état jamais enregistré. */
  assert.match(js, /lastSpot = cur; closeAll\(\);/);
  assert.doesNotMatch(js, /localStorage|sessionStorage/);
});

test('stabilité : replis.js ne touche ni à l’accueil ni à la barre d’onglets ; animations en transform et opacité', () => {
  assert.doesNotMatch(js, /#home|\.nav\b|homeTabs|hf-feed/);
  const kf = [...(css + read('organisation.css')).matchAll(/@keyframes obFoldIn\{([^}]*\})\}/g)].map(m => m[1]);
  assert.ok(kf.length >= 1);
  for (const k of kf) assert.doesNotMatch(k.replace(/opacity|transform|translateY\([^)]*\)|from|to|[{}:;0-9.\spx-]/g, ''), /\w/, 'seulement opacity et transform');
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /var\(--ob-snap/);
  assert.doesNotMatch(css, /--ob-[\w-]+\s*:/, 'aucune nouvelle variable de mouvement (celles de motion.css)');
  /* Ordre de chargement : après field-guide.css (ordre de l’onglet) ; script en fin de page. */
  assert.ok(html.indexOf('href="replis.css') > html.indexOf('href="field-guide.css'));
  assert.ok(html.indexOf('src="replis.js') > html.indexOf('src="field-guide.js'));
});

test('profil, jeu, défis : replis à un toucher, rien de retiré', () => {
  const badges = read('badges.js');
  assert.match(badges, /data-obf aria-expanded="\$\{unfolded\}" aria-controls="tbAll"/);
  assert.match(badges, /id="tbAll"\$\{unfolded\?'':' hidden'\}><div class="tb-tiers">\$\{tiers\}<\/div>\$\{groups\}/, 'raretés et médailles dans le repli');
  /* La fonction open(id) de la vitrine (fiche d’un trophée) ne doit pas être masquée par une variable locale. */
  const shelf = badges.slice(badges.indexOf('function renderShelf(){'), badges.indexOf('function hideQuizBlock'));
  assert.doesNotMatch(shelf, /\b(var|let|const)\s+[^;]*\bopen\s*=/, 'pas de variable « open » dans renderShelf');
  const surf = html.slice(html.indexOf('id="sfHowT"'), html.indexOf('<div style="height:22px"></div>', html.indexOf('id="sfHowT"')));
  assert.equal((surf.match(/<li>/g) || []).length, 18, 'les 18 figures sont toujours là');
  assert.match(surf, /aria-controls="sfHowMore"/);
  assert.match(surf, /<ul class="sf-how obf-zone" id="sfHowMore" hidden>/);
  assert.match(css, /\.obf-zone\[hidden\]\{display:none!important\}/);
  assert.match(read('app.js'), /<details class="chal-why"><summary>\$\{uic\('feuille'\)\}<b>Pourquoi ça compte<\/b><\/summary><span>\$\{ch\.why\}<\/span><\/details>/);
});

test('traductions : nouveaux textes en anglais et en espagnol', () => {
  const en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json')), src = JSON.parse(read('locales/source/fr.json'));
  const keys = ['Dans cette fiche', 'Pourquoi ça compte', 'Tous les trophées', 'Toutes les figures', 'La planète, l’immersion, les envies du moment, le mini-jeu et Poulpy', ...groups.flatMap(g => [g.title, g.sub])];
  for (const k of keys) {
    assert.ok(src.includes(k), 'source FR : ' + k);
    assert.ok(typeof en[k] === 'string' && en[k].trim() && en[k] !== k, 'EN : ' + k);
    assert.ok(typeof es[k] === 'string' && es[k].trim() && es[k] !== k, 'ES : ' + k);
  }
});

/* ---------- Autres onglets (17 novembre) : réponse courte, détail replié, sécurité jamais repliée ---------- */
const tabSrc = js.slice(js.indexOf('const TAB_GROUPS = {'), js.indexOf('const tabOf = '));
const tabGroups = {};
for (const m of tabSrc.matchAll(/(\w+): \[([\s\S]*?)\n    \]/g)) {
  tabGroups[m[1]] = [...m[2].matchAll(/\{ id: '(\w+)', title: '([^']+)', sub: '([^']+)', members: \[([^\]]+)\] \}/g)]
    .map(x => ({ id: x[1], title: x[2], sub: x[3], members: x[4].split(',').map(v => v.trim().replace(/^'|'$/g, '')) }));
}

test('onglets : Saisons, Conditions, Préparer et Faune ont leurs sections repliables', () => {
  assert.deepEqual(Object.keys(tabGroups), ['saisons', 'meteo', 'activites', 'faune']);
  assert.deepEqual(tabGroups.saisons.map(g => g.id), ['courbes']);
  assert.deepEqual(tabGroups.meteo.map(g => g.id), ['heures', 'lire']);
  assert.deepEqual(tabGroups.activites.map(g => g.id), ['depart', 'surplace', 'adresses']);
  assert.deepEqual(tabGroups.faune.map(g => g.id), ['photos', 'typiques']);
  /* Un seul système : mêmes têtes (.obf-head, aria-expanded, aria-controls), repli par attribut, jamais retiré du DOM. */
  assert.match(js, /head\.className = 'obf-head'/);
  assert.match(js, /e\.setAttribute\('data-obf-shut', ''\)/);
  assert.match(css, /#detail \.dcat \[data-obf-shut\]\{display:none!important\}/);
  assert.doesNotMatch(js, /\.remove\(\)/, 'aucun bloc retiré');
  /* Les têtes sont reposées après chaque rendu des modules, avant l’affichage. */
  assert.match(js, /new MutationObserver\([\s\S]*queueMicrotask/);
  /* Nouveau spot : tout replié. */
  assert.match(js, /lastSpot = cur; closeAll\(\); closeTabs\(\);/);
});

test('onglets : dangers, secours, urgence et avertissements ne sont jamais repliés', () => {
  const folded = Object.values(tabGroups).flat().flatMap(g => g.members).join(' ');
  for (const s of ['#dDangers', 'securite', '#spotSafetyLive', 'safety', '#dEmerg', '#dCall', '#dRescue', 'bio-warn', '.wx-slots', '#dWeather', '#sdVsNormal', '.wx-week', 'sd-stats', 'sd-flags', 'sd-cal', 'sd-month', 'field-checklist', 'sd-airports'])
    assert.ok(!folded.includes(s), 'jamais replié : ' + s);
  /* Conditions : la lecture de la mer passe sous la semaine ; le bloc Sécurité (onglet voisin) reste entier et visible. */
  const page = read('fiches-organisation.css');
  assert.match(page, /\.dcat\[data-cat="meteo"\]>:is\(\.obf-head\[data-obf-group="lire"\],#sdCoach,#imWeatherHelp\)\{order:2\}/);
  /* Faune : les espèces « À connaître avant de te mettre à l’eau » sont rendues avant les listes repliables. */
  const app = read('app.js'), fauneFn = app.slice(app.indexOf('function renderFaune'), app.indexOf('function bioGridMore'));
  assert.ok(fauneFn.indexOf("À connaître avant de te mettre à l") < fauneFn.indexOf('id="bioObserve"'), 'danger avant « À observer »');
  assert.ok(fauneFn.indexOf('id="bioObserve"') < fauneFn.indexOf('id="bioFlore"'));
  /* Sources : chacune reste dans sa section (normales, observations, aéroports visibles). */
  assert.ok(tabGroups.saisons[0].members.includes('#dSeasons>.sd-src'));
  assert.ok(tabGroups.faune[0].members.includes('#dWild>.sd-src'));
  assert.ok(!folded.includes('#dGo>.sd-src'), 'source des aéroports à côté des aéroports');
  /* Heure par heure : bloc identifié dans spot-experience.js. */
  const exp = read('spot-experience.js');
  assert.match(exp, /class="wx-block wx-hours"/);
  assert.match(exp, /class="wx-block wx-week"/);
});

test('« Avant d’y aller » : une seule invitation au niveau, d’un toucher, cases de hauteur fixe', () => {
  const before = read('spot-before.js');
  assert.equal((before.match(/Choisis ton niveau/g) || []).length, 1, 'une seule invitation');
  assert.match(before, /<button type="button" class="db-level" data-open-level>/);
  assert.match(before, /\[data-open-level\][\s\S]*openSettings\('sport'\)/);
  const page = read('fiches-organisation.css');
  assert.match(page, /#detail \.db-row\.db-half>\.db-v\{min-height:calc\(2 \* 1\.4em\)/);
  assert.match(page, /#detail \.db-row\[data-before="live"\]>\.db-v\{min-height:1\.4em\}/);
});

test('noms composés : un seul utilitaire, deux lignes sans tiret, données intactes', () => {
  const nm = read('spot-name.js'), app = read('app.js'), map = read('ocean-map.js');
  assert.match(nm, /const SEP = ' — '/);
  assert.match(nm, /data-no-i18n/);
  assert.match(app, /SpotName\.set\(document\.getElementById\('dName'\),s\.name\)/);
  assert.match(app, /<h3>\$\{window\.SpotName\?SpotName\.html\(s\.name\):esc\(s\.name\)\}<\/h3>/);
  assert.match(map, /const shortName=s=>window\.SpotName\?SpotName\.short\(s\.name\)/);
  assert.ok(html.indexOf('src="spot-name.js') < html.indexOf('src="ocean-map-model.js'), 'chargé avant la carte');
  /* Le nom affiché sur deux lignes ne change pas les données : la coupe ne lit que s.name, sans l’écrire. */
  assert.doesNotMatch(nm, /\.name\s*=/);
});

test('photos du lieu : rangées dans « Photos et carte » (la photo du haut ouvre déjà la galerie)', () => {
  assert.ok(groups.find(g => g.id === 'images').members.includes('#spotPhotoStrip'));
  assert.match(read('spot-gallery.js'), /\$\('#detail \.dcat\[data-cat="infos"\]'\);if\(tab\)tab\.append\(strip\)/);
});

test('traductions : sections des autres onglets et nouveaux libellés en anglais et en espagnol', () => {
  const en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json')), src = JSON.parse(read('locales/source/fr.json'));
  const keys = [...Object.values(tabGroups).flat().flatMap(g => [g.title, g.sub]), 'Choisis ton niveau pour savoir si ce spot te correspond', 'Dépend de ton niveau', 'Cette semaine'];
  for (const k of keys) {
    assert.ok(src.includes(k), 'source FR : ' + k);
    assert.ok(typeof en[k] === 'string' && en[k].trim() && en[k] !== k, 'EN : ' + k);
    assert.ok(typeof es[k] === 'string' && es[k].trim() && es[k] !== k, 'ES : ' + k);
  }
});
