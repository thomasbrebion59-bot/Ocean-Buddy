// Durable Object « Guard » : compteurs ATOMIQUES pour les limites de débit (repris de Frigo, server/src/guard.ts).
// Une instance par nom (env.GUARD.idFromName(nom)) :
//   - "rl:<portée>:<empreinte>" : fenêtres glissantes (plusieurs règles à la fois) ;
//   - "day:<portée>:<AAAA-MM-JJ>" : budget global du jour (disjoncteur, ex. e-mails envoyés).
// Chaque lecture-écriture se fait dans une transaction SYNCHRONE (stockage SQLite) : deux requêtes
// simultanées ne lisent jamais la même valeur. Interface par fetch (pas de RPC) : la classe reste testable dans Node.

const DAY_TTL_MS = 48 * 3600_000;

export class Guard {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const args = await request.json();
    if (url.pathname === "/hit") return Response.json(await this.hit(args));
    if (url.pathname === "/budget") return Response.json(await this.budget(args));
    return new Response("not found", { status: 404 });
  }

  /** rules : [{limit, windowMs}] ; la requête n'est comptée que si toutes les règles l'acceptent. */
  async hit({ rules }) {
    const kv = this.ctx.storage.kv;
    const now = Date.now();
    const longest = Math.max(...rules.map((r) => r.windowMs));
    const result = this.ctx.storage.transactionSync(() => {
      const recent = (kv.get("t") ?? []).filter((t) => t > now - longest);
      for (const r of rules) {
        const inWindow = recent.filter((t) => t > now - r.windowMs);
        if (inWindow.length >= r.limit) {
          kv.put("t", recent);
          return { ok: false, retryAfterMs: Math.max(1000, inWindow[0] + r.windowMs - now) };
        }
      }
      recent.push(now);
      kv.put("t", recent);
      return { ok: true };
    });
    await this.ctx.storage.setAlarm(now + longest + 5_000);
    return result;
  }

  async budget({ limit }) {
    const kv = this.ctx.storage.kv;
    const result = this.ctx.storage.transactionSync(() => {
      const used = kv.get("n") ?? 0;
      if (used >= limit) return { ok: false, used };
      kv.put("n", used + 1);
      return { ok: true, used: used + 1 };
    });
    if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(Date.now() + DAY_TTL_MS);
    return result;
  }

  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}
