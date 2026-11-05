/* Worker ob-api (comptes) : connexion, cloisonnement des comptes (IDOR), fusion, limites, suppression, journaux. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createWorker } from '../server/ob-api/src/index.js';
import { signEs256 } from '../server/ob-api/src/jwt.js';
import { devEnv, device, fakeD1, fakeGuards, serverDir, ORIGIN } from './ob-api-helpers.mjs';

const fav = (id, u, extra = {}) => ({ kind: 'fav', id, data: {}, u, deleted: false, ...extra });
const clock = () => { const c = { t: Date.UTC(2026, 10, 5, 9) }; c.now = () => c.t; return c; };

test('essai local : santé, connexion par le faux fournisseur, cookies HttpOnly, profil', async () => {
  const w = createWorker(), env = devEnv(), d = device(w, env);
  assert.deepEqual((await d.call('GET', '/api/v1/health')).data, { ok: true, mode: 'essai-local' });
  assert.equal((await d.login('lea@example.com', '000000')).status, 401);
  const r = await d.login('lea@example.com');
  assert.equal(r.status, 200);
  assert.deepEqual(r.data, { ok: true }, 'aucun jeton dans le corps sur le web');
  const cookies = r.res.headers.getSetCookie();
  assert.ok(cookies.every((c) => /HttpOnly/.test(c) && /SameSite=Lax/.test(c)));
  assert.ok(cookies.some((c) => /^ob_rt=.*Path=\/api\/v1\/auth/.test(c)));
  const me = await d.call('GET', '/api/v1/me');
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, 'lea@example.com');
  assert.equal(me.data.consent, null);
  assert.equal(me.data.mode, 'essai-local');
  assert.equal((await d.call('POST', '/api/v1/sync/pull', { since: 0 })).data.error, 'consent_required');
});

test('le faux fournisseur est impossible à activer hors essai local (échec fermé)', async () => {
  const w = createWorker();
  const cases = [
    [{ OB_ENV: 'production' }, 'http://localhost:8787'],
    [{}, 'https://oceanbuddy.app'],
    [{ SUPABASE_URL: 'https://example.supabase.co' }, 'http://localhost:8787'],
    [{ OB_DEV_FAKE_IDP: 'true' }, 'http://localhost:8787'],
  ];
  for (const [extra, base] of cases) {
    const env = devEnv(extra), d = device(w, env, { base });
    const r = await d.call('POST', '/api/v1/auth/otp/verify', { email: 'a@example.com', code: '123456' });
    assert.equal(r.status, 500, JSON.stringify(extra) + base);
    assert.equal(r.data.error, 'misconfigured');
  }
  // La configuration publiée (wrangler.toml) est celle de production ; .dev.vars n'est jamais suivi par git.
  const toml = readFileSync(join(serverDir, 'wrangler.toml'), 'utf8');
  const top = toml.split(/^\[(?!vars\])/m)[0] + (toml.match(/^\[vars\][\s\S]*?(?=^\[)/m)?.[0] ?? '');
  assert.match(top, /OB_ENV\s*=\s*"production"/);
  assert.doesNotMatch(toml, /^\s*OB_DEV_FAKE_IDP\s*=/m);
  assert.ok(existsSync(join(serverDir, '.dev.vars.example')));
  const tracked = execFileSync('git', ['ls-files', 'server/ob-api'], { cwd: join(serverDir, '..', '..') }).toString();
  assert.doesNotMatch(tracked, /\.dev\.vars(\n|$)/);
});

test('production mal configurée : toutes les routes refusent (500 misconfigured)', async () => {
  const w = createWorker();
  const base = { DB: fakeD1(), GUARD: fakeGuards(), OB_ENV: 'production', ALLOWED_ORIGINS: 'https://oceanbuddy.app', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x', SUPABASE_SECRET_KEY: 's', HASH_KEY: 'k'.repeat(40) };
  for (const drop of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'HASH_KEY', 'ALLOWED_ORIGINS', 'DB', 'GUARD']) {
    const env = { ...base }; delete env[drop];
    const r = await w.fetch(new Request('https://oceanbuddy.app/api/v1/health'), env);
    assert.equal(r.status, 500, drop);
  }
  const http = await w.fetch(new Request('https://oceanbuddy.app/api/v1/health'), { ...base, ALLOWED_ORIGINS: 'http://oceanbuddy.app' });
  assert.equal(http.status, 500);
  assert.equal((await w.fetch(new Request('https://oceanbuddy.app/api/v1/health'), base)).status, 200);
});

test('IDOR : un compte ne voit, ne modifie ni n’exporte jamais les éléments d’un autre', async () => {
  const w = createWorker(), env = devEnv();
  const a = await device(w, env).ready('a@example.com');
  const b = await device(w, env, { ip: '198.51.100.2' }).ready('b@example.com');
  assert.equal((await a.call('POST', '/api/v1/sync/push', { items: [{ kind: 'note', id: 'nazare', data: { text: 'secret de A' }, u: 10, deleted: false }] })).status, 200);
  const pb = await b.call('POST', '/api/v1/sync/pull', { since: 0 });
  assert.deepEqual(pb.data.items, []);
  // B écrit le même genre/identifiant : c'est SON élément, celui de A est intact.
  await b.call('POST', '/api/v1/sync/push', { items: [{ kind: 'note', id: 'nazare', data: { text: 'B' }, u: 99, deleted: false }] });
  assert.equal((await a.call('POST', '/api/v1/sync/pull', { since: 0 })).data.items[0].data.text, 'secret de A');
  const exp = await b.call('GET', '/api/v1/account/export');
  assert.ok(!JSON.stringify(exp.data).includes('secret de A'));
  // Un identifiant de compte glissé dans la requête est ignoré : seul le jeton compte.
  const sneaky = await b.call('POST', '/api/v1/sync/pull', { since: 0, user_id: 'x', sub: 'y' });
  assert.equal(sneaky.data.items.length, 1);
  // Sans connexion, rien.
  const anon = device(w, env, { ip: '198.51.100.3' });
  assert.equal((await anon.call('POST', '/api/v1/sync/pull', { since: 0 })).status, 401);
  assert.equal((await anon.call('GET', '/api/v1/account/export')).status, 401);
  // Jeton modifié (autre compte dans la charge utile) : signature refusée.
  const [h, p, s] = decodeURIComponent(a.jar.ob_at).split('.');
  const claims = JSON.parse(Buffer.from(p, 'base64url'));
  claims.sub = '00000000-0000-4000-8000-000000000000';
  const forged = [h, Buffer.from(JSON.stringify(claims)).toString('base64url'), s].join('.');
  assert.equal((await anon.call('POST', '/api/v1/sync/pull', { since: 0 }, { authorization: 'Bearer ' + forged, origin: null })).status, 401);
});

test('fusion côté serveur : le plus récent gagne, horloge bornée, progressions monotones, suppression propagée', async () => {
  const c = clock(), w = createWorker({ now: c.now }), env = devEnv();
  const d = await device(w, env).ready('lea@example.com');
  const push = (items) => d.call('POST', '/api/v1/sync/push', { items });
  const t0 = c.t;
  let r = await push([{ kind: 'trip', id: 't1', data: { id: 't1', name: 'v2', steps: [], checklist: [] }, u: t0, deleted: false }]);
  assert.deepEqual(r.data.results.map((x) => x.status), ['ok']);
  r = await push([{ kind: 'trip', id: 't1', data: { id: 't1', name: 'vieux', steps: [], checklist: [] }, u: t0 - 1000, deleted: false }]);
  assert.equal(r.data.results[0].status, 'stale');
  r = await push([{ kind: 'trip', id: 't1', data: { id: 't1', name: 'égalité', steps: [], checklist: [] }, u: t0, deleted: false }]);
  assert.equal(r.data.results[0].status, 'stale', 'à égalité le serveur gagne');
  r = await push([fav('f1', t0 + 365 * 86400000)]);
  assert.equal(r.data.results[0].u, t0 + 5 * 60000, 'date future bornée à +5 min');
  await push([{ kind: 'progress', id: 'xp', data: { xp: 500 }, u: t0, deleted: false }]);
  r = await push([{ kind: 'progress', id: 'xp', data: { xp: 300 }, u: t0 + 10, deleted: false }]);
  await push([{ kind: 'progress', id: 'main', data: { badges: ['a'], days: ['2026-11-01'] }, u: t0, deleted: false }]);
  await push([{ kind: 'progress', id: 'main', data: { badges: ['b'], days: ['2026-11-02'] }, u: t0 + 1, deleted: false }]);
  c.t += 2 * 60000;
  r = await push([{ kind: 'fav', id: 'f1', data: {}, u: t0 + 6 * 60000, deleted: true }]);
  const items = Object.fromEntries((await d.call('POST', '/api/v1/sync/pull', { since: 0 })).data.items.map((i) => [i.kind + ':' + i.id, i]));
  assert.equal(items['trip:t1'].data.name, 'v2');
  assert.equal(items['progress:xp'].data.xp, 500, 'l’XP ne recule jamais');
  assert.deepEqual(items['progress:main'].data.badges.sort(), ['a', 'b']);
  assert.equal(items['fav:f1'].deleted, true);
  assert.equal((await push([{ kind: 'progress', id: 'xp', data: {}, u: 1, deleted: true }])).data.error, 'invalid_item_kind');
});

test('tirage par pages sans couper un envoi en deux', async () => {
  const w = createWorker(), env = devEnv();
  const d = await device(w, env).ready('lea@example.com');
  for (let b = 0; b < 6; b++) {
    const r = await d.call('POST', '/api/v1/sync/push', { items: Array.from({ length: 100 }, (_, i) => fav(`s${b}-${i}`, 1000 + b)) });
    assert.equal(r.status, 200);
  }
  const p1 = (await d.call('POST', '/api/v1/sync/pull', { since: 0 })).data;
  assert.equal(p1.items.length, 500); assert.equal(p1.more, true);
  const since = Math.max(...p1.items.map((i) => i.rev));
  const p2 = (await d.call('POST', '/api/v1/sync/pull', { since })).data;
  assert.equal(p2.items.length, 100); assert.equal(p2.more, false);
  assert.equal(new Set([...p1.items, ...p2.items].map((i) => i.id)).size, 600);
});

test('bornes des envois : forme, taille, doublons, quota du compte', async () => {
  const w = createWorker(), env = devEnv();
  const d = await device(w, env).ready('lea@example.com');
  const push = (body) => d.call('POST', '/api/v1/sync/push', body);
  assert.equal((await push({ items: [{ kind: 'admin', id: 'x', data: {}, u: 1, deleted: false }] })).status, 400);
  assert.equal((await push({ items: [fav('a', 1), fav('a', 2)] })).data.error, 'duplicate_item');
  assert.equal((await push({ items: Array.from({ length: 101 }, (_, i) => fav('x' + i, 1)) })).data.error, 'invalid_items');
  assert.equal((await push('{"items":[' + '"x",'.repeat(70000) + '"x"]}')).status, 413);
  assert.equal((await push('pas du json')).status, 400);
  for (let b = 0; b < 20; b++) assert.equal((await push({ items: Array.from({ length: 100 }, (_, i) => fav(`q${b}-${i}`, 5)) })).status, 200);
  const full = await push({ items: [fav('un-de-trop', 5)] });
  assert.equal(full.status, 413); assert.equal(full.data.error, 'account_full');
});

test('limites de débit : demandes de code, tentatives, disjoncteur d’e-mails', async () => {
  const sent = [];
  const base = (await import('../server/ob-api/src/identity.js')).devIdentity();
  const devIdp = { ...base, async requestOtp(email) { sent.push(email); } };
  const w = createWorker({ devIdp });
  let env = devEnv();
  const d = device(w, env);
  for (let i = 0; i < 5; i++) assert.equal((await d.call('POST', '/api/v1/auth/otp/request', { email: 'lea@example.com' })).status, 202);
  assert.equal(sent.length, 3, 'au plus 3 codes par adresse en 15 min, réponse neutre ensuite');
  for (let i = 0; i < 5; i++) await d.call('POST', '/api/v1/auth/otp/request', { email: `x${i}@example.com` });
  const blocked = await d.call('POST', '/api/v1/auth/otp/request', { email: 'z@example.com' });
  assert.equal(blocked.status, 429); assert.ok(Number(blocked.res.headers.get('retry-after')) > 0);
  // Tentatives de code : 5 par adresse en 15 min, même avec le bon code ensuite.
  const v = device(w, env, { ip: '198.51.100.9' });
  for (let i = 0; i < 5; i++) assert.equal((await v.call('POST', '/api/v1/auth/otp/verify', { email: 'cible@example.com', code: '000000' })).status, 401);
  assert.equal((await v.call('POST', '/api/v1/auth/otp/verify', { email: 'cible@example.com', code: '123456' })).status, 429);
  // Disjoncteur global du jour.
  env = devEnv({ EMAIL_DAILY_BUDGET: '2' });
  const ips = ['192.0.2.1', '192.0.2.2', '192.0.2.3'];
  const res = [];
  for (const [i, ip] of ips.entries()) res.push((await device(w, env, { ip }).call('POST', '/api/v1/auth/otp/request', { email: `b${i}@example.com` })).status);
  assert.deepEqual(res, [202, 202, 503]);
  // Toutes les routes : 300 requêtes / 5 min par IP.
  const flood = device(w, devEnv(), { ip: '192.0.2.50' });
  let last;
  for (let i = 0; i < 301; i++) last = await flood.call('GET', '/api/v1/health');
  assert.equal(last.status, 429);
});

test('origines et CSRF : cookie sans en-tête X-OB-CSRF refusé, origine étrangère refusée, app native acceptée', async () => {
  const w = createWorker(), env = devEnv();
  const d = await device(w, env).ready('lea@example.com');
  assert.equal((await d.call('POST', '/api/v1/sync/pull', { since: 0 }, { 'x-ob-csrf': null })).data.error, 'csrf');
  assert.equal((await d.call('POST', '/api/v1/sync/pull', { since: 0 }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await d.call('GET', '/api/v1/me', undefined, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await d.call('POST', '/api/v1/sync/pull', { since: 0 }, { origin: null })).data.error, 'csrf', 'cookie sans Origin : refusé');
  const pre = await w.fetch(new Request('http://localhost:8787/api/v1/sync/push', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }), env);
  assert.equal(pre.status, 403);
  const ok = await w.fetch(new Request('http://localhost:8787/api/v1/sync/push', { method: 'OPTIONS', headers: { origin: ORIGIN } }), env);
  assert.equal(ok.status, 204); assert.equal(ok.headers.get('access-control-allow-origin'), ORIGIN);
  // App native : pas d'Origin, jetons dans le corps, puis Authorization: Bearer.
  const n = device(w, env, { origin: null, ip: '198.51.100.20' });
  const login = await n.call('POST', '/api/v1/auth/otp/verify', { email: 'lea@example.com', code: '123456', client: 'native' });
  assert.equal(typeof login.data.access_token, 'string'); assert.deepEqual(n.jar, {});
  const me = await n.call('GET', '/api/v1/me', undefined, { authorization: 'Bearer ' + login.data.access_token });
  assert.equal(me.status, 200);
  // Une page web ne peut pas obtenir les jetons en clair en se faisant passer pour l'app.
  const web = device(w, env, { ip: '198.51.100.21' });
  const asNative = await web.call('POST', '/api/v1/auth/otp/verify', { email: 'lea@example.com', code: '123456', client: 'native' });
  assert.equal(asNative.data.access_token, undefined);
  // Réponses jamais mises en cache.
  assert.equal(me.res.headers.get('cache-control'), 'no-store');
});

test('rafraîchissement, déconnexion, désactivation de la sauvegarde', async () => {
  const c = clock(), w = createWorker({ now: c.now }), env = devEnv();
  const d = await device(w, env).ready('lea@example.com');
  await d.call('POST', '/api/v1/sync/push', { items: [fav('a', 1)] });
  c.t += 2 * 3600_000;
  assert.equal((await d.call('GET', '/api/v1/me')).data.error, 'token_expired');
  assert.equal((await d.call('POST', '/api/v1/auth/refresh', {})).status, 200);
  assert.equal((await d.call('GET', '/api/v1/me')).status, 200);
  assert.equal((await d.call('DELETE', '/api/v1/consent')).status, 200);
  const me = (await d.call('GET', '/api/v1/me')).data;
  assert.equal(me.consent, null); assert.equal(me.sync.items, 0);
  assert.equal((await d.call('POST', '/api/v1/auth/logout', {})).status, 200);
  assert.deepEqual(d.jar, {});
  assert.equal((await d.call('GET', '/api/v1/me')).status, 401);
});

test('suppression du compte : connexion récente exigée, tout est effacé, identité supprimée (reprise si panne)', async () => {
  const c = clock(), deleted = [];
  let fail = true;
  const base = (await import('../server/ob-api/src/identity.js')).devIdentity({ now: c.now });
  const devIdp = { ...base, async deleteUser(sub) { if (fail) throw Error('panne'); deleted.push(sub); } };
  const w = createWorker({ now: c.now, devIdp }), env = devEnv();
  const d = await device(w, env).ready('lea@example.com');
  await d.call('POST', '/api/v1/sync/push', { items: [fav('a', 1), { kind: 'note', id: 'n', data: { text: 'x' }, u: 1, deleted: false }] });
  c.t += 11 * 60_000;
  await d.call('POST', '/api/v1/auth/refresh', {});
  const late = await d.call('DELETE', '/api/v1/account');
  assert.equal(late.status, 403); assert.equal(late.data.error, 'reauth_required');
  await d.login('lea@example.com');
  const r = await d.call('DELETE', '/api/v1/account');
  assert.deepEqual(r.data, { deleted: true, identity: 'pending' });
  assert.deepEqual(d.jar, {});
  const db = env.DB.raw;
  assert.equal(db.prepare('SELECT COUNT(*) n FROM sync_items').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM accounts').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM identity_deletions').get().n, 1);
  fail = false;
  await w.scheduled({}, env);
  assert.equal(deleted.length, 1);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM identity_deletions').get().n, 0);
});

test('journaux : aucune adresse e-mail, IP, identifiant, jeton ni contenu sur une session complète', async () => {
  const lines = [], log = console.log, err = console.error;
  console.log = (...a) => lines.push(a.join(' ')); console.error = (...a) => lines.push(a.join(' '));
  let d;
  try {
    const w = createWorker(), env = devEnv();
    d = await device(w, env, { ip: '203.0.113.77' }).ready('journal.secret@example.com');
    await d.call('POST', '/api/v1/sync/push', { items: [{ kind: 'note', id: 'nazare', data: { text: 'texte très privé' }, u: 1, deleted: false }] });
    await d.call('POST', '/api/v1/sync/pull', { since: 0 });
    await d.call('GET', '/api/v1/account/export');
    await d.call('POST', '/api/v1/auth/otp/verify', { email: 'journal.secret@example.com', code: '999999' });
    await d.call('DELETE', '/api/v1/account');
  } finally { console.log = log; console.error = err; }
  const all = lines.join('\n');
  assert.ok(lines.length >= 8);
  for (const bad of ['journal.secret', 'example.com', '203.0.113.77', 'texte très privé', 'nazare', '123456', '999999', 'eyJ'])
    assert.ok(!all.includes(bad), bad);
  for (const l of lines) assert.deepEqual(Object.keys(JSON.parse(l)).filter((k) => !['evt', 'route', 'status', 'ms', 'reason', 'name', 'kind', 'pending'].includes(k)), []);
});

test('production : jeton Supabase vérifié par JWKS (ES256), HS256 et mauvais émetteur refusés', async () => {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const SUPA = 'https://example.supabase.co';
  let jwksCalls = 0;
  const c = clock();
  const sub = '11111111-2222-4333-8444-555555555555';
  const token = (extra = {}) => signEs256(pair.privateKey, 'k1', { sub, email: 'p@example.com', role: 'authenticated', aud: 'authenticated', iss: SUPA + '/auth/v1', iat: Math.floor(c.t / 1000), exp: Math.floor(c.t / 1000) + 3600, ...extra });
  const fetcher = async (url, init) => {
    assert.ok(String(url).startsWith(SUPA + '/auth/v1/'), url);
    if (String(url).endsWith('/.well-known/jwks.json')) { jwksCalls++; return Response.json({ keys: [{ ...pub, kid: 'k1', alg: 'ES256' }] }); }
    if (String(url).endsWith('/verify')) return Response.json({ access_token: await token(), refresh_token: 'r', expires_in: 3600 });
    return Response.json({});
  };
  const w = createWorker({ now: c.now, fetcher });
  const env = { DB: fakeD1(), GUARD: fakeGuards(), OB_ENV: 'production', ALLOWED_ORIGINS: 'https://oceanbuddy.app', SUPABASE_URL: SUPA, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', SUPABASE_SECRET_KEY: 'test-secret', HASH_KEY: 'h'.repeat(40) };
  const d = device(w, env, { origin: 'https://oceanbuddy.app', base: 'https://oceanbuddy.app' });
  const login = await d.call('POST', '/api/v1/auth/otp/verify', { email: 'p@example.com', code: '123456' });
  assert.equal(login.status, 200);
  assert.ok(login.res.headers.getSetCookie().every((x) => /; Secure/.test(x)));
  assert.ok('__Host-ob_at' in d.jar && '__Secure-ob_rt' in d.jar);
  assert.equal((await d.call('GET', '/api/v1/me')).data.mode, 'production');
  const bearer = async (t) => (await device(w, env, { origin: null, base: 'https://oceanbuddy.app', ip: '192.0.2.99' }).call('GET', '/api/v1/me', undefined, { authorization: 'Bearer ' + t })).status;
  assert.equal(await bearer(await token({ iss: 'https://example2.example.co/auth/v1' })), 401);
  assert.equal(await bearer(await token({ role: 'anon' })), 401);
  assert.equal(await bearer(await token({ exp: Math.floor(c.t / 1000) - 1 })), 401);
  const hs = (await token()).split('.'); hs[0] = Buffer.from(JSON.stringify({ alg: 'HS256', kid: 'k1' })).toString('base64url');
  assert.equal(await bearer(hs.join('.')), 401);
  const none = (await token()).split('.'); none[0] = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
  assert.equal(await bearer(none[0] + '.' + none[1] + '.'), 401);
  assert.equal(jwksCalls, 1, 'clés publiques gardées en cache');
});
