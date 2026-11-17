/* scripts/publish-app-update.cjs : refus d’un paquet mobile d’ESSAI LOCAL (bundle.json : accountApi « essai-local »,
   construit avec OB_ACCOUNT_API par scripts/build-mobile.cjs). Tout se passe dans des dossiers temporaires : le vrai
   dépôt, mobile/www et app-update/ ne sont jamais touchés, rien n’est publié. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { assertPackageIsPublishable, assertEnvironmentIsPublishable } = require('../scripts/publish-app-update.cjs');

const REAL = path.resolve(__dirname, '..');
const tmp = prefix => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

/* Dépôt factice : le vrai script de publication, un faux build-mobile (même bundle.json que le vrai) et un faux contrôle de démarrage. */
function fakeRepo() {
  const root = tmp('ob-publish-garde-');
  const w = (rel, body) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, body); };
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.copyFileSync(path.join(REAL, 'scripts/publish-app-update.cjs'), path.join(root, 'scripts/publish-app-update.cjs'));
  w('scripts/build-mobile.cjs', `const fs=require('node:fs'),path=require('node:path');
const dest=path.resolve(__dirname,'../mobile/www');
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
fs.writeFileSync(path.join(dest,'index.html'),'<p>essai</p>');
const trial=fs.existsSync(path.join(__dirname,'..','trial-flag'));
fs.writeFileSync(path.join(dest,'bundle.json'),JSON.stringify(trial?{seq:1,accountApi:'essai-local'}:{seq:1})+'\\n');
fs.writeFileSync(path.join(__dirname,'..','build-ran'),'1');
`);
  w('scripts/check-boot.mjs', 'process.exit(0);\n');
  w('mobile/ota-baselines/1.0.0.json', JSON.stringify({ native: '1.0.0', seq: 1, files: {} }) + '\n');
  return root;
}
/* Environnement du processus fils entièrement explicite (le test ne lit jamais l’environnement réel). */
function run(root, args = [], env = {}) {
  return spawnSync(process.execPath, [path.join(root, 'scripts/publish-app-update.cjs'), ...args], { encoding: 'utf8', env, cwd: root });
}
const markTrial = root => fs.writeFileSync(path.join(root, 'trial-flag'), '1');
const exists = (root, rel) => fs.existsSync(path.join(root, rel));

test('paquet d’essai local (bundle.json « essai-local ») : refus en erreur, message en français, rien de publié', () => {
  const root = fakeRepo();
  markTrial(root);
  const r = run(root);
  assert.equal(r.status, 1, 'sortie en erreur');
  assert.match(r.stderr, /Publication refusée/);
  assert.match(r.stderr, /ESSAI LOCAL/);
  assert.match(r.stderr, /essai-local/);
  assert.match(r.stderr, /OB_ACCOUNT_API/, 'le message dit quoi retirer');
  assert.ok(exists(root, 'build-ran'), 'le paquet a bien été construit puis contrôlé');
  assert.ok(!exists(root, 'app-update'), 'app-update/ n’est pas créé : rien n’est publié');
});

test('même refus pour une référence --baseline : aucune référence enregistrée', () => {
  const root = fakeRepo();
  markTrial(root);
  const r = run(root, ['--baseline', '1.0.1']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Publication refusée/);
  assert.ok(!exists(root, 'mobile/ota-baselines/1.0.1.json'));
});

test('OB_ACCOUNT_API défini : refus avant même de construire', () => {
  const root = fakeRepo();
  const r = run(root, [], { OB_ACCOUNT_API: 'http://localhost:8787/api/v1' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Publication refusée/);
  assert.match(r.stderr, /OB_ACCOUNT_API/);
  assert.ok(!exists(root, 'build-ran'), 'rien n’a été construit');
  assert.ok(!exists(root, 'app-update'));
});

test('paquet normal : la publication se déroule comme avant (dossier temporaire)', () => {
  const root = fakeRepo();
  const r = run(root);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /Mise à jour \d+ prête/);
  const latest = JSON.parse(fs.readFileSync(path.join(root, 'app-update/latest.json'), 'utf8'));
  assert.equal(latest.native_min, '1.0.0');
  assert.ok(latest.download_files >= 1);
  assert.doesNotMatch(r.stderr, /refusée/);
});

test('assertPackageIsPublishable : essai-local, bundle absent ou illisible refusés ; paquet normal accepté', () => {
  const dir = tmp('ob-bundle-');
  const put = body => fs.writeFileSync(path.join(dir, 'bundle.json'), body);
  put('{"seq":202611170000}\n');
  assert.doesNotThrow(() => assertPackageIsPublishable(dir));
  put('{"seq":202611170000,"accountApi":"essai-local"}\n');
  assert.throws(() => assertPackageIsPublishable(dir), /Publication refusée.*ESSAI LOCAL/s);
  put('pas du JSON');
  assert.throws(() => assertPackageIsPublishable(dir), /introuvable ou illisible/);
  fs.rmSync(path.join(dir, 'bundle.json'));
  assert.throws(() => assertPackageIsPublishable(dir), /introuvable ou illisible/);
});

test('assertEnvironmentIsPublishable : OB_ACCOUNT_API refusée, absente ou vide acceptée', () => {
  assert.doesNotThrow(() => assertEnvironmentIsPublishable({}));
  assert.doesNotThrow(() => assertEnvironmentIsPublishable({ OB_ACCOUNT_API: '' }));
  assert.throws(() => assertEnvironmentIsPublishable({ OB_ACCOUNT_API: 'http://127.0.0.1:8787/api/v1' }), /Publication refusée/);
});

test('le script réel, une fois importé, ne publie rien (main seulement en ligne de commande)', () => {
  assert.equal(typeof assertPackageIsPublishable, 'function');
  const before = fs.existsSync(path.join(REAL, 'app-update/latest.json')) ? fs.statSync(path.join(REAL, 'app-update/latest.json')).mtimeMs : null;
  delete require.cache[require.resolve('../scripts/publish-app-update.cjs')];
  require('../scripts/publish-app-update.cjs');
  const after = fs.existsSync(path.join(REAL, 'app-update/latest.json')) ? fs.statSync(path.join(REAL, 'app-update/latest.json')).mtimeMs : null;
  assert.equal(after, before);
});
