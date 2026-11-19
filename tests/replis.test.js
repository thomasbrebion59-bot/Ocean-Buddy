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

test('fiche v2, onglet « Le spot » : deux sections repliées, chaque membre replié par CSS quand sa section est fermée', () => {
  assert.deepEqual(groups.map(g => g.id), ['reperes', 'images']);
  for (const g of groups) {
    const rule = css.match(new RegExp(`:not\\(\\[data-open~="${g.id}"\\]\\)>:is\\(([^)]+)\\)`));
    assert.ok(rule, 'règle de repli : ' + g.id);
    assert.deepEqual(rule[1].split(',').sort(), [...g.members].sort(), 'mêmes membres en JS et en CSS : ' + g.id);
    assert.match(css, new RegExp(`\\.obf-head\\[data-obf-group="${g.id}"\\]\\{order:`), 'tête ordonnée : ' + g.id);
  }
  assert.match(css, /\{display:none!important\}/);
});

test('fiche v2 : la description, l’anecdote, le conseil et les repères pratiques se lisent sans repli ; la sécurité a son onglet', () => {
  const folded = groups.flatMap(g => g.members).join(' ');
  for (const s of ['#dBefore', '#dNow', '#dDanger', '#dDangers', '#dEmerg', '#dCall', 'securite', '#spotSafetyLive', '#dLogBtn', '.field-story', '.anec-block', '.field-tip', '#fieldVisit', '.field-reference']) assert.ok(!folded.includes(s), 'jamais replié : ' + s);
  /* Le danger principal se lit dans l’onglet Sécurité : son doublon de l’onglet « Le spot » n’est plus affiché. */
  assert.match(css, /dcat\[data-cat="infos"\]\.field-overview>#dSeasonTeaser,\n[^{]*dcat\[data-cat="infos"\]\.field-overview>#fieldMainDanger\{display:none!important\}/);
  assert.match(html, /<div class="dcat" data-cat="saisons"[^>]*><div id="dSeasons"/, 'l’onglet Saisons garde le détail');
  /* « Dormir et alentours » : rangé une fois dans « Préparer », retrouvé par ses id. */
  assert.match(js, /const MOVED = \{ activites: \['#fieldOverview', '#guideAround', '#guideSleep', '#fieldNearbyBlock'\] \};/);
  assert.match(js, /if \(el && el\.parentNode !== to\) to\.append\(el\);/, 'rangement idempotent');
});

test('fiche : têtes accessibles (bouton, aria-expanded, aria-controls), raccourcis qui ouvrent la bonne section', () => {
  assert.match(js, /head\.type = 'button'/);
  assert.match(js, /setAttribute\('aria-expanded', 'false'\)/);
  assert.match(js, /setAttribute\('aria-controls', list\.join\(' '\)\)/);
  /* Phase de capture : la section s’ouvre avant le défilement du module (« Dès … la nuit », aide du vent). */
  assert.match(js, /\[data-guide-jump\][\s\S]*reveal\(document\.getElementById\(jump\.dataset\.guideJump\)\)[\s\S]*\}, true\);/);
  assert.match(js, /\[data-im-open\],#imWeatherHelp/);
  /* Nouveau spot : tout replié ; état jamais enregistré sur l’appareil. */
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
  const keys = ['Pourquoi ça compte', 'Tous les trophées', 'Toutes les figures', 'La planète, l’immersion, les envies du moment, le mini-jeu et Poulpy', ...groups.flatMap(g => [g.title, g.sub])];
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

test('onglets : Saisons, Conditions, Préparer et Nature ont leurs sections repliables ; Sécurité n’en a aucune', () => {
  assert.deepEqual(Object.keys(tabGroups), ['saisons', 'meteo', 'activites', 'faune']);
  assert.ok(!('securite' in tabGroups), 'aucun repli dans l’onglet Sécurité');
  assert.deepEqual(tabGroups.saisons.map(g => g.id), ['courbes']);
  assert.deepEqual(tabGroups.meteo.map(g => g.id), ['lire'], 'l’heure par heure est ouverte dans Prévisions');
  assert.deepEqual(tabGroups.activites.map(g => g.id), ['autour', 'depart', 'surplace', 'adresses']);
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

/* ---------- Sécurité jamais repliée (règle du fondateur, finitions-securite) ----------
   Dangers, numéros d’urgence et avertissements de sécurité ne sont jamais repliés ni coupés. Ces tests échouent si
   « Si tu es emporté », la reconnaissance d’un courant ou le danger principal repassent dans un repli, ou si le texte du
   danger d’« Avant d’y aller » est de nouveau tronqué par une règle CSS. */
const M = require('../spot-data-model.js');
const allFolded = () => [...groups, ...Object.values(tabGroups).flat()].flatMap(g => g.members).join(' ');

/* Feuilles de style dans l’ordre de index.html, puis cascade simplifiée (toutes les media queries comptent, au pire). */
const cssFiles = () => [...html.matchAll(/<link[^>]+href="([^"?]+\.css)/g)].map(m => m[1]).filter(f => fs.existsSync(path.join(root, f)));
function splitTop(s, sep) {
  const out = []; let depth = 0, cur = '';
  for (const c of s) { if (c === '(') depth++; if (c === ')') depth--; if (c === sep && depth === 0) { out.push(cur); cur = ''; } else cur += c; }
  out.push(cur); return out.map(x => x.trim()).filter(Boolean);
}
function specificity(sel) {
  let a = 0, b = 0, c = 0, rest = sel;
  rest = rest.replace(/:(is|not|has)\(((?:[^()]|\([^()]*\))*)\)/g, (_, k, arg) => { const best = splitTop(arg, ',').map(specificity).sort((x, y) => (y[0] - x[0]) || (y[1] - x[1]) || (y[2] - x[2]))[0] || [0, 0, 0]; a += best[0]; b += best[1]; c += best[2]; return ' '; });
  rest = rest.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, ' ');
  a += (rest.match(/#[\w-]+/g) || []).length;
  b += (rest.match(/\.[\w-]+|\[[^\]]*\]|(?<!:):[\w-]+/g) || []).length;
  c += (rest.match(/::[\w-]+/g) || []).length + (rest.replace(/\[[^\]]*\]/g, ' ').match(/(?:^|[\s>+~(])([a-z][\w-]*)/gi) || []).length;
  return [a, b, c];
}
function styleRules(css) {
  const out = []; css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let i = 0;
  const walk = (end) => {
    while (i < end) {
      const open = css.indexOf('{', i); if (open < 0 || open >= end) return;
      const head = css.slice(i, open).trim();
      let depth = 1, j = open + 1; while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
      if (/^@(media|supports|layer|container)/.test(head)) { const save = i; i = open + 1; walk(j - 1); i = j; void save; continue; }
      if (!head.startsWith('@')) out.push({ sel: head, body: css.slice(open + 1, j - 1) });
      i = j;
    }
  };
  walk(css.length);
  return out;
}
/* Déclarations qui s’appliquent à un élément dont le dernier composé du sélecteur contient la classe `cls`. */
function cascade(cls) {
  const win = {}; let order = 0;
  for (const f of cssFiles()) for (const r of styleRules(read(f))) for (const sel of splitTop(r.sel, ',')) {
    const parts = splitTop(sel.replace(/\s*([>+~])\s*/g, ' $1 '), ' ').filter(p => !/^[>+~]$/.test(p));
    const last = parts[parts.length - 1] || '';
    /* Une règle réservée à l’état [hidden] (élément volontairement retiré, ex. spot sans surf) ne compte pas. */
    if (!new RegExp(`\\.${cls}(?![\\w-])`).test(last) || /\[hidden\]/.test(last)) continue;
    const spec = specificity(sel); order++;
    for (const d of splitTop(r.body, ';')) {
      const k = d.indexOf(':'); if (k < 0) continue;
      const prop = d.slice(0, k).trim().toLowerCase(), raw = d.slice(k + 1).trim(), imp = /!important$/.test(raw), val = raw.replace(/\s*!important$/, '').trim();
      const cur = win[prop], key = [imp ? 1 : 0, ...spec, order];
      const beats = !cur || key.some((v, n) => v !== cur.key[n]) && (() => { for (let n = 0; n < key.length; n++) if (key[n] !== cur.key[n]) return key[n] > cur.key[n]; return false; })();
      if (beats) win[prop] = { val, key, where: `${f} : ${sel}` };
    }
  }
  return win;
}
function assertNotCut(cls) {
  const w = cascade(cls), v = p => (w[p] ? w[p].val.toLowerCase() : null), at = p => (w[p] ? ` (${w[p].where})` : '');
  assert.ok([null, 'none', 'unset', 'initial'].includes(v('-webkit-line-clamp')), `.${cls} limité en lignes : ${v('-webkit-line-clamp')}${at('-webkit-line-clamp')}`);
  assert.ok([null, 'none', 'unset', 'initial'].includes(v('line-clamp')), `.${cls} line-clamp : ${v('line-clamp')}${at('line-clamp')}`);
  for (const p of ['overflow', 'overflow-y', 'overflow-x']) assert.ok(!['hidden', 'clip'].includes(v(p)), `.${cls} ${p}:${v(p)}${at(p)}`);
  assert.ok([null, 'none'].includes(v('max-height')), `.${cls} max-height:${v('max-height')}${at('max-height')}`);
  assert.ok([null, 'auto'].includes(v('height')), `.${cls} height:${v('height')}${at('height')}`);
  assert.ok(!['nowrap', 'pre'].includes(v('white-space')), `.${cls} white-space:${v('white-space')}${at('white-space')}`);
  assert.ok(v('display') !== 'none', `.${cls} display:none${at('display')}`);
}

test('sécurité jamais repliée : « Si tu es emporté » et « Repérer une baïne ou un courant » visibles sans toucher, à côté de « Dangers & vigilance »', () => {
  const titles = ['Repérer une baïne ou un courant', 'Si tu es emporté'];
  for (const s of ['#sdRip', 'sd-rip', 'securite', '#dDangers']) assert.ok(!allFolded().includes(s), 'jamais replié : ' + s);
  /* Le coach (rendu dans « Lire les conditions », replié) ne les contient plus, quel que soit le niveau ou le sport. */
  assert.deepEqual(M.ripSafety(['surf'], false).map(b => b.h), titles);
  assert.ok(M.ripSafety(['surf'], false).every(b => b.lines.length >= 3 && b.src.length), 'texte complet et sources');
  for (const act of ['surf', 'bodyboard']) for (const level of [null, 'debutant', 'intermediaire', 'expert']) {
    const r = M.coach({ act, level, spot: { dangers: [['🌀', 'Courants de baïne très forts.']] }, live: null, clim: null, m: 0, monthName: 'janvier' });
    for (const l of r.levels) for (const b of l.blocks) assert.ok(!titles.includes(b.h), `${act} / ${level} / ${l.id} : « ${b.h} » est revenu dans le repli`);
  }
  /* spot-data.js les pose juste après le bloc « Dangers & vigilance » (onglet Sécurité). */
  const sd = read('spot-data.js');
  assert.match(sd, /const box = \$\('#dDangers'\)\?\.closest\('\.block'\);/);
  assert.match(sd, /box\.after\(host\);/);
  assert.match(sd, /const blocks = M\.ripSafety\(sports, inland\);/);
  assert.match(sd, /try \{ renderRip\(s\); \} catch \(e\) \{\}/);
  assert.doesNotMatch(sd.slice(sd.indexOf('function renderRip'), sd.indexOf('function renderRip') + 1500), /<details|data-obf/, 'pas de repli dans la carte');
  assert.match(html, /<div class="dcat" data-cat="securite"[^>]*>\s*<div class="block sx-watch"><h3 class="fx-title fx-title-s" id="dDangersTitle">À surveiller<\/h3><div id="dDangers"><\/div><\/div>/);
  /* Fiche v2 : la sécurité a son onglet, dont le panneau s’affiche en entier (aucune vue, aucun repli). */
  assert.match(html, /<button type="button" class="dtab" data-cat="securite" onclick="showDetailCat\('securite'\)">/);
  assert.match(read('app.js'), /const DETAIL_TABS=\['meteo','previsions','securite','infos','saisons','activites','faune'\];/);
  /* Aucune règle ne masque ni ne coupe la carte (hors [hidden], posé seulement quand le spot n’a ni surf ni bodyboard). */
  for (const cls of ['sd-rip', 'sd-rip-part']) assertNotCut(cls);
});

test('sécurité jamais repliée : le danger principal se lit en entier en tête de l’onglet Sécurité et dans l’alerte de Conditions', () => {
  for (const s of ['#dDanger', 'fx-danger', '#dNow', 'fx-alert']) assert.ok(!allFolded().includes(s), 'jamais replié : ' + s);
  const before = read('spot-before.js');
  assert.match(before, /headHost\.id = 'dDanger';[^\n]*\n\s*panel\.prepend\(headHost\);/, 'premier bloc de l’onglet Sécurité');
  assert.match(before, /<p class="fx-danger-text">\$\{esc\(d\.text\)\}<\/p>/, 'texte entier, aucune découpe en JS');
  assert.match(before, /<span class="fx-alert-tx">\$\{esc\(d\.text\)\}<\/span>/, 'alerte : phrase entière');
  assert.match(before, /if \(g\.n == null \|\| g\.n < 3\) return '';/, 'alerte seulement à partir de 3 sur 4');
  assert.match(before, /d\.basis === 'carnet' \? '<small class="fx-note">Carnet Ocean Buddy, non vérifié<\/small>'/);
  /* Points de danger sur l’onglet lui-même, lus aussi par les lecteurs d’écran. */
  assert.match(before, /tab\.setAttribute\('aria-label', `Sécurité, danger \$\{g\.n\} sur 4`\)/);
  assert.match(html, /<span>Sécurité<\/span><span class="dtab-dots" id="dTabDanger" aria-hidden="true"><\/span>/);
  const fg = read('field-guide.js'), fd = fg.slice(fg.indexOf('function mainDanger(s){'), fg.indexOf('function mapURL'));
  assert.match(fd, /const d=own\[0\]\|\|carnet\[0\];/);
  assert.match(read('spot-fit-model.js'), /const d = own\[0\] \|\| carnet\[0\];/);
  /* CSS : aucune règle gagnante ne limite le texte (line-clamp, max-height, overflow caché, nowrap, hauteur fixe). */
  for (const cls of ['fx-danger-text', 'fx-alert-tx', 'fx-caution']) assertNotCut(cls);
  for (const cls of ['fx-danger', 'fx-alert', 'fx-now']) {
    const w = cascade(cls);
    assert.ok(!w['max-height'] || w['max-height'].val === 'none', `.${cls} max-height (${w['max-height']?.where})`);
    assert.ok(!['hidden', 'clip'].includes(w.overflow?.val), `.${cls} overflow (${w.overflow?.where})`);
  }
});

test('sécurité : « Ton meilleur créneau » sans niveau reprend le bouton court d’« Avant d’y aller » (même composant, même libellé)', () => {
  const exp = read('spot-experience.js'), before = read('spot-before.js');
  assert.match(before, /const levelButton = \(\) => '<button type="button" class="db-level" data-open-level>Choisis ton niveau pour savoir si ce spot te correspond<\/button>';/);
  assert.match(before, /window\.OceanBefore = \{[^}]*\blevelButton\b/);
  assert.match(exp, /if \(rule\.reason === 'level'\) return \{html: `\$\{head\}\$\{window\.OceanBefore\?\.levelButton\?\.\(\) \|\| ''\}`/);
  assert.doesNotMatch(exp, /Choisis ton niveau/, 'plus de troisième consigne');
  assert.doesNotMatch(read('fiches-organisation.css'), /\.wx-level/);
});

test('« Avant d’y aller » : une seule invitation au niveau, d’un toucher, cases de hauteur fixe', () => {
  const before = read('spot-before.js');
  /* Une invitation par onglet : le bouton des Conditions (levelButton) et, depuis la fiche v2 (19 nov.), la pastille
     courte en tête de l’onglet Sécurité. Même action (data-open-level). */
  assert.equal((before.match(/Choisis ton niveau/g) || []).length, 2, 'une invitation par onglet');
  assert.match(before, /fit = '<p class="fx-fit"><button type="button" class="db-level sx-level" data-open-level>Choisis ton niveau<\/button><\/p>'/);
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
  const keys = [...Object.values(tabGroups).flat().flatMap(g => [g.title, g.sub]), 'Choisis ton niveau pour savoir si ce spot te correspond', 'Cette semaine', 'Les prochains jours', 'Toutes les prévisions', 'Voir la sécurité', 'Prévisions'];
  for (const k of keys) {
    assert.ok(src.includes(k), 'source FR : ' + k);
    assert.ok(typeof en[k] === 'string' && en[k].trim() && en[k] !== k, 'EN : ' + k);
    assert.ok(typeof es[k] === 'string' && es[k].trim() && es[k] !== k, 'ES : ' + k);
  }
});

const vm = require('node:vm');

test('description du lieu : ni lieu ni nom répétés au-dessus ; coordonnées après la description', () => {
  /* Affichage seulement, et seulement dans l’onglet « Le spot » : les données restent posées. */
  assert.match(css, /#detail \.dcat\[data-cat="infos"\]>\.field-story>h4\{display:none\}/);
  const fg = read('field-guide.js');
  assert.match(fg, /\$\('#fieldLocation'\)\.textContent=s\.loc;/);
  assert.match(fg, /\$\('#fieldIntroTitle'\)\.textContent=s\.name\.split\(' — '\)\[0\];/);
  assert.match(fg, /<span class="field-eyebrow" id="fieldLocation"><\/span><span id="fieldIntroTitle"><\/span>/);
  /* Coordonnées posées après la description et sa provenance (ordre du DOM, donc aussi pour les lecteurs d’écran). */
  assert.match(fg, /\$\('#dSource'\)\.insertAdjacentHTML\('afterend','<div class="field-coordinates" id="fieldCoordinates"><\/div>'\);/);
  assert.doesNotMatch(fg, /insertAdjacentHTML\('afterbegin','<div class="field-coordinates"/);
  assert.match(html, /<p id="dDesc"><\/p><p class="spot-provenance" id="dSource"><\/p>/);
  assert.match(css, /\.field-story>\.field-coordinates\{margin:14px 0 0\}/);
});

/* Retour vers une fiche quittée pour une autre : ses sections se rouvrent comme on les avait laissées. */
function leaveEnv() {
  const src = js.slice(js.indexOf('  let lastSpot = null;'), js.indexOf('  /* Fiche déjà ouverte au chargement de ce script'));
  const infosTab = { dataset: { open: '' }, querySelector: () => ({}) };
  const tabs = { saisons: { dataset: { open: '' } }, meteo: { dataset: { open: '' } } };
  const calls = [];
  const ctx = {
    currentSpot: null, restoring: false, handler: null, infosTab, tabs,
    window: { addEventListener: (n, fn) => { if (n === 'ocean:navigate') ctx.handler = fn; }, OceanNavigation: { restoreScroll: () => (ctx.restoring ? 0 : null) } },
    GROUPS: [{ id: 'lieu' }, { id: 'pratique' }, { id: 'autour' }, { id: 'images' }], TAB_GROUPS: { saisons: [], meteo: [] },
    infos: () => infosTab, tabOf: cat => tabs[cat], mount: () => infosTab, mountTab: cat => calls.push('mountTab:' + cat),
    setGroup: (id, open) => { const set = new Set(infosTab.dataset.open.split(/\s+/).filter(Boolean)); if (open) set.add(id); else set.delete(id); infosTab.dataset.open = [...set].join(' '); },
    closeAll: () => { infosTab.dataset.open = ''; }, closeTabs: () => { for (const c in tabs) tabs[c].dataset.open = ''; }
  };
  vm.runInNewContext(src, ctx);
  const open = (spot, restoring = false) => { ctx.currentSpot = spot; ctx.restoring = restoring; ctx.handler({ detail: 'detail' }); ctx.restoring = false; };
  return { ctx, open, infosTab, tabs };
}

test('retour vers une fiche déjà vue : ses sections se rouvrent comme on les avait laissées ; un nouveau spot s’ouvre replié', () => {
  const { open, infosTab, tabs, ctx } = leaveEnv();
  open('hossegor');
  assert.equal(infosTab.dataset.open, '', 'première ouverture : tout replié');
  infosTab.dataset.open = 'lieu autour'; tabs.saisons.dataset.open = 'mois';
  /* Un voisin touché dans « Dans les environs » : nouvelle fiche, repliée. */
  open('estagnots');
  assert.equal(infosTab.dataset.open, ''); assert.equal(tabs.saisons.dataset.open, '');
  infosTab.dataset.open = 'images';
  /* Retour : la fiche d’origine retrouve ses sections (donc sa hauteur, donc sa place dans la page). */
  open('hossegor', true);
  assert.deepEqual(infosTab.dataset.open.split(' ').sort(), ['autour', 'lieu']);
  assert.equal(tabs.saisons.dataset.open, 'mois'); assert.equal(tabs.meteo.dataset.open, '');
  /* Avancer : le voisin retrouve les siennes. */
  open('estagnots', true);
  assert.equal(infosTab.dataset.open, 'images'); assert.equal(tabs.saisons.dataset.open, '');
  /* Ouverture ordinaire d’une fiche déjà vue (pas un Retour) : repliée, comme toute nouvelle fiche. */
  open('hossegor');
  assert.equal(infosTab.dataset.open, ''); assert.equal(tabs.saisons.dataset.open, '');
  /* Passage par un autre écran : rien ne change pour la fiche qu’on retrouve. */
  infosTab.dataset.open = 'pratique';
  ctx.handler({ detail: 'home' }); open('hossegor');
  assert.equal(infosTab.dataset.open, 'pratique', 'même spot : état laissé tel quel');
});

test('retour vers une fiche déjà vue : mémoire bornée, jamais enregistrée sur l’appareil, section inconnue ignorée', () => {
  const { open, infosTab } = leaveEnv();
  open('a'); infosTab.dataset.open = 'lieu inconnue';
  for (let i = 0; i < 12; i++) open('s' + i);
  open('a', true);
  assert.equal(infosTab.dataset.open, '', 'au-delà des douze dernières fiches : repliée');
  open('s11'); infosTab.dataset.open = 'lieu inconnue'; open('b'); open('s11', true);
  assert.equal(infosTab.dataset.open, 'lieu', 'une section qui n’existe pas n’est pas rouverte');
  assert.doesNotMatch(js, /localStorage|sessionStorage/);
  /* L’écouteur agit pendant « ocean:navigate », que go() envoie avant de rendre le défilement. */
  const app = read('app.js'), sent = app.indexOf('new CustomEvent("ocean:navigate"');
  assert.ok(sent > 0 && sent < app.indexOf('wrap.scrollTop=window.OceanNavigation?.restoreScroll?.()||0;'), 'replis rouverts avant le défilement');
});
