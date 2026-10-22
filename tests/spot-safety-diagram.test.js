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
  wind: /Schéma d’un vent qui pousse au large/, shore: /Schéma d’une zone de déferlement/,
  passe: /Schéma d’un courant de passe/, riviere: /Schéma d’une rivière à courant/
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
    /* « courant » + plongée : schéma de passe ; snorkeling seul : aucun schéma. */
    const withDive = sports.includes('plongee') ? 'passe' : null;
    assert.equal(diagram(L.draw(spot('sipadan', ['Courants forts le long du tombant.'], {sports}), LIVE, MARINE).html), withDive);
    assert.equal(diagram(L.draw(spot('saltstraumen', ['Courant de marée extrêmement violent.', 'Baïnes ?'], {sports}), LIVE, MARINE).html), withDive);
    assert.equal(diagram(L.draw(spot('komodo', ['Rien de particulier.'], {sports}), LIVE, MARINE).html), null);
  }
  /* Une activité de plus que la plongée : le schéma de plage redevient possible, jamais celui de la passe. */
  assert.equal(diagram(L.draw(spot('x', ['Baïnes.'], {sports: ['plongee', 'surf']}), LIVE, MARINE).html), 'rip');
  assert.equal(diagram(L.draw(spot('x', ['Courant fort.'], {sports: ['plongee', 'surf']}), LIVE, MARINE).html), 'shore');
  /* Sans le mot « courant », les mots de courant de retour sont ignorés, mais un récif cité donne le schéma de récif. */
  assert.equal(diagram(L.draw(spot('x', ['Baïnes.', 'Récifs tranchants.'], {sports: ['plongee']}), LIVE, MARINE).html), 'reef');
  /* Récif et vent restent permis si le texte les cite. */
  assert.equal(diagram(L.draw(spot('x', ['Récif peu profond.'], {sports: ['plongee']}), LIVE, MARINE).html), 'reef');
  assert.equal(diagram(L.draw(spot('x', ['Vent fort en fin de journée.'], {sports: ['snorkeling']}), LIVE, MARINE).html), 'wind');
});

test('spot de mer sans schéma : la carte garde ses lectures et sa mention complète', () => {
  const {html, hidden} = load().draw(spot('komodo', ['Rien de particulier.'], {sports: ['plongee']}), LIVE, MARINE);
  assert.equal(hidden, false);
  assert.equal(diagram(html), null);
  assert.doesNotMatch(html, /safety-diagram|safety-tips/);
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
    assert.doesNotMatch(html, /safety-tips/, 'pas de consigne sans schéma de rivière');
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
      assert.ok(kind === null || kind === 'reef' || kind === 'wind' || kind === 'riviere', `${s.id} (eau intérieure) : schéma ${kind}`);
      assert.doesNotMatch(html, /Courant marin|Variation sur les 24|marée|Modèle (reçu|indisponible)/, s.id);
      if (kind === null) assert.ok(hidden && html === '', `${s.id} : carte vide`);
    } else if (dive) {
      diveOnly++;
      assert.ok(kind === null || kind === 'reef' || kind === 'wind' || kind === 'passe', `${s.id} (plongée seule) : schéma ${kind}`);
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

/* ---------- Schémas « passe » et « rivière » (item 7B) ---------- */
const CATALOG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'catalog.json'), 'utf8'));
const SCHEMAS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'sources', 'schemas.json'), 'utf8'));
const byId = id => CATALOG.find(s => s.id === id);
const kindOf = (L, id) => diagram(L.draw(byId(id), LIVE, MARINE).html);

test('passe et rivière : le catalogue donne les 61 + 6 spots de la recherche, et aucun autre', () => {
  const L = load();
  const passe = [], riviere = [];
  for (const s of CATALOG) {
    const kind = diagram(L.draw(s, LIVE, MARINE).html);
    if (kind === 'passe') passe.push(s.id);
    if (kind === 'riviere') riviere.push(s.id);
  }
  assert.equal(passe.length, 61, passe.join(','));
  assert.deepEqual(riviere.sort(), ['futaleufu', 'gorgestarn', 'pontdarc', 'rishikesh', 'roquegageac', 'soca']);
  for (const id of ['sipadan', 'saltstraumen', 'tikehau', 'rangiroa']) assert.ok(passe.includes(id), id);
  /* Un spot de passe garde ses lectures marines ; une rivière n'en a aucune. */
  assert.match(L.draw(byId('sipadan'), LIVE, MARINE).html, /Courant marin · modèle Open-Meteo/);
  assert.doesNotMatch(L.draw(byId('pontdarc'), LIVE, MARINE).html, /Courant marin|Open-Meteo|Modèle (reçu|indisponible)/);
});

test('sipadan et saltstraumen : passe ; pontdarc et gorgestarn : rivière', () => {
  const L = load();
  assert.equal(kindOf(L, 'sipadan'), 'passe');
  assert.equal(kindOf(L, 'saltstraumen'), 'passe');
  assert.equal(kindOf(L, 'pontdarc'), 'riviere');
  assert.equal(kindOf(L, 'gorgestarn'), 'riviere');
});

test('eisbach, ginnie, silfra et bonito : aucun schéma ; un lac ou un cénote non plus', () => {
  const L = load();
  for (const id of ['eisbach', 'ginnie', 'silfra', 'bonito', 'annecy', 'cenote_dosojos', 'grancenote']) {
    const {html, hidden} = L.draw(byId(id), LIVE, MARINE);
    const kind = diagram(html);
    assert.ok(kind !== 'passe' && kind !== 'riviere', `${id} : ${kind}`);
    assert.doesNotMatch(html, /safety-tips/, id);
  }
  for (const id of ['eisbach', 'ginnie', 'silfra', 'bonito']) assert.equal(kindOf(L, id), null, id);
  /* Même avec un texte qui cite l'eau vive : l'Eisbach, où la ville interdit de nager, n'a jamais de nageur dessiné. */
  assert.equal(diagram(L.draw(spot('eisbach', ['Rapides et crues.'], {waterType: 'inland', sports: ['surf']}), LIVE, MARINE).html), null);
});

test('rivière : mots entiers, et aucune cavité', () => {
  const t = (dangers, extra = {}) => diagram(load().draw(spot('x', dangers, {waterType: 'inland', sports: ['kayak'], ...extra}), LIVE, MARINE).html);
  for (const d of ['Rapides puissants.', 'Crues soudaines.', 'Un rapide.', 'Courant fort.', 'Siphons.', 'Seuils glissants.', 'Lâchers de barrage.', 'Barrage en amont.']) assert.equal(t([d]), 'riviere', d);
  assert.equal(t(['Rapides. Entrée dans la grotte.']), null, 'cavité : ni rivière ni récif');
  assert.equal(t(['Courant fort.', 'Galerie étroite.']), null);
  assert.equal(t(['Il accroche souvent.']), null, 'aucun mot entier de rivière');
  assert.equal(t(['Rapides et rochers.']), 'riviere', 'la rivière passe avant le récif');
  /* Un lac (waterType lake) n'a pas de courant de rivière. */
  assert.equal(t(['Courant fort.'], {waterType: 'lake'}), null);
});

test('passe : mots entiers « courant(s) », et la plongée est requise', () => {
  const t = (dangers, sports = ['plongee']) => diagram(load().draw(spot('x', dangers, {sports}), LIVE, MARINE).html);
  assert.equal(t(['Courants forts.']), 'passe');
  assert.equal(t(['COURANT de marée.']), 'passe');
  assert.equal(t(['Un courant.'], ['plongee', 'snorkeling']), 'passe');
  assert.equal(t(['Les concourants arrivent.']), null, '« concourants » ne contient pas « courants »');
  assert.equal(t(['Passe étroite.']), null);
  assert.equal(t(['Courant fort.'], ['snorkeling']), null, 'snorkeling seul : aucun schéma de plongeur');
  assert.equal(diagram(load().draw(spot('x', ['Courants forts.'], {sports: ['plongee'], waterType: 'lake'}), LIVE, MARINE).html), null, 'la passe est un schéma de mer');
  /* Snorkeling seul avec courant (thunderball, drawaqa) : aucun schéma de passe. */
  for (const id of ['thunderball', 'drawaqa']) assert.notEqual(kindOf(load(), id), 'passe', id);
});

test('passe : légende sans « laisse-toi porter », consignes sourcées, courant de gauche à droite', () => {
  const {html} = load().draw(byId('sipadan'), LIVE, MARINE);
  assert.match(html, />NE LUTTE PAS · RESTE GROUPÉ AVEC TON GUIDE</);
  assert.match(html, />BOUÉE EN SURFACE</);
  assert.match(html, /aria-label="Schéma d’un courant de passe"/);
  assert.doesNotMatch(html, /laisse-toi porter|se laisser porter/i);
  assert.doesNotMatch(html, /Ce schéma est un repère général/);
  const arrow = html.match(/<path class="arrow" d="M30 100h270m-17-11 17 11-17 11"\/>/);
  assert.ok(arrow, 'une flèche de courant vers la droite');
  assert.equal((html.match(/<li>/g) || []).length, 4);
});

test('rivière : légende DLRG, jamais « pieds » sans « gilet », le nageur rejoint la berge en biais', () => {
  const {html, hidden} = load().draw(byId('pontdarc'), LIVE, MARINE);
  assert.equal(hidden, false);
  assert.match(html, /aria-label="Schéma d’une rivière à courant"/);
  assert.match(html, />NE LUTTE PAS · REJOINS LA RIVE EN BIAIS</);
  assert.match(html, /<li>Ne lutte pas : laisse-toi porter et rejoins la rive en biais\./);
  assert.match(html, /Ce schéma est un repère général/);
  /* « pieds » : jamais dans le dessin, et dans une consigne seulement si elle dit « gilet ». */
  const svg = html.match(/<svg[\s\S]*?<\/svg>/)[0];
  assert.doesNotMatch(svg, /pieds|PIEDS/);
  assert.doesNotMatch(svg, /SUR LE DOS/);
  const items = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1].replace(/<a[\s\S]*?<\/a>/g, ''));
  assert.ok(items.length >= 5);
  for (const text of items) if (/pieds/i.test(text)) assert.match(text, /gilet/i, text);
  assert.equal(items.filter(t => /pieds/i.test(t)).length, 1);
  assert.doesNotMatch(items[0], /pieds|dos/, 'le baigneur sans gilet ne reçoit que la consigne DLRG');
  /* Courant de gauche à droite (flèches vers la droite) ; le trajet du nageur descend vers la berge du bas avec le courant. */
  assert.match(svg, /class="arrow" d="M25 50h120m-16-10 16 10-16 10M25 102h120m-16-10 16 10-16 10"/);
  const route = svg.match(/class="safe" d="M(\d+) (\d+)l(-?\d+) (-?\d+)"/);
  assert.ok(route, 'trajet en pointillés');
  const [, x0, y0, dx, dy] = route.map(Number);
  assert.ok(dx > 0, 'dans le sens du courant');
  assert.ok(dy > 0 && y0 + dy >= 124, 'jusqu’à la berge (y 124 à 150)');
  assert.ok(y0 > 26 && y0 < 124, 'le départ est dans l’eau');
  assert.ok(x0 + dx < 280, 'le trajet ne touche pas l’arbre immergé');
});

test('légendes des schémas : tiennent dans la largeur du dessin (420)', () => {
  const L = load();
  for (const id of ['sipadan', 'pontdarc']) {
    const svg = L.draw(byId(id), LIVE, MARINE).html.match(/<svg[\s\S]*?<\/svg>/)[0];
    for (const [, x, text] of svg.matchAll(/<text x="(\d+)" y="\d+">([^<]+)<\/text>/g)) assert.ok(+x + text.length * 7.6 <= 420, `${id} : « ${text} » déborde`);
  }
});

test('consignes sous les schémas : chaque texte et chaque lien viennent de data/sources/schemas.json', () => {
  const L = load();
  const seen = new Set();
  for (const id of ['sipadan', 'pontdarc']) {
    const html = L.draw(byId(id), LIVE, MARINE).html;
    const items = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]);
    assert.ok(items.length >= 4, id);
    for (const item of items) {
      const text = item.replace(/<a[\s\S]*$/, '').replace(/&#39;/g, '\'');
      const entry = Object.entries(SCHEMAS).find(([key, e]) => key.startsWith('schema.') && e.fr === text);
      assert.ok(entry, `texte absent de schemas.json : ${text}`);
      const [key, e] = entry;
      seen.add(key);
      assert.equal(e.affiche, id === 'sipadan' ? 'passe' : 'riviere', key);
      assert.equal(e.status, 'sourcé', key);
      assert.equal(e.verif.ok, true, key);
      const links = [...item.matchAll(/<a class="safety-tip-source" href="([^"]+)" target="_blank" rel="noopener noreferrer">Source : ([^<]+) · consultée le (\d\d\/\d\d\/\d{4})<\/a>/g)];
      assert.ok(links.length >= 1 && links.length <= 3, key);
      assert.equal(links.length, (item.match(/<a /g) || []).length, 'chaque lien suit le format « Source : {0} · consultée le {1} »');
      for (const [, href, , date] of links) {
        assert.match(href, /^https:\/\//);
        assert.ok(e.sources.some(x => x.url === href), `${key} : ${href} absent des sources`);
        assert.equal(date, e.consulted.split('-').reverse().join('/'), key);
      }
    }
  }
  assert.ok(seen.size >= 10, [...seen].join(','));
  /* Une entrée affichée a au moins une citation textuelle ; celles qui ne s'affichent pas le disent. */
  for (const [key, e] of Object.entries(SCHEMAS)) {
    if (!key.startsWith('schema.') || key === 'schema.passe.legende') continue;
    assert.ok(e.sources.length >= 1 && e.sources.every(x => x.url && x.quote && x.publisher), key);
    if (e.affiche === false) assert.ok(e.notes, key);
  }
  /* La consigne « gilet » de la fiche pratique (field-guide.js) cite bien cette entrée. */
  for (const x of SCHEMAS['schema.riviere.consigne1'].sources) assert.ok(x.url.startsWith('https://'));
  assert.equal(SCHEMAS['schema.riviere.consigne1'].fr, 'Porte un gilet ou une aide à la flottabilité marquée CE.');
});

test('consignes : aucune promesse ni formule absolue de sécurité', () => {
  const L = load();
  for (const id of ['sipadan', 'pontdarc']) {
    const html = L.draw(byId(id), LIVE, MARINE).html;
    assert.doesNotMatch(html, /sans danger|garanti|sûr à 100|aucun risque|idéal pour débuter|sauve/i, id);
  }
});
