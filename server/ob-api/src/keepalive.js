// Maintien de Supabase : l'offre gratuite met un projet en pause après une semaine sans assez d'activité.
// Le Worker (tâche planifiée quotidienne) envoie donc une demande SANS EFFET : aucune écriture, aucun e-mail,
// seulement la clé publique (jamais la clé secrète). Elle ne fait que demander à Supabase de chercher un
// jeton de renouvellement qui n'existe pas (réponse attendue : 400 « refresh_token_not_found »).
// Rien ne garantit que Supabase compte cela comme de l'« activité » : voir Ocean-Buddy-orga-docs/comptes/SUPABASE-MAINTIEN.md.
// Ne retourne jamais d'erreur : la tâche planifiée continue quoi qu'il arrive. Aucune clé, aucune adresse dans les résultats.

const SUPABASE_URL = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const TABLE_NAME = /^[a-z_][a-z0-9_]{0,62}$/;
// Jeton volontairement faux : n'appartient à aucune session.
const NO_SUCH_REFRESH_TOKEN = "ob-keepalive-sans-effet";

function authHeaders(key) {
  const headers = { apikey: key };
  // Anciennes clés (JWT « eyJ… ») : aussi en Authorization ; nouvelles clés sb_… : l'en-tête apikey suffit.
  if (key.startsWith("eyJ")) headers.authorization = `Bearer ${key}`;
  return headers;
}

/** fetch avec délai maximal ; la course garantit le retour même si la doublure ou le réseau ignore l'annulation. */
async function limited(fetcher, url, init, timeoutMs) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, timeoutMs);
  });
  try {
    return await Promise.race([fetcher(url, { ...init, signal: controller.signal }), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function probe(name, fetcher, url, init, timeoutMs, accepted) {
  try {
    const r = await limited(fetcher, url, init, timeoutMs);
    if (!r) return { probe: name, status: 0, reason: "timeout" };
    r.body?.cancel?.().catch(() => {}); // la réponse n'est jamais lue : rien à garder, rien à journaliser
    return { probe: name, status: r.status, reason: accepted(r.status) ? "ok" : "refused" };
  } catch {
    return { probe: name, status: 0, reason: "network" };
  }
}

/**
 * @param {{url: string, publishableKey: string, table?: string, fetcher: Function, timeoutMs?: number}} p
 *   table : (facultatif) nom d'une petite table publique lisible par la clé publique ; ajoute une lecture d'une ligne
 *   par l'API REST, la demande la plus proche d'une « requête vers la base de données ».
 * @returns {Promise<Array<{probe: string, status: number, reason: string}>>} [] si rien n'a été envoyé.
 */
export async function supabaseKeepAlive({ url, publishableKey, table, fetcher, timeoutMs = 8000 }) {
  try {
    const base = String(url ?? "").replace(/\/+$/, "");
    if (!SUPABASE_URL.test(base) || !publishableKey || typeof fetcher !== "function") return [];
    const out = [];
    out.push(
      await probe(
        "auth_refresh",
        fetcher,
        `${base}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: { ...authHeaders(publishableKey), "content-type": "application/json" },
          body: JSON.stringify({ refresh_token: NO_SUCH_REFRESH_TOKEN }),
        },
        timeoutMs,
        // 400 attendu (jeton inconnu) ; 5xx ou 429 : Supabase ne répond pas normalement.
        (status) => status < 500 && status !== 429,
      ),
    );
    if (table && TABLE_NAME.test(table)) {
      out.push(await probe("rest_read", fetcher, `${base}/rest/v1/${table}?select=*&limit=1`, { method: "GET", headers: authHeaders(publishableKey) }, timeoutMs, (status) => status === 200));
    }
    return out;
  } catch {
    return [];
  }
}
