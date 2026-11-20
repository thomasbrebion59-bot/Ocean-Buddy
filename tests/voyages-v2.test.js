const test = require('node:test'), assert = require('node:assert/strict');
const vm = require('node:vm');
const { read, fnSource, i18nContext } = require('./src-extract.cjs');
/* Interface v2, Voyages (maquette orga-docs/interface-v2/maquette-4-voyages.png) : « Mes voyages » d’abord, une carte légère
   par voyage, « Nouveau voyage », trois idées en petit ; plus de grande affiche ni de sur-titres en capitales. */
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

test('Mes voyages : dans l’ordre, les voyages, « Nouveau voyage », puis « Idées » en petit', () => {
  const a = overview.indexOf('<h2 class="ui-title">Mes voyages</h2>'), b = overview.indexOf('saved.map(t=>tripCard(t,t.id===star))'), c = overview.indexOf('data-action="new"', b), d = overview.indexOf('<h2 class="ui-title">Idées</h2>'), e = overview.indexOf('data-action="idea"');
  assert.ok(a > 0 && a < b && b < c && c < d && d < e, 'ordre des blocs');
  assert.match(overview, /<button type="button" class="ui-btn tv-new" data-action="new">\$\{I\.plus\}<span>Nouveau voyage<\/span><\/button>/);
  assert.match(css, /\.ocean-v2 \.tv-new\{width:100%;/, 'bouton pleine largeur');
  assert.match(css, /\.ocean-v2 \.tv-ideas\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/, 'trois vignettes sur une rangée');
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
