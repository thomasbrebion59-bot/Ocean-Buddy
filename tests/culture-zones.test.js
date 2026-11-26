'use strict';
/* Culture locale sourcée par zone (« Ici, on vit comme ça », chapitre « Le coin ») : scripts/build-culture-zones.cjs,
   data/culture-zones.json, assets/data/culture-zones.js, spot-guide.js. Règle : aucun fait sans source. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const B = require('../scripts/build-culture-zones.cjs');
const ok = (over = {}) => ({ kind: 'gout', title: 'Le pastis landais', text: 'Brioche à la fleur d’oranger.', months: [],
  source: { url: 'https://fr.wikipedia.org/wiki/Pastis_landais', publisher: 'Wikipédia', consulted: '2026-11-20' }, ...over });

test('validation : un fait sans source lisible, trop long, d’un genre inconnu ou d’un éditeur écarté est refusé', () => {
  assert.equal(B.factError(ok()), null);
  assert.match(B.factError(ok({ source: null })), /source absente/);
  assert.match(B.factError(ok({ source: { url: 'http://exemple.fr/a', publisher: 'X', consulted: '2026-11-20' } })), /https/);
  assert.match(B.factError(ok({ source: { url: 'https://exemple.fr/a', publisher: ' ', consulted: '2026-11-20' } })), /éditeur/);
  assert.match(B.factError(ok({ source: { url: 'https://exemple.fr/a', publisher: 'X', consulted: 'hier' } })), /date de consultation/);
  assert.match(B.factError(ok({ text: 'x'.repeat(B.MAX_TEXT + 1) })), /140 au plus/);
  assert.equal(B.factError(ok({ text: 'x'.repeat(B.MAX_TEXT) })), null);
  assert.match(B.factError(ok({ kind: 'prix' })), /genre inconnu/);
  assert.match(B.factError(ok({ months: [13] })), /mois/);
  assert.match(B.factError(ok({ text: 'Une fête — très connue.' })), /tiret/);
  for (const p of B.EXCLUDED_PUBLISHERS) assert.match(B.factError(ok({ source: { url: 'https://exemple.fr/a', publisher: p + ' (presse)', consulted: '2026-11-20' } })), /éditeur écarté/);
  assert.deepEqual(B.EXCLUDED_PUBLISHERS, ['Guide des Landes', 'Portal de Prefeitura', 'Riviera Maya News']);
  assert.deepEqual(B.KINDS, ['gout', 'fete', 'mot', 'coutume', 'lieu']);
});

test('fusion : faits invalides écartés et listés, « manques » retiré, zone vide ignorée, index spot → zone', () => {
  const d = B.merge([{ name: 'a.json', json: { updated: '2026-11-20', zones: {
    z1: { name: 'Zone 1', region: 'R', country: 'FR', spots: ['s1', 's2'], manques: ['pas de fête trouvée'], facts: [ok(), ok({ source: null, title: 'Sans source' })] },
    z2: { name: 'Zone 2', region: 'R', country: 'FR', spots: ['s3'], facts: [ok({ source: null })] },
    z3: { name: 'Zone 3', region: 'R', country: 'FR', spots: ['s1'], facts: [ok()] } } } }]);
  assert.deepEqual(Object.keys(d.zones), ['z1', 'z3']);
  assert.equal(d.zones.z1.facts.length, 1);
  assert.ok(!('manques' in d.zones.z1));
  assert.deepEqual(d.dropped.map(x => x.title), ['Sans source', 'Le pastis landais']);
  assert.deepEqual(d.spots, { s1: 'z1', s2: 'z1' }, 'un spot reste dans sa première zone');
  const c = B.compact(d);
  assert.deepEqual(c.zones.z1.f[0], ['gout', 'Le pastis landais', 'Brioche à la fleur d’oranger.', [], 'https://fr.wikipedia.org/wiki/Pastis_landais', 'Wikipédia', '2026-11-20', '']);
  assert.deepEqual(c.spots, d.spots);
});

test('donnée du dépôt : chaque fait a sa source, chaque spot de l’index existe dans sa zone et dans le catalogue', () => {
  const d = JSON.parse(read('data/culture-zones.json'));
  const zones = Object.entries(d.zones);
  assert.ok(zones.length >= 20, 'au moins vingt zones');
  for (const [id, z] of zones) {
    assert.ok(z.name && z.spots.length && z.facts.length, id);
    assert.ok(!('manques' in z), id);
    for (const f of z.facts) assert.equal(B.factError(f), null, `${id} : ${f.title}`);
  }
  const catalog = new Set(JSON.parse(read('data/catalog.json')).map(s => s.id));
  for (const [spot, id] of Object.entries(d.spots)) {
    assert.ok(d.zones[id] && d.zones[id].spots.includes(spot), `${spot} dans ${id}`);
    assert.ok(catalog.has(spot), 'spot du catalogue : ' + spot);
  }
  assert.equal(d.spots.hossegor, 'fr-landes-hossegor');
  /* Le fichier chargé par la fiche est la même donnée, compacte, et son empreinte est celle de l’URL de spot-guide.js. */
  const js = read('assets/data/culture-zones.js');
  const loaded = JSON.parse(js.slice(js.indexOf('window.OCEAN_CULTURE_ZONES=') + 27, js.lastIndexOf(';')));
  const illusMap = JSON.parse(read('data/culture-zones-illus.json')), illus = {};
  for (const [k, v] of Object.entries(illusMap)) if (fs.existsSync(path.join(__dirname, '..', 'assets/fiche/faits', v + '.webp'))) illus[k] = v;
  assert.deepEqual(loaded, B.compact(d, illus));
  const hash = require('crypto').createHash('sha256').update(js).digest('hex').slice(0, 12);
  assert.ok(read('spot-guide.js').includes(`const ZONES_URL='assets/data/culture-zones.js?v=${hash}';`), 'empreinte à jour : relancer scripts/build-culture-zones.cjs');
});

test('fiche : un fait par carte, sa source d’un toucher et dans « Sources et précisions », jamais au démarrage', () => {
  const g = read('spot-guide.js'), css = read('fiche.css');
  /* Chargé à l’ouverture d’une fiche, pas dans la page. */
  assert.doesNotMatch(read('index.html'), /culture-zones/);
  assert.match(g, /if\(!window\.OCEAN_CULTURE_ZONES\|\|\(zoneLang\(\)!=='fr'&&!window\['OCEAN_CULTURE_ZONES_'\+zoneLang\(\)\.toUpperCase\(\)\]\)\)loadZones\(\)\.then\(\(\)=>\{if\(current===s\.id&&zoneOf\(s\)\)paintLive\(s,false\);\}\);/);
  assert.match(g, /const d=window\.OCEAN_CULTURE_ZONES,id=s&&!s\.custom&&d\?\.spots\?\.\[s\.id\],z=id&&d\.zones\?\.\[id\];/, 'rattachement par l’identifiant du spot ; jamais pour un spot personnel');
  /* Carte : genre, titre, texte, source (lien externe) ; le texte du fait n’est pas envoyé au traducteur de page. */
  assert.match(g, /<a class="gl-fact-src" href="\$\{esc\(url\)\}" target="_blank" rel="noopener noreferrer"><span>Source :<\/span> <span\$\{srcL\.fixed\?NT:''\}>\$\{esc\(srcL\.text\)\}<\/span><\/a><\/li>/);
  assert.match(g, /<b\$\{NT\}>\$\{esc\(title\)\}<\/b><small\$\{NT\}>\$\{esc\(text\)\}<\/small>/);
  assert.match(g, /const ZONE_LABEL=\{gout:'À goûter',fete:'La fête',mot:'Le mot du coin',coutume:'La coutume',lieu:'À voir'\};/);
  /* Mois d’une fête : une édition constatée, pas une date. */
  assert.match(g, /<small class="gl-when"><span>Souvent en<\/span> <span\$\{NT\}>\$\{esc\(when\)\}<\/span><\/small>/);
  /* Les repères du carnet, sans source par fait, cèdent la place quand la zone donne le même genre. */
  assert.match(g, /const hello=has\('mot'\)\?'':c\.hello\?\.\[0\]\|\|''/);
  assert.match(g, /food=has\('gout'\)\?'':c\.food\?\.\[0\]\|\|''/);
  /* Toutes les sources de la zone, avec leur date, dans « Sources et précisions ». */
  assert.match(g, /<ul class="fx-note gl-zone-src">/);
  assert.match(read('replis.js'), /'#guideLive \.gl-zone-src'[,\]]/);
  assert.doesNotMatch(css, /\.gl-fact-src\{[^}]*display:none/);
  assert.match(css, /#detail \.gl-fact-src\{[^}]*min-height:44px/);
  for (const k of ['table', 'fete', 'coutume', 'marche', 'cabane', 'panneau', 'soleil']) assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets/fiche', k + '.webp')), k);
  for (const k of ['La fête', 'La coutume', 'Souvent en', 'consultée le', 'À voir'])
    for (const l of ['en', 'es']) { const d = JSON.parse(read(`locales/translations/${l}.json`)); assert.ok(d[k] && d[k] !== k, `${l} : ${k}`); }
});

test('mois : seulement sur une fête (le mois d’une édition constatée), jamais affichés pour un autre genre', () => {
  const d = JSON.parse(read('data/culture-zones.json'));
  for (const [id, z] of Object.entries(d.zones)) for (const f of z.facts)
    if (f.kind !== 'fete') assert.deepEqual(f.months, [], `${id} « ${f.title} » (${f.kind}) : pas de mois`);
  const merged = B.merge([{ name: 't', json: { zones: { z: { name: 'Z', spots: ['s'], facts: [
    { kind: 'lieu', title: 'Un lieu', text: 'Texte.', months: [10], source: { url: 'https://a.b/c', publisher: 'P', consulted: '2026-11-20' } },
    { kind: 'fete', title: 'Une fête', text: 'Texte.', months: [7], source: { url: 'https://a.b/c', publisher: 'P', consulted: '2026-11-20' } }] } } } }]);
  assert.deepEqual(merged.zones.z.facts.map(f => f.months), [[], [7]]);
  assert.match(read('spot-guide.js'), /when=kind==='fete'&&Array\.isArray\(months\)&&months\.length\?M\.monthsLabel\(months,LG\(\)\):'';/);
});

test('illustrations propres aux faits : identifiant stable, fichier présent, sinon l’illustration du genre', () => {
  assert.equal(B.factId('fr-landes-hossegor', 'Le pastis landais'), 'fr-landes-hossegor--le-pastis-landais');
  assert.equal(B.factId('gr-zakynthos-navagio', 'La fête de saint Denys'), 'gr-zakynthos-navagio--la-fete-de-saint-denys');
  const d = JSON.parse(read('data/culture-zones.json')), ids = new Set();
  for (const [id, z] of Object.entries(d.zones)) for (const f of z.facts) ids.add(B.factId(id, f.title));
  for (const [k, v] of Object.entries(JSON.parse(read('data/culture-zones-illus.json')))) {
    assert.ok(ids.has(k), 'fait connu : ' + k);
    assert.match(v, /^[a-z0-9-]+$/);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets/fiche/faits', v + '.webp')), 'fichier : ' + v);
  }
  assert.match(read('spot-guide.js'), /const big=!!own&&\/\^\[a-z0-9-\]\+\$\/\.test\(own\),srcL=M\.sourceLabel\(publisher,url\);/);
  assert.match(read('spot-guide.js'), /\$\{big\?HERO\('faits\/'\+own\):ILLU\(zoneIllu\(kind,title\)\)\}/);
});

test('traductions : chaque fait a son titre et son texte en anglais et en espagnol, sans source propre ni décoration', () => {
  const d = JSON.parse(read('data/culture-zones.json')), tr = JSON.parse(read('data/culture-zones-i18n.json'));
  const ids = [];
  for (const [id, z] of Object.entries(d.zones)) for (const f of z.facts) ids.push(B.factId(id, f.title));
  assert.equal(new Set(ids).size, ids.length, 'identifiants de faits uniques');
  assert.deepEqual(B.LANGS, ['en', 'es']);
  for (const lang of B.LANGS) {
    const t = tr[lang];
    assert.deepEqual(Object.keys(t.facts).sort(), [...ids].sort(), lang + ' : un fait traduit par fait, aucun en trop');
    assert.deepEqual(Object.keys(t.zones).sort(), Object.keys(d.zones).sort(), lang + ' : toutes les zones nommées');
    for (const [k, x] of Object.entries(t.facts)) {
      assert.equal(B.translationError(x), null, `${lang} ${k}`);
      assert.deepEqual(Object.keys(x).sort(), ['text', 'title'], `${lang} ${k} : ni source ni mois dans une traduction`);
    }
    /* Un mot du coin garde son mot : le titre d’un fait « mot » contient le titre français sans son article. */
    for (const [id, z] of Object.entries(d.zones)) for (const f of z.facts) if (f.kind === 'mot') {
      const words = f.title.replace(/^(Le |La |Les |L’|Un |Une )/i, '').toLowerCase().split(/[\s,]+/).filter(w => w.length >= 2);
      const title = t.facts[B.factId(id, f.title)].title.toLowerCase();
      assert.ok(!words.length || words.some(w => title.includes(w)), `${lang} : le mot « ${f.title} » est gardé`);
    }
    /* Les années ne changent pas : chaque nombre à quatre chiffres du texte français est dans la traduction, sans autre.
       (Les heures peuvent changer d’écriture : « 13 h » devient « 1 p.m. » en anglais.) */
    for (const [id, z] of Object.entries(d.zones)) for (const f of z.facts) {
      const nums = v => (String(v).match(/\d{4}/g) || []).map(Number).sort((a, b) => a - b).join(',');
      assert.equal(nums(t.facts[B.factId(id, f.title)].text), nums(f.text), `${lang} ${id} « ${f.title} » : mêmes années`);
    }
    /* Le fichier chargé par la fiche suit l’ordre des faits, et son empreinte est dans spot-guide.js. */
    const js = read(`assets/data/culture-zones.${lang}.js`);
    const loaded = JSON.parse(js.slice(js.indexOf('=') + 1).trim().replace(/;$/, ''));
    assert.deepEqual(loaded, { zones: B.translate(d, t).zones });
    for (const [id, z] of Object.entries(d.zones)) assert.equal(loaded.zones[id].f.length, z.facts.length, id);
    const hash = require('crypto').createHash('sha256').update(js).digest('hex').slice(0, 12);
    assert.ok(read('spot-guide.js').includes(`assets/data/culture-zones.${lang}.js?v=${hash}`), lang + ' : empreinte à jour');
  }
  /* La donnée française et ses sources ne sont pas touchées par les traductions. */
  assert.equal(B.translationError({ title: 'A', text: 'Un point · médian' }), 'flèche, tiret décoratif ou point médian');
  assert.match(B.translationError({ title: 'A', text: 'x'.repeat(171) }), /170 au plus/);
  const t = B.translate({ zones: { z: { facts: [{ title: 'Le pastis landais' }, { title: 'Baïne' }] } } }, { zones: { z: 'Zone' }, facts: { 'z--le-pastis-landais': { title: 'Pastis landais', text: 'A brioche.' }, 'z--disparu': { title: 'X', text: 'Y' } } });
  assert.deepEqual(t.zones, { z: { n: 'Zone', f: [['Pastis landais', 'A brioche.'], 0] } });
  assert.deepEqual(t.missing, ['z--baine']); assert.deepEqual(t.orphans, ['z--disparu']);
});

test('fiche : les faits s’affichent dans la langue de l’app, la source reste celle du fait français', () => {
  const g = read('spot-guide.js');
  assert.match(g, /const zoneLang=\(\)=>\(lang\(\)==='es'\?'es':english\(\)\?'en':'fr'\);/);
  assert.match(g, /return Array\.isArray\(x\)&&x\[0\]&&x\[1\]\?\[f\[0\],x\[0\],x\[1\],\.\.\.f\.slice\(3\)\]:f;/, 'seuls le titre et le texte changent ; sans traduction, le français');
  assert.match(g, /then\(\(\)=>need\(\)\?inject\(ZONES_URL_I18N\[lg\]\)\.catch\(\(\)=>\{\}\):null\)/, 'une traduction absente ne bloque pas la fiche');
});

test('cartes de culture : grande image nette pour chaque fait illustré, vignette pour les genres, la carte suivante se devine', () => {
  const css = read('fiche.css'), g = read('spot-guide.js');
  /* Choix du fondateur (23 nov.) : la grande image en tête de la carte, 4:3, sa place réservée (aucun saut). */
  assert.match(g, /const HERO=k=>`<img class="gl-hero" src="assets\/fiche\/\$\{k\}\.webp" alt="" width="1080" height="810" loading="lazy" decoding="async" draggable="false">`;/);
  assert.match(g, /\$\{big\?HERO\('faits\/'\+own\):ILLU\(zoneIllu\(kind,title\)\)\}/);
  assert.match(css, /#detail \.gl-big-card>\.gl-hero\{[^}]*width:calc\(100% \+ 24px\);[^}]*aspect-ratio:4 \/ 3;/);
  /* Les illustrations de genre (420 px) restent en vignette de 104 points (312 px d’écran en ×3). */
  assert.match(css, /#detail \.gl-card>\.gl-illu,#detail \.gl-card-go \.gl-illu\{grid-column:1;grid-row:1 \/ span 2;width:104px;height:104px;/);
  /* La carte ne prend jamais toute la largeur : 56 px restent pour l’écart et le bord de la suivante. */
  assert.match(css, /#detail \.gl-card\{flex:0 0 min\(330px,calc\(100% - 56px\)\);/);
  /* Aucun texte coupé : pas de hauteur fixe, pas de troncature dans la carte. */
  const card = css.slice(css.indexOf('/* Carte de culture (reprise le 23 nov.)'), css.indexOf('/* Budget sur place'));
  assert.doesNotMatch(card, /line-clamp|text-overflow|max-height|(?<!min-)height:\d+px(?!;aspect-ratio:1)/);
  assert.match(card, /#detail \.gl-fact-src\{align-self:end;display:block;min-height:44px;/, 'la source reste une cible de 44 points');
});

/* Chaque fait illustré a son fichier, en WebP, assez large pour la grande image (une carte d’environ 300 points demande
   environ 900 px sur un écran ×3). Largeur lue dans l’en-tête VP8/VP8L/VP8X du fichier. */
const webpWidth = buf => {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return 0;
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8 ') return buf.readUInt16LE(26) & 0x3fff;
  if (kind === 'VP8L') return 1 + (((buf[22] & 0x3f) << 8) | buf[21]);
  if (kind === 'VP8X') return 1 + buf.readUIntLE(24, 3);
  return 0;
};
test('illustrations des faits : chaque fait illustré a son WebP d’au moins 1000 px de large', () => {
  const illus = JSON.parse(read('data/culture-zones-illus.json'));
  const files = [...new Set(Object.values(illus).map(v => (typeof v === 'string' ? v : v && v.file)).filter(Boolean))];
  assert.ok(files.length >= 100, 'au moins 100 faits illustrés : ' + files.length);
  const narrow = [];
  for (const f of files) {
    const p = path.join(__dirname, '..', 'assets/fiche/faits', f.replace(/\.webp$/, '') + '.webp');
    assert.ok(fs.existsSync(p), 'fichier présent : ' + f);
    const w = webpWidth(fs.readFileSync(p));
    if (w < 1000) narrow.push(f + ' : ' + w);
  }
  assert.deepEqual(narrow, [], 'trop étroites');
});
