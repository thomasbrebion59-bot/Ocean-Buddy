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

/* Lieux : [nom, distance en m, étiquette brute (cuisine, sports ou genre, séparés par « ; »), référence OSM]. */
function buildPlaces(json) {
  const dropped = [];
  if (!json || typeof json.spots !== 'object') throw new Error('spot-places.json : pas de spots');
  if (!/ODbL/.test(String(json.license || ''))) throw new Error('spot-places.json : licence ODbL absente');
  if (!/^https:\/\//.test(String(json.source || ''))) throw new Error('spot-places.json : source sans adresse https');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(json.extracted || ''))) throw new Error('spot-places.json : date d’extraction absente');
  const spots = {};
  for (const [id, v] of Object.entries(json.spots)) {
    const out = {};
    for (const [cat, key] of Object.entries(CATS)) {
      const list = Array.isArray(v && v[cat]) ? v[cat] : [];
      const ok = [];
      for (const p of list) {
        const err = placeError(p);
        if (err) { dropped.push({ spot: id, cat, name: p && p.name || '', why: err }); continue; }
        const tag = cat === 'restaurants' ? (p.cuisine || '') : cat === 'ecoles' ? (p.sports || []).join(';') : (p.kind || '');
        ok.push([p.name.trim(), Math.round(p.distM), tag, p.osm]);
      }
      ok.sort((a, b) => a[1] - b[1]);
      if (ok.length) out[key] = ok.slice(0, MAX_PER_CAT);
    }
    /* Un spot sans aucun lieu garde son entrée (rayon seul) : la fiche dit alors « aucune adresse trouvée ». */
    out.r = Number(v && v.radiusM) || Number(json.radiusM) || 3000; spots[id] = out;
  }
  return { meta: { extracted: json.extracted, license: json.license, source: json.source }, spots, dropped };
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
    const places = buildPlaces(JSON.parse(fs.readFileSync(placesFile, 'utf8')));
    const prices = buildPrices(JSON.parse(fs.readFileSync(pricesFile, 'utf8')), JSON.parse(fs.readFileSync(namesFile, 'utf8')));
    for (const x of places.dropped) console.log(`lieu écarté : ${x.spot} / ${x.cat} « ${x.name} » (${x.why})`);
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
