/* scripts/version-assets.py et scripts/build-cultures.cjs doivent calculer la MÊME empreinte `const V='…';` de
   cultures-boot.js (fichiers chargés à la demande : cultures-model.js, cultures.js, données par langue).
   Essai sur un dépôt temporaire : le dépôt réel n’est jamais modifié. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { build } = require('../scripts/build-cultures.cjs');

const REAL = path.resolve(__dirname, '..');
const py = spawnSync('python3', ['--version'], { encoding: 'utf8' });
const HAS_PY = !py.error && py.status === 0;

const I = (fr, en = 'EN ' + fr, es = 'ES ' + fr) => ({ fr, en, es });
const SRC = { label: 'Source d’essai', url: 'https://example.org/essai' };
function repo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-version-assets-'));
  const w = (rel, data) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof data === 'string' ? data : JSON.stringify(data)); };
  w('data/catalog.json', [{ id: 'a1', country: 'Pays A', world: 'as' }, { id: 'b1', country: 'Pays B', world: 'eu' }]);
  w('data/spot-guides.json', { countries: { 'Pays A': { lang: 'Langue A', hello: ['Salut A', 'glose fr'], food: ['Plat A', 'Texte plat'], respect: 'Geste A' } } });
  w('locales/translations/en.json', { 'Pays A': 'Country A' });
  w('locales/translations/es.json', { 'Pays A': 'País A' });
  w('data/cultures-src/a.json', { 'Pays A': { thanks: { word: 'Merci A', lang: I('langue a'), source: { ...SRC } }, reviewed: '2026-11-16' } });
  /* Fichiers chargés à la demande (contenu d’essai, accents compris : le hachage porte sur les octets UTF-8). */
  w('cultures-model.js', "/* modèle d’essai : é à ü */\nmodule.exports={};\n");
  w('cultures.js', "/* cultures d’essai : œ ñ */\nwindow.OceanCulturesApp=1;\n");
  w('cultures-boot.js', "(()=>{\n  const V='000000000000';\n  window.OceanCultures={};\n})();\n");
  w('index.html', '<!doctype html><script src="cultures-boot.js"></script><script src="cultures.js"></script>\n');
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.copyFileSync(path.join(REAL, 'scripts/version-assets.py'), path.join(root, 'scripts/version-assets.py'));
  return root;
}
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const V = root => (read(root, 'cultures-boot.js').match(/const V='([^']*)';/) || [])[1];
function runPy(root) {
  const r = spawnSync('python3', ['-I', path.join(root, 'scripts/version-assets.py')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}
const resetV = root => fs.writeFileSync(path.join(root, 'cultures-boot.js'), read(root, 'cultures-boot.js').replace(/const V='[^']*';/, "const V='000000000000';"));

test('version-assets.py donne la même empreinte que build-cultures.cjs', { skip: !HAS_PY && 'python3 absent' }, () => {
  const root = repo();
  const r = build(root, { log() {} });
  assert.match(r.V, /^[0-9a-f]{12}$/);
  assert.equal(V(root), r.V, 'build-cultures a écrit son empreinte');
  resetV(root);
  assert.equal(V(root), '000000000000');
  const out = runPy(root);
  assert.equal(V(root), r.V, 'version-assets.py retrouve exactement la valeur de build-cultures');
  assert.match(out, /cultures/i, 'le script signale la mise à jour');
  /* Deuxième passage : rien à changer. */
  const again = runPy(root);
  assert.doesNotMatch(again, /Version des fichiers des cultures/);
  assert.equal(V(root), r.V);
  /* L’adresse du fichier d’amorce dans la page porte, elle, l’empreinte du fichier d’amorce mis à jour. */
  assert.match(read(root, 'index.html'), /cultures-boot\.js\?v=[0-9a-f]{12}"/);
});

test('modifier cultures.js (ou cultures-model.js, ou les données) change V, identiquement dans les deux scripts', { skip: !HAS_PY && 'python3 absent' }, () => {
  const root = repo();
  const base = build(root, { log() {} }).V;
  const seen = new Set([base]);
  const edits = {
    'cultures.js': () => fs.appendFileSync(path.join(root, 'cultures.js'), '/* modifié */\n'),
    'cultures-model.js': () => fs.appendFileSync(path.join(root, 'cultures-model.js'), '/* modifié */\n'),
    'assets/data/cultures.en.json': () => fs.appendFileSync(path.join(root, 'assets/data/cultures.en.json'), ' ')
  };
  for (const [name, edit] of Object.entries(edits)) {
    edit();
    /* Sans relancer build-cultures : seul version-assets.py recalcule. */
    const before = V(root);
    runPy(root);
    const viaPython = V(root);
    assert.notEqual(viaPython, before, name + ' : V doit changer');
    assert.match(viaPython, /^[0-9a-f]{12}$/);
    assert.ok(!seen.has(viaPython), name + ' : nouvelle valeur, jamais vue');
    seen.add(viaPython);
    if (name.endsWith('.json')) {
      /* build-cultures régénère les données (la retouche à la main disparaît) : une fois l’état cohérent, les deux scripts s’accordent. */
      const viaBuild = build(root, { log() {} }).V;
      resetV(root);
      runPy(root);
      assert.equal(V(root), viaBuild, name + ' : même empreinte que build-cultures.cjs');
      seen.add(viaBuild);
    } else {
      /* Même fichiers, même ordre, même hachage : build-cultures.cjs retrouve exactement la valeur posée par Python. */
      assert.equal(build(root, { log() {} }).V, viaPython, name + ' : même empreinte que build-cultures.cjs');
      assert.equal(V(root), viaPython);
    }
  }
});

test('build-cultures.cjs et version-assets.py : même liste de fichiers dans le code (garde-fou de dérive)', () => {
  const js = fs.readFileSync(path.join(REAL, 'scripts/build-cultures.cjs'), 'utf8');
  const pyCode = fs.readFileSync(path.join(REAL, 'scripts/version-assets.py'), 'utf8');
  assert.match(js, /\['cultures-model\.js','cultures\.js'\]/);
  assert.match(pyCode, /\('cultures-model\.js', 'cultures\.js'\)/);
  assert.match(js, /const LANGS=\['fr','en','es'\]/);
  assert.match(pyCode, /\('fr', 'en', 'es'\)/);
});
