/* Ocean Data : rendu de « Observé ici » (iNaturalist) et de « Quand partir ? » avec un DOM minimal.
   On exécute le vrai spot-data.js dans un contexte vm : décodage des crédits, mention sous 8 observations,
   bloc masqué hors mer, repli « Pour identifier… » masqué, place réservée, combinaison par mois, désaccord carnet / moyennes. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const catalog = require('../data/catalog.json');
const byId = Object.fromEntries(catalog.map(s => [s.id, s]));

class El {
  constructor(tag) {
    const self = this;
    this.tag = tag; this.id = ''; this.hidden = false; this.innerHTML = ''; this.children = []; this.cls = new Set(); this.clientWidth = 340;
    this.classList = {
      add: c => { self.cls.add(c); },
      remove: c => { self.cls.delete(c); },
      contains: c => self.cls.has(c),
      toggle(c, force) { const on = force === undefined ? !self.cls.has(c) : !!force; if (on) self.cls.add(c); else self.cls.delete(c); return on; }
    };
  }
  prepend(el) { this.children.unshift(el); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  insertAdjacentHTML() {}
}

/* Une page minimale : onglets Le spot et Faune, onglet Saisons, et un temps figé au 15 juillet 2026. */
function page({ climate = { spots: {} }, seasons, guide } = {}) {
  const infos = new El('div'), faune = new El('div'), seasonsHost = new El('div');
  faune.cls.add('dcat');
  const withId = (root, id) => root.children.find(e => e.id === id) || null;
  const doc = {
    head: { append() {} },
    createElement: t => new El(t),
    addEventListener() {},
    querySelector(sel) {
      switch (sel) {
        case '#dSeasons': return seasonsHost;
        case '#detail .dcat[data-cat="infos"]': return infos;
        case '#detail .dcat[data-cat="faune"]': return faune;
        case '#dSeasonTeaser': return withId(infos, 'dSeasonTeaser');
        case '#dWild': return withId(faune, 'dWild');
        default: return null;
      }
    }
  };
  const ctx = vm.createContext({ document: doc, console, Intl, setTimeout, clearTimeout, addEventListener() {} });
  ctx.window = ctx;
  vm.runInContext('(function(){const R=Date;globalThis.Date=class extends R{constructor(...a){if(a.length)super(...a);else super(2026,6,15)}static now(){return new R(2026,6,15).getTime()}}})()', ctx);
  vm.runInContext(read('assets/data/spot-wildlife.js'), ctx);
  ctx.OCEAN_CLIMATE = climate;
  ctx.OCEAN_ACCESS = { spots: {}, countries: {} };
  if (seasons !== undefined) ctx.OCEAN_SEASONS = seasons;
  if (guide) ctx.OceanSpotGuide = guide;
  vm.runInContext(read('spot-data-model.js'), ctx);
  vm.runInContext(read('spot-data.js'), ctx);
  return { ctx, infos, faune, seasonsHost, wild: () => withId(faune, 'dWild'), teaser: () => withId(infos, 'dSeasonTeaser'), data: ctx.OceanSpotData };
}
const settle = () => new Promise(r => setImmediate(r));

/* Données de faune réelles : on cherche les spots qui illustrent chaque cas. */
const W = (() => { const c = vm.createContext({}); c.window = c; vm.runInContext(read('assets/data/spot-wildlife.js'), c); return c.OCEAN_WILDLIFE; })();
const shownOf = id => W.spots[id].sp.map(r => ({ t: W.taxa[r[0]], c: r[1], h: r[2] })).filter(o => o.t);
const seaWith = pred => catalog.find(s => s.waterType === 'sea' && W.spots[s.id] && W.spots[s.id].sp.length >= 3 && pred(shownOf(s.id)));

test('le crédit « Jan Ebr &amp; Ivana Ebrová » s’affiche avec un seul « & »', async () => {
  const spot = seaWith(list => list.filter(o => o.t.p).slice(0, 12).some(o => /&amp;/.test(o.t.p[1] || '')));
  assert.ok(spot, 'aucun spot de test');
  const p = page(); p.data.update(spot); await settle();
  const html = p.wild().innerHTML;
  assert.match(html, /Jan Ebr &amp; Ivana Ebrová/, 'le « & » est échappé une seule fois');
  assert.doesNotMatch(html, /&amp;amp;/, 'pas de double échappement');
  assert.equal(p.wild().hidden, false);
});

test('sous 8 observations, « surtout … » s’accompagne de « {0} observations seulement »', async () => {
  const flagged = list => list.filter(o => o.h && o.h.some(v => v > 0)).slice(0, 3);
  const few = seaWith(list => flagged(list).some(o => o.c < 8));
  const many = seaWith(list => flagged(list).length > 0 && flagged(list).every(o => o.c >= 8));
  assert.ok(few && many, 'spots de test introuvables');
  const p = page(); p.data.update(few); await settle();
  const counts = flagged(shownOf(few.id)).filter(o => o.c < 8).map(o => o.c);
  const html = p.wild().innerHTML;
  const found = [...html.matchAll(/<small class="sd-few">(\d+) observations? seulement<\/small>/g)].map(m => +m[1]);
  assert.deepEqual(found, [...counts]);
  const q = page(); q.data.update(many); await settle();
  assert.doesNotMatch(q.wild().innerHTML, /sd-few/);
  assert.match(q.wild().innerHTML, /surtout /);
});

test('« La vraie faune du coin » est masquée hors mer, sans même charger les relevés', async () => {
  const lake = catalog.find(s => s.waterType !== 'sea' && W.spots[s.id]);
  assert.ok(lake, 'aucun spot hors mer avec des relevés');
  const p = page(); p.data.update(lake);
  assert.equal(p.wild(), null, 'aucun bloc créé');
  await settle();
  assert.equal(p.wild(), null);
  assert.equal(p.faune.classList.contains('sd-has-wild'), false);
  for (const id of ['silfra', 'cenote_dosojos', 'jellyfishlake', 'maubuisson']) {
    const q = page(); q.data.update(byId[id]); await settle();
    assert.ok(!q.wild() || (q.wild().hidden && q.wild().innerHTML === ''), id);
  }
});

test('quand le bloc iNaturalist s’affiche, l’onglet Faune le signale pour masquer le repli « Pour identifier… »', async () => {
  const sea = seaWith(() => true), lake = byId.silfra;
  const p = page();
  p.data.update(sea); await settle();
  assert.equal(p.faune.classList.contains('sd-has-wild'), true);
  p.data.update(lake); await settle();
  assert.equal(p.faune.classList.contains('sd-has-wild'), false, 'repli de nouveau visible pour un lac');
  const css = read('spot-data.css');
  assert.match(css, /\.dcat\.sd-has-wild #dFaune \.field-empty\{display:none\}/);
});

test('les blocs asynchrones gardent leur place pendant le chargement', async () => {
  const sea = seaWith(() => true);
  const p = page({ climate: { spots: {} } });
  p.data.update(sea);
  assert.equal(p.teaser().hidden, false);
  assert.ok(p.teaser().classList.contains('is-pending'), 'place réservée pour « Quand partir ? »');
  assert.ok(p.wild().classList.contains('is-pending'), 'place réservée pour « Observé ici »');
  const css = read('spot-data.css');
  assert.match(css, /\.sd-teaser\.is-pending\{min-height:\d+px/);
  assert.match(css, /\.sd-wild\.is-pending\{min-height:\d+px/);
  await settle();
  assert.ok(!p.wild().classList.contains('is-pending'));
  assert.equal(p.teaser().hidden, true, 'pas de normales pour ce spot : la place est rendue');
});

/* ---- « Quand partir ? » ---- */
const twelve = f => Array.from({ length: 12 }, (_, m) => f(m));
const climFor = sea => ({
  sea,
  air: { tx: twelve(() => 24), tn: twelve(() => 15), sun: twelve(() => 8), wet: twelve(() => 6), rain: twelve(() => 40), wind: twelve(() => 14), gust: twelve(() => 25), kite: twelve(() => 30), wdir: twelve(() => 6), yrs: [2015, 2024] },
  wave: { hs: twelve(() => 1.2), tp: twelve(() => 10), calm: twelve(() => 40), flat: twelve(() => 10), h1: twelve(() => 50), h2: twelve(() => 30), big: twelve(() => 5), dir: twelve(() => 7), rose: [5, 0, 0, 0, 0, 5, 30, 60], src: 'era5', yrs: [2015, 2024] }
});
const fake = (sports = ['surf']) => ({ id: 'x', name: 'Test — Plage', loc: 'Test', level: 'intermediaire', sports, waterType: 'sea', coords: { lat: 43, lon: -1 } });

test('le mois choisi affiche la combinaison de Poulpy avec la mention NOAA', async () => {
  const cases = [[12, '5/4 + chaussons/gants/cagoule'], [13, '4/3 + chaussons'], [17, '3/2 ou 4/3 + chaussons'], [21, '3/2'], [22, 'shorty, lycra ou 3/2'], [23, 'shorty ou lycra']];
  for (const [t, txt] of cases) {
    const p = page({ climate: { spots: { x: climFor(twelve(() => t)) } } });
    p.data.update(fake()); await settle();
    const html = p.seasonsHost.innerHTML;
    assert.ok(html.includes(`<b>Combinaison (repère) : ${txt}</b>`), `${t} °C : ${txt}`);
    assert.ok(html.includes('<small>Repère selon la température moyenne de l’eau (NOAA).</small>'));
  }
});

test('pas de combinaison pour la plongée, la baignade ni sans température de l’eau', async () => {
  for (const sports of [['plongee'], ['baignade'], ['snorkeling'], ['paddle']]) {
    const p = page({ climate: { spots: { x: climFor(twelve(() => 18)) } } });
    p.data.update(fake(sports)); await settle();
    assert.ok(p.seasonsHost.innerHTML.includes('sd-month'), sports.join());
    assert.doesNotMatch(p.seasonsHost.innerHTML, /Combinaison/, sports.join());
  }
  const dry = climFor(twelve(() => 18)); delete dry.sea;
  const p = page({ climate: { spots: { x: dry } } });
  p.data.update(fake()); await settle();
  assert.doesNotMatch(p.seasonsHost.innerHTML, /Combinaison/);
});

test('« Quand partir ? » rappelle que les mois sont calculés sur plusieurs années, jamais une prévision', async () => {
  const p = page({ climate: { spots: { x: climFor(twelve(() => 20)) } }, seasons: { x: [5, 6] } });
  p.data.update(fake()); await settle();
  const note = 'Calculé d’après les moyennes de plusieurs années. Ce n’est jamais une prévision.';
  assert.ok(p.seasonsHost.innerHTML.includes(`<p class="sd-calc">${note}</p>`));
  assert.ok(p.teaser().innerHTML.includes(note));
  assert.doesNotMatch(p.seasonsHost.innerHTML + p.teaser().innerHTML, /Nos carnets et les moyennes/);
});

test('désaccord carnet / moyennes : annoncé seulement quand seasons.json n’a aucun mois pour le spot', async () => {
  const gap = 'Nos carnets et les moyennes climatiques ne s’accordent pas ici : renseigne-toi sur place.';
  const run = async seasons => { const p = page({ climate: { spots: { x: climFor(twelve(() => 20)) } }, seasons }); p.data.update(fake()); await settle(); return p; };
  const none = await run({ y: [1] });
  assert.ok(none.seasonsHost.innerHTML.includes(`<p class="sd-gap">${gap}</p>`));
  assert.ok(none.teaser().innerHTML.includes(gap));
  const empty = await run({ x: [] });
  assert.ok(empty.seasonsHost.innerHTML.includes(gap));
  for (const seasons of [{ x: [5, 6] }, undefined]) {
    const ok = await run(seasons);
    assert.ok(!ok.seasonsHost.innerHTML.includes(gap) && !ok.teaser().innerHTML.includes(gap), JSON.stringify(seasons));
  }
  // carnet connu et sans saison : rien à comparer
  const p = page({ climate: { spots: { x: climFor(twelve(() => 20)) } }, seasons: { y: [1] }, guide: { ready: () => true, culture: () => ({ season: '' }) } });
  p.data.update(fake()); await settle();
  assert.ok(!p.seasonsHost.innerHTML.includes(gap));
});

/* ---- Lisibilité ---- */
/* Plus petite taille de police déclarée pour ce sélecteur (toutes les règles qui le terminent), ou null. */
function sizeOf(css, selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(?:^|[}\\s,])' + esc + '\\s*\\{([^}]*)\\}', 'gm'), clean = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const sizes = [];
  for (let m; (m = re.exec(clean));) {
    const f = /font-size\s*:\s*([\d.]+)px/.exec(m[1]) || /font\s*:[^;]*?\b([\d.]+)px/.exec(m[1]);
    if (f) sizes.push(parseFloat(f[1]));
  }
  return sizes.length ? Math.min(...sizes) : null;
}
test('lisibilité : avertissement à 12 px, noms latins et crédits à 11 px au moins', () => {
  const base = read('base.css'), sd = read('spot-data.css');
  assert.ok(sizeOf(base, '.bio-note') >= 12, '.bio-note');
  assert.ok(sizeOf(base, '.bio-sci') >= 11, '.bio-sci');
  assert.ok(sizeOf(sd, '.sd-credit') >= 11, '.sd-credit');
  assert.ok(sizeOf(sd, '.sd-sp i') >= 11, 'nom latin');
  assert.ok(sizeOf(sd, '.sd-src') >= 12, '.sd-src');
  assert.ok(sizeOf(sd, '.sd-flag-name small') >= 12, '.sd-flag-name small');
  assert.ok(sizeOf(sd, '.sd-teaser-note') >= 12, '.sd-teaser-note');
  assert.ok(sizeOf(sd, '.sd-suit small') >= 12, '.sd-suit small');
  assert.doesNotMatch(sd.match(/\.sd-credit\{[^}]*\}/)[0], /ellipsis|nowrap/, 'le crédit n’est plus tronqué');
});
