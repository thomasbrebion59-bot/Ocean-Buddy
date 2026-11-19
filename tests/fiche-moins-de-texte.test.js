'use strict';
/* 19 nov. 2026, le fondateur devant les planches de la fiche v2 : « il y a trop de texte, tu dois trouver une alternative,
   je veux un site beau et utilisable ». Chaque onglet montre la réponse ; sources, précisions et explications sont à un
   toucher. Jamais derrière un toucher : le niveau de danger, les numéros d’urgence, les dangers du spot, le titre de
   chaque consigne. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const css = read('fiche.css'), replis = read('replis.js'), data = read('spot-data.js'), html = read('index.html');
const M = require('../spot-data-model.js');

test('consignes de courant : un titre de quelques mots toujours affiché, le détail d’un toucher, les sources gardées', () => {
  const blocks = M.ripSafety(['surf'], false);
  assert.deepEqual(blocks.map(b => b.id), ['rip-spot', 'rip-out']);
  for (const b of blocks) {
    assert.ok(b.src.length >= 2, 'sources : ' + b.id);
    for (const ln of b.lines) {
      assert.ok(Array.isArray(ln) && ln.length === 2, 'titre et détail : ' + b.id);
      assert.ok(ln[0].length <= 40 && ln[0].split(' ').length <= 7, 'titre court : ' + ln[0]);
      assert.ok(!/[.:;]$/.test(ln[0]), 'titre sans ponctuation finale : ' + ln[0]);
      assert.ok(ln[1].length > 10 && /\.$/.test(ln[1]), 'détail en phrase : ' + ln[1]);
    }
  }
  /* Le sens des phrases d’origine reste : ne pas lutter, garder la planche, lever un bras, sortir en parallèle de la plage. */
  const out = blocks[1].lines.map(l => l.join(' ')).join(' ');
  for (const w of ['Reste calme', 'Ne lutte pas contre le courant', 'Garde ta planche', 'Lève un bras et appelle', 'nage en parallèle de la plage']) assert.ok(out.includes(w), w);
  const spot = blocks[0].lines.map(l => l.join(' ')).join(' ');
  for (const w of ['sans vagues', 'chenal', 'plus sombre ou trouble', 'baïne', 'marée montante']) assert.ok(spot.includes(w), w);
  assert.equal(M.ripSafety(['surf'], true), null, 'plan d’eau intérieur : pas de consigne de courant');
  /* Rendu : « Si tu es emporté » est une suite d’actions (numérotée), les signes d’un courant non. */
  assert.match(data, /const ordered = b\.id === 'rip-out', tag = ordered \? 'ol' : 'ul';/);
  assert.match(data, /<span class="sx-step-tx"><b>\$\{esc\(lead\)\}<\/b>\$\{more \? `<span class="sx-step-more">\$\{esc\(more\)\}<\/span>` : ''\}<\/span><\/li>/);
  assert.match(data, /\$\{ripSteps\(b\)\}<button type="button" class="fx-more sx-steps-more" data-fx-reveal="\.sd-rip-part">Lire le détail<\/button>\$\{coachSources\(b\.src\)\}<\/div>/);
  /* Le titre de l’étape n’est jamais masqué ; seul le détail attend le toucher. */
  assert.match(css, /#sdRip \.sx-step-more\{display:none;/);
  assert.match(css, /#sdRip \.sd-rip-part\.is-detail \.sx-step-more\{display:block\}/);
  assert.doesNotMatch(css, /\.sx-step-tx b\{[^}]*display:none/);
  assert.doesNotMatch(css, /\.sx-step(-n|-tx)?\{[^}]*(display:none|overflow:hidden|line-clamp)/);
});

test('révéler d’un toucher : le bouton pose .is-detail sur son bloc et s’efface ; rien n’est retiré de la page', () => {
  const fn = replis.slice(replis.indexOf("const b = e.target.closest('#detail button[data-fx-reveal]')"), replis.indexOf('/* Les modules réécrivent leurs blocs'));
  assert.match(fn, /const box = b\.closest\(b\.dataset\.fxReveal\); if \(!box\) return;\n\s+box\.classList\.add\('is-detail'\); b\.hidden = true;/);
  assert.doesNotMatch(fn, /\.remove\(\)|innerHTML/);
  /* Les trois usages : consignes, liste « Avant de partir », gestes pour préserver. */
  assert.match(read('field-guide.js'), /<button type="button" class="fx-more field-check-more" data-fx-reveal="\.field-checklist">Voir le détail des étapes<\/button>/);
  assert.match(read('app.js'), /<button type="button" class="fx-more pres-more" data-fx-reveal="#presBlock">Pourquoi ces gestes \?<\/button>/);
  assert.match(css, /\.field-checklist:not\(\.is-detail\) \.field-check small\{display:none\}/);
  assert.match(css, /#presBlock:not\(\.is-detail\) \.pres-tx p\{display:none\}/);
  /* Le lien « Voir le numéro d’urgence » de la liste reste toujours visible. */
  assert.doesNotMatch(css, /\.field-check-go\{[^}]*display:none/);
});

test('« Sources et précisions » : un seul pied de fiche, pour l’onglet affiché ; les précisions sont copiées, jamais déplacées', () => {
  assert.equal((html.match(/id="dNotes"/g) || []).length, 1);
  assert.ok(html.indexOf('id="dNotes"') > html.indexOf('data-cat="securite" style'), 'après le dernier panneau');
  assert.match(replis, /const cats = tab === 'previsions' \? \['meteo'\] : tab === 'faune' \? \['faune', 'preserver'\] : \[tab\];/);
  /* Une précision masquée par son bloc (section fermée, bloc absent pour ce spot) n’est pas listée ; pas de doublon. */
  assert.match(replis, /if \(n\.hidden \|\| n\.style\.display === 'none' \|\| n\.hasAttribute\('data-obf-shut'\)\) return true;/);
  assert.match(replis, /if \(!k \|\| seen\.has\(k\)\) return false; seen\.add\(k\); return true;/);
  assert.match(replis, /const c = e\.cloneNode\(true\); c\.removeAttribute\('data-fx-note'\); c\.removeAttribute\('id'\);/);
  /* Changement d’onglet ou de fiche : la ligne se referme. Ses propres écritures ne relancent pas le rangement. */
  assert.match(replis, /new MutationObserver\(\(\) => \{ setNotes\(false\); syncNotes\(\); \}\)\.observe\(\$\('#detail'\), \{ attributes: true, attributeFilter: \['data-tab'\] \}\);/);
  assert.match(replis, /if \(notesBox && muts\.every\(m => notesBox\.contains\(m\.target\)\)\) return;/);
  assert.match(replis, /lastSpot = cur; closeAll\(\); closeTabs\(\); setNotes\(false\); syncNotes\(\);/);
  /* Même dessin que les autres sections repliables. */
  assert.match(css, /html \.ocean-v2 #detail :is\(\.dcat,\.fx-notes\) \.obf-head\{min-height:48px;/);
  for (const k of ['Sources et précisions', 'D’où viennent ces informations', 'Lire le détail', 'Une anecdote sur ce spot', 'Valeurs de modèle, à vérifier sur place', 'Sors par le côté', 'Une bande sans vagues'])
    for (const l of ['en', 'es']) { const d = JSON.parse(read(`locales/translations/${l}.json`)); assert.ok(d[k] && d[k] !== k, `${l} : ${k}`); }
});

test('moins de texte : aéroports sur une ligne, pastilles de matériel, photos d’espèces en bande, gestes sur une ligne', () => {
  assert.match(css, /\.dcat\[data-cat="activites"\] \.sd-ap small\{display:none\}/);
  assert.match(css, /#detail \.px-place>p\{display:none\}/);
  assert.match(css, /\.dcat\[data-cat="faune"\] \.sd-species\{display:flex;[^}]*overflow-x:auto;/);
  assert.match(css, /\.dcat\[data-cat="preserver"\] \.pres-tx\{display:grid;grid-template-columns:minmax\(0,1fr\) auto;/);
  /* Les crédits des photos d’espèces restent affichés (licences), comme le nom de chaque espèce. */
  assert.doesNotMatch(css, /\.sd-credit\{[^}]*display:none/);
  assert.doesNotMatch(css, /\.dcat\[data-cat="faune"\] \.sd-sp (b|i)\{[^}]*display:none/);
  /* Une ligne de section sans contenu pour ce spot s’efface (anecdote absente). */
  assert.match(replis, /head\.hidden = els\.length > 0 && els\.every\(absent\);/);
  assert.match(css, /#detail \.obf-head\[hidden\]\{display:none!important\}/);
});
