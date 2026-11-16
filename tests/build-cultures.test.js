/* scripts/build-cultures.cjs : fusion stricte des fiches culturelles et fichiers de l’app, sur un petit dépôt d’essai
   (dossier temporaire ; les textes d’essai sont fictifs et ne quittent jamais le test). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build } = require('../scripts/build-cultures.cjs');

const I = (fr, en = 'EN ' + fr, es = 'ES ' + fr) => ({ fr, en, es });
const SRC = { label: 'Source d’essai', url: 'https://example.org/essai' };
function repo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-cultures-'));
  const w = (rel, data) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof data === 'string' ? data : JSON.stringify(data)); };
  w('data/catalog.json', [{ id: 'a1', country: 'Pays A', world: 'as' }, { id: 'a2', country: 'Pays A', world: 'oc' }, { id: 'a3', country: 'Pays A', world: 'as' }, { id: 'b1', country: 'Pays B', world: 'eu' }, { id: 'c1', country: 'Pays C', world: 'af' }]);
  w('data/spot-guides.json', { countries: { 'Pays A': { lang: 'Langue A', hello: ['Salut A', 'glose fr'], food: ['Plat A', 'Texte plat'], respect: 'Geste A' } } });
  w('data/spot-guides.en.json', { countries: { 'Pays A': { lang: 'Language A', hello: ['Salut A', 'gloss en'], food: ['Dish A', 'Dish text'], respect: 'Manners A' } } });
  w('data/spot-guides.es.json', { countries: {} });
  w('locales/translations/en.json', { 'Pays A': 'Country A' });
  w('locales/translations/es.json', { 'Pays A': 'País A' });
  w('cultures-boot.js', "const V='000000000000';\n");
  for (const [name, data] of Object.entries(files)) w('data/cultures-src/' + name, data);
  return root;
}
const entry = () => ({ sea: { title: I('La pirogue d\'essai'), text: I('Texte d\'essai fictif.'), source: { ...SRC } }, thanks: { word: 'Merci A', lang: I('langue a'), source: { ...SRC } }, reviewed: '2026-11-16' });

test('fusion : fichiers valides, référence data/cultures.json et un fichier par langue', () => {
  const root = repo({
    'a.json': { 'Pays A': entry(), manques: ['Pays A › fete : pas de source fiable'] },
    'b.json': { 'Pays B': { fete: { title: I('Fête B'), when: I('mai'), text: I('Texte fête.'), source: { ...SRC } }, base: { hello: { word: 'Hej B', gloss: I('salut') }, source: { label: 'Base B', url: 'https://example.org/b' } }, reviewed: '2026-11-15' } }
  });
  const r = build(root, { log() {} });
  assert.equal(r.stats.countries, 2);
  assert.equal(r.manques.length, 1);
  const ref = JSON.parse(fs.readFileSync(path.join(root, 'data/cultures.json'), 'utf8'));
  assert.deepEqual(Object.keys(ref.countries), ['Pays A', 'Pays B']);
  assert.equal(ref.reviewed, '2026-11-16');
  const fr = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/cultures.fr.json'), 'utf8')).countries;
  assert.deepEqual(Object.keys(fr), ['Pays A', 'Pays B', 'Pays C'], 'tous les pays du catalogue');
  assert.equal(fr['Pays A'].w, 'as', 'continent le plus fréquent');
  assert.deepEqual(fr['Pays A'].hello, ['Salut A', 'glose fr']);
  assert.equal(fr['Pays A'].sea.title, 'La pirogue d’essai', 'apostrophe typographique en français');
  assert.deepEqual(fr['Pays A'].sea.src, ['Source d’essai', 'https://example.org/essai']);
  assert.equal(fr['Pays A'].baseSrc, undefined, 'le carnet existant n’a pas de source à afficher');
  assert.deepEqual(fr['Pays B'].hello, ['Hej B', 'salut']);
  assert.deepEqual(fr['Pays B'].baseSrc, ['Base B', 'https://example.org/b']);
  assert.deepEqual(fr['Pays C'], { name: 'Pays C', w: 'af' });
  const en = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/cultures.en.json'), 'utf8')).countries;
  assert.equal(en['Pays A'].name, 'Country A');
  assert.equal(en['Pays A'].langs, 'Language A');
  assert.deepEqual(en['Pays A'].hello, ['Salut A', 'gloss en']);
  assert.equal(en['Pays A'].sea.title, "EN La pirogue d'essai");
  const es = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/cultures.es.json'), 'utf8')).countries;
  assert.equal(es['Pays A'].name, 'País A');
  assert.equal(es['Pays A'].langs, 'Language A', 'sans carnet espagnol : l’anglais');
  assert.match(fs.readFileSync(path.join(root, 'cultures-boot.js'), 'utf8'), /const V='[0-9a-f]{12}';/);
  assert.notEqual(fs.readFileSync(path.join(root, 'cultures-boot.js'), 'utf8'), "const V='000000000000';\n");
});

test('échec clair : pays inconnu, champ en double, adresse http, JSON illisible', () => {
  const e2 = entry(); e2.sea.source.url = 'http://example.org/essai';
  const root = repo({
    'a.json': { 'Pays A': entry(), 'Pays Z': entry() },
    'b.json': { 'Pays A': { sea: entry().sea, reviewed: '2026-11-16' }, 'Pays B': e2 },
    'c.json': '{ pas du json'
  });
  assert.throws(() => build(root), err => {
    const m = err.message;
    assert.match(m, /pays inconnu du catalogue « Pays Z »/);
    assert.match(m, /b\.json : Pays A › sea déjà fourni par a\.json/);
    assert.match(m, /Pays B › sea\.source\.url : adresse https/);
    assert.match(m, /c\.json : JSON illisible/);
    return true;
  });
  assert.ok(!fs.existsSync(path.join(root, 'data/cultures.json')), 'rien n’est écrit en cas d’erreur');
});

test('--ignorer-invalides : seul le bloc fautif est retiré et signalé ; --verifier n’écrit rien', () => {
  const bad = entry(); bad.sea.source.url = 'http://example.org/essai';
  const root = repo({ 'a.json': { 'Pays A': bad } });
  const check = build(root, { skipInvalid: true, checkOnly: true });
  assert.equal(check.written.length, 0);
  assert.ok(!fs.existsSync(path.join(root, 'data/cultures.json')));
  const r = build(root, { skipInvalid: true });
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /bloc retiré/);
  const fr = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/cultures.fr.json'), 'utf8')).countries;
  assert.equal(fr['Pays A'].sea, undefined);
  assert.equal(fr['Pays A'].thanks.word, 'Merci A');
});

test('données du dépôt : les fiches de data/cultures-src respectent le schéma (hors adresses http signalées)', () => {
  const dir = path.join(__dirname, '..', 'data/cultures-src');
  if (!fs.existsSync(dir)) return;
  const M = require('../cultures-model.js');
  const catalog = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data/catalog.json'), 'utf8')).map(s => s.country));
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const [name, e] of Object.entries(d)) {
      if (name.startsWith('_') || name === 'manques') continue;
      assert.ok(catalog.has(name), `${f} : ${name} absent du catalogue`);
      const errs = M.validateEntry(name, e).filter(x => !/adresse https/.test(x));
      assert.deepEqual(errs, [], `${f} : ${name}`);
    }
  }
});
