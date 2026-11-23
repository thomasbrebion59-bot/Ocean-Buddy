const test = require('node:test'), assert = require('node:assert/strict');
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
const { read, fnSource, i18nContext } = require('./src-extract.cjs');
/* Interface v2, Voyages (maquette orga-docs/interface-v2/maquette-4-voyages.png) : « Mes voyages » d’abord, une carte légère
   par voyage, « Nouveau voyage », puis les idées ; plus de grande affiche ni de titres en capitales.
   Passe du 23 novembre 2026 : six idées en affiches (trois thèmes vérifiés sur les données, trois destinations),
   illustration dédiée sans voyage, toute la largeur sur ordinateur, voyage ouvert et fenêtres en casse de phrase. */
const src = read('trips.js'), css = read('ui-listes.css');
const overview = src.slice(src.indexOf('function overview(saved){'), src.indexOf('function tripDetail(t){'));
const card = src.slice(src.indexOf('function tripCard(t,withSteps){'), src.indexOf('function render(){'));

test('Voyages : plus d’affiche, de polaroïd ni de sur-titres en capitales', () => {
  for (const gone of ['page-eyebrow', 'trip-welcome', 'trip-poulpy-postcard', 'trip-stamp', 'Ton prochain', 'grand départ', 'Trois idées', 'LE CARNET DE TES ENVIES', 'MON PROCHAIN VOYAGE', 'UNE ÉTINCELLE', 'Les bons spots.'])
    assert.ok(!src.includes(gone), 'encore là : ' + gone);
  /* Aucun texte tout en capitales dans l’écran (hors sigles courts). */
  const caps = [...src.matchAll(/>([A-ZÀ-Ý][A-ZÀ-Ý ’'.,?!]{7,})</g)].map(m => m[1]);
  assert.deepEqual(caps, []);
  assert.match(css, /\.ocean-v2 #trips>\.as-large p\{display:none\}/, 'grand titre « Voyages » sans sur-titre');
  assert.match(css, /\.ocean-v2 #trips \.trip-banner \.trip-pill\{text-transform:none;letter-spacing:0\}/);
});

test('Mes voyages : dans l’ordre, les voyages, « Nouveau voyage », puis « Idées »', () => {
  const a = overview.indexOf('<h2 class="ui-title">Mes voyages</h2>'), b = overview.indexOf('saved.map(t=>tripCard(t,t.id===star))'), c = overview.indexOf('data-action="new"', b), d = overview.indexOf('<h2 class="ui-title">Idées</h2>'), e = overview.indexOf('<div class="tv-ideas">${ideas.map(ideaCard).join(\'\')}</div>');
  assert.ok(a > 0 && a < b && b < c && c < d && d < e, 'ordre des blocs');
  assert.match(overview, /<button type="button" class="ui-btn tv-new" data-action="new">\$\{I\.plus\}<span>Nouveau voyage<\/span><\/button>/);
  assert.match(css, /\.ocean-v2 \.tv-new\{width:100%;/, 'bouton pleine largeur');
  assert.match(css, /\.ocean-v2 \.tv-ideas\{display:grid;grid-auto-flow:column;grid-auto-columns:clamp\(148px,41vw,190px\);/, 'téléphone : des affiches à faire défiler, deux et le début de la troisième');
  assert.match(css, /\.ocean-v2 \.tv-ideas\{grid-auto-flow:row;grid-template-columns:repeat\(6,minmax\(0,1fr\)\);[^}]*overflow:visible\}/, 'ordinateur : les six sur une rangée');
  /* Sans voyage : la carte vide porte « Nouveau voyage », avant les idées. */
  const empty = overview.slice(overview.indexOf('const empty='), overview.indexOf('return `<section'));
  assert.match(empty, /class="tv-empty"/); assert.match(empty, /Pas encore de voyage/); assert.match(empty, /data-action="new"/);
  assert.match(overview, /\$\{saved\.length\?`[\s\S]*`:empty\}/);
});

test('carte d’un voyage : photo de la première étape, nom, dates, étapes, « Avant de partir », jours en grand', () => {
  assert.match(card, /<article class="tv-card" data-action="select" data-id="\$\{esc\(t\.id\)\}"/, 'toute la carte ouvre le voyage existant');
  assert.match(card, /<img class="tv-photo" src="\$\{esc\(cover\(t\)\)\}"\$\{first&&spot\(first\.spotId\)\?spotPhotoSrcset\(first\.spotId\):''\} sizes="[^"]+" alt="" loading="lazy" decoding="async">/);
  assert.match(card, /<b class="tv-name">\$\{esc\(t\.name\)\}<\/b>/);
  assert.match(card, /n>1\?`\$\{n\} étapes`:n===1\?`\$\{n\} étape`:'Aucune étape'/);
  assert.match(card, /const c=M\.countdown\(t,todayKey\(\)\),p=M\.progress\(t\)/, 'chiffres tirés du modèle, rien d’inventé');
  assert.match(card, /role="img" aria-label="Avant de partir : \$\{p\.done\} sur \$\{p\.total\}"/);
  assert.match(card, /<span class="tv-bar" style="--p:\$\{\(p\.done\/p\.total\)\.toFixed\(3\)\};--n:\$\{p\.total\}"><i><\/i><\/span><span class="tv-frac" translate="no" aria-hidden="true">\$\{p\.done\}\/\$\{p\.total\}<\/span>/);
  assert.match(card, /c\.state==='upcoming'\?`<span class="tv-count"><b class="ui-num" data-tv-num="\$\{c\.days\}" translate="no">\$\{c\.days\}<\/b><span class="ui-unit">\$\{c\.days>1\?obT\('jours'\):obT\('jour'\)\}<\/span><\/span>`/);
  /* Étapes en ronds reliés : le prochain voyage s’il a plusieurs étapes, sinon le premier qui en a plusieurs. */
  assert.match(src, /function featured\(saved\)\{\s*const next=M\.nextTrip\(saved,todayKey\(\)\)\?\.trip;\s*if\(next&&next\.steps\.length>1\)return next\.id;\s*return saved\.find\(t=>t\.steps\.length>1\)\?\.id\|\|null;/);
  assert.match(card, /\$\{withSteps\?stepsRow\(t\):''\}<\/article>/);
  assert.match(css, /\.ocean-v2 \.tv-count \.ui-num\{font-size:40px/);
});

test('dates courtes : « 5 au 7 décembre », mois abrégés à cheval sur deux mois, année seulement au loin', () => {
  const ctx = vm.createContext({ window: {}, Intl, Date, String });
  vm.runInContext(`const todayKey=()=>'2026-11-20';const D=v=>new Date(v+'T12:00:00');const dayMonth=(v,month='long')=>D(v).toLocaleDateString('fr-FR',{day:'numeric',month});${fnSource(src, 'shortRange')};this.f=shortRange;`, ctx);
  assert.equal(ctx.f({ start: '2026-12-05', end: '2026-12-07' }), '5 au 7 décembre');
  assert.equal(ctx.f({ start: '2027-02-12', end: '2027-02-26' }), '12 au 26 février');
  assert.equal(ctx.f({ start: '2026-11-28', end: '2026-12-03' }), '28 nov. au 3 déc.');
  assert.equal(ctx.f({ start: '2026-12-05', end: '' }), '5 décembre');
  assert.equal(ctx.f({ start: '2026-12-05', end: '2026-12-05' }), '5 décembre');
  assert.equal(ctx.f({ start: '', end: '' }), '');
  assert.equal(ctx.f({ start: '2028-03-02', end: '2028-03-09' }), '2 au 9 mars 2028', 'dans plus de onze mois : avec l’année');
  assert.equal(ctx.f({ start: '2025-08-02', end: '2025-08-09' }), '2 au 9 août 2025', 'voyage passé d’une autre année');
  /* Le mot de liaison n’est pas une clé de traduction (un gabarit « {0} au {1} » attraperait d’autres phrases). */
  const fr = JSON.parse(read('locales/source/fr.json'));
  assert.ok(!fr.some(k => /^\{0\} au \{1\}/.test(k)));
  assert.match(card, /<span class="tv-dates" translate="no" data-no-i18n>\$\{esc\(dates\)\}<\/span>/);
  /* Hors du français, la date est écrite dans la langue choisie (avant : « 5–7 décembre » restait en français en EN). */
  for (const [lang, tag, want] of [['en', 'en', /December/], ['es', 'es', /diciembre/]]) {
    const c2 = vm.createContext({ window: { OB_I18N: { lang }, OB_LOCALE: tag }, Intl, Date, String });
    vm.runInContext(`const todayKey=()=>'2026-11-20';const D=v=>new Date(v+'T12:00:00');const dayMonth=(v,month='long')=>D(v).toLocaleDateString('fr-FR',{day:'numeric',month});${fnSource(src, 'shortRange')};this.f=shortRange;`, c2);
    const r = c2.f({ start: '2026-12-05', end: '2026-12-07' }), single = c2.f({ start: '2026-12-05', end: '' });
    assert.match(r, want, lang + ' : ' + r); assert.doesNotMatch(r, /décembre| au /, lang + ' : ' + r);
    assert.match(single, want, lang + ' (un seul jour) : ' + single);
  }
});

test('vie : barre qui se remplit, jours qui montent une fois, ronds l’un après l’autre ; rien en mouvement réduit', () => {
  const live = src.slice(src.indexOf('let arriving=true'), src.indexOf('function storedTrips('));
  assert.match(live, /const still=\(\)=>document\.body\.classList\.contains\('reduce-motion'\)\|\|!!\(window\.matchMedia&&matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\)\|\|typeof Element\.prototype\.animate!=='function';/);
  assert.match(live, /if\(!fresh\|\|still\(\)\|\|document\.body\.dataset\.screen!=='trips'\)return;/, 'seulement à l’arrivée sur l’écran');
  assert.match(live, /fill\.animate\(\[\{transform:'scaleX\(0\)'\},\{transform:`scaleX\(\$\{p\}\)`\}\]/);
  assert.match(live, /card\.querySelectorAll\('\.tv-steps>li'\)\.forEach\(\(li,i\)=>li\.animate\(/); assert.match(live, /delay:320\+i\*70/);
  assert.match(live, /if\(num&&to>1&&!counted\.has\(card\.dataset\.tv\)\)/, 'le nombre de jours ne monte qu’une fois par voyage');
  const props = [...live.matchAll(/\.animate\(([^)]*\)[^)]*)\)/g)].flatMap(m => [...m[1].matchAll(/\{(\w+):/g)].map(x => x[1]));
  for (const p of new Set(props)) assert.ok(['transform', 'opacity', 'duration'].includes(p), 'propriété animée : ' + p);
  assert.ok(!/setInterval|iterations|infinite/.test(live));
  assert.match(src, /if\(e\.detail==='trips'\)\{if\(from!=='trips'\)arriving=true;render\(\);\}/);
  assert.match(css, /\.ocean-v2 \.tv-bar>i\{position:absolute;inset:0;background:var\(--t-main\);transform:scaleX\(var\(--p\)\);transform-origin:0 50%\}/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.ocean-v2 :is\(\.tv-card,\.tv-idea\)\{transition:none\}/);
});

test('distances du voyage ouvert : traduites en entier en anglais et en espagnol', () => {
  /* La classe compte : un <span> sans attribut ferait lire toute la ligne comme une phrase à balises par i18n.js (doRich),
     et le gabarit plus court « {0} depuis l’étape {1} » donnerait encore « from stop précédente ». */
  assert.match(src, /`<span class="trip-dist">\$\{prettyDistance\(distance\)\} entre les spots<\/span>`/);
  assert.match(src, /`<span class="trip-dist">\$\{prettyDistance\(leg\)\} depuis l’étape précédente<\/span>`/);
  assert.ok(!/<span>\$\{prettyDistance/.test(src));
  const sp = s => s.replace(/\s+/g, ' ');
  const en = i18nContext('en'), es = i18nContext('es');
  assert.equal(sp(en.obT('23 km depuis l’étape précédente')), '23 km from the previous stop', 'avant : « 23 km from stop précédente »');
  assert.equal(sp(en.obT('190 km entre les spots')), '190 km between spots', 'avant : resté en français');
  assert.equal(sp(en.obT('190 km entre les étapes connues')), '190 km between known stops');
  assert.equal(sp(es.obT('23 km depuis l’étape précédente')), '23 km desde la etapa anterior');
  assert.equal(sp(es.obT('190 km entre les spots')), '190 km entre los spots');
});

test('textes nouveaux de Voyages : dans la chaîne de traduction, en anglais et en espagnol', () => {
  const fr = JSON.parse(read('locales/source/fr.json')), en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json'));
  for (const k of ['Mes voyages', 'Nouveau voyage', 'Idées', 'Pas encore de voyage', '{0} étape', '{0} étapes', 'Aucune étape', 'Dates à définir', 'Avant de partir : {0} sur {1}', 'jours', 'jour', 'Jour', 'Terminé', 'Étapes', '{0} entre les spots', '{0} depuis l’étape précédente']) {
    assert.ok(fr.includes(k), 'source FR : ' + k);
    assert.ok(typeof en[k] === 'string' && en[k].trim(), 'EN : ' + k); assert.ok(typeof es[k] === 'string' && es[k].trim(), 'ES : ' + k);
  }
});

/* ---------- Passe du 23 novembre 2026 ---------- */
const ideasSrc = src.slice(src.indexOf('const ideas=['), src.indexOf('];', src.indexOf('const ideas=[')) + 2);
const ideas = JSON.parse(vm.runInNewContext(ideasSrc + ';JSON.stringify(ideas)')); /* JSON : des tableaux de ce contexte-ci */
const catalog = JSON.parse(read('data/catalog.json')), seasons = JSON.parse(read('data/seasons.json'));
const lite = JSON.parse(vm.runInNewContext(read('assets/data/spot-climate-lite.js') + ';JSON.stringify(window.OCEAN_CLIMATE_LITE)', { window: {} }));
const spotOf = id => catalog.find(s => s.id === id);

test('idées : six affiches, trois thèmes de la maquette puis trois destinations, étapes et photos du catalogue', () => {
  assert.deepEqual(ideas.map(x => x.short), ['Surf d’hiver', 'Plongée', 'Eau chaude', 'Côte basque', 'Côte portugaise', 'Bali']);
  for (const x of ideas) {
    assert.equal(x.spots.length, 3, x.short);
    for (const id of x.spots) { const s = spotOf(id); assert.ok(s, 'spot du catalogue : ' + id); assert.ok(s.photo, 'vraie photo : ' + id); }
    assert.ok(x.spots.includes(x.photo), x.short + ' : la photo de l’affiche est celle d’une étape');
    /* Le lieu annoncé : le pays des étapes, ou la mer qu’elles bordent (Mer Rouge, Polynésie). */
    const countries = new Set(x.spots.map(id => spotOf(id).country));
    assert.equal(countries.size, 1, x.short + ' : un seul pays'); assert.equal([...countries][0], x.destination, x.short);
    /* La pastille du sport : pratiqué à chaque étape d’un thème, à la plupart des étapes d’une destination. */
    const n = x.spots.filter(id => spotOf(id).sports.includes(x.sport)).length;
    assert.ok(x.months || x.sea ? n === 3 : n >= 2, x.short + ' : ' + x.sport + ' à ' + n + ' étapes');
    assert.ok(x.name && x.place && x.destination);
  }
});

test('idées : aucun chiffre inventé (saison de data/seasons.json, mer des normales NOAA affichées par la fiche)', () => {
  const surf = ideas[0], dive = ideas[1], warm = ideas[2];
  /* « Surf d’hiver », « Nov. à mars » : chaque étape est en saison chacun des mois annoncés, dont décembre, janvier, février. */
  assert.deepEqual(surf.months, [10, 2]);
  const months = [10, 11, 0, 1, 2];
  for (const id of surf.spots) for (const m of months) assert.ok((seasons[id] || []).includes(m), `${id} en saison le mois ${m}`);
  /* Température de la mer : la plus basse et la plus haute des valeurs mensuelles des trois étapes, telles qu’affichées. */
  for (const x of [dive, warm]) {
    const all = x.spots.flatMap(id => lite[id][0]);
    assert.equal(all.length, 36, x.short);
    assert.deepEqual(x.sea, [Math.min(...all), Math.max(...all)], x.short);
  }
  assert.ok(warm.sea[0] >= 24, '« Eau chaude » : au moins le seuil « 24 °C et plus » du planificateur, toute l’année');
  /* Les destinations n’annoncent ni saison ni température : leurs étapes n’ont pas de mois de saison en commun. */
  for (const x of ideas.slice(3)) { assert.ok(!x.months && !x.sea, x.short); }
});

test('repère d’une idée : écrit dans la langue choisie, jamais passé au traducteur de page', () => {
  const run = (lang, tag) => { const c = vm.createContext({ window: { OB_I18N: { lang }, OB_LOCALE: tag }, Intl: vm.runInNewContext('Intl'), Date, String }); vm.runInContext(`${fnSource(src, 'ideaFact')};this.f=ideaFact;`, c); return c.f; };
  const fr = run('fr', 'fr-FR'), en = run('en', 'en'), es = run('es', 'es');
  assert.equal(fr(ideas[0]), 'Nov. à mars'); assert.equal(fr(ideas[1]), '22 à 29 °C'); assert.equal(fr(ideas[2]), '26 à 29 °C'); assert.equal(fr(ideas[3]), '');
  assert.match(en(ideas[0]), /^Nov\s?[–-]\s?Mar$/); assert.equal(en(ideas[2]), '26–29 °C');
  assert.match(es(ideas[0]), /^Nov\.?\s?[–-]\s?mar\.?$/); assert.equal(es(ideas[1]), '22–29 °C');
  assert.match(src, /\$\{fact\?`<span class="tv-idea-fact" translate="no" data-no-i18n>\$\{esc\(fact\)\}<\/span>`:''\}/);
  /* Le mot de liaison n’est pas une clé de traduction (un gabarit « {0} à {1} » attraperait d’autres phrases). */
  const fr0 = JSON.parse(read('locales/source/fr.json'));
  assert.ok(!fr0.some(k => /^\{0\} à \{1\}/.test(k)));
});

test('affiche d’une idée : vraie photo paresseuse, sport en pastille, thème et lieu ; l’idée remplit le formulaire dans la langue de l’app', () => {
  const card = src.slice(src.indexOf('function ideaCard(x,i){'), src.indexOf('function tripCard(t,withSteps){'));
  assert.match(card, /<button type="button" class="tv-idea" data-action="idea" data-index="\$\{i\}"><img src="\$\{esc\(spotPhotoUrl\(x\.photo,480\)\|\|photo\(x\.photo\)\)\}"\$\{spotPhotoSrcset\(x\.photo\)\} sizes="[^"]+" alt="" loading="lazy" decoding="async">/);
  assert.match(card, /<span class="tv-idea-sport" aria-hidden="true">\$\{sportMark\(x\.sport\)\}<\/span>/);
  assert.match(card, /<span class="tv-idea-tx"><b>\$\{x\.short\}<\/b><small>\$\{x\.place\}<\/small><\/span><\/button>/);
  assert.match(src, /if\(a==='idea'\)editor\(null,ideas\[\+b\.dataset\.index\]\);/);
  assert.match(src, /const said=v=>\(v&&typeof obT==='function'\?obT\(v\):v\)\|\|'';\s*const fields=existing\|\|\{name:said\(idea\?\.name\),destination:said\(idea\?\.destination\)/);
  const fr = JSON.parse(read('locales/source/fr.json')), en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json'));
  for (const x of ideas) for (const k of [x.name, x.short, x.place, x.destination]) {
    assert.ok(fr.includes(k), 'source FR : ' + k);
    assert.ok(typeof en[k] === 'string' && en[k].trim(), 'EN : ' + k); assert.ok(typeof es[k] === 'string' && es[k].trim(), 'ES : ' + k);
  }
  assert.equal(i18nContext('en').obT('Surf d’hiver au Maroc'), 'Winter surf in Morocco'); assert.equal(i18nContext('es').obT('Plongée en mer Rouge'), 'Buceo en el mar Rojo');
  assert.match(css, /\.ocean-v2 \.tv-idea\{position:relative;display:block;min-width:0;aspect-ratio:4\/5;/);
  assert.match(css, /\.ocean-v2 \.tv-idea-tx small\{[^}]*text-overflow:ellipsis/);
});

test('sans voyage : illustration dédiée, en WebP de bonne définition, dans un cadre 16:9', () => {
  const empty = overview.slice(overview.indexOf('const empty='), overview.indexOf('return `<section'));
  assert.match(empty, /<span class="tv-empty-art"><img src="assets\/ui\/voyage-vide\.webp" srcset="assets\/ui\/voyage-vide-960\.webp 960w, assets\/ui\/voyage-vide\.webp 1536w" sizes="[^"]+" alt="" width="1536" height="864" decoding="async"><\/span>/);
  assert.ok(!/travel-v2\.webp/.test(empty), 'plus l’image de Poulpy réutilisée');
  /* Fichiers présents ; en-tête WebP (RIFF….WEBP) et dimensions annoncées (bloc VP8X, VP8 ou VP8L). */
  const size = f => { const b = fs.readFileSync(path.join(__dirname, '..', f)); assert.equal(b.toString('ascii', 0, 4), 'RIFF'); assert.equal(b.toString('ascii', 8, 12), 'WEBP');
    const tag = b.toString('ascii', 12, 16);
    if (tag === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (tag === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; };
  assert.deepEqual(size('assets/ui/voyage-vide.webp'), [1536, 864]); assert.deepEqual(size('assets/ui/voyage-vide-960.webp'), [960, 540]);
  assert.match(css, /\.ocean-v2 \.tv-empty-art\{display:block;width:100%;aspect-ratio:16\/9;[^}]*overflow:hidden\}/, 'place réservée : rien ne saute au chargement');
});

test('ordinateur : toute la largeur utile, voyages en colonnes, carte vide partagée entre l’illustration et l’invitation', () => {
  const wide = css.slice(css.indexOf('@media(min-width:960px){\n  .ocean-v2 .tv{max-width:1180px}'));
  assert.ok(wide.length > 100, 'bloc ordinateur de Voyages');
  assert.match(wide, /\.ocean-v2 \.tv-list\{grid-template-columns:repeat\(auto-fill,minmax\(440px,1fr\)\);/);
  assert.match(wide, /\.ocean-v2 \.tv-empty\{grid-template-columns:minmax\(0,1\.35fr\) minmax\(280px,1fr\);/);
  assert.match(wide, /\.ocean-v2 \.tv-empty-art\{grid-column:1;grid-row:1\/-1\}/);
  assert.ok(!/\.ocean-v2 \.tv\{max-width:920px\}/.test(css));
});

test('voyage ouvert et fenêtres : plus aucun titre en capitales', () => {
  assert.match(css, /\.ocean-v2 #trips \.trip-banner h2\{[^}]*font:800 32px\/1\.08 var\(--body\);[^}]*text-transform:none/);
  assert.match(css, /\.ocean-v2 \.trip-dialog h2\{[^}]*font:800 26px\/1\.12 var\(--body\);[^}]*text-transform:none/);
  /* ui-listes.css est chargée après trips.css (qui écrit ces titres en capitales) : sa règle l’emporte. */
  const html = read('index.html');
  assert.ok(html.indexOf('href="trips.css') > 0 && html.indexOf('href="trips.css') < html.indexOf('href="ui-listes.css'));
  for (const k of ['Nouveau voyage', 'Les détails du voyage']) assert.ok(src.includes(k));
  assert.match(css, /\.ocean-v2 #trips \.trip-banner \.trip-when\{[^}]*text-transform:none\}/, '« Départ demain », « Voyage terminé » en casse normale');
  /* Bannière : dates courtes, étapes et durée en repères à pictogramme ; plus de tiret ni de points médians. */
  const detail = src.slice(src.indexOf('function tripDetail(t){'), src.indexOf('function stepLogistics(s){'));
  assert.match(detail, /const n=t\.steps\.length,days=M\.duration\(t\),dates=shortRange\(t\);/, 'chiffres tirés du modèle');
  assert.match(detail, /<p class="tv-meta"><span>\$\{I\.calendar\}\$\{dates\?`<span translate="no" data-no-i18n>\$\{esc\(dates\)\}<\/span>`:'<span>Dates à définir<\/span>'\}<\/span><span>\$\{I\.pin\}/);
  assert.match(detail, /<h2>\$\{esc\(t\.name\)\}<\/h2>\$\{meta\}<\/div>/);
  assert.ok(!/range\(t\)\)\} <span>·<\/span>/.test(detail));
  assert.match(read('poulpy.css'), /\.trip-dialog h2 \{ padding-right:100px; \}/, 'le titre s’arrête avant le médaillon de Poulpy (place réservée par poulpy.css)');
  assert.ok(!/\.ocean-v2 \.trip-dialog h2\{[^}]*padding/.test(css), 'ui-listes.css ne retire pas cette réserve');
});

test('vie de la passe : cartes et idées qui entrent, itinéraire qui se trace, voyage ouvert et fenêtre qui arrivent ; rien en mouvement réduit', () => {
  const live = src.slice(src.indexOf('let arriving=true'), src.indexOf('function storedTrips('));
  assert.match(live, /const rise=\(el,delay,dy=14,duration=420\)=>el\.animate\(\[\{opacity:0,transform:`translate3d\(0,\$\{dy\}px,0\)`\},\{opacity:1,transform:'translate3d\(0,0,0\)'\}\]/);
  assert.match(live, /cards\.forEach\(\(card,k\)=>\{\s*rise\(card,40\+k\*60\);/);
  assert.match(live, /document\.querySelectorAll\('#tripContent \.tv-idea'\)\.forEach\(\(el,i\)=>rise\(el,after\+90\+i\*45,12,400\)\);/);
  assert.match(live, /li\.classList\.contains\('tv-link'\)\?\[\{opacity:0,transform:'scaleX\(0\)'\},\{opacity:1,transform:'scaleX\(1\)'\}\]/, 'le trait entre deux ronds se trace');
  assert.match(css, /\.ocean-v2 \.tv-link\{[^}]*transform-origin:0 50%\}/);
  /* Voyage ouvert : à l’ouverture seulement, et le drapeau est posé juste avant le rendu qui reste à l’écran. */
  assert.match(live, /function arriveTrip\(\)\{\s*const fresh=opening;opening=false;\s*if\(!fresh\|\|still\(\)\|\|document\.body\.dataset\.screen!=='trips'\)return;/);
  assert.match(src, /if\(t\)arriveTrip\(\);else enliven\(\);/);
  assert.match(src, /go\('trips'\);opening=true;render\(\);/); assert.match(src, /go\('trips'\);opening=!existing;render\(\);/);
  assert.ok(!/opening=true;go\('trips'\)/.test(src), 'go(\'trips\') rend déjà l’écran une fois : le drapeau serait consommé trop tôt');
  /* Fenêtre : animation CSS, coupée en mouvement réduit (réglage du téléphone et réglage de l’app). */
  assert.match(css, /@keyframes tv-dialog-in\{from\{opacity:0;transform:translate3d\(0,14px,0\) scale\(\.98\)\}\}/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.ocean-v2 \.trip-dialog\[open\],\.ocean-v2 \.trip-dialog\[open\]::backdrop\{animation:none\}\}/);
  assert.match(css, /\.ocean-v2\.reduce-motion \.trip-dialog\[open\],\.ocean-v2\.reduce-motion \.trip-dialog\[open\]::backdrop\{animation:none\}/);
  assert.match(css, /\.ocean-v2\.reduce-motion :is\(\.tv-card,\.tv-idea\),\.ocean-v2\.reduce-motion \.tv-idea>img\{transition:none\}/);
  assert.ok(!/setInterval|iterations|infinite/.test(live) && !/infinite/.test(css), 'aucune boucle permanente');
});
