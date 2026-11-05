// Fournisseurs d'identité. En production : Supabase Auth UNIQUEMENT pour vérifier l'identité (code à 6 chiffres
// ou lien magique par e-mail ; Se connecter avec Apple à l'étape 3). Aucune donnée d'application chez Supabase.
// En essai local : un faux fournisseur, utilisable seulement si toutes les conditions de devMode() (index.js) sont réunies.

import { keyCache, JwtError, signEs256, verifyJwt } from "./jwt.js";

export class IdpError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function session(body) {
  if (!body || typeof body.access_token !== "string" || typeof body.refresh_token !== "string") throw new IdpError("idp_unavailable", 502);
  return { access_token: body.access_token, refresh_token: body.refresh_token, expires_in: Number(body.expires_in) || 3600 };
}

/** Supabase Auth (API REST, appelée seulement par le Worker ; le navigateur ne la voit jamais). */
export function supabaseIdentity({ url, publishableKey, secretKey, fetcher }) {
  const base = `${url.replace(/\/+$/, "")}/auth/v1`;
  const findKey = keyCache(async () => {
    const r = await fetcher(`${base}/.well-known/jwks.json`, { headers: { apikey: publishableKey } });
    if (!r.ok) throw new JwtError("jwks_unavailable");
    return r.json();
  });
  async function call(path, { method = "POST", body, token, admin = false } = {}) {
    const key = admin ? secretKey : publishableKey;
    const headers = { apikey: key, "content-type": "application/json" };
    // Anciennes clés (JWT « eyJ… ») : aussi en Authorization ; nouvelles clés sb_… : l'en-tête apikey suffit.
    if (token) headers.authorization = `Bearer ${token}`;
    else if (key.startsWith("eyJ")) headers.authorization = `Bearer ${key}`;
    let r;
    try {
      r = await fetcher(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      throw new IdpError("idp_unavailable", 502);
    }
    const data = await r.json().catch(() => null);
    if (r.status === 429) throw new IdpError("rate_limited", 429);
    if (r.status >= 500) throw new IdpError("idp_unavailable", 502);
    return { status: r.status, ok: r.ok, data };
  }
  return {
    kind: "supabase",
    issuer: base,
    findKey,
    async requestOtp(email) {
      const r = await call("/otp", { body: { email, create_user: true } });
      if (!r.ok) throw new IdpError("otp_failed", 502);
    },
    async verifyOtp(email, code) {
      const r = await call("/verify", { body: { type: "email", email, token: code } });
      if (!r.ok) throw new IdpError("invalid_code", 401);
      return session(r.data);
    },
    async verifyTokenHash(tokenHash) {
      const r = await call("/verify", { body: { type: "email", token_hash: tokenHash } });
      if (!r.ok) throw new IdpError("invalid_link", 401);
      return session(r.data);
    },
    async refresh(refreshToken) {
      const r = await call("/token?grant_type=refresh_token", { body: { refresh_token: refreshToken } });
      if (!r.ok) throw new IdpError("invalid_refresh", 401);
      return session(r.data);
    },
    async logout(accessToken) {
      await call("/logout?scope=local", { token: accessToken }).catch(() => {});
    },
    async deleteUser(sub) {
      const r = await call(`/admin/users/${encodeURIComponent(sub)}`, { method: "DELETE", admin: true });
      if (!r.ok && r.status !== 404) throw new IdpError("idp_delete_failed", 502);
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Faux fournisseur d'ESSAI LOCAL : code fixe 123456, jetons ES256 signés par une clé créée en mémoire au démarrage.
// Mêmes jetons et même vérification (JWKS) que Supabase, seul l'émetteur change. Jamais actif en production :
// devMode() exige OB_ENV=local, OB_DEV_FAKE_IDP=1, aucune adresse Supabase et une requête sur localhost en http.
export const DEV_ISSUER = "http://localhost/ob-dev-idp";
export const DEV_CODE = "123456";
let devKeys = null;
async function devKeyPair() {
  devKeys ??= (async () => {
    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
    return { privateKey: pair.privateKey, jwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, kid: "dev-1", alg: "ES256", use: "sig" } };
  })();
  return devKeys;
}
async function devUserId(email) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`ob-dev|${email}`)));
  const h = [...d.subarray(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export function devIdentity({ now = () => Date.now() } = {}) {
  const findKey = keyCache(async () => ({ keys: [(await devKeyPair()).jwk] }));
  async function issue(sub, email, authAt) {
    const { privateKey } = await devKeyPair();
    const t = Math.floor(now() / 1000);
    const common = { sub, email, role: "authenticated", iss: DEV_ISSUER, iat: t, amr: [{ method: "otp", timestamp: authAt }] };
    return {
      access_token: await signEs256(privateKey, "dev-1", { ...common, aud: "authenticated", exp: t + 3600 }),
      refresh_token: await signEs256(privateKey, "dev-1", { ...common, aud: "ob-dev-refresh", exp: t + 30 * 86400 }),
      expires_in: 3600,
    };
  }
  return {
    kind: "dev",
    issuer: DEV_ISSUER,
    findKey,
    async requestOtp() {},
    async verifyOtp(email, code) {
      if (code !== DEV_CODE) throw new IdpError("invalid_code", 401);
      return issue(await devUserId(email), email, Math.floor(now() / 1000));
    },
    async verifyTokenHash() {
      throw new IdpError("invalid_link", 401);
    },
    async refresh(refreshToken) {
      try {
        const c = await verifyJwt(refreshToken, { findKey, issuer: DEV_ISSUER, audience: "ob-dev-refresh", now: now() });
        return issue(c.sub, c.email, c.amr[0].timestamp);
      } catch {
        throw new IdpError("invalid_refresh", 401);
      }
    },
    async logout() {},
    async deleteUser() {},
  };
}
