// Prépare la version App Store 1.4.0 d'Ocean Buddy (App Store Connect API, clé « Ocean Buddy CI »).
// Lecture seule par défaut ; n'écrit qu'avec --apply.
//   node scripts/asc-release.mjs                         # état + ce qui serait fait (GET uniquement)
//   node scripts/asc-release.mjs --apply                 # crée la version, localisations fr/en/es, confidentialité
//   node scripts/asc-release.mjs --apply --attach-build  # attache le build traité par Apple
//   node scripts/asc-release.mjs --apply --submit        # soumet à la revue (avec --attach-build si pas encore fait)
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from './site-base.cjs';

const VERSION = '1.4.0';
const BUILD = '202610201';
const KEY_ID = '8T28JHQX3P';
const ISSUER = '7d044674-c0b4-45e2-b48b-f0d57cdb4b29';
const BUNDLE_ID = 'io.github.thomasbrebion59bot.oceanbuddy';
const KEY_PATH = `${homedir()}/Documents/OceanBuddy-signing/private_keys/AuthKey_${KEY_ID}.p8`;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = site.OB_SITE_BASE; // https://oceanbuddy.app/
const PRIVACY = SITE + 'privacy';
const APPLY = process.argv.includes('--apply');
const ATTACH = process.argv.includes('--attach-build');
const SUBMIT = process.argv.includes('--submit');
if ((ATTACH || SUBMIT) && !APPLY) console.log('(--attach-build / --submit demandent --apply : simulation seulement)');

// --- Textes de la fiche ---
const fr = readFileSync(join(ROOT, 'mobile/store/app-store-fr.md'), 'utf8');
const frDesc = fr.split('## Description\n')[1].split('\n## ')[0].trim();
const frKeywords = (fr.match(/^- Mots-clés : (.+)$/m) || [])[1].trim();
const loc = (n) => JSON.parse(readFileSync(join(ROOT, `mobile/store/localizations/${n}.json`), 'utf8'));
const TEXT = {
  fr: { description: frDesc, keywords: frKeywords,
    whatsNew: 'Nouveau look : nouveau logo et thème crème. Verre iOS 26 pour la barre d’onglets et Poulpy, animations plus fluides, Poulpy qui répond hors ligne, application en français, anglais et espagnol. Plus d’infos sur oceanbuddy.app.' },
  en: { ...pick(loc('en')),
    whatsNew: 'New look: a new logo and a cream theme. iOS 26 glass look for the tab bar and Poulpy, smoother animations, Poulpy answering offline, and the app in French, English and Spanish. More at oceanbuddy.app.' },
  es: { ...pick(loc('es')),
    whatsNew: 'Nuevo aspecto: nuevo logo y tema crema. Efecto cristal de iOS 26 en la barra de pestañas y Poulpy, animaciones más fluidas, Poulpy responde sin conexión y la app en francés, inglés y español. Más en oceanbuddy.app.' },
};
function pick(l) { return { description: l.description, keywords: l.keywords, promotionalText: l.promotionalText }; }
const DEFAULT_LOCALE = { fr: 'fr-FR', en: 'en-US', es: 'es-ES' };
const lang = (l) => l.split('-')[0];
const wanted = (l) => ['fr', 'en', 'es'].includes(lang(l));

// --- API ---
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
// Écriture : seulement avec --apply, sinon on affiche ce qui serait fait.
async function write(method, path, body, label) {
  if (!APPLY) { console.log(`    [simulation] ${label}`); return null; }
  console.log(`    ${label}`);
  return call(method, path, body);
}
const patch = (type, id, attributes, label) =>
  write('PATCH', `/v1/${type}/${id}`, { data: { type, id, attributes } }, label);

// --- App ---
const apps = (await get('/v1/apps?limit=200')).data.filter((a) => a.attributes.bundleId === BUNDLE_ID);
if (apps.length !== 1) throw new Error(`App ${BUNDLE_ID} introuvable (${apps.length})`);
const app = apps[0];
console.log(`App : ${app.attributes.name} (${app.id}), langue principale ${app.attributes.primaryLocale}`);

// a) Version 1.4.0
const versions = (await get(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=50`)).data;
for (const v of versions) console.log(`  version ${v.attributes.versionString} : ${v.attributes.appStoreState}`);
let version = versions.find((v) => v.attributes.versionString === VERSION);
if (!version) {
  console.log(`  a) la version ${VERSION} n'existe pas`);
  const r = await write('POST', '/v1/appStoreVersions', {
    data: { type: 'appStoreVersions', attributes: { platform: 'IOS', versionString: VERSION, releaseType: 'AFTER_APPROVAL' },
      relationships: { app: { data: { type: 'apps', id: app.id } } } } }, `création de la version ${VERSION}`);
  version = r?.data;
} else console.log(`  a) la version ${VERSION} existe déjà (${version.attributes.appStoreState})`);

// b) Localisations de la version
if (version) {
  const locs = (await get(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=200`)).data;
  console.log(`  b) localisations de version : ${locs.map((l) => l.attributes.locale).join(', ') || '(aucune)'}`);
  const kept = {};
  for (const l of locs) {
    const lg = lang(l.attributes.locale);
    if (wanted(l.attributes.locale) && !kept[lg]) kept[lg] = l;
    else await write('DELETE', `/v1/appStoreVersionLocalizations/${l.id}`, null, `suppression ${l.attributes.locale}`);
  }
  for (const lg of ['fr', 'en', 'es']) {
    const t = TEXT[lg];
    const attrs = { description: t.description, keywords: t.keywords, whatsNew: t.whatsNew, supportUrl: SITE + 'support.html', marketingUrl: SITE };
    if (t.promotionalText) attrs.promotionalText = t.promotionalText;
    if (kept[lg]) await patch('appStoreVersionLocalizations', kept[lg].id, attrs, `mise à jour ${kept[lg].attributes.locale}`);
    else await write('POST', '/v1/appStoreVersionLocalizations', {
      data: { type: 'appStoreVersionLocalizations', attributes: { locale: DEFAULT_LOCALE[lg], ...attrs },
        relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } } } }, `création ${DEFAULT_LOCALE[lg]}`);
  }
} else console.log('  b) (version absente : localisations simulées après création)');

// c) appInfo éditable : langues fr/en/es + URL de confidentialité
const infos = (await get(`/v1/apps/${app.id}/appInfos`)).data;
for (const info of infos) {
  const st = info.attributes.appStoreState || info.attributes.state;
  console.log(`  c) appInfo ${info.id} : ${st}`);
  if (st === 'READY_FOR_SALE') { console.log('    (publié : ignoré)'); continue; }
  const locs = (await get(`/v1/appInfos/${info.id}/appInfoLocalizations?limit=200`)).data;
  console.log(`    langues : ${locs.map((l) => l.attributes.locale).join(', ')}`);
  for (const l of locs) {
    if (!wanted(l.attributes.locale)) await write('DELETE', `/v1/appInfoLocalizations/${l.id}`, null, `suppression ${l.attributes.locale}`);
    else if (l.attributes.privacyPolicyUrl !== PRIVACY) await patch('appInfoLocalizations', l.id, { privacyPolicyUrl: PRIVACY }, `privacyPolicyUrl ${l.attributes.locale} → ${PRIVACY}`);
    else console.log(`    ${l.attributes.locale} : confidentialité déjà ${PRIVACY}`);
  }
  for (const lg of ['fr', 'en', 'es']) if (!locs.some((l) => lang(l.attributes.locale) === lg))
    console.log(`    attention : pas de langue ${lg} sur cet appInfo (à ajouter dans App Store Connect)`);
}

// d) Build
let build = null;
{
  const q = `/v1/builds?filter[app]=${app.id}&filter[version]=${BUILD}&filter[preReleaseVersion.version]=${VERSION}&limit=5`;
  build = (await get(q)).data[0] || null;
  console.log(build ? `  d) build ${BUILD} : ${build.attributes.processingState}${build.attributes.expired ? ' (expiré)' : ''}`
    : `  d) build ${BUILD} pas encore visible chez Apple (envoyer l'IPA avec altool, attendre le traitement)`);
}
if (ATTACH || SUBMIT) {
  if (!version || !build) console.log('    impossible : version ou build absent');
  else if (build.attributes.processingState !== 'VALID') console.log('    build pas encore traité (VALID attendu) : réessayer plus tard');
  else await write('PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`,
    { data: { type: 'builds', id: build.id } }, `attache le build ${BUILD} à la version ${VERSION}`);
}

// e) Soumission à la revue
if (SUBMIT) {
  if (!version || !build || build.attributes.processingState !== 'VALID') console.log('  e) soumission impossible (build non prêt)');
  else {
    const sub = await write('POST', '/v1/reviewSubmissions', { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' },
      relationships: { app: { data: { type: 'apps', id: app.id } } } } }, 'création de la soumission');
    if (sub) {
      await call('POST', '/v1/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems',
        relationships: { reviewSubmission: { data: { type: 'reviewSubmissions', id: sub.data.id } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } } } });
      await call('PATCH', `/v1/reviewSubmissions/${sub.data.id}`, { data: { type: 'reviewSubmissions', id: sub.data.id, attributes: { submitted: true } } });
      console.log('    soumis à la revue');
    }
  }
}
console.log(APPLY ? 'Terminé.' : 'Lecture seule : rien n\'a été modifié (--apply pour écrire).');
