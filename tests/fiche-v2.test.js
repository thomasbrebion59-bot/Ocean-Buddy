/* Fiche de spot v2 (18 nov. 2026, demande du fondateur) : plus de bloc « Avant d’y aller », la fiche s’ouvre sur les
   conditions (parcours en chapitres depuis le 20 nov.), la sécurité a son onglet (jamais repliée), une seule
   police (Figtree) et une échelle typographique pilotée par des variables. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { read, fnSource } = require('./src-extract.cjs');
const html = read('index.html'), app = read('app.js'), before = read('spot-before.js'), css = read('fiche.css'), exp = read('spot-experience.js');

/* 20 nov. 2026 : la fiche est un parcours en chapitres (proposition approuvée par le fondateur). La rangée #dTabs est la
   barre de progression ; un sommaire en médaillons ouvre le parcours. */
const tabsHtml = html.slice(html.indexOf('<div class="dtabs" id="dTabs">'), html.indexOf('<div class="dcat" data-cat="infos"'));
const tabs = [...tabsHtml.matchAll(/<button type="button" class="dtab( active)?" data-cat="(\w+)" onclick="showDetailCat\('(\w+)'\)">([\s\S]*?)<\/button>/g)];
const CHAPTERS = ['meteo', 'infos', 'faune', 'securite', 'saisons', 'activites'];

test('parcours : six chapitres dans la barre, « Conditions » en premier ; un sommaire en médaillons ouvre la fiche', () => {
  assert.deepEqual(tabs.map(t => t[2]), CHAPTERS);
  assert.deepEqual(tabs.map(t => t[4].replace(/<span class="dtab-dots"[^>]*><\/span>/, '').replace(/<[^>]+>/g, '').trim()), ['Conditions', 'Le coin', 'Nature', 'Sécurité', 'Saisons', 'Préparer']);
  assert.deepEqual(tabs.map(t => !!t[1]), [true, false, false, false, false, false]);
  for (const t of tabs) assert.equal(t[2], t[3], 'data-cat et showDetailCat disent le même chapitre');
  assert.doesNotMatch(tabsHtml, /<img|<svg/, 'aucun pictogramme dans la barre');
  assert.match(app, /const DETAIL_CHAPTERS=\['meteo','infos','faune','securite','saisons','activites'\];/);
  /* Sommaire : mêmes chapitres, même ordre, chacun avec son illustration (fichier présent) et son nom. */
  const start = html.slice(html.indexOf('<nav class="px-start" id="dStart"'), html.indexOf('<div class="dtabs" id="dTabs">'));
  const meds = [...start.matchAll(/<button type="button" class="px-med" data-fx-tab="(\w+)"><img src="(assets\/fiche\/[\w-]+\.webp)" alt="" width="210" height="210" loading="lazy" decoding="async" draggable="false"><span>([^<]+)<\/span><\/button>/g)];
  assert.deepEqual(meds.map(m => m[1]), CHAPTERS);
  assert.deepEqual(meds.map(m => m[3]), ['Conditions', 'Le coin', 'Nature', 'Sécurité', 'Saisons', 'Préparer']);
  for (const m of meds) assert.ok(require('node:fs').existsSync(require('node:path').join(__dirname, '..', m[2])), m[2]);
  assert.match(start, /<h3 class="fx-title">Ton voyage commence ici<\/h3>/);
  assert.ok(html.indexOf('id="dStart"') < html.indexOf('id="dTabs"'), 'le sommaire précède la barre');
  /* Le panneau des conditions est le premier chapitre ; la fiche s’ouvre dessus, prévisions détaillées refermées. */
  assert.match(html, /<div class="dcat" data-cat="meteo" data-view="now">/);
  assert.match(app, /removeAttribute\('data-forecast'\);\n  showDetailCat\('meteo',false\);\n  \/\* Les modules annexes/, 'openSpot ouvre la fiche en haut du parcours');
  assert.match(read('navigation.js'), /detailTab:\$\('#dTabs \.dtab\.active'\)\?\.dataset\.cat\|\|'meteo'/);
  assert.match(read('navigation.js'), /showDetailCat\(route\.detailTab\|\|'meteo',false\);/, 'chapitre rendu au Retour par la même fonction');
  /* Ordre des chapitres posé par la feuille, les panneaux gardent leur place dans la page. */
  CHAPTERS.forEach((c, i) => assert.match(css, new RegExp(`#detail \\.detail-body>:is\\(\\.dcat\\[data-cat="${c}"\\],\\[data-chapter="${c}"\\]\\)\\{order:${[1, 2, 3, 5, 6, 7][i]}\\}`), c));
  assert.match(css, /#detail \.detail-body>\.dcat\[data-cat="preserver"\]\{order:4\}/, 'les gestes suivent la faune');
  assert.match(css, /#detail \.detail-body>\.fx-notes\{order:9\}/, '« Sources et précisions » ferme le parcours');
});

/* showDetailCat exécuté avec de faux panneaux. */
function tabWorld() {
  const cats = ['infos', 'saisons', 'meteo', 'activites', 'faune', 'preserver', 'securite'];
  const made = {};
  const panels = cats.map(c => ({ dataset: { cat: c }, style: { display: 'none' }, removed: [], before(h) { made[h.id] = h; } }));
  if (panels[2]) panels[2].dataset.view = 'forecast';
  const btns = CHAPTERS.map(c => ({ dataset: { cat: c }, cls: new Set(), attrs: {}, classList: { toggle(n, on) { on ? this.o.cls.add(n) : this.o.cls.delete(n); } }, setAttribute(k, v) { this.attrs[k] = v; } }));
  btns.forEach(b => { b.classList.o = b; });
  const detail = { dataset: {} }, scrolled = [];
  const meteo = panels.find(p => p.dataset.cat === 'meteo');
  const el = id => ({ id, getBoundingClientRect: () => ({ top: 500 }), isConnected: true });
  const ctx = {
    window: {}, Date,
    document: {
      querySelectorAll: s => (s === '#detail .dcat' ? panels : s === '#dTabs .dtab' ? btns : []),
      querySelector: s => (s === '#detail .dcat[data-cat="meteo"]' ? meteo : s === '#dTabs .dtab.active' ? (btns.find(b => b.cls.has('active')) || null) : s === '#spotWeek .wx-week' ? el('week') : /^#detail \.dcat\[data-cat="(\w+)"\]$/.test(s) ? panels.find(p => p.dataset.cat === RegExp.$1) : null),
      getElementById: id => (id === 'detail' ? detail : id === 'dPreserve' ? el('dPreserve') : id === 'screenWrap' ? { scrollTop: 0, getBoundingClientRect: () => ({ top: 0 }), scrollTo: o => scrolled.push(o) } : made[id] || null),
      createElement: () => ({ dataset: {}, isConnected: true, getBoundingClientRect: () => ({ top: 500 }) }),
      body: { classList: { contains: () => false }, dataset: { screen: 'detail' } }
    },
    getComputedStyle: () => ({ paddingTop: '8px', top: '44px' }),
    setTimeout: () => 0, requestAnimationFrame: f => f()
  };
  vm.createContext(ctx);
  const src = ['DETAIL_TABS', 'DETAIL_CHAPTERS'].map(n => app.match(new RegExp(`const ${n}=\\[[^\\]]+\\];`))[0].replace('const ', 'var ')).join('')
    + app.match(/const DETAIL_CHAPTER_TITLES=\{[^}]+\};/)[0].replace('const ', 'var ') + 'var detailSpyLock=0;'
    + ['detailTabOf', 'detailChapterOf', 'detailReduced', 'detailChaptersMount', 'detailMarkChapter', 'detailBarOffset', 'detailScrollTo', 'showDetailCat'].map(n => fnSource(app, n)).join('');
  vm.runInContext(src, ctx);
  const shown = () => panels.filter(p => p.style.display === '').map(p => p.dataset.cat);
  const active = () => btns.filter(b => b.cls.has('active')).map(b => b.dataset.cat);
  return { ctx, panels, shown, active, detail, scrolled, made, meteo };
}

test('aller à un chapitre : tous les panneaux restent affichés, la barre marque le chapitre, les anciens noms d’onglets marchent toujours', () => {
  const w = tabWorld(), go = (c, scroll = false) => w.ctx.showDetailCat(c, scroll);
  go('meteo');
  assert.deepEqual(w.shown().sort(), ['activites', 'faune', 'infos', 'meteo', 'preserver', 'saisons', 'securite'], 'aucun panneau masqué');
  assert.equal(w.meteo.dataset.view, 'now', 'le chapitre Conditions montre le moment présent');
  assert.deepEqual(w.active(), ['meteo']);
  /* Un titre par chapitre, posé devant son panneau (jamais dedans : les modules réécrivent le contenu des panneaux). */
  assert.deepEqual(Object.keys(w.made).sort(), CHAPTERS.map(c => 'dChapter-' + c).sort());
  assert.deepEqual(CHAPTERS.map(c => w.made['dChapter-' + c].textContent), ['Conditions', 'Le coin', 'Nature', 'Sécurité', 'Saisons', 'Préparer']);
  for (const c of ['securite', 'infos', 'saisons', 'activites', 'faune']) { go(c); assert.deepEqual(w.active(), [c]); assert.equal(w.detail.dataset.tab, c); assert.equal(w.shown().length, 7); }
  /* « previsions » : les 7 jours et l’heure par heure s’ouvrent dans Conditions. « preserver » : les gestes, chapitre Nature. */
  assert.equal(w.meteo.dataset.forecast, undefined);
  go('previsions'); assert.equal(w.meteo.dataset.forecast, 'open'); assert.deepEqual(w.active(), ['meteo']); assert.equal(w.meteo.dataset.view, 'now');
  go('preserver'); assert.deepEqual(w.active(), ['faune']);
  go('nimportequoi'); assert.deepEqual(w.active(), ['meteo']);
  /* Sans défilement demandé (ouverture, Retour), la page ne bouge pas ; avec, elle va au chapitre, sous la barre. */
  assert.equal(w.scrolled.length, 0);
  go('securite', true); assert.equal(w.scrolled.length, 1); assert.equal(w.scrolled[0].behavior, 'smooth');
  assert.equal(w.scrolled[0].top, 500 - 0 - 10, 'au titre du chapitre, moins la hauteur de la barre collée (absente de ce faux monde)');
  assert.match(fnSource(app, 'detailBarOffset'), /return \(parseFloat\(getComputedStyle\(wrap\)\.paddingTop\)\|\|0\)\+\(parseFloat\(getComputedStyle\(bar\)\.top\)\|\|0\)\+bar\.offsetHeight;/);
  /* Les prévisions détaillées ne sont masquées que tant qu’on ne les a pas demandées. */
  assert.match(css, /\[data-view="now"\]:not\(\[data-forecast="open"\]\) \[data-fx-view="forecast"\],/);
  /* Chapitre lu : écoute passive, au plus une mesure tous les 120 ms. */
  assert.match(app, /wrap\.addEventListener\('scroll',onScroll,\{passive:true\}\);/);
  assert.match(app, /var wait=Math\.max\(0,120-\(Date\.now\(\)-last\)\);/);
  assert.doesNotMatch(app.slice(app.indexOf('const DETAIL_CHAPTERS'), app.indexOf('function worldLab')), /scroll-snap|setInterval/);
});

test('ouverture : trois chiffres du moment sur la photo, la motion d’arrivée et la parallaxe s’effacent en mouvement réduit', () => {
  assert.match(html, /<div class="dfacts" id="dFacts"><\/div>\n\s*<!--[^>]*-->\n\s*<div class="hx-now" id="dHeroNow"><\/div>/);
  const hero = fnSource(before, 'hero');
  assert.match(hero, /if \(!s \|\| s\.custom\) \{ el\.innerHTML = ''; el\.hidden = true; return; \}/, 'rien sur un spot personnel');
  assert.match(hero, /chips\.push\(hxChip\('wave', 'Houle'/); assert.match(hero, /chips\.push\(hxChip\('temp', 'Eau'/);
  assert.match(hero, /if \(inland\(s\)\) \{[\s\S]*hxChip\('wind', 'Vent'/, 'plan d’eau intérieur : le vent, pas la houle');
  assert.match(hero, /class="hx-chip hx-danger" data-hx="danger" data-fx-tab="securite"/, 'le danger mène à la sécurité');
  assert.match(hero, /ready \? \(sw \? num\(sw\) : '—'\) : hxWait/, 'la case garde sa place pendant le chargement');
  assert.match(before, /hero\(s, L && L\.live \? L : null\);/); assert.match(fnSource(before, 'live'), /hero\(s, l\);/);
  /* Photo : environ 62 % de l’écran sur téléphone (proposition approuvée ; 42 % au temps des onglets). */
  assert.match(css, /html \.ocean-v2 #detail #detailHero\{min-height:clamp\(400px,62dvh,600px\);height:auto\}/);
  /* Motion : une fois par ouverture, rien en boucle, rien en mouvement réduit ; parallaxe en transform, une écriture par image. */
  /* (La scène de Conditions, plus bas dans fiche.css, a sa propre règle : boucle douce seulement à l’écran.) */
  const px = css.slice(css.indexOf('PARCOURS EN CHAPITRES'), css.indexOf('SCÈNE ILLUSTRÉE DE CONDITIONS'));
  assert.doesNotMatch(px, /infinite/);
  assert.match(px, /@media \(prefers-reduced-motion:reduce\)\{#detail\.px-in \.hero-photo,[^}]*\{animation:none!important\}#detail \.hero-photo\{transform:none!important\}\}/);
  assert.match(px, /body\.reduce-motion #detail \.hero-photo\{transform:none!important\}/);
  assert.match(px, /html:not\(\.ob-zoom-open\):not\(\.ob-zoom-land\) #detail\.px-in \.hero-photo\{animation:pxZoom/, 'jamais pendant le vol de la photo');
  assert.match(app, /if\(detailReduced\(\)\|\|y<=0\)\{if\(photo\.style\.transform\)photo\.style\.transform='';return;\}/);
  assert.match(app, /wrap\.addEventListener\('scroll',function\(\)\{if\(!raf\)raf=requestAnimationFrame\(parallax\);\},\{passive:true\}\);/);
  assert.match(app, /if\(arrived===id\|\|detailReduced\(\)\)\{arrived=id;return;\}/);
  /* Jetons crème : ni couleur en dur, ni flou de verre, ni capitales dans la section. */
  assert.doesNotMatch(px.replace(/\/\*[\s\S]*?\*\//g, ''), /#[0-9a-fA-F]{3,8}\b|backdrop-filter|text-transform:uppercase/);
});

test('« Avant d’y aller » n’est plus affiché : rien entre la photo et les onglets', () => {
  assert.doesNotMatch(before.replace(/\/\*[\s\S]*?\*\//g, ''), /Avant d’y aller|dBefore|d-before/);
  assert.doesNotMatch(before, /body\.prepend\(host\)/);
  assert.match(before, /const panel = \$\('#detail \.dcat\[data-cat="meteo"\]'\); if \(!panel\) return null;[\s\S]{0,260}panel\.prepend\(host\);/, 'le panneau « Maintenant » est dans l’onglet Conditions');
  assert.match(before, /context\.parentNode !== panel\) panel\.prepend\(context\)/, 'le choix d’activité aussi');
  assert.match(html, /<div class="detail-body">\s*<!--[\s\S]*?-->\s*<nav class="px-start" id="dStart"/, 'le sommaire du parcours ouvre le corps de la fiche');
  /* « J’ai surfé ici » : une seule fois, en bas de l’onglet « Le spot ». */
  assert.equal((html.match(/id="dLogBtn"/g) || []).length, 1);
  const infos = html.slice(html.indexOf('<div class="dcat" data-cat="infos"'), html.indexOf('<div class="dcat" data-cat="saisons"'));
  assert.match(infos, /id="dLogBtn"/);
});

/* spot-before.js exécuté en entier avec de faux nœuds : ce que les relevés affichent. */
function nowWorld({ gauge = 2, inland = false, level = null, lang = 'fr' } = {}) {
  const made = [];
  const sub = (host, sel) => { host.subs = host.subs || {}; return host.subs[sel] || (host.subs[sel] = { sel, innerHTML: '', textContent: '', cls: new Set(), classList: { add: n => host.subs[sel].cls.add(n), remove: n => host.subs[sel].cls.delete(n), contains: n => host.subs[sel].cls.has(n) }, closest: () => null, querySelector(q) { return q === '[data-weather-retry]' && /data-weather-retry/.test(this.innerHTML) ? {} : null; } }); };
  const el = () => { const e = { id: '', className: '', attrs: {}, isConnected: false, subs: {}, _h: '', setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }, querySelector(sel) { return new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split(' ')[0].replace(/\\\[/, '').replace(/\\\]$/, '').split('=')[0]).test(this._h) || /db-v/.test(sel) ? sub(this, sel) : null; } };
    Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; this.subs = {}; } }); made.push(e); return e; };
  const panel = () => ({ kids: [], prepend(k) { k.isConnected = true; k.parentNode = this; this.kids.unshift(k); } });
  const meteo = panel(), securite = panel(), tab = el(), dotSlot = el(), context = { parentNode: null };
  const calls = [];
  const ctx = {
    console, Intl, Number, String, Math, Date, RegExp, Set,
    document: { querySelector: s => (s === '#detail .dcat[data-cat="meteo"]' ? meteo : s === '#detail .dcat[data-cat="securite"]' ? securite : s === '#immersionContext' ? context : s === '#dTabs .dtab[data-cat="securite"]' ? tab : s === '#dTabDanger' ? dotSlot : null),
      createElement: el, addEventListener() {}, body: { dataset: { screen: 'detail' } } },
    dangerGauge: () => ({ n: gauge }), isInland: () => inland, chosenLevel: level, LIVE: {}, COORDS: { hossegor: { lat: 1, lon: 1 } },
    showDetailCat: c => calls.push(c), OB_I18N: { lang }
  };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(read('spot-fit-model.js'), ctx); vm.runInContext(before, ctx);
  const spot = { id: 'hossegor', level: 'expert', dangers: [['🌊', 'Vagues puissantes et parfois dangereuses : les débutants doivent s’abstenir.']] };
  ctx.OceanBefore.update(spot);
  const host = meteo.kids.find(k => k.id === 'dNow'), head = securite.kids.find(k => k.id === 'dDanger');
  const row = k => host.querySelector(`[data-before="${k}"] .db-v`);
  return { ctx, B: ctx.OceanBefore, spot, host, head, row, tab, dotSlot, meteo, context, calls };
}
const text = h => h.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

test('Conditions : quatre relevés en grands chiffres, unité à part, écart à la normale en sous-ligne', () => {
  const w = nowWorld();
  assert.match(w.host.innerHTML, /<h3 class="fx-title" id="dNowTitle">Maintenant<\/h3>/);
  /* Avant l’arrivée des données : les quatre cases existent déjà (même hauteur), une barre à la place du chiffre. */
  assert.equal((w.host.innerHTML.match(/class="fx-reading"/g) || []).length, 4);
  assert.equal((w.host.innerHTML.match(/fx-wait/g) || []).length, 4);
  w.B.live(w.spot, { live: true, wind: '20 km/h SO', swell: '3,9 m', temp: '17 °C', tide: 'Descendante', periodS: 13.6, fetchedAt: new Date(2026, 10, 18, 14, 5).getTime() });
  const h = w.row('live').innerHTML;
  assert.equal((h.match(/class="fx-reading"/g) || []).length, 4);
  assert.match(h, /data-reading="wind">[\s\S]*?<span class="fx-label">Vent<\/span><span class="fx-value"><span class="fx-num">20<\/span><span class="fx-unit">km\/h SO<\/span><\/span>/);
  assert.match(h, /data-reading="wave">[\s\S]*?<span class="fx-num">3,9<\/span><span class="fx-unit">m \(14 s\)<\/span>/, 'houle : le nombre entier avec sa décimale, la période arrondie');
  assert.match(h, /data-reading="temp">[\s\S]*?<span class="fx-num">17<\/span><span class="fx-unit">°C<\/span>/);
  assert.match(h, /data-reading="tide">[\s\S]*?<span class="fx-word">Descendante<\/span>/);
  assert.doesNotMatch(text(h), /·/, 'aucune chaîne reliée par des points médians');
  /* Écart à la normale du mois : passé par spot-data.js, posé en sous-ligne, et gardé si les relevés sont redessinés. */
  w.B.normal(w.spot, { sea: '1 °C au-dessus de la normale', swell: 'Plus forte que d’habitude' });
  w.B.live(w.spot, { live: true, wind: '20 km/h SO', swell: '3,9 m', temp: '17 °C', tide: 'Descendante', periodS: 13.6, fetchedAt: Date.now() });
  const h2 = w.row('live').innerHTML;
  assert.match(h2, /data-reading-sub="temp">1 °C au-dessus de la normale</);
  assert.match(h2, /data-reading-sub="wave">Plus forte que d’habitude</);
  assert.match(read('spot-data.js'), /short\.sea = Math\.abs\(d\) < 1 \? 'Proche de la normale du mois'/);
  /* Valeur absente : un tiret, jamais un chiffre inventé. */
  w.B.live(w.spot, { live: true, wind: '—', swell: '—', temp: '—', tide: '—', fetchedAt: Date.now() });
  assert.equal((w.row('live').innerHTML.match(/fx-num is-none/g) || []).length, 4);
});

test('Conditions : plan d’eau intérieur, service indisponible, « Réessayer » : la place des relevés est gardée', () => {
  const lake = nowWorld({ inland: true });
  assert.equal((lake.host.innerHTML.match(/class="fx-reading"/g) || []).length, 1, 'seulement le vent');
  lake.B.live(lake.spot, { live: true, wind: '12 km/h N', swell: '—', temp: '—', tide: '—', fetchedAt: Date.now() });
  assert.match(lake.row('live').innerHTML, /<span class="fx-num">12<\/span>[\s\S]*Plan d’eau intérieur : ni houle marine, ni marée océanique\./);
  assert.doesNotMatch(lake.row('live').innerHTML, /data-reading="(wave|tide|temp)"/);
  const w = nowWorld();
  w.B.live(w.spot, null);
  assert.match(w.row('live').innerHTML, /Prévision indisponible pour le moment/);
  w.B.retry(w.spot, 'live', 'now');
  assert.match(w.row('live').innerHTML, /Indisponible<\/span><button type="button" class="ob-retry" data-weather-retry="now">Réessayer<\/button>/);
  w.B.wait(w.spot, 'live');
  assert.equal((w.row('live').innerHTML.match(/fx-wait/g) || []).length, 4, 'retour aux cases d’attente, même hauteur');
  assert.ok(w.row('live').cls.has('db-wait'));
  /* Hauteur réservée par la feuille de style, pilotée par les variables de corps. */
  assert.match(css, /#detail \.fx-readings\{min-height:calc\(2 \* \(var\(--fiche-label\) \* 1\.25 \+ var\(--fiche-num\) \* \.95 \+ var\(--fiche-note\) \* 1\.3 \+ 4px\) \+ 20px\)\}/);
  /* Un autre spot ouvert entre-temps : une réponse en retard ne s’affiche pas sur la mauvaise fiche. */
  w.B.live({ id: 'autre' }, { live: true, wind: '99 km/h N', fetchedAt: Date.now() });
  assert.doesNotMatch(w.row('live').innerHTML, /99/);
});

test('Conditions : « Ton créneau » sur une ligne, avec son avertissement de vent de terre en entier', () => {
  const w = nowWorld({ level: 'intermediaire' });
  assert.match(w.host.innerHTML, /<span class="fx-slot-k">Ton créneau<\/span>/);
  const rule = { ok: true, level: 'intermediaire' }, today = { status: 'ok', start: '2026-11-18T12:00', end: '2026-11-18T14:00', quality: 'good' };
  const warn = 'Le vent vient de la terre (offshore) : il lisse les vagues, mais il te pousse vers le large. Reste près du bord et ne lâche pas ta planche.';
  w.B.slot(w.spot, rule, today, h => h + ' h', warn);
  const s = w.row('slot').innerHTML;
  assert.match(s, /<span>Aujourd’hui <b>12 h – 14 h<\/b><\/span><span class="db-q is-good">Dans tes repères<\/span>/);
  assert.ok(s.includes(`<p class="fx-caution">${warn.replace(/’/g, '’')}</p>`), 'avertissement entier');
  w.B.slot(w.spot, null);
  assert.match(w.row('slot').innerHTML, /Indisponible pour le moment/);
  /* Sans niveau : le bouton court, le même que dans Prévisions et Sécurité. */
  const n = nowWorld();
  n.B.slot(n.spot, { ok: false, reason: 'level' }, null);
  assert.match(n.row('slot').innerHTML, /^<button type="button" class="db-level" data-open-level>Choisis ton niveau<\/button>$/);
  /* L’avertissement vient de la même règle que la carte du créneau (spot-experience.js). */
  assert.match(exp, /const cautionOf = r => \(r && r\.status === 'ok' && r\.offshore && \(r\.kind !== 'wave' \|\| r\.level === 'debutant'\)/);
  assert.match(exp, /OceanBefore\?\.slot\(s, rule, today, hourFmt, cautionOf\(today\)\)/);
});

test('danger : alerte dans Conditions à partir de 3 sur 4, tête de l’onglet Sécurité, points sur l’onglet', () => {
  const hi = nowWorld({ gauge: 3 });
  assert.match(hi.host.innerHTML, /^<button type="button" class="fx-alert" data-fx-tab="securite">/, 'l’alerte ouvre le panneau');
  assert.match(text(hi.host.innerHTML), /^Danger 3 sur 4 Voir la sécurité Vagues puissantes et parfois dangereuses : les débutants doivent s’abstenir\. Maintenant/);
  assert.match(hi.head.innerHTML, /<h3 class="fx-title" id="dDangerTitle">Danger 3 sur 4<\/h3><span class="fx-dots" aria-hidden="true"><i class="on"><\/i><i class="on"><\/i><i class="on"><\/i><i class=""><\/i><\/span>/);
  assert.match(hi.head.innerHTML, /<p class="fx-danger-text">Vagues puissantes et parfois dangereuses : les débutants doivent s’abstenir\.<\/p>/);
  assert.equal(hi.dotSlot.innerHTML, '<i class="on"></i><i class="on"></i><i class="on"></i><i class=""></i>');
  assert.equal(hi.tab.attrs['aria-label'], 'Sécurité, danger 3 sur 4');
  const lo = nowWorld({ gauge: 2 });
  assert.doesNotMatch(lo.host.innerHTML, /fx-alert/, 'pas d’alerte sous 3 sur 4');
  assert.match(lo.head.innerHTML, /Danger 2 sur 4/);
  const none = nowWorld({ gauge: null });
  assert.match(none.head.innerHTML, /Danger non évalué/);
  assert.equal(none.dotSlot.innerHTML, '');
  assert.ok(!('aria-label' in none.tab.attrs));
  /* Liens entre onglets : un seul écouteur, sur l’attribut data-fx-tab. */
  assert.match(before, /const go = e\.target\.closest\('#detail \[data-fx-tab\]'\); if \(!go\) return;\s*try \{ if \(typeof showDetailCat === 'function'\) showDetailCat\(go\.dataset\.fxTab\); \}/);
  assert.match(exp, /<button type="button" class="fx-more" data-fx-tab="previsions">Toutes les prévisions<\/button>/);
});

test('Prévisions et Conditions : un seul bloc météo, deux vues ; trois prochains jours dans Conditions', () => {
  assert.match(exp, /<div class="fx-next" data-fx-view="now"><h3 class="fx-title fx-title-s">Les prochains jours<\/h3>\$\{sceneHTML\(daily, inland\)\}<div class="fx-days">\$\{daily\.slice\(0, 3\)\.map/);
  for (const c of ['wx-block wx-week', 'wx-block wx-hours']) assert.match(exp, new RegExp(`<div class="${c}" data-fx-view="forecast">`), c);
  assert.ok(exp.indexOf('wx-block wx-week" data-fx-view') < exp.indexOf('wx-block wx-hours" data-fx-view'), 'les 7 jours avant l’heure par heure');
  /* Fiche v2, onglet Prévisions : deux titres, plus de « Cette semaine », de « Max du jour » ni de cartes de créneau. */
  assert.match(exp, /<h3 class="fx-title">Les 7 jours<\/h3>/);
  assert.match(exp, /<h3 class="fx-title">Heure par heure<\/h3>/);
  assert.doesNotMatch(exp, /Cette semaine|Max du jour|wx-best|wx-slot"|class="wx-sub"/);
  assert.doesNotMatch(exp, /MÉTÉO DU SPOT/, 'plus de sur-titre en capitales');
  /* L’ancienne grille des conditions et le bloc « comparé à la normale » ne sont plus affichés (repris par les relevés). */
  assert.match(css, /#detail \.dcat\[data-cat="meteo"\]>:is\(#dCondHead,#dWeather,#sdVsNormal\)\{display:none!important\}/);
});

test('police : Figtree pour tout le texte, Barlow Condensed pour les noms en affiche ; Manrope et DM Sans sortis', () => {
  assert.match(html, /family=Barlow\+Condensed:wght@600;700;800;900&family=Figtree:wght@400;500;600;700;800&display=swap/);
  assert.match(read('design.css'), /--display:'Figtree',sans-serif;--body:'Figtree',sans-serif;/);
  assert.match(read('scripts/build-mobile.cjs'), /\['barlow-condensed','Barlow Condensed',\[600,700,800,900\]\],\['figtree','Figtree',\[400,500,600,700,800\]\]\];/);
  assert.match(read('scripts/build-mobile.cjs'), /'figtree-latin-700-normal'/, 'préchargée avant le rideau');
  const pkg = JSON.parse(read('package.json')).dependencies;
  assert.equal(pkg['@fontsource/figtree'], '5.3.0');
  assert.ok(!('@fontsource/dm-sans' in pkg) && !('@fontsource/manrope' in pkg));
  for (const f of ['index.html', 'design.css', 'i18n.css', 'adventure.css', 'spot-data.css', 'surf.css', 'badges.css', 'badges.js', 'home-feed.js', 'spot-voyage.css', 'field-guide.css', 'scripts/build-mobile.cjs'])
    assert.doesNotMatch(read(f), /DM Sans|Manrope|dm-sans/, f);
});

test('fiche.css : échelle typographique pilotée par six variables posées sur #detail, aucun corps en dur pour ces rôles', () => {
  assert.ok(css.startsWith('/* @creme-tokens */'));
  const tokens = css.match(/\.ocean-v2 #detail\{\s*--fiche-num:(\d+(?:\.\d+)?)px;--fiche-unit:(\d+(?:\.\d+)?)px;--fiche-title:(\d+(?:\.\d+)?)px;--fiche-label:(\d+(?:\.\d+)?)px;--fiche-text:(\d+(?:\.\d+)?)px;--fiche-note:(\d+(?:\.\d+)?)px;/);
  assert.ok(tokens, 'les six variables, dans cet ordre');
  assert.deepEqual(tokens.slice(1).map(Number), [42, 15, 23, 14.5, 15.5, 13], 'valeurs par défaut');
  const role = { 'fx-num': '--fiche-num', 'fx-unit': '--fiche-unit', 'fx-title': '--fiche-title', 'fx-label': '--fiche-label', 'fx-text': '--fiche-text', 'fx-note': '--fiche-note' };
  for (const [cls, v] of Object.entries(role)) assert.match(css, new RegExp(`#detail \\.${cls}[,{][^}]*font:\\d+ var\\(${v}\\)`), cls);
  /* Le numéro d’urgence suit le grand chiffre. */
  assert.match(css, /\.dcat\[data-cat="securite"\] \.sx-urg \.sc-num\{[^}]*font:800 var\(--fiche-num\)/);
  /* Dans les composants et l’onglet Conditions, les corps passent par les variables (seuls les onglets ont leur 16 px). */
  const body = css.slice(css.indexOf('/* ================= Composants'), css.indexOf('fin de la section Conditions')).replace(/\/\*[\s\S]*?\*\//g, '');
  const hard = [...body.matchAll(/font:\d+ (\d+(?:\.\d+)?px)[^;}]*/g)].map(m => m[0]).filter(f => !/^font:\d+ 16px\/1 var\(--body\)/.test(f));
  assert.deepEqual(hard, [], 'corps en dur');
  assert.doesNotMatch(body, /font-size:\d/);
  /* Interdits de la fiche : capitales espacées, numéros de section. */
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ''), /text-transform:uppercase/);
  /* Chargée après toutes les autres feuilles. */
  const sheets = [...html.matchAll(/<link rel="stylesheet" href="([^"?]+\.css)/g)].map(m => m[1]);
  assert.equal(sheets.at(-1), 'fiche.css');
  /* Une section par onglet, séparées par des lignes fixes (fusions des agents des autres onglets). */
  for (const t of ['CONDITIONS', 'PRÉVISIONS', 'SÉCURITÉ', 'LE SPOT', 'SAISONS', 'PRÉPARER', 'NATURE']) assert.ok(css.includes('ONGLET ' + t), t);
  assert.equal((css.match(/ne rien écrire entre ces deux lignes de séparation/g) || []).length, 7);
});

test('Sécurité : son onglet, rien de replié ; en-tête compact et rangée d’onglets collée', () => {
  assert.match(css, /\.dcat\[data-cat="securite"\]::before\{content:none!important;display:none!important\}/, 'l’ancien intertitre n’a plus lieu d’être');
  assert.match(css, /#detail \.dcat\[data-cat="securite"\]>#dDanger\{order:1\}\n#detail \.dcat\[data-cat="securite"\]>\.safety-block\{order:2\}/, 'danger, puis urgences');
  /* 19 nov. (« trop de texte ») : dans Sécurité, seule la valeur de modèle des courants s’ouvre d’un toucher. */
  assert.match(read('replis.js'), /securite: \[\n\s+\{ id: 'courants', title: 'Courants & dangers à vérifier', sub: 'Valeurs de modèle, à vérifier sur place', members: \['#spotSafetyLive'\] \}\n\s+\]/, 'un seul repli dans Sécurité : la valeur de modèle des courants');
  assert.match(read('field-guide.js'), /fieldAction==='emergency'\)\{showDetailCat\('securite',false\);/);
  assert.match(css, /html \.ocean-v2 #detail #detailHero\{min-height:clamp\(400px,62dvh,600px\);height:auto\}/, 'photo : environ 62 % de l’écran à l’ouverture du parcours');
  assert.match(css, /#detail \.detail-hero \.dfact-sea\{display:none\}/);
  assert.match(read('base.css'), /\.dtabs\{[^}]*position:sticky;top:0/);
});

test('onglets collés : juste sous l’en-tête, la zone sûre n’est comptée qu’une fois', () => {
  const shell = read('app-shell.css'), before = read('spot-before.css');
  /* En-tête : 52 px + zone sûre. Zone qui défile : marge du haut de 8 px + zone sûre. */
  assert.match(shell, /height:calc\(52px \+ var\(--as-top\)\)!important/);
  assert.match(shell, /padding:calc\(8px \+ var\(--as-top\)\) var\(--as-gutter\)/);
  /* Collé = mesuré depuis le bord intérieur de la zone qui défile : 52 − 8 = 44 px, sans la zone sûre. */
  const m = before.match(/@media\(max-width:959px\)\{[\s\S]*?\.ocean-v2 #detail \.dtabs\{top:([^;]+);z-index:6\}/);
  assert.ok(m, 'règle des onglets collés sur téléphone');
  assert.equal(m[1], '44px');
  assert.doesNotMatch(read('fiche.css') + before, /#detail \.dtabs\{[^}]*top:calc\([^)]*--as-top/, 'jamais la zone sûre dans le décalage collé');
  assert.match(before, /@media\(min-width:960px\)\{\.ocean-v2 #detail \.dtabs\{top:0;z-index:6\}\}/, 'ordinateur : collé en haut de sa colonne');
});

/* Lot Prévisions et Saisons (fiche v2) : leurs sections de fiche.css passent par les variables de corps, sans capitales
   espacées ; Saisons garde son contenu au style clair, les sources visibles et le rappel « jamais une prévision ». */
const section = name => { const a = css.indexOf('ONGLET ' + name), b = css.indexOf('fin de la section', a); return css.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, ''); };
test('fiche.css, Prévisions et Saisons : corps par les variables, ni capitales ni lettres espacées', () => {
  for (const name of ['PRÉVISIONS', 'SAISONS']) {
    const body = section(name);
    assert.ok(body.length > 400, name);
    assert.deepEqual([...body.matchAll(/font:\d+ (\d+(?:\.\d+)?px)[^;}]*/g)].map(m => m[0]), [], name + ' : corps en dur');
    assert.doesNotMatch(body, /font-size:\d/, name);
    assert.doesNotMatch(body, /text-transform:uppercase|letter-spacing:[1-9]/, name);
  }
  /* Les 7 jours : une grille pour l’en-tête et les lignes (sous-grilles), colonnes alignées, chiffres tabulaires. */
  assert.match(section('PRÉVISIONS'), /#detail \.fx7-head,#detail \.fx7-list,#detail \.fx7-row,#detail \.fx7-btn\{display:grid;grid-column:1 \/ -1;grid-template-columns:subgrid;/);
  assert.match(section('PRÉVISIONS'), /font-variant-numeric:tabular-nums/);
  /* Le détail du jour ne fait pas déborder les colonnes. */
  assert.match(section('PRÉVISIONS'), /#detail \.fx7-row>:not\(\.fx7-btn\)\{grid-column:1 \/ -1;min-width:0;contain:inline-size\}/);
  /* L’avertissement de vent de terre n’est jamais coupé. */
  assert.doesNotMatch(section('PRÉVISIONS').match(/#detail \.fx7-caution\{[^}]*\}/)[0], /nowrap|overflow|line-clamp|max-height/);
  /* Saisons : le panneau du mois au style clair. */
  assert.match(section('SAISONS'), /#detail #dSeasons \.sd-month\{[^}]*background:none;box-shadow:none;color:var\(--t-ink\)\}/);
});

test('Saisons : un titre sans sur-titre, relevés du mois en composant de la fiche, plus de point médian ni de mois répété', () => {
  const js = read('spot-data.js'), seasons = js.slice(js.indexOf('function calendar'), js.indexOf('/* Aperçu dans « Le spot »'));
  assert.match(seasons, /<header class="sd-head"><h3 class="fx-title">Quand partir<\/h3><p class="sd-calc">\$\{CALC_NOTE\}<\/p>/);
  assert.match(js, /const CALC_NOTE = 'Calculé d’après les moyennes de plusieurs années\. Ce n’est jamais une prévision\.';/);
  assert.doesNotMatch(seasons, /sd-kicker|L’année à|Mois par mois, ce que la mer/);
  assert.match(seasons, /<div class="fx-reading sd-reading k-\$\{key\}">\$\{icon\(I\[ic\], 'fx-ic'\)\}<span class="fx-label">/);
  assert.match(seasons, /<div class="fx-readings sd-readings">\$\{tiles\.join\(''\)\}<\/div>/);
  assert.doesNotMatch(seasons, /sd-tiles|sd-tile /);
  /* Aucune chaîne à point médian dans l’onglet (l’aperçu de l’onglet Le spot garde le sien). */
  assert.doesNotMatch(seasons.replace(/\/\*[\s\S]*?\*\//g, ''), /' · '|` · `| · \$\{|\} · /);
  assert.match(seasons, /esc\(rangeText\(b\.ranges, ', '\)\)/);
  assert.match(js, /function rangeText\(ranges, sep = ' · '\)/, 'faune et aperçu inchangés');
  /* Verdict : la pastille seule, le mois n’est plus répété (« En novembre » le dit) ; les raisons suivent. */
  assert.doesNotMatch(seasons, /<\/b> ce mois-ci|<\/b> en \$\{/);
  /* Sources visibles, une phrase par élément ; la houle du large seulement s’il y a des normales de houle ; le rappel
     « pas une prévision » n’est plus répété en pied (il est en tête de l’onglet). */
  const src = js.slice(js.indexOf('function sources(c)'), js.indexOf('function renderSeasons'));
  assert.match(src, /\$\{w \? ' <span>La houle est celle du large : la plage peut être plus abritée ou plus exposée\.<\/span>' : ''\}/);
  /* Chaque source dans son élément (traduite seule) ; séparateur « ; » à la française, « ; » collé ailleurs. */
  assert.match(src, /<span>Normales calculées sur plusieurs années pour le secteur du spot :<\/span> \$\{parts\.map\(x => `<span>\$\{esc\(x\)\}<\/span>`\)\.join\(sep\)\}\./);
  assert.doesNotMatch(src, /Ce sont des tendances/);
});

/* Relecture du 19 nov. : petits défauts de l’onglet Saisons et de l’onglet Prévisions. */
test('Saisons : période sous le sport = mois de la meilleure case, « Bon » d’une teinte à lui, insécables, sous-titre sans houle', () => {
  const js = read('spot-data.js'), cal = js.slice(js.indexOf('function calendar'), js.indexOf('function calendar') + 2000);
  /* Libellé et cases disent la même chose : les mois au meilleur niveau atteint (douze « Top » : « toute l’année »). */
  assert.match(cal, /lv = y\.map\(M\.level\), topL = Math\.max\(-1, \.\.\.lv\.filter\(v => v != null\)\)/);
  assert.match(cal, /const b = \{ranges: topL >= 1 \? M\.ranges\(lv\.map\(\(L, m\) => \(L === topL \? m : -1\)\)\.filter\(m => m >= 0\)\) : \[\]\};/);
  const M = require('../spot-data-model.js');
  assert.deepEqual(M.ranges([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), [[0, 11]], 'douze mois → une seule plage, « toute l’année »');
  /* « Bon » (l2) entre « Possible » (l1) et « Top » (l3), dans la section Saisons. */
  const sec = css.slice(css.indexOf('ONGLET SAISONS'), css.indexOf('fin de la section Saisons'));
  assert.match(sec, /#detail #dSeasons \.sd-cell\.l2,#detail #dSeasons \.sd-legend i\.l2\{background:color-mix\(in srgb,var\(--g-soft\) 50%,var\(--g-main\)\)\}/);
  /* « 8 % de jours ≥ 25 km/h » ne se coupe plus entre le chiffre et son unité (espaces insécables, aussi en traduction). */
  assert.ok(js.includes('`${num(d.kite)} % de jours ≥ 25 km/h`'));
  for (const l of ['en', 'es']) assert.match(JSON.parse(read(`locales/translations/${l}.json`))['{0} % de jours ≥ 25 km/h'], /^\{0\} % .+ ≥ 25 km\/h$/);
  /* « L’année en courbes » : un sous-titre juste aussi sur un lac (pas de houle annoncée). */
  assert.match(read('replis.js'), /title: 'L’année en courbes', sub: 'Températures, soleil, pluie et vent'/);
});

test('Prévisions : lever et coucher écrits comme les autres heures (« 7 h 37 »), rappel du calcul sous le meilleur jour', () => {
  assert.match(exp, /const clock = iso => \{[^\n]*if \(!window\.OB_I18N \|\| \/\^\(fr\|es\)\/\.test\(OB_I18N\.lang \|\| 'fr'\)\) return `\$\{\+m\[1\]\} h \$\{m\[2\]\}`;/);
  assert.match(exp, /\$\{note \? `<p class="fx7-calc">\$\{esc\(note\)\}<\/p>` : ''\}<\/div>`;/);
  assert.doesNotMatch(exp, /fx-note fx7-calc" data-fx-view="forecast"/, 'plus en pied d’onglet quand un jour est mis en avant');
  assert.match(exp, /foot: best \? '' : note\}/, 'sans meilleur jour, le rappel reste en pied, sous l’heure du relevé');
});

test('barre du haut de la fiche : le nom du spot, pas « Le spot » (qui est aussi un onglet)', () => {
  const nav = read('navigation.js');
  assert.match(nav, /const spotTitle=scr==='detail'&&window\.SpotName\?SpotName\.parts\(SPOTS\.find\(s=>s\.id===currentSpot\)\?\.name\)\.main:'';/);
  assert.match(nav, /mobileTitle\.textContent=spotTitle\|\|\{home:'Accueil',spots:'Explorer',detail:'Le spot',/, 'sans spot connu, l’ancien titre reste');
  /* Nom déjà traduit par spot-name.js : le traducteur de page ne le reprend pas, et le marquage part avec la fiche. */
  assert.match(nav, /if\(spotTitle\)\{mobileTitle\.setAttribute\('data-no-i18n',''\);mobileTitle\.setAttribute\('translate','no'\);\}/);
  assert.match(nav, /else \{mobileTitle\.removeAttribute\('data-no-i18n'\);mobileTitle\.removeAttribute\('translate'\);\}/);
  const SpotName = (() => { const w = {}; new Function('window', read('spot-name.js'))(w); return w.SpotName; })();
  assert.equal(SpotName.parts('Hossegor — La Gravière').main, 'Hossegor');
  assert.equal(SpotName.parts('Tulamben').main, 'Tulamben');
  assert.equal(SpotName.parts(undefined).main, '');
});

test('barre de progression collée : fond opaque du thème, pleine largeur, sans fondu de bord ni coins arrondis', () => {
  const css = read('fiche.css');
  const rule = 'html .ocean-v2 #detail .dtabs{background:var(--t-page);border-radius:0;-webkit-mask-image:none;mask-image:none;box-shadow:none}';
  assert.ok(css.includes(rule));
  /* Elle vient après les règles anciennes (field-guide.css, design.css) : fiche.css est chargée en dernier. */
  const html = read('index.html');
  assert.ok(html.indexOf('fiche.css?v=') > html.indexOf('field-guide.css?v='));
  assert.ok(html.indexOf('fiche.css?v=') > html.indexOf('design.css?v='));
});

test('photo d’ouverture : les points de danger, allumés jusqu’au niveau seulement, le point éteint est un anneau', () => {
  const css = read('fiche.css'), before = read('spot-before.js');
  assert.match(css, /#detail \.hx-danger \.fx-dots i:not\(\.on\)\{background:transparent;box-shadow:inset 0 0 0 1\.5px /);
  assert.match(css, /#detail \.hx-danger \.fx-dots i\.on\{background:color-mix\(in srgb,var\(--t-danger\) 72%,var\(--t-on-main\)\)\}/);
  /* La tuile de la photo utilise le même dessin des points que l’alerte (dots(g.n) : .on sur les n premiers). */
  const hero = before.slice(before.indexOf('function hero('), before.indexOf('function alertLine('));
  assert.match(hero, /hx-danger/);
  assert.match(hero, /dots\(g\.n\)/);
});
