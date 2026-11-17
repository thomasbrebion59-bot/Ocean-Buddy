/* Compte : compatibilité des tampons des cultures entre versions (ancien / nouveau client × ancien / nouveau Worker).
   Les anciennes versions sont relues dans git (commits épinglés) et rejouées telles quelles : le Worker par createWorker
   (D1 simulée, faux fournisseur), le client par le vrai account-sync.js dans un contexte vm (faux DOM, fetch relié au Worker).
   Règle vérifiée : quelle que soit la combinaison, la sauvegarde des favoris et des voyages, l'export et la suppression
   marchent ; aucun tampon local n'est perdu ; les tampons ne voyagent qu'entre clients à jour, via un Worker à jour. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createWorker as createNewWorker } from '../server/ob-api/src/index.js';
import { devEnv, device, ORIGIN } from './ob-api-helpers.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/* main du 5 nov. : Worker en ligne (déployé depuis ce commit, plus ada09b2 qui ne touche que le journal d'identité) et site en ligne. */
const DEPLOYED = '88499363a01cf4eaa2734ef906dc59c429ee7d5c';
/* Tête d'intégration avant les tampons (decouverte-cultures) : candidat 1.5.0 et Worker avec l'appel quotidien. */
const BASE = 'ffb4941bafd81fb567f9f528812d2ebcb312c1b1';
const STATE_KEY = 'oceanbuddy_sync_v1', EMAIL = 'tampons@example.com';

const hasCommit = (sha) => { try { execFileSync('git', ['cat-file', '-e', sha + '^{commit}'], { cwd: ROOT, stdio: 'ignore' }); return true; } catch { return false; } };
const AVAILABLE = hasCommit(DEPLOYED) && hasCommit(BASE);
const TMP = AVAILABLE ? mkdtempSync(join(tmpdir(), 'ob-compat-')) : null;
test.after(() => { if (TMP) rmSync(TMP, { recursive: true, force: true }); });

/* Copie d'une version : modèle, client et sources du Worker, à la même place que dans le dépôt. */
function extract(sha) {
  const dir = join(TMP, sha.slice(0, 7));
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', sha, '--', 'account-sync-model.js', 'account-sync.js', 'server/ob-api/src', 'server/ob-api/package.json'], { cwd: ROOT })
    .toString().trim().split('\n');
  for (const f of files) { mkdirSync(dirname(join(dir, f)), { recursive: true }); writeFileSync(join(dir, f), execFileSync('git', ['show', `${sha}:${f}`], { cwd: ROOT, maxBuffer: 1e8 })); }
  return dir;
}
async function version(sha) {
  if (!sha) return { name: 'nouveau', model: readFileSync(join(ROOT, 'account-sync-model.js'), 'utf8'), client: readFileSync(join(ROOT, 'account-sync.js'), 'utf8'), createWorker: createNewWorker, isNew: true };
  const dir = extract(sha);
  const { createWorker } = await import(pathToFileURL(join(dir, 'server/ob-api/src/index.js')).href);
  return { name: sha.slice(0, 7), model: readFileSync(join(dir, 'account-sync-model.js'), 'utf8'), client: readFileSync(join(dir, 'account-sync.js'), 'utf8'), createWorker, isNew: false };
}

/* Un appareil : le vrai account-sync.js (et son modèle) dans un faux navigateur ; fetch passe par le Worker avec les cookies de `d`. */
function appareil(v, worker, env, d, { storage = {}, search = '', ip }) {
  const mk = (init) => { const m = new Map(Object.entries(init).map(([k, x]) => [k, typeof x === 'string' ? x : JSON.stringify(x)]));
    return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, x) => { m.set(k, String(x)); }, removeItem: (k) => { m.delete(k); }, get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null }; };
  const localStorage = mk(storage), sessionStorage = mk({}), errors = [];
  const stub = () => ({ className: '', innerHTML: '', textContent: '', style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, addEventListener() {}, append() {}, after() {}, remove() {}, querySelector: () => null, querySelectorAll: () => [], focus() {} });
  const document = { hidden: false, documentElement: { lang: 'fr' }, head: { append() {} }, activeElement: null,
    body: { classList: { contains: () => false }, append() {} }, createElement: () => stub(), getElementById: () => null, addEventListener() {},
    querySelector: () => null, querySelectorAll: () => [] };
  async function fetch(url, init = {}) {
    const h = new Headers(init.headers || {});
    h.set('origin', ORIGIN); h.set('cf-connecting-ip', ip);
    const cookie = Object.entries(d.jar).map(([k, x]) => `${k}=${x}`).join('; '); if (cookie) h.set('cookie', cookie);
    const res = await worker.fetch(new Request('http://localhost:8787' + url, { method: init.method || 'GET', headers: h, body: init.body }), env);
    for (const c of res.headers.getSetCookie()) { const [kv] = c.split(';'), i = kv.indexOf('='); if (/Max-Age=0/.test(c)) delete d.jar[kv.slice(0, i)]; else d.jar[kv.slice(0, i)] = kv.slice(i + 1); }
    if (!res.ok) errors.push(url + ' ' + res.status);
    return res;
  }
  const ctx = vm.createContext({ console, localStorage, sessionStorage, document, fetch, TextEncoder, Headers,
    setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, clearInterval() {}, requestAnimationFrame: () => 0, addEventListener() {},
    MutationObserver: class { observe() {} disconnect() {} }, history: { state: null, replaceState() {} },
    location: { search, pathname: '/', hash: '', reload() {} } });
  ctx.window = ctx;
  vm.runInContext(v.model, ctx, { filename: 'account-sync-model.js' });
  vm.runInContext(v.client, ctx, { filename: 'account-sync.js' });
  const read = (k) => JSON.parse(localStorage.getItem(k) ?? 'null');
  return {
    errors, read,
    sync: () => ctx.OceanAccount.sync(),
    favs: () => (read('oceanbuddy_v1')?.favs || []).slice().sort(),
    trips: () => (read('oceanbuddy_trips_v1')?.trips || []).map((t) => t.id).sort(),
    stamps: () => read('oceanbuddy_cultures_v1')?.stamps || {},
    state: () => read(STATE_KEY) || {},
    /* Première synchronisation lancée par le retour de connexion (?compte=connecte) : attendre sa fin. */
    async settled() { for (let i = 0; i < 4000 && !this.state().lastSync; i++) await new Promise((r) => setImmediate(r)); return !!this.state().lastSync; },
  };
}

const trip = (id, name) => ({ id, name, destination: '', start: '', end: '', notes: '', accommodation: '', transport: '', budget: '', steps: [], checklist: [] });
const cultures = (stamps) => ({ v: 1, stamps, quiz: null, run: 0, best: 0, last: null });
const STAMPS_A = { Portugal: '2026-11-10', Japon: '2026-11-12' }, STAMPS_B = { Maroc: '2026-11-14' };

async function scenario(W, CA, CB) {
  const env = devEnv(), worker = W.createWorker();
  /* Appareil A : un favori, un voyage, deux tampons ; connecté, sauvegarde activée, puis synchronisation. */
  const dA = await device(worker, env, { ip: '203.0.113.10' }).ready(EMAIL);
  const A = appareil(CA, worker, env, dA, { ip: '203.0.113.10', storage: {
    [STATE_KEY]: { v: 1, lastRev: 0, shadow: {}, pend: {}, linked: true, invite: { at: 1 } },
    oceanbuddy_v1: { xp: 40, favs: ['hossegor'], sessions: [], level: 'debutant', sport: 'surf', name: 'Léa', eco: [], onboarded: true },
    oceanbuddy_trips_v1: { version: 1, trips: [trip('t1', 'Portugal')] },
    oceanbuddy_cultures_v1: cultures(STAMPS_A) } });
  await A.sync();
  /* Appareil B : un autre favori, un tampon ; il revient de la connexion (première synchronisation, le compte gagne les conflits). */
  const dB = device(worker, env, { ip: '198.51.100.20' });
  assert.equal((await dB.login(EMAIL)).status, 200);
  const B = appareil(CB, worker, env, dB, { ip: '198.51.100.20', search: '?compte=connecte', storage: {
    [STATE_KEY]: { v: 1, lastRev: 0, shadow: {}, pend: {}, invite: { at: 1 } },
    oceanbuddy_v1: { xp: 10, favs: ['nazare'], sessions: [], level: null, sport: 'surf', name: '', eco: [], onboarded: true },
    oceanbuddy_cultures_v1: cultures(STAMPS_B) } });
  assert.ok(await B.settled(), 'première synchronisation de B terminée');
  await A.sync();
  for (const [n, x] of [['A', A], ['B', B]]) {
    assert.deepEqual(x.errors.filter((e) => !/\/me 4\d\d$/.test(e)), [], `${n} : aucune requête refusée`);
    assert.deepEqual(x.favs(), ['hossegor', 'nazare'], `${n} : favoris des deux appareils`);
    assert.deepEqual(x.trips(), ['t1'], `${n} : voyage retrouvé`);
  }
  /* Aucun tampon local perdu ; les tampons ne passent qu'entre clients à jour, par un Worker à jour. */
  const travels = W.isNew && CA.isNew && CB.isNew;
  assert.deepEqual(A.stamps(), travels ? { ...STAMPS_A, ...STAMPS_B } : STAMPS_A, 'tampons de A');
  assert.deepEqual(B.stamps(), travels ? { ...STAMPS_A, ...STAMPS_B } : STAMPS_B, 'tampons de B');
  const server = Object.fromEntries((await dA.call('POST', '/api/v1/sync/pull', { since: 0 })).data.items.map((i) => [i.kind + ':' + i.id, i.data]));
  assert.ok(server['fav:hossegor'] && server['fav:nazare'] && server['trip:t1'], 'favoris et voyage sur le compte');
  const sent = { ...(W.isNew && CA.isNew ? STAMPS_A : {}), ...(W.isNew && CB.isNew ? STAMPS_B : {}) };
  assert.deepEqual(server['progress:cultures']?.stamps || {}, sent, 'tampons sur le compte');
  /* Export et suppression du compte. */
  const ex = await dA.call('GET', '/api/v1/account/export');
  assert.equal(ex.status, 200); assert.ok(ex.data.items.some((i) => i.kind === 'trip' && i.id === 't1'));
  const del = await dA.call('DELETE', '/api/v1/account');
  assert.equal(del.status, 200); assert.equal(del.data.deleted, true);
  /* B garde un jeton encore valide quelques minutes, mais le compte n'existe plus : plus rien à lire. */
  assert.equal((await dB.call('POST', '/api/v1/sync/pull', { since: 0 })).data.error, 'consent_required', 'plus aucune donnée après suppression');
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM sync_items').get().n, 0);
}

const opts = AVAILABLE ? {} : { skip: 'commits de référence absents (clone partiel) : essai de compatibilité non joué' };

test('Worker en ligne (5 nov.) : il refuse TOUT un envoi qui contient un id de progression inconnu', opts, async () => {
  const W = await version(DEPLOYED), env = devEnv(), worker = W.createWorker();
  const d = await device(worker, env).ready(EMAIL);
  const r = await d.call('POST', '/api/v1/sync/push', { items: [
    { kind: 'fav', id: 'hossegor', data: {}, u: Date.now(), deleted: false },
    { kind: 'progress', id: 'cultures', data: cultures(STAMPS_A), u: Date.now(), deleted: false }] });
  assert.equal(r.status, 400); assert.equal(r.data.error, 'invalid_item_data'); assert.equal(r.res.headers.get('x-ob-item'), '1');
  assert.deepEqual((await d.call('POST', '/api/v1/sync/pull', { since: 0 })).data.items, [], 'le favori du même envoi est perdu aussi');
  assert.equal((await d.call('POST', '/api/v1/sync/pull', { since: 0 })).data.accept, undefined, 'et il n’annonce rien');
});

const NEW = { sha: null }, OLD = { sha: DEPLOYED }, OLD_BASE = { sha: BASE };
const CASES = [
  ['ancien client + ancien Worker', OLD, OLD, OLD], ['ancien client (base) + ancien Worker (base)', OLD_BASE, OLD_BASE, OLD_BASE],
  ['nouveau client + ancien Worker', OLD, NEW, NEW], ['nouveau client + ancien Worker (base)', OLD_BASE, NEW, NEW],
  ['nouveau et ancien clients + ancien Worker', OLD, NEW, OLD],
  ['ancien client + nouveau Worker', NEW, OLD, OLD], ['ancien client (base) + nouveau Worker', NEW, OLD_BASE, OLD_BASE],
  ['nouveau client + nouveau Worker', NEW, NEW, NEW],
  ['nouveau client (A) + ancien client (B) + nouveau Worker', NEW, NEW, OLD], ['ancien client (A) + nouveau client (B) + nouveau Worker', NEW, OLD_BASE, NEW],
];
const cache = new Map();
const load = async (x) => { const k = x.sha || 'new'; if (!cache.has(k)) cache.set(k, await version(x.sha)); return cache.get(k); };
for (const [name, W, CA, CB] of CASES)
  test(`compatibilité : ${name}`, opts, async () => { await scenario(await load(W), await load(CA), await load(CB)); });
