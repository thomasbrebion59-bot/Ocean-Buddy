// Vérification des jetons d'accès (JWT) émis par Supabase Auth, avec les clés publiques du projet (JWKS).
// Seules les signatures asymétriques sont acceptées (ES256, RS256) : un secret partagé (HS256) ou « none » est refusé.
// Les clés sont gardées en mémoire 10 minutes ; une clé inconnue déclenche au plus un rechargement toutes les 30 s.

const enc = new TextEncoder();
const dec = new TextDecoder();

export function b64urlEncode(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function b64urlDecode(text) {
  if (typeof text !== "string" || !/^[A-Za-z0-9_-]*$/.test(text)) throw new Error("b64");
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
const jsonPart = (part) => JSON.parse(dec.decode(b64urlDecode(part)));

const ALGS = {
  ES256: { kty: "EC", import: { name: "ECDSA", namedCurve: "P-256" }, verify: { name: "ECDSA", hash: "SHA-256" } },
  RS256: { kty: "RSA", import: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, verify: { name: "RSASSA-PKCS1-v1_5" } },
};

export class JwtError extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}

/** Source de clés : `load()` renvoie {keys:[JWK]} (fetch du JWKS Supabase, ou clés du faux fournisseur local). */
export function keyCache(load, { ttlMs = 600_000, minRefetchMs = 30_000 } = {}) {
  let keys = null, at = 0, pending = null;
  const imported = new Map();
  async function refresh() {
    pending ??= (async () => {
      try {
        const set = await load();
        if (!set || !Array.isArray(set.keys)) throw new JwtError("jwks_invalid");
        keys = set.keys;
        at = Date.now();
        imported.clear();
      } finally {
        pending = null;
      }
    })();
    await pending;
  }
  return async function find(kid, alg) {
    if (!keys || Date.now() - at > ttlMs) await refresh();
    let jwk = keys.find((k) => k.kid === kid);
    if (!jwk && Date.now() - at > minRefetchMs) {
      await refresh();
      jwk = keys.find((k) => k.kid === kid);
    }
    if (!jwk) throw new JwtError("unknown_kid");
    const spec = ALGS[alg];
    if (jwk.kty !== spec.kty || (jwk.alg && jwk.alg !== alg)) throw new JwtError("alg_mismatch");
    const id = `${kid}|${alg}`;
    if (!imported.has(id)) {
      const { kty, crv, x, y, n, e } = jwk;
      imported.set(id, crypto.subtle.importKey("jwk", { kty, crv, x, y, n, e, ext: true }, spec.import, false, ["verify"]));
    }
    return imported.get(id);
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Vérifie signature et revendications ; renvoie les revendications. Lève JwtError(reason) sinon. */
export async function verifyJwt(token, { findKey, issuer, audience = "authenticated", now = Date.now() }) {
  if (typeof token !== "string" || token.length > 8192) throw new JwtError("malformed");
  const parts = token.split(".");
  if (parts.length !== 3) throw new JwtError("malformed");
  let header, claims;
  try {
    header = jsonPart(parts[0]);
    claims = jsonPart(parts[1]);
  } catch {
    throw new JwtError("malformed");
  }
  if (!ALGS[header.alg]) throw new JwtError("unsupported_alg");
  if (typeof header.kid !== "string") throw new JwtError("no_kid");
  const key = await findKey(header.kid, header.alg);
  let sig = b64urlDecode(parts[2]);
  const ok = await crypto.subtle.verify(ALGS[header.alg].verify, key, sig, enc.encode(`${parts[0]}.${parts[1]}`));
  if (!ok) throw new JwtError("bad_signature");
  const t = Math.floor(now / 1000);
  if (typeof claims.exp !== "number" || claims.exp <= t) throw new JwtError("expired");
  if (typeof claims.iat === "number" && claims.iat > t + 60) throw new JwtError("future");
  if (claims.iss !== issuer) throw new JwtError("issuer");
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(audience)) throw new JwtError("audience");
  if (claims.role !== "authenticated" || claims.is_anonymous === true) throw new JwtError("role");
  if (typeof claims.sub !== "string" || !UUID.test(claims.sub)) throw new JwtError("subject");
  return claims;
}

/** Moment de la dernière authentification (code e-mail, Apple…), en secondes : sert à exiger une connexion récente. */
export function authTime(claims) {
  const stamps = Array.isArray(claims.amr) ? claims.amr.map((a) => Number(a && a.timestamp)).filter(Number.isFinite) : [];
  return stamps.length ? Math.max(...stamps) : Number(claims.iat) || 0;
}

/** Signature ES256 (faux fournisseur local et tests uniquement). */
export async function signEs256(privateKey, kid, claims) {
  const head = b64urlEncode(enc.encode(JSON.stringify({ alg: "ES256", typ: "JWT", kid })));
  const body = b64urlEncode(enc.encode(JSON.stringify(claims)));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, enc.encode(`${head}.${body}`));
  return `${head}.${body}.${b64urlEncode(new Uint8Array(sig))}`;
}
