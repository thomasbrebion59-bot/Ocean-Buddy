/* Fiche de spot v2 (18 nov. 2026, demande du fondateur) : plus de bloc « Avant d’y aller », sept onglets en texte seul
   juste sous une photo compacte, la fiche s’ouvre sur les conditions, la sécurité a son onglet (jamais repliée), une seule
   police (Figtree) et une échelle typographique pilotée par des variables. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { read, fnSource } = require('./src-extract.cjs');
const html = read('index.html'), app = read('app.js'), before = read('spot-before.js'), css = read('fiche.css'), exp = read('spot-experience.js');

const tabsHtml = html.slice(html.indexOf('<div class="dtabs" id="dTabs">'), html.indexOf('<div class="dcat" data-cat="infos"'));
const tabs = [...tabsHtml.matchAll(/<button type="button" class="dtab( active)?" data-cat="(\w+)" onclick="showDetailCat\('(\w+)'\)">([\s\S]*?)<\/button>/g)];

test('sept onglets en texte seul, « Conditions » en premier et actif à l’ouverture', () => {
  assert.deepEqual(tabs.map(t => t[2]), ['meteo', 'previsions', 'securite', 'infos', 'saisons', 'activites', 'faune']);
  assert.deepEqual(tabs.map(t => t[4].replace(/<span class="dtab-dots"[^>]*><\/span>/, '').replace(/<[^>]+>/g, '').trim()), ['Conditions', 'Prévisions', 'Sécurité', 'Le spot', 'Saisons', 'Préparer', 'Nature']);
  assert.deepEqual(tabs.map(t => !!t[1]), [true, false, false, false, false, false, false]);
  for (const t of tabs) assert.equal(t[2], t[3], 'data-cat et showDetailCat disent le même onglet');
  assert.doesNotMatch(tabsHtml, /<img|<svg/, 'aucun pictogramme dans les onglets');
  assert.doesNotMatch(read('spot-immersion.js'), /#dTabs \.dtab[\s\S]{0,200}insertAdjacentHTML/, 'plus de pictogramme posé par le module d’immersion');
  /* Le panneau des conditions est affiché d’emblée ; « Le spot » attend son onglet. */
  assert.match(html, /<div class="dcat" data-cat="meteo" data-view="now">/);
  assert.match(html, /<div class="dcat" data-cat="infos" style="display:none">/);
  assert.match(app, /showDetailCat\('meteo',false\);\n  \/\* Les modules annexes/, 'openSpot ouvre la fiche sur les conditions');
  assert.match(read('navigation.js'), /detailTab:\$\('#dTabs \.dtab\.active'\)\?\.dataset\.cat\|\|'meteo'/);
  assert.match(read('navigation.js'), /showDetailCat\(route\.detailTab\|\|'meteo',false\);/, 'onglet rendu au Retour par la même fonction');
});

/* showDetailCat exécuté avec de faux panneaux. */
function tabWorld() {
  const cats = ['infos', 'saisons', 'meteo', 'activites', 'faune', 'preserver', 'securite'];
  const panels = cats.map(c => ({ dataset: { cat: c }, style: { display: 'none' } }));
  const btns = ['meteo', 'previsions', 'securite', 'infos', 'saisons', 'activites', 'faune'].map(c => ({ dataset: { cat: c }, cls: new Set(), attrs: {}, classList: { toggle(n, on) { on ? this.o.cls.add(n) : this.o.cls.delete(n); } }, setAttribute(k, v) { this.attrs[k] = v; } }));
  btns.forEach(b => { b.classList.o = b; });
  const detail = { dataset: {} }, scrolled = [];
  const ctx = {
    document: {
      querySelectorAll: s => (s === '#detail .dcat' ? panels : s === '#dTabs .dtab' ? btns : []),
      getElementById: id => (id === 'detail' ? detail : id === 'dPreserve' ? { scrollIntoView: o => scrolled.push(o) } : null),
      body: { classList: { contains: () => false } }
    },
    setTimeout: () => 0, requestAnimationFrame: f => f()
  };
  vm.createContext(ctx);
  vm.runInContext(app.match(/const DETAIL_TABS=\[[^\]]+\];/)[0].replace('const ', 'var ') + fnSource(app, 'detailTabOf') + fnSource(app, 'showDetailCat'), ctx);
  const shown = () => panels.filter(p => p.style.display === '').map(p => p.dataset.cat);
  const active = () => btns.filter(b => b.cls.has('active')).map(b => b.dataset.cat);
  return { ctx, panels, shown, active, detail, scrolled, view: () => panels.find(p => p.dataset.cat === 'meteo').dataset.view };
}

test('changement d’onglet : un panneau par onglet, « Prévisions » est la seconde vue des conditions, « Nature » réunit faune et gestes', () => {
  const w = tabWorld(), go = c => w.ctx.showDetailCat(c, false);
  go('meteo'); assert.deepEqual(w.shown(), ['meteo']); assert.equal(w.view(), 'now'); assert.deepEqual(w.active(), ['meteo']);
  go('previsions'); assert.deepEqual(w.shown(), ['meteo']); assert.equal(w.view(), 'forecast'); assert.deepEqual(w.active(), ['previsions']);
  go('securite'); assert.deepEqual(w.shown(), ['securite'], 'la sécurité seule, en entier'); assert.equal(w.view(), 'now');
  go('infos'); assert.deepEqual(w.shown(), ['infos']);
  go('saisons'); assert.deepEqual(w.shown(), ['saisons']);
  go('activites'); assert.deepEqual(w.shown(), ['activites']);
  go('faune'); assert.deepEqual(w.shown(), ['faune', 'preserver']); assert.deepEqual(w.active(), ['faune']);
  assert.equal(w.detail.dataset.tab, 'faune');
  /* Anciens noms : « preserver » mène à Nature et jusqu’aux gestes ; un nom inconnu retombe sur les conditions. */
  go('preserver'); assert.deepEqual(w.shown(), ['faune', 'preserver']); assert.deepEqual(w.active(), ['faune']); assert.equal(w.scrolled.length, 1);
  go('nimportequoi'); assert.deepEqual(w.shown(), ['meteo']); assert.deepEqual(w.active(), ['meteo']);
  /* Plus de panneau de sécurité collé sous les conditions. */
  assert.doesNotMatch(app, /cat==='meteo'&&d\.dataset\.cat==='securite'/);
  assert.match(css, /\[data-view="now"\] \[data-fx-view="forecast"\],\n[^\n]*\[data-view="forecast"\] \[data-fx-view="now"\],/);
});

test('« Avant d’y aller » n’est plus affiché : rien entre la photo et les onglets', () => {
  assert.doesNotMatch(before.replace(/\/\*[\s\S]*?\*\//g, ''), /Avant d’y aller|dBefore|d-before/);
  assert.doesNotMatch(before, /body\.prepend\(host\)/);
  assert.match(before, /const panel = \$\('#detail \.dcat\[data-cat="meteo"\]'\); if \(!panel\) return null;[\s\S]{0,260}panel\.prepend\(host\);/, 'le panneau « Maintenant » est dans l’onglet Conditions');
  assert.match(before, /context\.parentNode !== panel\) panel\.prepend\(context\)/, 'le choix d’activité aussi');
  assert.match(html, /<div class="detail-body">\s*<!--[\s\S]*?-->\s*<div class="dtabs" id="dTabs">/, 'la rangée d’onglets ouvre le corps de la fiche');
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
  assert.match(n.row('slot').innerHTML, /<button type="button" class="db-level" data-open-level>Choisis ton niveau pour savoir si ce spot te correspond<\/button>/);
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
  assert.match(exp, /<div class="fx-next" data-fx-view="now"><h3 class="fx-title fx-title-s">Les prochains jours<\/h3><div class="fx-days">\$\{daily\.slice\(0, 3\)\.map/);
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
  assert.match(css, /\.dcat\[data-cat="securite"\] \.sc-num\{font:800 var\(--fiche-num\)/);
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
  assert.doesNotMatch(read('replis.js'), /securite: \[/, 'aucune section repliable dans Sécurité');
  assert.match(read('field-guide.js'), /fieldAction==='emergency'\)\{showDetailCat\('securite',false\);/);
  assert.match(css, /html \.ocean-v2 #detail #detailHero\{min-height:clamp\(230px,33dvh,320px\);height:auto\}/, 'photo : environ un tiers de l’écran');
  assert.match(css, /#detail \.detail-hero \.dfact-sea\{display:none\}/);
  assert.match(read('base.css'), /\.dtabs\{[^}]*position:sticky;top:0/);
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
