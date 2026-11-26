/* Lot 0 « Corrections » de la version qui suit la 1.5.0 : traductions (mois, nuits, messages avec prénom, légendes de photos,
   sources du Coin), requêtes de recherche dans la langue de l'app, liste « Avant de partir » selon le sport, textes et styles
   des petits défauts (0.1 à 0.18). Le traducteur i18n.js tourne dans Node comme dans tests/app-update-ecran.test.js. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { i18nContext, load } = require('./src-extract.cjs');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const json = f => JSON.parse(read(f));

/* ---------- 0.1 : « Mar » reste « Mar » ---------- */
test('0.1 les mois et les jours écrits par Intl ne sont jamais retraduits (« Mar » ne devient plus « Tue »)', () => {
  for (const lang of ['en', 'es']) {
    const t = i18nContext(lang, {}).OB_I18N.t;
    for (const style of ['short', 'long']) {
      for (let m = 0; m < 12; m++) { const n = new Intl.DateTimeFormat(lang, { month: style }).format(new Date(2026, m, 15)); assert.equal(t(n), n, `${lang} mois ${n}`); }
      for (let d = 0; d < 7; d++) { const n = new Intl.DateTimeFormat(lang, { weekday: style }).format(new Date(2026, 10, 1 + d)); assert.equal(t(n), n, `${lang} jour ${n}`); }
    }
    assert.equal(t('Mar'), 'Mar');
  }
});
test('0.1 spot-plan.js protège les mois du traducteur et traduit « envies » (plus de point médian)', () => {
  const src = read('spot-plan.js');
  assert.match(src, /data-plan-m="\$\{m\}" translate="no"/);
  assert.match(src, /<span translate="no">\$\{esc\(monthName\(st\.m, 'short'\)\)\}<\/span>/);
  assert.doesNotMatch(src, /' · '|\} · \$\{/);
  assert.match(src, /OceanPlan = \{[^}]*\blabel\b/);
  assert.match(src, /function label\(st = state\)/);
  const t = i18nContext('en', {}).OB_I18N.t;
  assert.equal(t('2 envies'), '2 picks');
});

/* ---------- 0.2 : nuits ---------- */
test('0.2 « 3 nuits » : gabarits entiers, traduits d’un bloc', () => {
  const en = i18nContext('en', {}).OB_I18N.t, es = i18nContext('es', {}).OB_I18N.t;
  assert.equal(en('3 nuits : 42–90 € au total.'), '3 nights: 42–90 € in total.');
  assert.equal(es('3 nuits : 42–90 € au total.'), '3 noches: 42–90 € en total.');
  assert.equal(en('1 nuit : 14 € au total.'), '1 night: 14 € in total.');
  assert.equal(en('pour 3 nuits en solo'), 'for 3 nights solo');
  assert.equal(es('pour 1 nuit en solo, sur les étapes datées'), 'por 1 noche en solitario, en las etapas con fecha');
  const src = read('spot-guide.js');
  assert.doesNotMatch(src, /step\.nights\+' nuits'|est\.nights\+' nuits'/);
});

/* ---------- 0.3 : message avec prénom ---------- */
test('0.3 « Bon retour » et « C’est parti » : une phrase entière, le prénom posé après la traduction', () => {
  const run = (lang, name) => {
    const ctx = i18nContext(lang, {});
    const g = load('app.js', ['shownName', 'greet'], { window: { obT: ctx.OB_I18N.t }, userName: name });
    return [g.greet('Bon retour, {0} ! L’océan t’attendait.'), g.greet('C’est parti, {0} !', g.shownName())];
  };
  assert.deepEqual(run('en', 'Explorateur'), ['Welcome back, Explorer! The ocean was waiting for you.', 'Let\'s go, Explorer!']);
  assert.deepEqual(run('es', 'Explorateur'), ['¡Qué bueno tenerte de vuelta, Explorador! ¡El océano te esperaba!', '¡Vamos, Explorador!']);
  assert.deepEqual(run('en', 'Léa'), ['Welcome back, Léa! The ocean was waiting for you.', 'Let\'s go, Léa!']);
  assert.deepEqual(run('fr', 'Explorateur'), ['Bon retour, Explorateur ! L’océan t’attendait.', 'C’est parti, Explorateur !']);
});

/* ---------- 0.4 : légendes de photos et sources du Coin ---------- */
test('0.4 chaque légende et chaque titre de photo a sa traduction anglaise et espagnole', () => {
  const ctx = vm.createContext({ window: {} }); vm.runInContext(read('photo-catalog.js'), ctx);
  const en = json('locales/translations/en.json'), es = json('locales/translations/es.json'), src = new Set(json('locales/source/fr.json'));
  const rows = [...Object.values(ctx.window.SPOT_PHOTOS), ...[].concat(...Object.values(ctx.window.SPOT_GALLERIES))];
  let n = 0;
  for (const p of rows) for (const f of ['caption', 'label']) if (p[f]) { n++; assert.ok(src.has(p[f]), 'non extrait : ' + p[f]); assert.ok(en[p[f]] && es[p[f]], 'non traduit : ' + p[f]); }
  assert.ok(n >= 100);
});
test('0.4 sources du Coin : « Wikipedia (fr), « titre » », identique dans toutes les langues', () => {
  const M = require('../spot-guide-model.js');
  assert.deepEqual(M.sourceLabel('Wikipédia, article « Pastis landais »', 'https://fr.wikipedia.org/wiki/Pastis_landais'), { text: 'Wikipedia (fr), « Pastis landais »', fixed: true });
  assert.equal(M.sourceLabel('Wikipédia (en), article « Zakynthos »', 'https://en.wikipedia.org/wiki/Zakynthos').text, 'Wikipedia (en), « Zakynthos »');
  assert.equal(M.sourceLabel('Wikivoyage (en), article « Tahiti »', 'https://en.wikivoyage.org/wiki/Tahiti').text, 'Wikivoyage (en), « Tahiti »');
  assert.equal(M.sourceLabel('Wiktionnaire, entrée « kaixo »', 'https://fr.wiktionary.org/wiki/kaixo').text, 'Wiktionary (fr), « kaixo »');
  assert.equal(M.sourceLabel('Wikipedia en espagnol', 'https://es.wikipedia.org/wiki/Rond%C3%B3n_(plato)').text, 'Wikipedia (es), « Rondón (plato) »');
  assert.equal(M.sourceLabel('Wikipédia', 'https://fr.wikipedia.org/wiki/Marmite_dieppoise').text, 'Wikipedia (fr), « Marmite dieppoise »');
  assert.deepEqual(M.sourceLabel('Tourism Whitsundays', 'https://x'), { text: 'Tourism Whitsundays', fixed: false });
  /* Toutes les sources du fichier : une étiquette sans « undefined », et chaque éditeur non Wikimedia est traduit. */
  const en = json('locales/translations/en.json'), es = json('locales/translations/es.json');
  for (const z of Object.values(json('data/culture-zones.json').zones)) for (const f of z.facts) {
    const r = M.sourceLabel(f.source.publisher, f.source.url);
    assert.doesNotMatch(r.text, /undefined/);
    if (!r.fixed) assert.ok(en[r.text] && es[r.text], 'éditeur non traduit : ' + r.text);
    else assert.match(r.text, /^Wik(ipedia|ivoyage|tionary) \([a-z-]+\)(, « .+ »)?$/);
  }
  assert.match(read('spot-guide.js'), /M\.sourceLabel\(publisher,url,window\.OB_I18N\?\.lang\)/);
  /* Guillemets selon la langue : “ ” en anglais, « » en français et en espagnol. */
  assert.equal(M.sourceLabel('Wikipédia, article « Pastis landais »', 'https://fr.wikipedia.org/wiki/Pastis_landais', 'en').text, 'Wikipedia (fr), “Pastis landais”');
  assert.equal(M.sourceLabel('Wikipédia, article « Pastis landais »', 'https://fr.wikipedia.org/wiki/Pastis_landais', 'es').text, 'Wikipedia (fr), « Pastis landais »');
  assert.equal(M.sourceLabel('Wikipédia', 'https://fr.wikipedia.org/wiki/Pastis_landais', 'fr').text, 'Wikipedia (fr), « Pastis landais »');
  assert.equal(M.sourceLabel('Wikipédia (en)', 'https://en.wikipedia.org/wiki/X', 'en').text, 'Wikipedia (en), “X”');
  assert.equal(M.sourceLabel('Tourism Whitsundays', 'https://x', 'en').text, 'Tourism Whitsundays');
});

/* ---------- 0.5 : recherches dans la langue de l'app ---------- */
test('0.5 requêtes de recherche dans la langue de l’app, vraie adresse de recherche Hostelworld', () => {
  const M = require('../spot-guide-model.js');
  assert.deepEqual(M.searchQueries('fr', 'Surf'), { hotels: 'hôtels pas chers', school: 'école surf', rental: 'location matériel surf', restaurants: 'restaurants' });
  assert.deepEqual(M.searchQueries('en', 'Diving'), { hotels: 'cheap hotels', school: 'diving school', rental: 'diving equipment rental', restaurants: 'restaurants' });
  assert.deepEqual(M.searchQueries('es', 'Buceo'), { hotels: 'hoteles baratos', school: 'escuela de buceo', rental: 'alquiler de material de buceo', restaurants: 'restaurantes' });
  assert.equal(M.searchQueries('de', '').school, 'école');
  const fr = M.searchLinks('Hossegor, France'), en = M.searchLinks('Hossegor, France', { lang: 'en' }), es = M.searchLinks('Hossegor, France', { lang: 'es' });
  assert.equal(fr.hostelworld, 'https://www.hostelworld.com/find/keywordsuggestions?search_keywords=Hossegor%2C%20France&internalsearch=yes');
  assert.match(fr.google, /h%C3%B4tels%20pas%20chers%20Hossegor/);
  assert.match(en.google, /cheap%20hotels%20Hossegor/);
  assert.match(es.google, /hoteles%20baratos%20Hossegor/);
  assert.doesNotMatch(JSON.stringify(fr), /google\.com\/search/);
  assert.match(read('spot-guide.js'), /M\.searchQueries\(LG\(\)/);
});

/* ---------- 0.6 : tiret long, dates, point médian ---------- */
test('0.6 noms de spots sans tiret long (SpotName.html) et dates écrites dans la langue choisie', () => {
  assert.match(read('trips.js'), /<b>\$\{nameHtml\(s\.name\)\}<\/b><small>\$\{esc\(s\.loc\)\}/);
  assert.match(read('trips.js'), /<p>\$\{nameHtml\(spot\(spotId\)\.name\)\}<\/p>/);
  assert.doesNotMatch(read('trips.js'), /' — '\+date/);
  assert.match(read('ocean-map.js'), /<b>\$\{nameHtml\(s\)\}<\/b>/);
  assert.equal((read('ocean-map.js').match(/<b>\$\{esc\(s\.name\)\}<\/b>/g) || []).length, 0);
  assert.match(read('spot-notebook.js'), /<b>\$\{window\.SpotName\?SpotName\.html\(s\.name\):esc\(s\.name\)\}<\/b>/);
  assert.doesNotMatch(read('index.html'), /<title>[^<]*—/);
  assert.doesNotMatch(read('polish.js'), /\.join\(' · '\)/);
  const en = i18nContext('en', {}).OB_I18N.t, es = i18nContext('es', {}).OB_I18N.t;
  assert.equal(en('du Dec 5 au Dec 12, 2026'), 'Dec 5 to Dec 12, 2026');
  assert.equal(es('du 5 dic au 12 dic 2026'), 'del 5 dic al 12 dic 2026');
  assert.equal(en('Jusqu’au Dec 12, 2026'), 'Until Dec 12, 2026');
});
test('0.6 texte de partage d’un spot : nom en clair puis niveau et sport entre parenthèses, sans point médian', () => {
  const src = read('polish.js');
  assert.match(src, /nm\.sub \? nm\.main \+ ', ' \+ nm\.sub : nm\.main, extra && '\(' \+ extra \+ '\)'/);
});

/* ---------- 0.7 : sports en pictogrammes ---------- */
test('0.7 feuille de région : trois pictogrammes de sport, lus par une étiquette, au lieu des mots coupés', () => {
  const js = read('ocean-map.js'), css = read('ocean-map.css');
  assert.match(js, /<small>\$\{esc\(countryOf\(s\)\)\}\$\{sportsHtml\(acts\)\}<\/small>/);
  assert.match(js, /role="img" aria-label="\$\{esc\(label\)\}"/);
  assert.match(js, /:`, \$\{esc\(label\)\}`;/, 'repli sans pictogrammes : « Espagne, Surf, Plongée » (virgule après le pays)');
  assert.doesNotMatch(js, /esc\(countryOf\(s\)\)\} · \$\{esc\(acts\.slice/);
  assert.match(css, /\.omap-sports\{display:inline-flex/);
  assert.match(css, /\.omap-item \.omap-sports \.poulpy-mini\{width:22px!important/);
});

/* ---------- 0.8 : barre « Ajouter à un voyage » ---------- */
test('0.8 la barre d’action de la fiche ne monte qu’une fois le sommaire passé (#detail.is-past)', () => {
  const src = read('ocean-hub.js');
  assert.match(src, /bar\.classList\.toggle\('show',onDetail&&detail\.classList\.contains\('is-past'\)\)/);
  assert.match(src, /new MutationObserver\(\(\)=>requestAnimationFrame\(check\)\)\.observe\(detail,\{attributes:true,attributeFilter:\['class'\]\}\)/);
  assert.match(read('app.js'), /detail\.classList\.toggle\('is-past',past\)/);  /* Relecture : cachée, la barre n’est ni atteignable au clavier ni lue par VoiceOver. */
  assert.match(src, /bar\.inert=true;/);
  assert.match(src, /bar\.inert=!bar\.classList\.contains\('show'\);/);
});

/* ---------- 0.9, 0.10, 0.11 ---------- */
test('0.9 un seul mot : « Nouveautés » sur la planète comme dans la liste', () => {
  assert.match(read('ocean-map.js'), /\['new','Nouveautés'\]/);
  assert.doesNotMatch(read('ocean-map.js'), /'Nouveaux'/);
  assert.match(read('explore-list.js'), /'Nouveautés'/);
});
test('0.10 « Pas aujourd’hui. Demain de 15 h à 17 h. » dans l’onglet Conditions, comme l’accueil', () => {
  const b = read('spot-before.js');
  assert.match(b, /function slot\(s, rule, today, hourFmt, caution, tomorrow\)/);
  assert.match(b, /`Pas aujourd’hui\. Demain \$\{nextText\}\.`/);
  assert.match(read('spot-experience.js'), /toBefore\(slots\.rule, slots\.today, slots\.res && slots\.res\[1\] \? slots\.res\[1\]\.r : null\)/);
  const en = i18nContext('en', {}).OB_I18N.t;
  assert.equal(en('Pas aujourd’hui. Demain de 3 PM à 5 PM.'), 'Not today. Tomorrow from 3 PM to 5 PM.');
});
test('0.11 la rubrique « Pour toi aujourd’hui » garde un seul titre', () => {
  const f = read('home-feed.js');
  assert.match(f, /const GOOD_TITLE='Pour toi aujourd’hui';/);
  assert.match(f, /function goodTitle\(\)\{return GOOD_TITLE;\}/);
});

/* ---------- 0.12 à 0.17 ---------- */
test('0.12 le lien « Communauté » est masqué tant que le serveur n’est pas configuré', () => {
  assert.match(read('community.js'), /if\(!configured\)document\.querySelectorAll\('\.n-community'\)\.forEach\(b=>\{b\.hidden=true;\}\)/);
  assert.match(read('ui-nav.css'), /\.n-community\[hidden\]\{display:none!important\}/);
  assert.equal(read('community-config.js').includes("endpoint:''"), true);
});
test('0.13 plus de sur-titre en capitales dans l’accueil, la fiche et le comparateur', () => {
  assert.match(read('index.html'), /<span class="onb-kicker">Bienvenue chez Ocean Buddy<\/span>/);
  for (const f of ['field-guide.js', 'spot-notebook.js']) assert.doesNotMatch(read(f), /PROLONGER|TA SESSION|TON PROCHAIN|SITUER &|NOUVEAUX SPOTS|LE DÉPART SE PRÉPARE/);
  assert.doesNotMatch(read('field-guide.css').split('\n').find(l => l.startsWith('.field-eyebrow{')), /uppercase/);
});
test('0.14 le bouton « près de moi » prévient qu’on demandera la position', () => {
  assert.match(read('index.html'), /montre-moi les activités près de moi \(on te demandera ta position\)</);
});
test('0.15 « Avant de partir » : le matériel suit le sport, le surf reste le repli', () => {
  const M = require('../trip-model.js');
  assert.equal(M.create().checklist[1].label, 'Préparer planche, leash et combinaison');
  assert.equal(M.create({}, ['x'], { sport: 'surf' }).checklist[1].label, 'Préparer planche, leash et combinaison');
  assert.equal(M.create({}, ['x'], { sport: 'plongee' }).checklist[1].label, 'Préparer ton matériel de plongée');
  assert.equal(M.create({}, ['x'], { sport: 'kayak' }).checklist[1].label, 'Préparer kayak, pagaie et aide à la flottabilité');
  assert.equal(M.create({}, ['x'], { sport: 'inconnu' }).checklist[1].label, 'Préparer planche, leash et combinaison');
  for (const sport of ['surf', 'bodyboard', 'plongee', 'snorkeling', 'paddle', 'kayak', 'baignade', 'kitesurf', 'windsurf']) {
    const labels = M.create({}, ['x'], { sport }).checklist.map(c => c.label);
    assert.equal(labels.length, 6);
    assert.equal(labels[0], 'Vérifier les conditions et l’accès aux spots');
  }
  assert.match(read('trips.js'), /M\.create\(f,spotId\?\[spotId\]:\(idea\?\.spots\|\|\[\]\),\{sport:sportFor\(spotId\|\|idea\?\.spots\?\.\[0\]\)\}\)/);
});
test('0.16 Réglages : plancher à 13 px', () => {
  const css = read('design.css') + read('base.css');
  assert.match(read('app.js'), /<h4 style="font-size:13px!important;line-height:1\.15/);
  for (const re of [/\.set-lab,\.ocean-v2 \.set-toggle\{font-size:13px/, /\.set-reset\{[^}]*font-size:13px/, /\.set-about\{font-size:13px/, /\.set-card \.set-save,\.ocean-v2 \.set-card \.quiz-x,\.ocean-v2 \.set-card \.sport-card h4\{font-size:13px!important/, /\.set-lab\{display:block;font-size:13px/])
    assert.match(css, re);
});
test('0.17 « Ta saison de compétition », sans point médian', () => {
  assert.match(read('index.html'), /Ta saison de compétition<\/h4>/);
  assert.doesNotMatch(read('index.html'), /Compétition · ta saison/);
});

/* ---------- 0.18 : onboarding à 375 × 667 ---------- */
test('0.18 petits écrans en hauteur : pictogrammes à 48 px et « Continuer » collé en bas', () => {
  const css = read('polish.css');
  assert.match(css, /@media \(max-width:640px\) and \(max-height:700px\)\{[^}]*#onb \.sport-card \.se\{width:48px!important;height:48px!important\}/);
  assert.match(css, /#onb \.onb-step\.active \.onb-btn\{position:sticky;bottom:calc\(8px \+ env\(safe-area-inset-bottom\)\)/);
});

/* ---------- Traductions complètes ---------- */
test('les dictionnaires couvrent tous les textes extraits (anglais et espagnol)', () => {
  const src = json('locales/source/fr.json'), en = json('locales/translations/en.json'), es = json('locales/translations/es.json');
  const miss = k => src.filter(x => !(typeof k[x] === 'string' && k[x].trim()));
  assert.deepEqual(miss(en), []);
  assert.deepEqual(miss(es), []);
});
