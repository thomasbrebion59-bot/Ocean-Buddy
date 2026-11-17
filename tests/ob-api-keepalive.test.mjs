/* Worker ob-api : maintien de Supabase (tâche planifiée quotidienne). Aucun appel réseau : le fournisseur est une doublure
   injectée par deps.fetcher. Vérifie : bon chemin, clé publique seule, aucun effet, jamais bloquant, jamais sans SUPABASE_URL. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorker } from '../server/ob-api/src/index.js';
import { supabaseKeepAlive } from '../server/ob-api/src/keepalive.js';
import { devEnv, fakeD1, fakeGuards } from './ob-api-helpers.mjs';

const SUPA = 'https://example.supabase.co';
const PUB = 'sb_publishable_test_cle_publique';
const SECRET = 'sb_secret_test_cle_secrete';
const prodEnv = (extra = {}) => ({
  DB: fakeD1(), GUARD: fakeGuards(), OB_ENV: 'production', ALLOWED_ORIGINS: 'https://oceanbuddy.app',
  SUPABASE_URL: SUPA, SUPABASE_PUBLISHABLE_KEY: PUB, SUPABASE_SECRET_KEY: SECRET, HASH_KEY: 'h'.repeat(40), ...extra,
});
/** Doublure de Supabase : note chaque demande ; réponses réglables par chemin. */
function fakeSupabase(answer = () => null) {
  const calls = [];
  const fetcher = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? 'GET', headers: { ...init.headers }, body: init.body });
    const r = await answer(String(url), init);
    if (r) return r;
    if (String(url).includes('/auth/v1/token')) return Response.json({ error: 'invalid_grant', error_code: 'refresh_token_not_found' }, { status: 400 });
    return Response.json({});
  };
  return { calls, fetcher };
}
const events = (lines) => lines.filter((l) => l.startsWith('{')).map((l) => JSON.parse(l)); // ignore les avertissements de Node
/** Capte le journal du Worker le temps d'une opération. */
async function withLogs(f) {
  const lines = [], log = console.log, err = console.error;
  console.log = (...a) => lines.push(a.join(' ')); console.error = (...a) => lines.push(a.join(' '));
  try { await f(); } finally { console.log = log; console.error = err; }
  return lines;
}

test('maintien : la tâche planifiée envoie un appel d’authentification sans effet, clé publique seule', async () => {
  const s = fakeSupabase(), env = prodEnv();
  const lines = await withLogs(() => createWorker({ fetcher: s.fetcher }).scheduled({}, env));
  assert.equal(s.calls.length, 1);
  const [c] = s.calls;
  assert.equal(c.url, `${SUPA}/auth/v1/token?grant_type=refresh_token`);
  assert.equal(c.method, 'POST');
  assert.equal(c.headers.apikey, PUB);
  assert.deepEqual(JSON.parse(c.body), { refresh_token: 'ob-keepalive-sans-effet' }, 'aucun e-mail, aucune donnée : seulement un faux jeton');
  assert.ok(!JSON.stringify(c).includes(SECRET), 'la clé secrète ne part jamais');
  assert.equal(c.headers.authorization, undefined, 'clé sb_publishable_… : l’en-tête apikey suffit');
  // Journal : un seul événement anonyme, ni clé ni adresse.
  const ev = events(lines).filter((e) => e.evt === 'keepalive');
  assert.deepEqual(ev, [{ evt: 'keepalive', route: 'auth_refresh', status: 400, reason: 'ok' }]);
  const all = lines.join('\n');
  for (const bad of [PUB, SECRET, 'example.supabase.co', 'ob-keepalive-sans-effet']) assert.ok(!all.includes(bad), bad);
});

test('maintien : ancienne clé publique (JWT) aussi en Authorization ; lecture REST facultative seulement si une table est nommée', async () => {
  const legacy = 'eyJhbGciOiJIUzI1NiJ9.cle-publique-ancienne.signature';
  const s = fakeSupabase();
  const res = await supabaseKeepAlive({ url: SUPA + '/', publishableKey: legacy, table: 'ob_keepalive', fetcher: s.fetcher });
  assert.deepEqual(res.map((r) => [r.probe, r.status, r.reason]), [['auth_refresh', 400, 'ok'], ['rest_read', 200, 'ok']]);
  assert.equal(s.calls[0].headers.authorization, 'Bearer ' + legacy);
  assert.equal(s.calls[1].url, `${SUPA}/rest/v1/ob_keepalive?select=*&limit=1`);
  assert.equal(s.calls[1].method, 'GET');
  assert.equal(s.calls[1].body, undefined);
  // Table absente (404) : l'appel est journalisé « refused » pour que le fondateur voie l'erreur.
  const absent = fakeSupabase((url) => (url.includes('/rest/v1/') ? Response.json({ code: 'PGRST205' }, { status: 404 }) : null));
  const miss = await supabaseKeepAlive({ url: SUPA, publishableKey: PUB, table: 'ob_keepalive', fetcher: absent.fetcher });
  assert.deepEqual(miss.map((r) => [r.probe, r.status, r.reason]), [['auth_refresh', 400, 'ok'], ['rest_read', 404, 'refused']]);
  // Nom de table douteux : ignoré (rien d'injecté dans le chemin), l'appel d'authentification part quand même.
  for (const bad of ['../auth/v1/admin/users', 'a?b=c', 'Table Majuscule', '']) {
    const t = fakeSupabase();
    const r = await supabaseKeepAlive({ url: SUPA, publishableKey: PUB, table: bad, fetcher: t.fetcher });
    assert.equal(t.calls.length, 1, bad); assert.equal(r.length, 1, bad);
  }
  // Via le Worker : la variable SUPABASE_KEEPALIVE_TABLE active la lecture.
  const w = fakeSupabase();
  await createWorker({ fetcher: w.fetcher }).scheduled({}, prodEnv({ SUPABASE_KEEPALIVE_TABLE: 'ob_keepalive' }));
  assert.deepEqual(w.calls.map((c) => c.method + ' ' + new URL(c.url).pathname), ['POST /auth/v1/token', 'GET /rest/v1/ob_keepalive']);
});

test('maintien : panne réseau, 5xx, 429 ou silence de Supabase ne cassent jamais la tâche (suppressions d’identité reprises quand même)', async () => {
  const cases = {
    réseau: () => { throw new TypeError('fetch failed'); },
    '503': () => new Response('x', { status: 503 }),
    '429': () => new Response('x', { status: 429 }),
    silence: () => new Promise(() => {}), // ne répond jamais : le délai maximal doit couper
  };
  for (const [name, fail] of Object.entries(cases)) {
    const deleted = [];
    const s = fakeSupabase((url, init) => {
      if (url.includes('/auth/v1/token')) return fail();
      if (init.method === 'DELETE') { deleted.push(decodeURIComponent(url.split('/').pop())); return Response.json({}); }
      return null;
    });
    const env = prodEnv();
    env.DB.raw.prepare("INSERT INTO identity_deletions (user_id, created_at) VALUES ('11111111-2222-4333-8444-555555555555', 1)").run();
    const t0 = Date.now();
    const lines = await withLogs(() => createWorker({ fetcher: s.fetcher, keepAliveTimeoutMs: 25 }).scheduled({}, env));
    assert.ok(Date.now() - t0 < 2000, `${name} : délai maximal respecté`);
    assert.deepEqual(deleted, ['11111111-2222-4333-8444-555555555555'], `${name} : le reste de la tâche s’exécute`);
    assert.equal(env.DB.raw.prepare('SELECT COUNT(*) n FROM identity_deletions').get().n, 0, name);
    const ev = events(lines).find((e) => e.evt === 'keepalive');
    assert.equal(ev.reason, name === 'silence' ? 'timeout' : name === 'réseau' ? 'network' : 'refused', name);
    assert.ok(!lines.join('\n').includes('example.supabase.co'), name);
  }
});

test('maintien : aucun appel sans SUPABASE_URL, ni en essai local, ni sans clé publique', async () => {
  // Production sans adresse Supabase : la tâche s'arrête comme avant (configuration invalide) et n'appelle rien.
  const a = fakeSupabase();
  await withLogs(() => createWorker({ fetcher: a.fetcher }).scheduled({}, prodEnv({ SUPABASE_URL: undefined })));
  assert.equal(a.calls.length, 0);
  // Essai local (faux fournisseur) : rien non plus.
  const b = fakeSupabase();
  await createWorker({ fetcher: b.fetcher }).scheduled({}, devEnv());
  assert.equal(b.calls.length, 0);
  // OB_ENV=local même avec une adresse Supabase : rien.
  const c = fakeSupabase();
  await withLogs(() => createWorker({ fetcher: c.fetcher }).scheduled({}, prodEnv({ OB_ENV: 'local' })));
  assert.equal(c.calls.length, 0);
  // Fonction seule : adresse absente, non HTTPS ou étrangère, clé absente : rien n'est envoyé.
  for (const [url, key] of [['', PUB], [undefined, PUB], ['http://example.supabase.co', PUB], ['https://example.supabase.co/../x', PUB], [SUPA, '']]) {
    const d = fakeSupabase();
    assert.deepEqual(await supabaseKeepAlive({ url, publishableKey: key, fetcher: d.fetcher }), []);
    assert.equal(d.calls.length, 0, String(url));
  }
});
