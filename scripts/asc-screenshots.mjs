// Remplace les captures App Store de la version 1.4.0 (App Store Connect API, clé « Ocean Buddy CI »).
// Source : mobile/store/screenshots/v4/<locale>/<iphone-69|ipad-13>/NN-nom.png
// Lecture seule par défaut ; n'écrit qu'avec --apply.
//   node scripts/asc-screenshots.mjs           # liste ce qui serait fait (GET uniquement)
//   node scripts/asc-screenshots.mjs --apply   # supprime les anciennes captures, envoie les nouvelles, ordonne
import { createPrivateKey, sign, createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '1.4.0';
const KEY_ID = '8T28JHQX3P';
const ISSUER = '7d044674-c0b4-45e2-b48b-f0d57cdb4b29';
const BUNDLE_ID = 'io.github.thomasbrebion59bot.oceanbuddy';
const KEY_PATH = `${homedir()}/Documents/OceanBuddy-signing/private_keys/AuthKey_${KEY_ID}.p8`;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'mobile/store/screenshots/v4');
const APPLY = process.argv.includes('--apply');
const LOCALES = ['fr-FR', 'en-US', 'es-ES'];
// iPhone 6,9" (1320×2868) et iPad 13" (2064×2752) : types d'affichage de l'API qui acceptent ces tailles.
const DEVICES = [
  { dir: 'iphone-69', type: 'APP_IPHONE_67', size: [1320, 2868] },
  { dir: 'ipad-13', type: 'APP_IPAD_PRO_3GEN_129', size: [2064, 2752] },
];

const b64 = (b) => Buffer.from(b).toString('base64url');
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }));
  const body = b64(JSON.stringify({ iss: ISSUER, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' }));
  const key = createPrivateKey(readFileSync(KEY_PATH));
  const sig = sign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${b64(sig)}`;
}
const headers = { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' };
async function call(method, path, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}
const get = (p) => call('GET', p);

function pngSize(buf) { return [buf.readUInt32BE(16), buf.readUInt32BE(20)]; }
function localFiles(locale, dev) {
  const dir = join(SHOTS, locale, dev.dir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /^\d\d-.*\.png$/.test(f)).sort().map((f) => {
    const path = join(dir, f), buf = readFileSync(path), [w, h] = pngSize(buf);
    if (w !== dev.size[0] || h !== dev.size[1]) throw new Error(`${path} : ${w}×${h}, attendu ${dev.size.join('×')}`);
    return { name: f, path, buf, md5: createHash('md5').update(buf).digest('hex') };
  });
}

async function upload(set, file) {
  console.log(`    + ${file.name}`);
  const created = (await call('POST', '/v1/appScreenshots', { data: { type: 'appScreenshots',
    attributes: { fileName: file.name, fileSize: file.buf.length },
    relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } } } })).data;
  for (const op of created.attributes.uploadOperations) {
    const chunk = file.buf.subarray(op.offset, op.offset + op.length);
    const h = Object.fromEntries(op.requestHeaders.map((x) => [x.name, x.value]));
    const res = await fetch(op.url, { method: op.method, headers: h, body: chunk });
    if (!res.ok) throw new Error(`upload ${file.name} (${op.offset}) → ${res.status} ${await res.text()}`);
  }
  await call('PATCH', `/v1/appScreenshots/${created.id}`, { data: { type: 'appScreenshots', id: created.id,
    attributes: { uploaded: true, sourceFileChecksum: file.md5 } } });
  return created.id;
}

// --- App et version ---
const app = (await get('/v1/apps?limit=200')).data.find((a) => a.attributes.bundleId === BUNDLE_ID);
if (!app) throw new Error(`App ${BUNDLE_ID} introuvable`);
const versions = (await get(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=50`)).data;
const version = versions.find((v) => v.attributes.versionString === VERSION);
if (!version) throw new Error(`Version ${VERSION} introuvable`);
console.log(`App ${app.attributes.name} · version ${VERSION} : ${version.attributes.appStoreState}`);
if (version.attributes.appStoreState !== 'PREPARE_FOR_SUBMISSION') throw new Error('La version doit être PREPARE_FOR_SUBMISSION');

const locs = (await get(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=200`)).data;
for (const locale of LOCALES) {
  const loc = locs.find((l) => l.attributes.locale === locale);
  if (!loc) { console.log(`${locale} : localisation absente (lancer asc-release.mjs --apply)`); continue; }
  console.log(`\n${locale}`);
  const sets = (await get(`/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets?limit=50`)).data;
  for (const dev of DEVICES) {
    const files = localFiles(locale, dev);
    let set = sets.find((s) => s.attributes.screenshotDisplayType === dev.type);
    const old = set ? (await get(`/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`)).data : [];
    console.log(`  ${dev.type} (${dev.dir}) : ${old.length} existante(s), ${files.length} nouvelle(s)`);
    if (!files.length) { console.log('    aucune image locale : ignoré'); continue; }
    for (const o of old) {
      if (!APPLY) console.log(`    [simulation] − ${o.attributes.fileName}`);
      else { console.log(`    − ${o.attributes.fileName}`); await call('DELETE', `/v1/appScreenshots/${o.id}`); }
    }
    if (!APPLY) { for (const f of files) console.log(`    [simulation] + ${f.name} (${f.buf.length} o, md5 ${f.md5.slice(0, 8)})`); console.log('    [simulation] ordonner le jeu'); continue; }
    if (!set) set = (await call('POST', '/v1/appScreenshotSets', { data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: dev.type },
      relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: loc.id } } } } })).data;
    const ids = [];
    for (const f of files) ids.push(await upload(set, f));
    await call('PATCH', `/v1/appScreenshotSets/${set.id}/relationships/appScreenshots`, { data: ids.map((id) => ({ type: 'appScreenshots', id })) });
    console.log('    ordre appliqué');
  }
}
console.log(APPLY ? '\nTerminé.' : '\nLecture seule : rien n\'a été modifié (--apply pour écrire).');
