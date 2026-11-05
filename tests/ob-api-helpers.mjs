/* Banc d'essai du Worker ob-api dans Node : D1 simulée par node:sqlite (vraies requêtes SQL, vraie migration),
   Durable Object Guard réel sur un stockage en mémoire. Aucun appel réseau : les fournisseurs sont des doublures. */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Guard } from '../server/ob-api/src/guard.js';

export const serverDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'server', 'ob-api');

export function fakeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const f of readdirSync(join(serverDir, 'migrations')).sort()) db.exec(readFileSync(join(serverDir, 'migrations', f), 'utf8'));
  const plain = (rows) => rows.map((r) => ({ ...r }));
  const stmt = (sql, args = []) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    async first(col) { const r = db.prepare(sql).get(...args); return r ? (col ? r[col] : { ...r }) : null; },
    async all() { return { results: plain(db.prepare(sql).all(...args)), success: true }; },
    async run() { const r = db.prepare(sql).run(...args); return { success: true, meta: { changes: r.changes } }; },
  });
  return {
    raw: db,
    prepare: (sql) => stmt(sql),
    async batch(list) {
      db.exec('BEGIN');
      try {
        const out = list.map((s) => /^\s*select/i.test(s.sql) ? { results: plain(db.prepare(s.sql).all(...s.args)) } : (db.prepare(s.sql).run(...s.args), { results: [] }));
        db.exec('COMMIT');
        return out;
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}

class FakeStorage {
  data = new Map(); alarm = null;
  kv = {
    get: (k) => (this.data.has(k) ? structuredClone(this.data.get(k)) : undefined),
    put: (k, v) => { this.data.set(k, structuredClone(v)); },
    delete: (k) => this.data.delete(k),
  };
  transactionSync(f) { const snap = new Map(this.data); try { return f(); } catch (e) { this.data = snap; throw e; } }
  async getAlarm() { return this.alarm; }
  async setAlarm(t) { this.alarm = t; }
  async deleteAll() { this.data.clear(); }
}
export function fakeGuards() {
  const inst = new Map();
  return {
    inst,
    idFromName: (n) => n,
    get(id) {
      if (!inst.has(id)) inst.set(id, new Guard({ storage: new FakeStorage() }, {}));
      const g = inst.get(id);
      return { fetch: (u, init) => g.fetch(new Request(u, init)) };
    },
  };
}

export const ORIGIN = 'http://localhost:8788';
export function devEnv(extra = {}) {
  return { DB: fakeD1(), GUARD: fakeGuards(), OB_ENV: 'local', OB_DEV_FAKE_IDP: '1', ALLOWED_ORIGINS: ORIGIN, ...extra };
}

/** Un « appareil » : son propre bocal à cookies et sa propre IP. */
export function device(worker, env, { origin = ORIGIN, base = 'http://localhost:8787', ip = '203.0.113.7' } = {}) {
  const jar = {};
  async function call(method, path, body, headers = {}) {
    const h = { 'content-type': 'application/json', 'x-ob-csrf': '1', 'cf-connecting-ip': ip, ...(origin ? { origin } : {}), ...headers };
    for (const k of Object.keys(h)) if (h[k] === null) delete h[k];
    const cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
    if (cookie && !('cookie' in headers)) h.cookie = cookie;
    const res = await worker.fetch(new Request(base + path, { method, headers: h, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }), env);
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(';'); const i = kv.indexOf('=');
      if (/Max-Age=0/.test(c)) delete jar[kv.slice(0, i)]; else jar[kv.slice(0, i)] = kv.slice(i + 1);
    }
    const text = await res.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, res };
  }
  return {
    jar, call,
    async login(email, code = '123456') {
      await call('POST', '/api/v1/auth/otp/request', { email });
      return call('POST', '/api/v1/auth/otp/verify', { email, code });
    },
    async ready(email) {
      const r = await this.login(email); if (r.status !== 200) throw Error('login ' + r.status);
      const c = await call('POST', '/api/v1/consent', { version: '2026-11' }); if (c.status !== 200) throw Error('consent');
      return this;
    },
  };
}
