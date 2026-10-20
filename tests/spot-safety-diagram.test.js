const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* Faux élément : querySelector renvoie toujours le même objet par sélecteur. */
function el() {
  const kids = {}, attrs = {}, listeners = {};
  return {
    hidden: false, innerHTML: '', textContent: '', className: '', dataset: {}, style: {}, attrs, listeners,
    classList: {add() {}, remove() {}, toggle() {}, contains() { return false; }},
    querySelector(s) { return kids[s] || (kids[s] = el()); },
    querySelectorAll() { return []; },
    setAttribute(k, v) { attrs[k] = v; }, getAttribute(k) { return attrs[k]; },
    addEventListener(type, fn) { listeners[type] = fn; }, append() {}, after() {}, remove() {}, focus() {}, closest() { return null; },
    getContext() { return {clearRect() {}, beginPath() {}, arc() {}, fill() {}}; },
    get isConnected() { return false; }
  };
}

/* Charge spot-experience.js dans un bac à sable, avec isInland tel que l'app le définit (lac ou plan d'eau intérieur). */
function load() {
  const els = {};
  const sandbox = {
    document: {readyState: 'complete', querySelector: sel => els[sel] || (els[sel] = el()), querySelectorAll: () => [], createElement: () => el(), addEventListener() {}},
    OB_I18N: {locale: 'fr', lang: 'fr'},
    isInland: s => ['lake', 'inland'].includes(s?.waterType),
    spotSports: s => (Array.isArray(s.sports) ? s.sports : []),
    console, setTimeout, clearTimeout, fetch: () => new Promise(() => {})
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'spot-experience.js'), 'utf8'), sandbox, {filename: 'spot-experience.js'});
  const host = () => els['#spotSafetyLive'] || (els['#spotSafetyLive'] = el());
  return {
    /* Rend la fiche et renvoie le contenu de la carte « lecture du secteur ». */
    draw(spot, live, marine) {
      sandbox.OceanExperience.update(spot, 'surf');
      if (live || marine) sandbox.OceanExperience.refreshConditions(spot, live, marine);
      return {html: host().innerHTML, hidden: !!host().hidden};
    }
  };
}

const spot = (id, dangers, extra = {}) => ({id, name: id, loc: 'Lieu', waterType: 'sea', sports: ['surf'], dangers: dangers.map(d => ['⚠️', d]), ...extra});
const LIVE = {live: true, current: '1.2 km/h N', fetchedAt: Date.UTC(2026, 9, 20, 10, 0)};
const MARINE = {hourly: {sea_level_height_msl: [0, 0.2, 0.5, 0.9, 1.1, 1.2, 1.0, 0.7]}};
const KINDS = {
  rip: /Schéma d’un courant de retour/, reef: /Schéma d’un récif peu profond/,
  wind: /Schéma d’un vent qui pousse au large/, shore: /Schéma d’une zone de déferlement/
};
const diagram = html => Object.keys(KINDS).find(k => KINDS[k].test(html)) || null;

test('courant de retour : les flèches partent du sable vers le large (pointes en haut)', () => {
  const {html} = load().draw(spot('hossegor', ['Courants de baïne très forts, surtout à marée descendante.']), LIVE, MARINE);
  assert.equal(diagram(html), 'rip');
  const arrow = html.match(/<path class="arrow" d="([^"]+)"/)[1];
  /* Sable en bas (y 98 à 150), mer en haut : chaque flèche monte (de y grand à y petit) et sa pointe est sous le sommet. */
  const stems = [...arrow.matchAll(/M(\d+) (\d+)V(\d+)/g)];
  assert.equal(stems.length, 3, 'trois flèches');
  for (const [, , y0, y1] of stems) assert.ok(+y0 > +y1 && +y0 >= 98 && +y1 < 98, `la flèche monte vers la mer (${y0} -> ${y1})`);
  assert.equal([...arrow.matchAll(/V\d+m-9 10 9-10 9 10/g)].length, 3, 'pointes dirigées vers le haut');
  assert.doesNotMatch(arrow, /v-?\d+m-9-10/, 'plus de pointe vers le bas');
});

test('courant de retour : légende « COURANT VERS LE LARGE », consigne de sortie conservée', () => {
  const {html} = load().draw(spot('hossegor', ['Baïnes fortes.']), LIVE, MARINE);
  assert.match(html, />COURANT VERS LE LARGE</);
  assert.doesNotMatch(html, /ZONE DE RETOUR/);
  assert.match(html, />SORTIR SUR LE CÔTÉ · NE PAS LUTTER</);
  assert.match(html, /aria-label="Schéma d’un courant de retour"/);
});

test('choix du schéma par mots entiers, sans accents ni casse', () => {
  const t = (danger, sports) => diagram(load().draw(spot('x', [danger], sports ? {sports} : {}), LIVE, MARINE).html);
  assert.equal(t('Courants d’arrachement puissants.'), 'rip');
  assert.equal(t('Courants d\'arrachement puissants.'), 'rip');
  assert.equal(t('Courant d’arrachement.'), 'rip');
  assert.equal(t('Courants de retour au centre de la plage.'), 'rip');
  assert.equal(t('Courant de retour.'), 'rip');
  assert.equal(t('Courants de baïne.'), 'rip');
  assert.equal(t('BAÏNES en marée descendante'), 'rip');
  assert.equal(t('Baine à droite.'), 'rip');
  assert.equal(t('Rip current fort.'), 'rip');
  assert.equal(t('Des rips à marée haute.'), 'rip');
  assert.equal(t('Récifs tranchants.'), 'reef');
  assert.equal(t('RÉCIF peu profond'), 'reef');
  assert.equal(t('Reef.'), 'reef');
  assert.equal(t('Rochers à marée basse.'), 'reef');
  assert.equal(t('Roche immergée.'), 'reef');
  assert.equal(t('Falaises instables.'), 'reef');
  assert.equal(t('Vent offshore fréquent.'), 'wind');
  assert.equal(t('Kite et voile en même temps.'), 'wind');
  assert.equal(t('Voiles de planches à voile.'), 'wind');
  assert.equal(t('Aucun mot clé ici.'), 'shore');
});

test('plus aucune sous-chaîne : approche, souvent, sortie, courant seul, strip', () => {
  const t = danger => diagram(load().draw(spot('x', [danger]), LIVE, MARINE).html);
  assert.equal(t('Approche difficile par la route.'), 'shore', '« approche » ne contient plus « roche »');
  assert.equal(t('L’accroche est délicate.'), 'shore', '« accroche » ne contient plus « roche »');
  assert.equal(t('Le vent tourne souvent.'), 'wind', 'seul « vent » compte');
  assert.equal(t('Il change souvent de direction.'), 'shore', '« souvent » ne contient plus « vent »');
  assert.equal(t('Les vagues peuvent fermer.'), 'shore', '« peuvent » ne contient plus « vent »');
  assert.equal(t('Récif tranchant. Sortie par la grotte.'), 'reef', '« sortie » n’est plus un courant de retour');
  assert.equal(t('Sortie à l’eau compliquée.'), 'shore');
  assert.equal(t('Courant fort le long de la plage.'), 'shore', '« courant » seul n’est plus un courant de retour');
  assert.equal(t('Courants forts autour des rochers.'), 'reef');
  assert.equal(t('Un strip de plage étroit.'), 'shore', '« strip » ne contient plus « rip »');
  assert.equal(t('Description incomplète.'), 'shore', '« description » ne contient plus « rip »');
});

test('plongée et snorkeling seuls : ni schéma de courant de retour ni zone de déferlement', () => {
  const L = load();
  for (const sports of [['plongee'], ['snorkeling'], ['plongee', 'snorkeling']]) {
    assert.equal(diagram(L.draw(spot('sipadan', ['Courants forts le long du tombant.'], {sports}), LIVE, MARINE).html), null);
    assert.equal(diagram(L.draw(spot('saltstraumen', ['Courant de marée extrêmement violent.', 'Baïnes ?'], {sports}), LIVE, MARINE).html), null);
    assert.equal(diagram(L.draw(spot('komodo', ['Rien de particulier.'], {sports}), LIVE, MARINE).html), null);
  }
  /* Une activité de plus que la plongée : le schéma de plage redevient possible. */
  assert.equal(diagram(L.draw(spot('x', ['Baïnes.'], {sports: ['plongee', 'surf']}), LIVE, MARINE).html), 'rip');
  /* Les mots de courant de retour sont ignorés, mais un récif cité dans le même texte donne le schéma de récif. */
  assert.equal(diagram(L.draw(spot('x', ['Courants de retour.', 'Récifs tranchants.'], {sports: ['plongee']}), LIVE, MARINE).html), 'reef');
  /* Récif et vent restent permis si le texte les cite. */
  assert.equal(diagram(L.draw(spot('x', ['Récif peu profond.'], {sports: ['plongee']}), LIVE, MARINE).html), 'reef');
  assert.equal(diagram(L.draw(spot('x', ['Vent fort en fin de journée.'], {sports: ['snorkeling']}), LIVE, MARINE).html), 'wind');
});

test('spot de mer sans schéma : la carte garde ses lectures et sa mention complète', () => {
  const {html, hidden} = load().draw(spot('sipadan', ['Courants forts.'], {sports: ['plongee']}), LIVE, MARINE);
  assert.equal(hidden, false);
  assert.equal(diagram(html), null);
  assert.doesNotMatch(html, /safety-diagram/);
  assert.match(html, /Courant marin · modèle Open-Meteo/);
  assert.match(html, /Variation sur les 24 premières heures du modèle/);
  assert.match(html, /Vérifie la marée du jour/);
  assert.match(html, /Modèle reçu le /);
});

test('spot de mer : rendu des lectures et mention inchangés', () => {
  const {html} = load().draw(spot('hossegor', ['Baïnes.']), LIVE, MARINE);
  assert.match(html, /<b>1\.2 km\/h N<\/b><small>Courant marin · modèle Open-Meteo<\/small>/);
  assert.match(html, /Variation sur les 24 premières heures du modèle/);
  assert.match(html, /Les courants Open-Meteo sont une aide de repérage à résolution limitée près des côtes : ils ne remplacent ni le balisage, ni le poste de secours, ni les consignes du spot\. Vérifie la marée du jour auprès d’une source locale\./);
  assert.match(html, /Modèle reçu le /);
  assert.doesNotMatch(html, /Ce schéma est un repère général/);
  /* Sans lecture reçue. */
  assert.match(load().draw(spot('hossegor', ['Baïnes.'])).html, /Modèle indisponible/);
});

test('plan d’eau intérieur : ni courant marin, ni variation, ni marée, ni badge de modèle', () => {
  const L = load();
  for (const waterType of ['lake', 'inland']) {
    const {html} = L.draw(spot('x', ['Rochers immergés.'], {waterType, sports: ['kayak']}), LIVE, MARINE);
    assert.equal(diagram(html), 'reef', 'le récif reste permis si le texte le cite');
    assert.doesNotMatch(html, /Courant marin/);
    assert.doesNotMatch(html, /Open-Meteo/);
    assert.doesNotMatch(html, /Variation sur les 24/);
    assert.doesNotMatch(html, /marée/);
    assert.doesNotMatch(html, /Modèle (reçu|indisponible)/);
    assert.doesNotMatch(html, /safety-readings/);
    assert.match(html, /<p class="safety-disclaimer">Ce schéma est un repère général : il ne remplace ni le balisage, ni les consignes du lieu\.<\/p>/);
  }
});

test('plan d’eau intérieur : jamais de schéma de courant de retour ni de déferlement', () => {
  const L = load();
  for (const waterType of ['lake', 'inland']) {
    for (const d of ['Courants d’arrachement puissants.', 'Baïnes.', 'Courant très rapide et froid.', 'Rien de spécial.']) {
      const {html, hidden} = L.draw(spot('eisbach', [d], {waterType, sports: ['surf']}), LIVE, MARINE);
      assert.equal(diagram(html), null, d);
      /* Ni schéma ni lecture : pas de carte vide. */
      assert.equal(hidden, true, d);
      assert.equal(html, '', d);
    }
  }
});

test('la carte se réaffiche quand on passe d’un plan d’eau sans schéma à un spot de mer', () => {
  const L = load();
  assert.equal(L.draw(spot('eisbach', ['Courant rapide.'], {waterType: 'inland'}), LIVE, MARINE).hidden, true);
  const sea = L.draw(spot('hossegor', ['Baïnes.']), LIVE, MARINE);
  assert.equal(sea.hidden, false);
  assert.equal(diagram(sea.html), 'rip');
});

test('catalogue : aucun schéma de plage pour l’eau intérieure ni pour la plongée seule', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'catalog.json'), 'utf8'));
  const L = load();
  let inland = 0, diveOnly = 0, rip = 0;
  for (const s of catalog) {
    const {html, hidden} = L.draw(s, LIVE, MARINE);
    const kind = diagram(html);
    const sports = s.sports || [];
    const isInland = ['lake', 'inland'].includes(s.waterType);
    const dive = sports.length > 0 && sports.every(x => x === 'plongee' || x === 'snorkeling');
    if (kind === 'rip') rip++;
    if (isInland) {
      inland++;
      assert.ok(kind === null || kind === 'reef' || kind === 'wind', `${s.id} (eau intérieure) : schéma ${kind}`);
      assert.doesNotMatch(html, /Courant marin|Variation sur les 24|marée|Modèle (reçu|indisponible)/, s.id);
      if (kind === null) assert.ok(hidden && html === '', `${s.id} : carte vide`);
    } else if (dive) {
      diveOnly++;
      assert.ok(kind === null || kind === 'reef' || kind === 'wind', `${s.id} (plongée seule) : schéma ${kind}`);
    }
  }
  assert.ok(inland >= 20 && diveOnly >= 20 && rip > 0, `${inland} / ${diveOnly} / ${rip}`);
});

test('« Le cadre » et la ligne « Cadre » disent « Plan d’eau intérieur » hors mer', () => {
  for (const file of ['field-guide.js', 'spot-notebook.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(src, /isInland\(s\)\?'Plan d’eau intérieur':'Mer & océan'/, file);
    assert.doesNotMatch(src, /'Eau douce'/, file);
  }
});

test('voyage : le conseil du spot porte l’étiquette « Poulpy » et le titre « Le conseil de Poulpy »', () => {
  const scenes = [1, 2, 3].map(i => ({src: `s${i}.webp`, title: `Scène ${i}`, caption: ''}));
  const sandbox = {
    document: {body: el(), documentElement: el(), createElement: () => el(), activeElement: null, addEventListener() {}, getElementById: () => null},
    matchMedia: () => ({matches: false}), requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    setTimeout: () => 0, clearTimeout() {}, performance: {now: () => 0}, console,
    Image: function () { return el(); }, innerWidth: 400, innerHeight: 800, devicePixelRatio: 1,
    localStorage: {getItem: () => null, setItem() {}}, addEventListener() {}, removeEventListener() {},
    OCEAN_SCENES: {x: scenes}
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'spot-voyage.js'), 'utf8'), sandbox, {filename: 'spot-voyage.js'});
  let rootEl = null;
  sandbox.document.body.append = r => { rootEl = r; };
  sandbox.OceanVoyage.open({id: 'x', name: 'Spot', loc: 'Lieu', desc: 'Description du lieu.', tip: 'Loge chez l’habitant.', dangers: [], sports: ['surf']});
  const card = () => rootEl.querySelector('[data-card]').innerHTML;
  assert.match(card(), /<span>Arrivée<\/span>/);
  rootEl.listeners.keydown({key: 'ArrowRight', target: {closest: () => null}, preventDefault() {}});
  assert.match(card(), /<span>Poulpy<\/span>/);
  assert.match(card(), /<h2>Le conseil de Poulpy<\/h2>/);
  assert.match(card(), /<p>Loge chez l’habitant\.<\/p>/);
  assert.doesNotMatch(card(), /Avant d’entrer dans l’eau/);
});
