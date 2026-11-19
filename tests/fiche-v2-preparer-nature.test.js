/* Fiche de spot v2, onglets Préparer et Nature (lot C, 19 nov. 2026). Demande du fondateur : moins chargé, des titres
   simples en casse de phrase, plus de sur-titres en capitales, de numéros de section ni de cartes dans des cartes ; chaque
   fait garde sa source visible ; la note de l’utilisateur n’est jamais perdue. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { read, fnSource } = require('./src-extract.cjs');
const css = read('fiche.css'), app = read('app.js'), guide = read('spot-guide.js'), data = read('spot-data.js');
const field = read('field-guide.js'), notebook = read('spot-notebook.js'), replis = read('replis.js');
const section = (name, next) => css.slice(css.indexOf('ONGLET ' + name), css.indexOf('fin de la section ' + next));
const prep = section('PRÉPARER', 'Préparer'), nature = section('NATURE', 'Nature');
const tabGroups = cat => {
  const src = replis.slice(replis.indexOf('const TAB_GROUPS = {'), replis.indexOf('const tabOf = '));
  const m = new RegExp(cat + ': \\[([\\s\\S]*?)\\n    \\]').exec(src);
  return [...m[1].matchAll(/\{ id: '(\w+)', title: '([^']+)', sub: '([^']+)', members: \[([^\]]+)\] \}/g)].map(x => ({ id: x[1], members: x[4] }));
};

test('Préparer : six sections à titre simple, dans l’ordre du brief (Y aller, Dormir, Autour, Matériel et cours, Avant de partir, Ton carnet)', () => {
  assert.match(data, /host\.innerHTML = `<h3 class="fx-title">Y aller<\/h3>/);
  assert.match(fnSource(guide, 'sleepHTML'), /<h3 class="fx-title">Dormir<\/h3>/);
  assert.match(fnSource(guide, 'aroundHTML'), /<h3 class="fx-title">Autour<\/h3>/);
  assert.match(field, /<h3 class="fx-title">Matériel et cours<\/h3>/);
  assert.match(field, /<h3 class="fx-title">Avant de partir<\/h3>/);
  assert.match(notebook, /<h3 class="fx-title">Ton carnet<\/h3>/);
  /* L’ordre vient du CSS (les modules gardent leurs nœuds et leurs id). */
  const order = id => +new RegExp('\\[data-cat="activites"\\]>' + id.replace(/[.#]/g, m => '\\' + m) + '\\{order:(\\d+)\\}').exec(prep)[1];
  const seq = ['#dGo', '#guideSleep', '#guideAround', '#fieldNearbyBlock', '.field-local', '#dZonesBlock', '.field-preparation'].map(order);
  assert.deepEqual(seq, [...seq].sort((a, b) => a - b), 'Y aller, Dormir, Autour, Dans les environs, Matériel et cours, zones, Avant de partir');
  assert.match(prep, /\.field-checklist>\.field-check\{order:2\}[\s\S]*#dGuide>\.field-notebook\{order:4\}/, 'la liste, puis le carnet');
});

test('Préparer : plus de sur-titres en capitales, de numéros de chapitre, de schéma radar ni de jauge de classement', () => {
  for (const src of [fnSource(guide, 'aroundHTML'), fnSource(guide, 'sleepHTML')]) {
    assert.doesNotMatch(src, /guide-chapter-number|guide-chapter-label/);
    assert.doesNotMatch(src, />[A-ZÀÉÈ’ ]{6,}</, 'aucun texte tout en capitales');
  }
  assert.doesNotMatch(guide, /function radar\(|function gauge\(|data-around-toggle/);
  assert.doesNotMatch(data, /<p class="sd-kicker">\$\{icon\(I\.plane\)\}Y aller/);
  assert.doesNotMatch(field, /TON POINT DE DÉPART|<span class="field-eyebrow">SUR PLACE/);
  assert.doesNotMatch(notebook, /TON CARNET/);
  assert.match(field, /<h4 class="fx-title fx-title-s">Dans les environs<\/h4>/, '« Dans les environs » sans sur-titre');
});

test('Préparer : chaque fait garde sa source à côté (aéroports, lieux autour, nuit la moins chère)', () => {
  /* La source des aéroports suit le lien de vol, avant le détail du pays replié. */
  const goTpl = data.slice(data.indexOf('<h3 class="fx-title">Y aller</h3>'), data.indexOf('</div>`;', data.indexOf('<h3 class="fx-title">Y aller</h3>')));
  assert.ok(goTpl.indexOf('OurAirports') > goTpl.indexOf('${flights}') && goTpl.indexOf('OurAirports') < goTpl.indexOf('<div class="sd-facts">'));
  assert.match(fnSource(guide, 'aroundHTML'), /Lieux sélectionnés par Ocean Buddy et situés grâce aux coordonnées de Wikipédia/);
  assert.match(fnSource(guide, 'aroundHTML'), /wikiUrl\(lang,x\.title\)/, 'chaque lieu garde son lien Wikipédia');
  assert.match(fnSource(guide, 'sleepHTML'), /Estimation indicative Ocean Buddy \(\$\{M\.EDITION\}\)/);
  assert.match(fnSource(guide, 'sleepHTML'), /Recherches publiques, sans lien sponsorisé/);
  /* La haute saison se traduit d’un bloc : aucun élément au milieu de la phrase (i18n.js la couperait en deux). */
  const peak = fnSource(guide, 'sleepHTML').split('\n').find(l => l.includes('const peak='));
  assert.ok(peak && !/months\(|<span/.test(peak), 'mois en texte simple dans « Haute saison (…) : … la nuit. »');
});

test('Préparer : seuls le détail du pays et le point de départ sont repliés ; la liste et le carnet restent en vue', () => {
  const g = tabGroups('activites');
  assert.deepEqual(g.map(x => x.id), ['depart', 'surplace']);
  const folded = g.map(x => x.members).join(' ');
  for (const s of ['field-notebook', 'field-checklist', 'sd-airports', '#guideSleep', '#guideAround', '#fieldNearbyBlock', '.field-local'])
    assert.ok(!folded.includes(s), 'jamais replié : ' + s);
  /* La note de l’utilisateur garde son champ, sa clé et sa limite. */
  assert.match(notebook, /<textarea id="spotPersonalNote" data-note-spot="\$\{s\.id\}" maxlength="\$\{M\.NOTE_LIMIT\}"/);
});

test('Nature : les deux chiffres en relevés de la fiche, « Quand les voir », plus de sur-titre « Observé ici »', () => {
  assert.match(data, /<div class="sd-stats nx-stats"><div class="nx-stat"><b class="fx-num">\$\{num\(w\.n\)\}<\/b>/);
  assert.match(data, /<h4 class="fx-title fx-title-s">Quand les voir \?<\/h4>/);
  assert.doesNotMatch(data, /sd-kicker">\$\{icon\(I\.eye\)\}Observé ici/);
  assert.match(nature, /\.nx-stats>\.nx-stat\{[^}]*background:none/, 'plus de tuiles sombres');
  /* Les sources restent visibles sous leur repli. */
  const g = tabGroups('faune');
  assert.deepEqual(g.map(x => x.id), ['photos', 'typiques']);
  const folded = g.map(x => x.members).join(' ');
  assert.ok(!folded.includes('sd-src') && !folded.includes('bio-note') && !folded.includes('bio-warn'));
  assert.match(data, /Photos sous licence libre, crédits sur chaque image\./);
});

test('Nature, Préserver : l’enjeu en une phrase, puis les gestes en liste simple, sans pastilles numérotées', () => {
  const ctx = { PRESERVE: { z1: { e: 'La dune tient la plage.', g: [['Passe par les accès', 'Pourquoi.'], ['Remporte tes mégots', 'Pourquoi.']] } }, SPOT_ZONE: { s1: 'z1' }, ecoHas: k => k === 'z:z1:1', uic: () => '<svg></svg>' };
  vm.createContext(ctx);
  vm.runInContext(fnSource(app, 'presGeste') + fnSource(app, 'renderPreserve'), ctx);
  const h = ctx.renderPreserve({ id: 's1' });
  assert.match(h, /<h3 class="fx-title">Préserver ce spot<\/h3><p class="fx-text nx-pres-e">La dune tient la plage\.<\/p><ul class="pres-l"><li class="pres-g">/);
  assert.equal((h.match(/<li class="pres-g">/g) || []).length, 2);
  assert.doesNotMatch(h, /pres-n|pres-lab|Ce que tu peux faire ici/);
  assert.match(h, /Je l'ai fait<span class="nx-xp">\+15 XP<\/span><\/button>/);
  assert.match(h, /class="pres-do fx-pill done"[^>]*disabled>✓ Fait ici/, 'un geste déjà fait reste coché');
});

test('Préparer et Nature : les nouveaux textes sont traduits en anglais et en espagnol', () => {
  const src = new Set(JSON.parse(read('locales/source/fr.json')));
  const keys = ['Y aller', 'Dormir', 'Autour', 'Matériel et cours', 'Ton carnet', 'Ton point de départ', 'Même activité, dans un rayon de 200 km',
    'Chercher un vol vers {1}', 'Haute saison ({0}) : {1} la nuit.', 'Je l\'ai fait', 'Préserver ce spot', 'Photos et observations', 'Quand les voir ?'];
  for (const l of ['en', 'es']) {
    const tr = JSON.parse(read(`locales/translations/${l}.json`));
    for (const k of keys) {
      assert.ok(src.has(k), 'clé extraite : ' + k);
      assert.ok(typeof tr[k] === 'string' && tr[k].trim() && (l === 'es' || tr[k] !== k), l + ' : ' + k);
    }
  }
});

test('Préparer : la carte du secteur reste dans « Le spot », même après plusieurs fiches ouvertes', () => {
  const exp = read('spot-experience.js'), fn = fnSource(exp, 'updateAreaMap');
  assert.doesNotMatch(fn, /around\.after\(panel\)/, 'elle ne suit plus « Autour », rangé dans Préparer');
  assert.match(fn, /const infos=\$\('#detail \.dcat\[data-cat="infos"\]'\);if\(infos&&panel\.parentNode!==infos\)infos\.append\(panel\);/);
  /* Préparer : le choix de l’activité vient sous le titre « Avant de partir », en pastilles. */
  assert.match(prep, /\.field-checklist\{display:contents\}/);
  assert.match(prep, /\.field-checklist>\.field-list-head\{order:0\}[\s\S]*>#dSports\{order:1\}[\s\S]*\.field-checklist>\.field-check\{order:2\}/);
});
