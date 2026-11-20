#!/usr/bin/env node
/* Culture locale sourcée, par zone (« Ici, on vit comme ça », chapitre « Le coin » de la fiche).
 *
 *   node scripts/build-culture-zones.cjs [dossier]      (ou OB_CULTURE_ZONES_DIR=dossier)
 *
 * Lit culture-zones.json du dossier (le fichier fusionné ; à défaut, tous les culture-zones*.json) (par défaut ~/Projects/Ocean-Buddy-orga-docs/donnees-spots,
 * format dans son FORMAT.md), valide chaque fait, et écrit dans le dépôt :
 *   - data/culture-zones.json            la donnée gardée, lisible (zones, faits, sources, index spot → zone) ;
 *   - assets/data/culture-zones.js       la même, compacte, chargée à la demande à l’ouverture d’une fiche.
 * Puis met à jour l’empreinte de l’URL dans spot-guide.js.
 * Règle : aucun fait sans source. Un fait invalide est écarté et listé, jamais corrigé ici.
 * Sans dossier de collecte (autre machine, intégration continue), data/culture-zones.json est repris tel quel.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const KINDS = ['gout', 'fete', 'mot', 'coutume', 'lieu'];
const MAX_TEXT = 140;
/* Éditeurs écartés tant que le fondateur n’a pas tranché (sources jugées trop faibles à la collecte du 20 nov. 2026). */
const EXCLUDED_PUBLISHERS = ['Guide des Landes', 'Portal de Prefeitura', 'Riviera Maya News'];
const excluded = p => EXCLUDED_PUBLISHERS.some(x => String(p || '').toLowerCase().includes(x.toLowerCase()));

/* Un fait : pourquoi il est refusé, ou null s’il est valable. */
function factError(f) {
  if (!f || typeof f !== 'object') return 'fait illisible';
  if (!KINDS.includes(f.kind)) return 'genre inconnu : ' + f.kind;
  if (typeof f.title !== 'string' || !f.title.trim()) return 'titre absent';
  if (typeof f.text !== 'string' || !f.text.trim()) return 'texte absent';
  if (f.text.length > MAX_TEXT) return `texte de ${f.text.length} caractères (${MAX_TEXT} au plus)`;
  if (/[→←↔⇒➜➔]|\s[—–]\s/.test(f.title + ' ' + f.text)) return 'flèche ou tiret décoratif';
  const s = f.source;
  if (!s || typeof s !== 'object') return 'source absente';
  if (typeof s.url !== 'string' || !/^https:\/\/[^\s/]+\.[^\s/]+/.test(s.url)) return 'source sans adresse https';
  if (typeof s.publisher !== 'string' || !s.publisher.trim()) return 'source sans éditeur';
  if (typeof s.consulted !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.consulted)) return 'source sans date de consultation';
  if (f.months != null && (!Array.isArray(f.months) || f.months.some(m => !Number.isInteger(m) || m < 1 || m > 12))) return 'mois invalides';
  if (excluded(s.publisher)) return 'éditeur écarté : ' + s.publisher;
  return null;
}

/* Fusionne des fichiers de collecte en une donnée validée. files : [{name, json}]. */
function merge(files) {
  const zones = {}, spots = {}, dropped = [], notes = [];
  let updated = '';
  for (const { name, json } of files) {
    if (!json || typeof json.zones !== 'object') { notes.push(`${name} : pas de zones, ignoré`); continue; }
    if (typeof json.updated === 'string' && json.updated > updated) updated = json.updated;
    for (const [id, z] of Object.entries(json.zones)) {
      if (!z || typeof z.name !== 'string' || !Array.isArray(z.spots) || !Array.isArray(z.facts)) { notes.push(`${name} : zone ${id} illisible, ignorée`); continue; }
      const facts = [];
      for (const f of z.facts) {
        const err = factError(f);
        if (err) { dropped.push({ zone: id, title: f && f.title || '', why: err }); continue; }
        facts.push({ kind: f.kind, title: f.title.trim(), text: f.text.trim(), months: Array.isArray(f.months) ? f.months : [],
          source: { url: f.source.url, publisher: f.source.publisher.trim(), consulted: f.source.consulted } });
      }
      if (!facts.length) { notes.push(`${name} : zone ${id} sans fait valable, ignorée`); continue; }
      /* Le fichier fusionné (culture-zones.json) reprend les zones des moitiés : même zone, même contenu, la dernière lue gagne. */
      zones[id] = { name: z.name.trim(), region: String(z.region || '').trim(), country: String(z.country || '').trim(), spots: z.spots.map(String), facts };
    }
  }
  for (const [id, z] of Object.entries(zones)) for (const s of z.spots) {
    if (spots[s] && spots[s] !== id) notes.push(`spot ${s} : déjà dans ${spots[s]}, gardé là (aussi cité par ${id})`); else spots[s] = id;
  }
  return { version: 1, updated, zones, spots, dropped, notes };
}

/* Forme compacte chargée par la fiche : faits en tableaux [genre, titre, texte, mois, adresse, éditeur, date]. */
function compact(d) {
  const zones = {};
  for (const [id, z] of Object.entries(d.zones)) zones[id] = { n: z.name, r: z.region, c: z.country, f: z.facts.map(f => [f.kind, f.title, f.text, f.months, f.source.url, f.source.publisher, f.source.consulted]) };
  return { v: d.version, updated: d.updated, zones, spots: d.spots };
}

function run() {
  const root = path.join(__dirname, '..');
  const dir = process.argv[2] || process.env.OB_CULTURE_ZONES_DIR || path.join(os.homedir(), 'Projects/Ocean-Buddy-orga-docs/donnees-spots');
  const kept = path.join(root, 'data/culture-zones.json');
  let data;
  let names = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^culture-zones.*\.json$/.test(f)).sort() : [];
  /* Le fichier fusionné, quand il existe, est la source unique : ses moitiés (-a, -b) ne sont pas relues. */
  if (names.includes('culture-zones.json')) names = ['culture-zones.json'];
  if (names.length) {
    const files = [];
    for (const name of names) {
      try { files.push({ name, json: JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')) }); }
      catch (e) { console.log(`${name} : JSON illisible (collecte en cours ?), ignoré`); }
    }
    data = merge(files);
    for (const n of data.notes) console.log('note : ' + n);
    for (const x of data.dropped) console.log(`écarté : ${x.zone} « ${x.title} » (${x.why})`);
    const { dropped, notes, ...clean } = data;
    fs.writeFileSync(kept, JSON.stringify(clean, null, 1) + '\n');
  } else {
    if (!fs.existsSync(kept)) throw new Error('Aucun fichier de collecte dans ' + dir + ' et pas de data/culture-zones.json.');
    data = JSON.parse(fs.readFileSync(kept, 'utf8'));
    console.log('Pas de dossier de collecte : data/culture-zones.json repris tel quel.');
  }
  const body = '/* Généré par scripts/build-culture-zones.cjs depuis data/culture-zones.json. Ne pas modifier à la main. */\nwindow.OCEAN_CULTURE_ZONES=' + JSON.stringify(compact(data)) + ';\n';
  const out = path.join(root, 'assets/data/culture-zones.js');
  fs.writeFileSync(out, body);
  const hash = crypto.createHash('sha256').update(body).digest('hex').slice(0, 12);
  const guide = path.join(root, 'spot-guide.js'), code = fs.readFileSync(guide, 'utf8');
  const next = code.replace(/assets\/data\/culture-zones\.js\?v=[0-9a-f]+/, 'assets/data/culture-zones.js?v=' + hash);
  if (next !== code) fs.writeFileSync(guide, next);
  const facts = Object.values(data.zones).reduce((a, z) => a + z.facts.length, 0);
  console.log(`${Object.keys(data.zones).length} zones, ${Object.keys(data.spots).length} spots, ${facts} faits sourcés → data/culture-zones.json, assets/data/culture-zones.js (${(body.length / 1024).toFixed(1)} Ko)` + (data.dropped ? `, ${data.dropped.length} faits écartés` : ''));
}

module.exports = { KINDS, MAX_TEXT, EXCLUDED_PUBLISHERS, factError, merge, compact };
if (require.main === module) run();
