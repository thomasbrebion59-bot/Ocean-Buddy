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
const groups = [...js.matchAll(/\{ id: '(\w+)', title: '([^']+)', sub: '([^']+)', members: \[([^\]]+)\] \}/g)]
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
