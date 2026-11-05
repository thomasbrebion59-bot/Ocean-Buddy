// ob-api : API des comptes Ocean Buddy (Cloudflare Worker, route oceanbuddy.app/api/*).
// - Identité : Supabase Auth (code / lien e-mail), vérifiée ici par signature (JWKS) ; aucune clé Supabase dans l'app.
// - Données : D1 (Cloudflare), une ligne par élément synchronisé ; retour arrière par D1 Time Travel.
// - Web : jetons dans des cookies HttpOnly posés par ce Worker ; app native : en-tête Authorization (Trousseau, étape 3).
// - Limites de débit partout (Durable Object Guard), journaux sans donnée personnelle, échec fermé si mal configuré.
// Règles : ~/Projects/REGLES-SECURITE-COMPTES.md ; plan : Ocean-Buddy-orga-docs/comptes/PLAN-COMPTE.md.

import Model from "../../../account-sync-model.js";
import { verifyJwt, authTime, JwtError } from "./jwt.js";
import { supabaseIdentity, devIdentity, IdpError } from "./identity.js";
export { Guard } from "./guard.js";

const M = Model;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const REAUTH_SECONDS = 600;
const TOMBSTONE_DAYS = 90;
const PULL_PAGE = 500;
const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000;

// ---------- réponses et erreurs ----------
export class HttpError extends Error {
  constructor(status, code, headers = {}, cookies = []) {
    super(code);
    this.status = status;
    this.code = code;
    this.headers = headers;
    this.cookies = cookies;
  }
}
const BASE_HEADERS = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
};
function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, "content-type": "application/json; charset=utf-8", ...headers } });
}
/** Journal : seulement {evt, route, status, ms, reason} ; jamais d'e-mail, d'IP, d'identifiant, de jeton ni de contenu. */
function logEvent(fields) {
  console.log(JSON.stringify(fields));
}
function misconfigured(name) {
  console.error(JSON.stringify({ evt: "config_invalid", name }));
  return new HttpError(500, "misconfigured");
}

// ---------- configuration (échec fermé) ----------
/** Essai local : TOUTES les conditions, sinon jamais. Une seule manque alors que le drapeau est mis : erreur de configuration. */
export function devMode(env, url) {
  if (env.OB_DEV_FAKE_IDP === undefined || env.OB_DEV_FAKE_IDP === "" || env.OB_DEV_FAKE_IDP === "0") return false;
  const ok = env.OB_DEV_FAKE_IDP === "1" && env.OB_ENV === "local" && !env.SUPABASE_URL && url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname);
  if (!ok) throw misconfigured("OB_DEV_FAKE_IDP");
  return true;
}
function intVar(raw, fallback) {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
export function readConfig(env, url, deps) {
  if (!env.DB) throw misconfigured("DB");
  if (!env.GUARD) throw misconfigured("GUARD");
  const dev = devMode(env, url);
  const origins = String(env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!origins.length || origins.some((o) => !/^https?:\/\/[a-z0-9.-]+(:\d+)?$/.test(o))) throw misconfigured("ALLOWED_ORIGINS");
  if (!dev && origins.some((o) => !o.startsWith("https://"))) throw misconfigured("ALLOWED_ORIGINS");
  const nativeOrigins = String(env.NATIVE_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  let hashKey = String(env.HASH_KEY ?? "");
  if (dev && !hashKey) hashKey = "essai-local-uniquement-pas-un-secret-0000";
  if (hashKey.length < 32) throw misconfigured("HASH_KEY");
  let idp;
  if (dev) idp = deps.devIdp;
  else {
    const supa = String(env.SUPABASE_URL ?? "");
    if (!/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(supa)) throw misconfigured("SUPABASE_URL");
    if (!env.SUPABASE_PUBLISHABLE_KEY) throw misconfigured("SUPABASE_PUBLISHABLE_KEY");
    if (!env.SUPABASE_SECRET_KEY) throw misconfigured("SUPABASE_SECRET_KEY");
    idp = deps.supabaseFor(supa, env.SUPABASE_PUBLISHABLE_KEY, env.SUPABASE_SECRET_KEY);
  }
  return {
    dev,
    origins,
    nativeOrigins,
    hashKey,
    idp,
    emailBudget: intVar(env.EMAIL_DAILY_BUDGET, 80),
    secure: url.protocol === "https:",
  };
}

// ---------- empreintes (HMAC) : IP, adresse e-mail et compte ne servent qu'à nommer des compteurs ----------
const hmacKeys = new Map();
async function bucket(cfg, text) {
  let key = hmacKeys.get(cfg.hashKey);
  if (!key) {
    key = crypto.subtle.importKey("raw", new TextEncoder().encode(cfg.hashKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    hmacKeys.set(cfg.hashKey, key);
  }
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key, new TextEncoder().encode(text)));
  return [...sig.subarray(0, 10)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
/** IP normalisée (IPv6 regroupée par /64), reprise de Frigo ; jamais stockée ni journalisée en clair. */
export function ipKey(request) {
  const ip = request.headers.get("CF-Connecting-IP")?.trim().toLowerCase() ?? "";
  if (ip === "" || ip.length > 64) return "unknown";
  if (!ip.includes(":")) return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) ? ip : "unknown";
  const mapped = ip.slice(ip.lastIndexOf(":") + 1);
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(mapped)) return mapped;
  const halves = ip.split("::");
  if (halves.length > 2) return "unknown";
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const groups = halves.length === 1 ? head : [...head, ...Array(Math.max(0, 8 - head.length - tail.length)).fill("0"), ...tail];
  if (groups.length !== 8 || !groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return "unknown";
  return `v6:${groups.slice(0, 4).map((g) => g.padStart(4, "0")).join(":")}`;
}

async function guardCall(env, name, path, args) {
  const stub = env.GUARD.get(env.GUARD.idFromName(name));
  const r = await stub.fetch(`https://guard${path}`, { method: "POST", body: JSON.stringify(args) });
  if (!r.ok) throw new HttpError(503, "unavailable");
  return r.json();
}
/** Limite de débit (fenêtres glissantes). `quiet` : refus silencieux (renvoie false) au lieu d'un 429. */
async function limit(ctx, scope, subject, rules, { quiet = false } = {}) {
  const name = `rl:${scope}:${await bucket(ctx.cfg, `${scope}|${subject}`)}`;
  const r = await guardCall(ctx.env, name, "/hit", { rules: rules.map(([n, w]) => ({ limit: n, windowMs: w })) });
  if (r.ok) return true;
  if (quiet) return false;
  const retry = Math.max(1, Math.ceil(r.retryAfterMs / 1000));
  throw new HttpError(429, "rate_limited", { "retry-after": String(retry) });
}

// ---------- cookies ----------
function cookieNames(cfg) {
  return cfg.secure ? { at: "__Host-ob_at", rt: "__Secure-ob_rt" } : { at: "ob_at", rt: "ob_rt" };
}
function readCookie(request, name) {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}
function sessionCookies(cfg, s) {
  const n = cookieNames(cfg), sec = cfg.secure ? "; Secure" : "";
  return [
    `${n.at}=${s.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.min(s.expires_in, 3600)}${sec}`,
    `${n.rt}=${s.refresh_token}; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}${sec}`,
  ];
}
function clearCookies(cfg) {
  const n = cookieNames(cfg), sec = cfg.secure ? "; Secure" : "";
  return [`${n.at}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${sec}`, `${n.rt}=; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=0${sec}`];
}
function withCookies(response, cookies) {
  for (const c of cookies) response.headers.append("set-cookie", c);
  return response;
}

// ---------- corps de requête ----------
async function readBody(request, maxBytes) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new HttpError(413, "too_large");
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new HttpError(413, "too_large");
  if (!text) return {};
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error();
    return v;
  } catch {
    throw new HttpError(400, "bad_json");
  }
}
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
function readEmail(body) {
  const email = String(body.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) throw new HttpError(400, "invalid_email");
  return email;
}

// ---------- identité ----------
async function verifyAccess(ctx, token) {
  try {
    return await verifyJwt(token, { findKey: ctx.cfg.idp.findKey, issuer: ctx.cfg.idp.issuer, now: ctx.now() });
  } catch (e) {
    if (e instanceof JwtError && e.reason === "jwks_unavailable") throw new HttpError(503, "unavailable");
    if (e instanceof JwtError && e.reason === "expired") throw new HttpError(401, "token_expired");
    if (e instanceof JwtError) throw new HttpError(401, "unauthenticated");
    throw new HttpError(503, "unavailable");
  }
}
async function requireUser(ctx) {
  const auth = ctx.request.headers.get("authorization") ?? "";
  const bearer = /^Bearer ([A-Za-z0-9._-]+)$/.exec(auth)?.[1];
  const token = bearer ?? readCookie(ctx.request, cookieNames(ctx.cfg).at);
  if (!token) throw new HttpError(401, "unauthenticated");
  const claims = await verifyAccess(ctx, token);
  return { claims, sub: claims.sub, token };
}
async function ensureAccount(ctx, sub) {
  await ctx.env.DB.prepare("INSERT INTO accounts (user_id, created_at) VALUES (?1, ?2) ON CONFLICT(user_id) DO NOTHING").bind(sub, ctx.now()).run();
}
async function account(ctx, sub) {
  return ctx.env.DB.prepare("SELECT user_id, created_at, consent_version, consent_at, rev FROM accounts WHERE user_id = ?1").bind(sub).first();
}
async function requireConsent(ctx, sub) {
  const a = await account(ctx, sub);
  if (!a || !a.consent_version) throw new HttpError(403, "consent_required");
  return a;
}
/** Réponse de connexion : cookies HttpOnly sur le web ; jetons dans le corps seulement pour l'app native (sans Origin web). */
async function loginResponse(ctx, s, body) {
  const claims = await verifyAccess(ctx, s.access_token);
  await ensureAccount(ctx, claims.sub);
  const origin = ctx.request.headers.get("origin");
  if (body.client === "native" && (!origin || ctx.cfg.nativeOrigins.includes(origin)))
    return json(200, { ok: true, access_token: s.access_token, refresh_token: s.refresh_token, expires_in: s.expires_in });
  return withCookies(json(200, { ok: true }), sessionCookies(ctx.cfg, s));
}
function idpFailure(e) {
  if (e instanceof IdpError) return new HttpError(e.status, e.code);
  return e;
}

// ---------- routes ----------
async function otpRequest(ctx) {
  const body = await readBody(ctx.request, 2048);
  const email = readEmail(body);
  await limit(ctx, "otp-ip", ctx.ip, [[10, HOUR]]);
  // Adresse : refus SILENCIEUX (réponse neutre identique) pour ne rien révéler et ne rien envoyer.
  if (!(await limit(ctx, "otp-mail", email, [[3, 15 * MIN], [10, DAY]], { quiet: true }))) return json(202, { ok: true });
  const day = new Date(ctx.now()).toISOString().slice(0, 10);
  const b = await guardCall(ctx.env, `day:email:${day}`, "/budget", { limit: ctx.cfg.emailBudget });
  if (!b.ok) {
    logEvent({ evt: "email_budget_exhausted" });
    throw new HttpError(503, "email_budget");
  }
  try {
    await ctx.cfg.idp.requestOtp(email);
  } catch (e) {
    throw idpFailure(e);
  }
  return json(202, { ok: true });
}
async function otpVerify(ctx) {
  const body = await readBody(ctx.request, 2048);
  const email = readEmail(body);
  const code = String(body.code ?? "");
  if (!/^\d{6}$/.test(code)) throw new HttpError(400, "invalid_code");
  await limit(ctx, "verify-ip", ctx.ip, [[20, 15 * MIN]]);
  await limit(ctx, "verify-mail", email, [[5, 15 * MIN], [10, HOUR], [20, DAY]]);
  let s;
  try {
    s = await ctx.cfg.idp.verifyOtp(email, code);
  } catch (e) {
    throw idpFailure(e);
  }
  return loginResponse(ctx, s, body);
}
const TOKEN_HASH_RE = /^[A-Za-z0-9_-]{10,200}$/;
function confirmPage(tokenHash) {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ocean Buddy</title>
<style>body{font:16px/1.5 system-ui,sans-serif;background:#fef9eb;color:#0b2a4a;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}main{max-width:420px;text-align:center}button{font:inherit;font-weight:700;border:0;border-radius:14px;background:#0b4f8a;color:#fff;padding:14px 22px;min-height:48px;cursor:pointer}small{display:block;margin-top:18px;color:#56708a}</style></head>
<body><main><h1>Ocean Buddy</h1><p>Confirme ta connexion à ton compte.<br><span lang="en">Confirm your sign-in.</span> · <span lang="es">Confirma tu inicio de sesión.</span></p>
<form method="post" action="/api/v1/auth/confirm"><input type="hidden" name="token_hash" value="${tokenHash}"><button type="submit">Confirmer ma connexion</button></form>
<small>Si tu n’as rien demandé, ferme simplement cette page.</small></main></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { ...BASE_HEADERS, "content-type": "text/html; charset=utf-8", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'" },
  });
}
async function confirmGet(ctx) {
  const tokenHash = ctx.url.searchParams.get("token_hash") ?? "";
  if (!TOKEN_HASH_RE.test(tokenHash)) throw new HttpError(400, "invalid_link");
  await limit(ctx, "confirm-ip", ctx.ip, [[20, 15 * MIN]]);
  return confirmPage(tokenHash);
}
async function confirmPost(ctx) {
  const form = new URLSearchParams((await ctx.request.text()).slice(0, 1024));
  const tokenHash = form.get("token_hash") ?? "";
  if (!TOKEN_HASH_RE.test(tokenHash)) throw new HttpError(400, "invalid_link");
  await limit(ctx, "confirm-ip", ctx.ip, [[20, 15 * MIN]]);
  let s;
  try {
    s = await ctx.cfg.idp.verifyTokenHash(tokenHash);
  } catch (e) {
    throw idpFailure(e);
  }
  const claims = await verifyAccess(ctx, s.access_token);
  await ensureAccount(ctx, claims.sub);
  return withCookies(new Response(null, { status: 303, headers: { ...BASE_HEADERS, location: "/?compte=connecte" } }), sessionCookies(ctx.cfg, s));
}
async function refresh(ctx) {
  const body = await readBody(ctx.request, 4096);
  await limit(ctx, "refresh-ip", ctx.ip, [[60, 15 * MIN]]);
  const fromCookie = readCookie(ctx.request, cookieNames(ctx.cfg).rt);
  const rt = fromCookie ?? (typeof body.refresh_token === "string" ? body.refresh_token : null);
  if (!rt || rt.length > 4096) throw new HttpError(401, "unauthenticated");
  let s;
  try {
    s = await ctx.cfg.idp.refresh(rt);
  } catch (e) {
    const err = idpFailure(e);
    if (err.status === 401 && fromCookie) throw new HttpError(401, "unauthenticated", {}, clearCookies(ctx.cfg));
    throw err;
  }
  return loginResponse(ctx, s, fromCookie ? {} : body);
}
async function logout(ctx) {
  const token = readCookie(ctx.request, cookieNames(ctx.cfg).at) ?? /^Bearer (.+)$/.exec(ctx.request.headers.get("authorization") ?? "")?.[1];
  if (token) await ctx.cfg.idp.logout(token);
  return withCookies(json(200, { ok: true }), clearCookies(ctx.cfg));
}
async function me(ctx) {
  const u = await requireUser(ctx);
  await ensureAccount(ctx, u.sub);
  const a = await account(ctx, u.sub);
  const stats = await ctx.env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(length(data)), 0) AS b FROM sync_items WHERE user_id = ?1 AND deleted = 0").bind(u.sub).first();
  return json(200, {
    user: { email: typeof u.claims.email === "string" ? u.claims.email : null, createdAt: a.created_at },
    consent: a.consent_version ? { version: a.consent_version, at: a.consent_at } : null,
    sync: { rev: a.rev, items: stats.n, bytes: stats.b },
    limits: { items: M.LIMITS.itemsPerAccount, bytes: M.LIMITS.accountBytes },
    mode: ctx.cfg.dev ? "essai-local" : "production",
  });
}
async function consentSet(ctx) {
  const u = await requireUser(ctx);
  const body = await readBody(ctx.request, 1024);
  const version = String(body.version ?? "");
  if (!/^[A-Za-z0-9._-]{1,20}$/.test(version)) throw new HttpError(400, "invalid_version");
  await limit(ctx, "consent", u.sub, [[20, HOUR]]);
  await ensureAccount(ctx, u.sub);
  await ctx.env.DB.prepare("UPDATE accounts SET consent_version = ?2, consent_at = ?3 WHERE user_id = ?1").bind(u.sub, version, ctx.now()).run();
  return json(200, { ok: true });
}
/** Désactiver la sauvegarde = effacer les données du serveur (le compte reste). */
async function consentDelete(ctx) {
  const u = await requireUser(ctx);
  await limit(ctx, "consent", u.sub, [[20, HOUR]]);
  await ctx.env.DB.batch([
    ctx.env.DB.prepare("DELETE FROM sync_items WHERE user_id = ?1").bind(u.sub),
    ctx.env.DB.prepare("UPDATE accounts SET consent_version = NULL, consent_at = NULL WHERE user_id = ?1").bind(u.sub),
  ]);
  return json(200, { ok: true });
}

function rowToItem(r) {
  return { kind: r.kind, id: r.item_id, data: JSON.parse(r.data), u: r.updated_at, deleted: r.deleted === 1, rev: r.rev };
}
async function pull(ctx) {
  const u = await requireUser(ctx);
  const body = await readBody(ctx.request, 1024);
  const since = Number(body.since ?? 0);
  if (!Number.isSafeInteger(since) || since < 0) throw new HttpError(400, "invalid_since");
  await limit(ctx, "pull", u.sub, [[300, HOUR]]);
  const a = await requireConsent(ctx, u.sub);
  const { results } = await ctx.env.DB.prepare(
    "SELECT kind, item_id, data, deleted, updated_at, rev FROM sync_items WHERE user_id = ?1 AND rev > ?2 ORDER BY rev LIMIT ?3",
  ).bind(u.sub, since, PULL_PAGE + 1).all();
  let rows = results, more = false;
  if (rows.length > PULL_PAGE) {
    // Page pleine : on ne coupe jamais un même envoi (même rev) en deux.
    more = true;
    const lastRev = rows[PULL_PAGE].rev;
    const kept = rows.slice(0, PULL_PAGE).filter((r) => r.rev !== lastRev);
    rows = kept.length ? kept : rows.slice(0, PULL_PAGE);
  }
  return json(200, { items: rows.map(rowToItem), more, rev: a.rev });
}

async function push(ctx) {
  const u = await requireUser(ctx);
  const body = await readBody(ctx.request, M.LIMITS.requestBytes);
  const items = body.items;
  if (!Array.isArray(items) || items.length === 0 || items.length > M.LIMITS.itemsPerPush) throw new HttpError(400, "invalid_items");
  const keys = new Set();
  for (const [i, it] of items.entries()) {
    const reason = M.checkPushItem(it);
    if (reason) throw new HttpError(400, `invalid_item_${reason}`, { "x-ob-item": String(i) });
    const key = M.keyOf(it.kind, it.id);
    if (keys.has(key)) throw new HttpError(400, "duplicate_item");
    keys.add(key);
  }
  await limit(ctx, "push", u.sub, [[120, HOUR]]);
  await requireConsent(ctx, u.sub);
  const db = ctx.env.DB, now = ctx.now();
  const placeholders = [...keys].map((_, i) => `?${i + 2}`).join(",");
  const { results: existingRows } = await db.prepare(
    `SELECT kind, item_id, data, deleted, updated_at, length(data) AS len FROM sync_items WHERE user_id = ?1 AND (kind || ':' || item_id) IN (${placeholders})`,
  ).bind(u.sub, ...keys).all();
  const existing = new Map(existingRows.map((r) => [M.keyOf(r.kind, r.item_id), r]));
  const stats = await db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(length(data)), 0) AS b FROM sync_items WHERE user_id = ?1").bind(u.sub).first();
  let count = stats.n, bytes = stats.b;
  const writes = [], results = [];
  for (const it of items) {
    const key = M.keyOf(it.kind, it.id), e = existing.get(key);
    // Horloge : jamais plus de 5 minutes dans le futur ; à égalité, la version du serveur gagne.
    let u2 = Math.min(Math.floor(it.u), now + 5 * MIN);
    let data = it.deleted ? {} : it.data;
    if (it.kind === "progress" && e && e.deleted === 0) {
      const merged = M.mergeProgress(it.id, JSON.parse(e.data), it.data);
      if (M.hash(merged) === M.hash(JSON.parse(e.data))) {
        results.push({ kind: it.kind, id: it.id, status: "ok", u: e.updated_at });
        continue;
      }
      data = merged;
      u2 = Math.max(u2, e.updated_at + 1);
    } else if (e && !(u2 > e.updated_at)) {
      results.push({ kind: it.kind, id: it.id, status: "stale", u: e.updated_at });
      continue;
    }
    const text = JSON.stringify(data);
    if (!e) count++;
    bytes += text.length - (e ? e.len : 0);
    writes.push({ it, text, u: u2 });
    results.push({ kind: it.kind, id: it.id, status: "ok", u: u2 });
  }
  if (count > M.LIMITS.itemsPerAccount || bytes > M.LIMITS.accountBytes) throw new HttpError(413, "account_full");
  let rev = null;
  if (writes.length) {
    const stmts = [db.prepare("UPDATE accounts SET rev = rev + 1 WHERE user_id = ?1").bind(u.sub)];
    for (const w of writes)
      stmts.push(
        db.prepare(
          `INSERT INTO sync_items (user_id, kind, item_id, data, deleted, updated_at, rev)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, (SELECT rev FROM accounts WHERE user_id = ?1))
           ON CONFLICT(user_id, kind, item_id) DO UPDATE SET data = excluded.data, deleted = excluded.deleted, updated_at = excluded.updated_at, rev = excluded.rev
           WHERE excluded.updated_at > sync_items.updated_at OR sync_items.kind = 'progress'`,
        ).bind(u.sub, w.it.kind, w.it.id, w.text, w.it.deleted ? 1 : 0, w.u),
      );
    stmts.push(db.prepare("SELECT rev FROM accounts WHERE user_id = ?1").bind(u.sub));
    const out = await db.batch(stmts);
    rev = out[out.length - 1].results[0].rev;
  }
  return json(200, { results, rev });
}

async function exportData(ctx) {
  const u = await requireUser(ctx);
  await limit(ctx, "export", u.sub, [[3, DAY]]);
  await ensureAccount(ctx, u.sub);
  const a = await account(ctx, u.sub);
  const { results } = await ctx.env.DB.prepare("SELECT kind, item_id, data, deleted, updated_at, rev FROM sync_items WHERE user_id = ?1 AND deleted = 0 ORDER BY kind, item_id").bind(u.sub).all();
  const body = {
    application: "Ocean Buddy",
    version: 1,
    exportedAt: new Date(ctx.now()).toISOString(),
    account: { email: typeof u.claims.email === "string" ? u.claims.email : null, createdAt: new Date(a.created_at).toISOString() },
    consent: a.consent_version ? { version: a.consent_version, at: new Date(a.consent_at).toISOString() } : null,
    items: results.map((r) => ({ kind: r.kind, id: r.item_id, data: JSON.parse(r.data), updatedAt: new Date(r.updated_at).toISOString() })),
  };
  return json(200, body, { "content-disposition": 'attachment; filename="ocean-buddy-export.json"' });
}

async function deleteAccount(ctx) {
  const u = await requireUser(ctx);
  await limit(ctx, "delete", u.sub, [[3, DAY]]);
  // Connexion récente exigée (nouveau code e-mail) : un téléphone prêté ne peut pas supprimer le compte.
  if (authTime(u.claims) < Math.floor(ctx.now() / 1000) - REAUTH_SECONDS) throw new HttpError(403, "reauth_required");
  const db = ctx.env.DB;
  await db.batch([
    db.prepare("DELETE FROM sync_items WHERE user_id = ?1").bind(u.sub),
    db.prepare("DELETE FROM apple_credentials WHERE user_id = ?1").bind(u.sub),
    db.prepare("DELETE FROM accounts WHERE user_id = ?1").bind(u.sub),
    db.prepare("INSERT INTO identity_deletions (user_id, created_at) VALUES (?1, ?2) ON CONFLICT(user_id) DO NOTHING").bind(u.sub, ctx.now()),
  ]);
  let identity = "done";
  try {
    await ctx.cfg.idp.deleteUser(u.sub);
    await db.prepare("DELETE FROM identity_deletions WHERE user_id = ?1").bind(u.sub).run();
  } catch {
    identity = "pending";
    logEvent({ evt: "identity_delete_deferred" });
  }
  return withCookies(json(200, { deleted: true, identity }), clearCookies(ctx.cfg));
}

const ROUTES = {
  "GET /api/v1/health": ["health", async (ctx) => json(200, { ok: true, mode: ctx.cfg.dev ? "essai-local" : "production" }), { csrf: false }],
  "POST /api/v1/auth/otp/request": ["otp_request", otpRequest],
  "POST /api/v1/auth/otp/verify": ["otp_verify", otpVerify],
  "GET /api/v1/auth/confirm": ["confirm_page", confirmGet, { csrf: false }],
  "POST /api/v1/auth/confirm": ["confirm", confirmPost, { form: true }],
  "POST /api/v1/auth/refresh": ["refresh", refresh],
  "POST /api/v1/auth/logout": ["logout", logout],
  "GET /api/v1/me": ["me", me, { csrf: false }],
  "POST /api/v1/consent": ["consent", consentSet],
  "DELETE /api/v1/consent": ["consent_delete", consentDelete],
  "POST /api/v1/sync/pull": ["pull", pull],
  "POST /api/v1/sync/push": ["push", push],
  "GET /api/v1/account/export": ["export", exportData, { csrf: false }],
  "DELETE /api/v1/account": ["account_delete", deleteAccount],
};

/** Origines : liste fermée. Requêtes qui modifient : en-tête X-OB-CSRF + Origin autorisée, sauf app native (Bearer, sans Origin web). */
function checkOrigin(ctx, opts) {
  const origin = ctx.request.headers.get("origin");
  if (origin && !ctx.cfg.origins.includes(origin) && !ctx.cfg.nativeOrigins.includes(origin)) throw new HttpError(403, "forbidden_origin");
  if (ctx.request.method === "GET" || opts.csrf === false) return;
  if (opts.form) {
    if (!origin || !ctx.cfg.origins.includes(origin)) throw new HttpError(403, "forbidden_origin");
    return;
  }
  const bearer = /^Bearer /.test(ctx.request.headers.get("authorization") ?? "");
  const hasCookie = !!readCookie(ctx.request, cookieNames(ctx.cfg).at) || !!readCookie(ctx.request, cookieNames(ctx.cfg).rt);
  if (!origin && (bearer || !hasCookie)) return; // app native (CapacitorHttp n'envoie pas d'Origin web)
  if (!origin || ctx.request.headers.get("x-ob-csrf") !== "1") throw new HttpError(403, "csrf");
}
function corsHeaders(ctx) {
  const origin = ctx.request.headers.get("origin");
  if (!origin || !ctx.cfg?.origins.includes(origin)) return {};
  return { "access-control-allow-origin": origin, "access-control-allow-credentials": "true", vary: "Origin" };
}

export function createWorker(overrides = {}) {
  const deps = {
    now: () => Date.now(),
    fetcher: (...a) => fetch(...a),
    ...overrides,
  };
  deps.devIdp ??= devIdentity({ now: deps.now });
  const supaCache = new Map();
  deps.supabaseFor ??= (url, pub, sec) => {
    const k = `${url}|${pub}|${sec}`;
    if (!supaCache.has(k)) supaCache.set(k, supabaseIdentity({ url, publishableKey: pub, secretKey: sec, fetcher: deps.fetcher }));
    return supaCache.get(k);
  };

  async function handle(request, env) {
    const url = new URL(request.url);
    const ctx = { request, env, url, now: deps.now, cfg: null, ip: ipKey(request) };
    const started = deps.now();
    let route = "unknown", status = 500, reason;
    let response;
    try {
      ctx.cfg = readConfig(env, url, deps);
      if (!url.pathname.startsWith("/api/v1/")) throw new HttpError(404, "not_found");
      if (request.method === "OPTIONS") {
        route = "preflight";
        const origin = request.headers.get("origin");
        if (!origin || !ctx.cfg.origins.includes(origin)) throw new HttpError(403, "forbidden_origin");
        response = new Response(null, {
          status: 204,
          headers: { ...BASE_HEADERS, ...corsHeaders(ctx), "access-control-allow-methods": "GET, POST, DELETE", "access-control-allow-headers": "content-type, x-ob-csrf", "access-control-max-age": "600" },
        });
      } else {
        const entry = ROUTES[`${request.method} ${url.pathname}`];
        if (!entry) throw new HttpError(404, "not_found");
        route = entry[0];
        checkOrigin(ctx, entry[2] ?? {});
        await limit(ctx, "all", ctx.ip, [[300, 5 * MIN]]);
        response = await entry[1](ctx);
      }
    } catch (e) {
      const err = e instanceof HttpError ? e : new HttpError(500, "internal");
      if (!(e instanceof HttpError)) console.error(JSON.stringify({ evt: "error", route, kind: e?.name ?? "Error" }));
      reason = err.code;
      response = json(err.status, { error: err.code }, err.headers);
      withCookies(response, err.cookies ?? []);
    }
    if (ctx.cfg) for (const [k, v] of Object.entries(corsHeaders(ctx))) response.headers.set(k, v);
    status = response.status;
    logEvent({ evt: "req", route, status, ms: deps.now() - started, ...(reason ? { reason } : {}) });
    return response;
  }

  /** Tâche planifiée : reprend les suppressions d'identité en attente, purge les suppressions de plus de 90 jours. */
  async function scheduled(env) {
    const db = env.DB;
    await db.prepare("DELETE FROM sync_items WHERE deleted = 1 AND updated_at < ?1").bind(deps.now() - TOMBSTONE_DAYS * DAY).run();
    let idp;
    try {
      idp = readConfig(env, new URL(env.OB_ENV === "local" ? "http://localhost/" : "https://oceanbuddy.app/"), deps).idp;
    } catch {
      return;
    }
    const { results } = await db.prepare("SELECT user_id FROM identity_deletions WHERE attempts < 20 LIMIT 50").all();
    for (const r of results) {
      try {
        await idp.deleteUser(r.user_id);
        await db.prepare("DELETE FROM identity_deletions WHERE user_id = ?1").bind(r.user_id).run();
      } catch {
        await db.prepare("UPDATE identity_deletions SET attempts = attempts + 1 WHERE user_id = ?1").bind(r.user_id).run();
      }
    }
    logEvent({ evt: "scheduled", pending: results.length });
  }

  return {
    fetch: (request, env) => handle(request, env),
    scheduled: (_event, env, ctx) => (ctx?.waitUntil ? ctx.waitUntil(scheduled(env)) : scheduled(env)),
  };
}

export default createWorker();
