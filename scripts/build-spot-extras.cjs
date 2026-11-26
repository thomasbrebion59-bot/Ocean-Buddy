#!/usr/bin/env node
/* Lieux autour des spots (OpenStreetMap) et niveau des prix par pays (Banque mondiale), pour « Sur place » du chapitre
 * « Le coin » de la fiche.
 *
 *   node scripts/build-spot-extras.cjs [dossier]      (ou OB_SPOT_EXTRAS_DIR=dossier)
 *
 * Lit dans le dossier de collecte (par défaut ~/Projects/Ocean-Buddy-orga-docs/donnees-spots, format dans son FORMAT.md) :
 *   - spot-places.json     restaurants, écoles, locations et boutiques autour de chaque spot (OSM, ODbL) ;
 *   - price-index.json     niveau des prix de la consommation des ménages par pays (WDI, PA.NUS.PRVT.PLI, CC BY 4.0) ;
 *   - scripts/pays-iso2.json   nom de pays du catalogue → code ISO2.
 * Valide tout, puis écrit dans le dépôt :
 *   - data/spot-extras.json          la donnée gardée, lisible ;
 *   - assets/data/spot-extras.js     la même, compacte, chargée à la demande à l’ouverture d’une fiche.
 * Puis met à jour l’empreinte de l’URL dans spot-guide.js.
 * Règles : aucune note, aucun prix, aucun avis, aucun horaire venant d’OSM ; un pays sans valeur reste absent (jamais de
 * valeur de remplacement). Une entrée invalide est écartée et listée, jamais corrigée ici.
 * Sans dossier de collecte (autre machine, intégration continue), data/spot-extras.json est repris tel quel.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const CATS = { restaurants: 'R', ecoles: 'E', locations: 'L' };
const MAX_PER_CAT = 5;
/* Champs permis pour un lieu. Tout autre champ (note, prix, avis, horaires…) fait écarter le lieu. */
const PLACE_KEYS = ['name', 'lat', 'lon', 'distM', 'cuisine', 'sports', 'kind', 'osm'];
const FORBIDDEN = /^(note|notes|rating|ratings|stars|price|prices|prix|avis|review|reviews|opening_hours|horaires|fee|tarif|tarifs)$/i;
const OSM_REF = /^(node|way|relation)\/\d+$/;

/* Un lieu : pourquoi il est refusé, ou null s’il est valable. */
function placeError(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return 'lieu illisible';
  for (const k of Object.keys(p)) {
    if (FORBIDDEN.test(k)) return 'champ interdit : ' + k;
    if (!PLACE_KEYS.includes(k)) return 'champ inconnu : ' + k;
  }
  if (typeof p.name !== 'string' || !p.name.trim()) return 'nom absent';
  if (typeof p.distM !== 'number' || !Number.isFinite(p.distM) || p.distM < 0 || p.distM > 20000) return 'distance invalide';
  if (typeof p.osm !== 'string' || !OSM_REF.test(p.osm)) return 'référence OpenStreetMap invalide';
  if (p.sports != null && (!Array.isArray(p.sports) || p.sports.some(x => typeof x !== 'string'))) return 'sports illisibles';
  if (p.cuisine != null && typeof p.cuisine !== 'string') return 'cuisine illisible';
  if (p.kind != null && !['location', 'boutique'].includes(p.kind)) return 'genre inconnu : ' + p.kind;
  return null;
}
const osmUrl = ref => 'https://www.openstreetmap.org/' + ref;

/* Tri des « locations ou boutiques » (lot 4, finitions). OpenStreetMap range sous shop=surf|sports|dive… des activités sans
 * rapport avec les sports d’eau du guide : excursions en bateau, voiliers, pêche, jet-ski, quad, tennis, pelote, ski, patins…
 * Ces lieux sont écartés ici, à l’écriture du fichier de l’app ; la donnée de collecte (donnees-spots) reste intacte.
 * Un jet-ski n’est gardé que si le spot a ce sport (aucun spot du catalogue ne l’a aujourd’hui).
 * Une école rangée en location (nom : « school », « école », « escuela », « camp »…) passe dans les écoles.
 * Un même lieu (même référence OSM ou même nom) n’apparaît que dans une catégorie : écoles, puis locations, puis restaurants. */
const norm = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const OFF_TOPIC = [
  /\b(peche|fishing|fisherman)\b|lystfisk/,                                 // pêche
  /excursion|sorties?\b|voilier|\bvoiles?\b|\bsailing\b|catavoile|lokavoile|catamaran|yacht|croisiere|navigation/, // bateau, voile
  /\bquad\b|\brando\b/,                                                    // quad, randonnée
  /\bski(hut|s)?\b/,                                                       // ski
  /\broller|\btrucks?\b|\bskate\b(?!.*(bike|velo|cycle))/,                 // patins et skate (sauf location de vélos)
  /fitness|fitboxe|\bboxe\b|\brun\b|tennis|set et match|pilota|pelota|chistera|padel|\bgolf\b|\bgym\b|crossfit/
];
const JET = /\bjet\b|jet-?ski|scooter des mers/;
const SCHOOL = /\bschool\b|\becoles?\b|\bescuela\b|\beskola\b|skolen|\bscuola\b|\bcamp\b/;
/* Sport lu dans le nom d’une école reclassée, dans les étiquettes que l’app sait nommer (SPORT_TAG de spot-guide.js). */
function sportsInName(n) {
  const out = [];
  if (/kite/.test(n)) out.push('kitesurfing');
  if (/windsurf|vind/.test(n)) out.push('windsurfing');
  if (/surf/.test(n)) out.push('surfing');
  if (/dive|diving|diver|scuba|buceo|plong/.test(n)) out.push('scuba_diving');
  return out;
}
function offTopic(name, sports) {
  const n = norm(name);
  if (JET.test(n)) return !(sports || []).includes('jetski');
  return OFF_TOPIC.some(re => re.test(n));
}

/* Lieux : [nom, distance en m, étiquette brute (cuisine, sports ou genre, séparés par « ; »), référence OSM].
 * spotSports : { idDuSpot: [sports du catalogue] }, facultatif (sans lui, aucun spot n’a de jet-ski). */
function buildPlaces(json, spotSports) {
  const dropped = [], filtered = [];
  if (!json || typeof json.spots !== 'object') throw new Error('spot-places.json : pas de spots');
  if (!/ODbL/.test(String(json.license || ''))) throw new Error('spot-places.json : licence ODbL absente');
  if (!/^https:\/\//.test(String(json.source || ''))) throw new Error('spot-places.json : source sans adresse https');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(json.extracted || ''))) throw new Error('spot-places.json : date d’extraction absente');
  const spots = {};
  for (const [id, v] of Object.entries(json.spots)) {
    const out = {}, valid = {};
    for (const [cat, key] of Object.entries(CATS)) {
      const list = Array.isArray(v && v[cat]) ? v[cat] : [];
      const ok = [];
      for (const p of list) {
        const err = placeError(p);
        if (err) { dropped.push({ spot: id, cat, name: p && p.name || '', why: err }); continue; }
        ok.push(p);
      }
      valid[cat] = ok;
    }
    const sports = (spotSports && spotSports[id]) || [];
    /* Locations : on écarte le hors-sujet, on envoie les écoles chez les écoles. */
    const keepL = [];
    for (const p of valid.locations) {
      if (offTopic(p.name, sports)) { filtered.push({ spot: id, name: p.name, why: 'hors sujet' }); continue; }
      if (SCHOOL.test(norm(p.name))) { valid.ecoles.push({ ...p, sports: p.sports || sportsInName(norm(p.name)) }); filtered.push({ spot: id, name: p.name, why: 'école' }); continue; }
      keepL.push(p);
    }
    valid.locations = keepL;
    /* Un même lieu dans une seule catégorie. */
    const seenOsm = new Set(), seenName = new Set();
    for (const cat of ['ecoles', 'locations', 'restaurants']) {
      const names = [];
      valid[cat] = valid[cat].filter(p => {
        const nn = norm(p.name).replace(/[^a-z0-9]/g, '');
        if (seenOsm.has(p.osm) || seenName.has(nn)) { filtered.push({ spot: id, name: p.name, why: 'doublon' }); return false; }
        names.push(nn); return true;
      });
      for (const p of valid[cat]) seenOsm.add(p.osm);
      names.forEach(n => seenName.add(n));
    }
    for (const [cat, key] of Object.entries(CATS)) {
      const ok = valid[cat].map(p => {
        const tag = cat === 'restaurants' ? (p.cuisine || '') : cat === 'ecoles' ? (p.sports || []).join(';') : (p.kind || '');
        return [p.name.trim(), Math.round(p.distM), tag, p.osm];
      });
      ok.sort((a, b) => a[1] - b[1]);
      if (ok.length) out[key] = ok.slice(0, MAX_PER_CAT);
    }
    /* Un spot sans aucun lieu garde son entrée (rayon seul) : la fiche dit alors « aucune adresse trouvée ». */
    out.r = Number(v && v.radiusM) || Number(json.radiusM) || 3000; spots[id] = out;
  }
  return { meta: { extracted: json.extracted, license: json.license, source: json.source }, spots, dropped, filtered };
}

/* Niveau des prix : par nom de pays du catalogue, [indice (États-Unis = 100), année, code ISO2]. */
function buildPrices(json, names) {
  const dropped = [];
  const s = json && json.source;
  if (!s || !/^https:\/\//.test(String(s.url || ''))) throw new Error('price-index.json : source sans adresse https');
  if (!String(s.license || '').trim()) throw new Error('price-index.json : licence absente');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s.consulted || ''))) throw new Error('price-index.json : date de consultation absente');
  const byIso = json.countries || {}, c = {};
  for (const [name, iso] of Object.entries(names || {})) {
    const v = byIso[iso];
    if (!v) continue;
    if (typeof v.index !== 'number' || !Number.isFinite(v.index) || v.index <= 0 || !Number.isInteger(v.year) || v.year < 2000 || v.year > 2100) {
      dropped.push({ country: name, iso, why: 'valeur ou année invalide' }); continue;
    }
    c[name] = [Math.round(v.index * 10) / 10, v.year, iso];
  }
  return { meta: { name: s.name, url: s.url, license: s.license, consulted: s.consulted, base: String(json.base || '') }, countries: c, dropped };
}

function compact(places, prices) {
  return { v: 1, osm: places.meta, places: places.spots, prix: { meta: prices.meta, c: prices.countries } };
}

function run() {
  const root = path.join(__dirname, '..');
  const dir = process.argv[2] || process.env.OB_SPOT_EXTRAS_DIR || path.join(os.homedir(), 'Projects/Ocean-Buddy-orga-docs/donnees-spots');
  const kept = path.join(root, 'data/spot-extras.json');
  let data;
  const placesFile = path.join(dir, 'spot-places.json'), pricesFile = path.join(dir, 'price-index.json'), namesFile = path.join(dir, 'scripts/pays-iso2.json');
  if (fs.existsSync(placesFile) && fs.existsSync(pricesFile) && fs.existsSync(namesFile)) {
    const catFile = path.join(root, 'data/catalog.json');
    const spotSports = {};
    if (fs.existsSync(catFile)) for (const sp of JSON.parse(fs.readFileSync(catFile, 'utf8'))) spotSports[sp.id] = Array.isArray(sp.sports) ? sp.sports : [];
    const places = buildPlaces(JSON.parse(fs.readFileSync(placesFile, 'utf8')), spotSports);
    const prices = buildPrices(JSON.parse(fs.readFileSync(pricesFile, 'utf8')), JSON.parse(fs.readFileSync(namesFile, 'utf8')));
    for (const x of places.dropped) console.log(`lieu écarté : ${x.spot} / ${x.cat} « ${x.name} » (${x.why})`);
    for (const x of places.filtered) console.log(`lieu trié : ${x.spot} « ${x.name} » (${x.why})`);
    for (const x of prices.dropped) console.log(`pays écarté : ${x.country} (${x.why})`);
    data = compact(places, prices);
    fs.writeFileSync(kept, JSON.stringify(data, null, 1) + '\n');
  } else {
    if (!fs.existsSync(kept)) throw new Error('Pas de fichiers de collecte dans ' + dir + ' et pas de data/spot-extras.json.');
    data = JSON.parse(fs.readFileSync(kept, 'utf8'));
    console.log('Pas de dossier de collecte : data/spot-extras.json repris tel quel.');
  }
  const body = '/* Généré par scripts/build-spot-extras.cjs depuis data/spot-extras.json. Ne pas modifier à la main. */\nwindow.OCEAN_SPOT_EXTRAS=' + JSON.stringify(data) + ';\n';
  fs.writeFileSync(path.join(root, 'assets/data/spot-extras.js'), body);
  const hash = crypto.createHash('sha256').update(body).digest('hex').slice(0, 12);
  const guide = path.join(root, 'spot-guide.js'), code = fs.readFileSync(guide, 'utf8');
  const next = code.replace(/assets\/data\/spot-extras\.js\?v=[0-9a-f]+/, 'assets/data/spot-extras.js?v=' + hash);
  if (next !== code) fs.writeFileSync(guide, next);
  const nPlaces = Object.values(data.places).reduce((a, s) => a + ['R', 'E', 'L'].reduce((b, k) => b + (s[k] ? s[k].length : 0), 0), 0);
  console.log(`${Object.keys(data.places).length} spots avec lieux (${nPlaces} lieux), ${Object.keys(data.prix.c).length} pays avec indice → data/spot-extras.json, assets/data/spot-extras.js (${(body.length / 1024).toFixed(1)} Ko)`);
}

module.exports = { CATS, MAX_PER_CAT, PLACE_KEYS, placeError, buildPlaces, buildPrices, compact, osmUrl };
if (require.main === module) run();
