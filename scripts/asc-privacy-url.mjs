// Remplace l'URL de confidentialité github.io par celle de l'adresse publique (OB_SITE_BASE) dans toutes les langues de la fiche App Store.
// Lecture seule par défaut ; écrit seulement avec --apply.
// node scripts/asc-privacy-url.mjs [--apply]   (adresse : OB_SITE_BASE, voir scripts/site-base.cjs)
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import site from './site-base.cjs';

const KEY_ID = '8T28JHQX3P';
const ISSUER = '7d044674-c0b4-45e2-b48b-f0d57cdb4b29';
const KEY_PATH = `${homedir()}/Documents/OceanBuddy-signing/private_keys/AuthKey_${KEY_ID}.p8`;
const NEW_URL = site.OB_SITE_BASE + 'privacy'; // Cloudflare Pages sert privacy.html sous /privacy;
const APPLY = process.argv.includes('--apply');

const b64 = (b) => Buffer.from(b).toString('base64url');
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }));
  const body = b64(JSON.stringify({ iss: ISSUER, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' }));
  const key = createPrivateKey(readFileSync(KEY_PATH));
  const sig = sign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${b64(sig)}`;
}
const auth = { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' };
async function api(path, init = {}) {
  const res = await fetch(`https://api.appstoreconnect.apple.com/v1${path}`, { ...init, headers: auth });
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} → ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const apps = (await api('/apps?limit=50')).data.filter((a) => /ocean/i.test(a.attributes.name));
for (const app of apps) {
  console.log(`App : ${app.attributes.name} (${app.attributes.bundleId})`);
  for (const info of (await api(`/apps/${app.id}/appInfos`)).data) {
    console.log(`  appInfo ${info.id} : ${info.attributes.appStoreState || info.attributes.state}`);
    const locs = (await api(`/appInfos/${info.id}/appInfoLocalizations?limit=200`)).data;
    let todo = 0;
    for (const loc of locs) {
      const cur = loc.attributes.privacyPolicyUrl || '';
      if (cur === NEW_URL) continue;
      todo++;
      if (APPLY) {
        await api(`/appInfoLocalizations/${loc.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ data: { type: 'appInfoLocalizations', id: loc.id, attributes: { privacyPolicyUrl: NEW_URL } } }),
        });
      }
    }
    console.log(`    ${locs.length} langues, ${todo} à changer${APPLY ? ' : changées' : ' (relancer avec --apply)'}`);
  }
}
