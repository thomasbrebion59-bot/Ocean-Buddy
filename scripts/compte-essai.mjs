#!/usr/bin/env node
/*
 * Essai LOCAL du compte gratuit, de bout en bout, sans compte Supabase ni déploiement.
 *
 *   node scripts/compte-essai.mjs            puis ouvrir http://localhost:8788/?compte=essai
 *
 * - Worker ob-api en local (wrangler dev) avec D1 local et le FAUX fournisseur d'identité (code 123456), d'après
 *   server/ob-api/wrangler.essai.toml : la configuration de production (wrangler.toml) contient SUPABASE_URL, que le mode
 *   essai refuse (500 « misconfigured »). Ce faux fournisseur est refusé partout ailleurs que sur http://localhost
 *   (server/ob-api/src/index.js, devMode).
 * - Le site est servi sur le port 8788 et /api/* est relayé vers le Worker : même origine, comme sur oceanbuddy.app.
 * - App iPhone simulée : /__natif/api/* relaie vers le Worker SANS Origin, cookie ni X-OB-CSRF et sans renvoyer de cookie,
 *   comme CapacitorHttp (URLSession) dans l'app. Le paquet mobile (mobile/www) est servi sous /natif/ s'il a été construit
 *   avec OB_ACCOUNT_API=http://localhost:8788/__natif/api/v1 (voir scripts/compte-essai-e2e.mjs).
 * - Deux appareils : deux navigateurs (ou une fenêtre privée) avec la même adresse e-mail = le même compte.
 * Ports : OB_ESSAI_PORT (site, 8788) et OB_ESSAI_API_PORT (Worker, 8787). Données de l'essai : server/ob-api/.wrangler/essai.
 * Prérequis : `npm install --prefix server/ob-api` (wrangler) une fois.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const api = path.join(root, 'server/ob-api');
const www = path.join(root, 'mobile/www');
const SITE_PORT = Number(process.env.OB_ESSAI_PORT) || 8788, API_PORT = Number(process.env.OB_ESSAI_API_PORT) || 8787;
const CONFIG = 'wrangler.essai.toml', PERSIST = '.wrangler/essai';
const wrangler = path.join(api, 'node_modules/.bin/wrangler');
if (!fs.existsSync(wrangler)) {
  console.error('wrangler est absent : lance d’abord  npm install --prefix server/ob-api');
  process.exit(1);
}
const busy = await fetch(`http://127.0.0.1:${API_PORT}/`).then(() => true, () => false);
if (busy) {
  console.error(`Le port ${API_PORT} est déjà pris (un autre essai ?). Choisis-en un autre : OB_ESSAI_API_PORT=8797 OB_ESSAI_PORT=8798 node scripts/compte-essai.mjs`);
  process.exit(1);
}

const origins = `http://localhost:${SITE_PORT},http://127.0.0.1:${SITE_PORT}`;
const mig = spawnSync(wrangler, ['d1', 'migrations', 'apply', 'ob-comptes-essai', '--local', '-c', CONFIG, '--persist-to', PERSIST], { cwd: api, stdio: ['pipe', 'inherit', 'inherit'], input: 'y\n' });
if (mig.status !== 0) process.exit(mig.status ?? 1);
const worker = spawn(wrangler, ['dev', '--local', '-c', CONFIG, '--persist-to', PERSIST, '--port', String(API_PORT), '--ip', '127.0.0.1', '--var', `ALLOWED_ORIGINS:${origins}`, '--show-interactive-dev-session=false'], { cwd: api, stdio: ['ignore', 'inherit', 'inherit'] });
process.on('exit', () => worker.kill());
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => process.exit(0));

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.avif': 'image/avif' };

async function relay(req, res, target, native) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const headers = { ...req.headers };
  for (const h of ['host', 'connection', 'content-length']) delete headers[h];
  /* App simulée : URLSession n'envoie ni Origin, ni Referer, ni cookie de page, ni en-tête X-OB-CSRF. */
  if (native) for (const h of Object.keys(headers)) if (/^(origin|referer|cookie|x-ob-csrf|sec-fetch-.*)$/i.test(h)) delete headers[h];
  try {
    const r = await fetch(`http://127.0.0.1:${API_PORT}${target}`, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined, redirect: 'manual' });
    const out = {};
    r.headers.forEach((v, k) => { if (k !== 'set-cookie' && k !== 'content-encoding' && k !== 'content-length') out[k] = v; });
    const cookies = r.headers.getSetCookie();
    if (cookies.length && !native) out['set-cookie'] = cookies;
    res.writeHead(r.status, out);
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch {
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end('{"error":"worker_unavailable"}');
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) return relay(req, res, url.pathname + url.search, false);
  if (url.pathname.startsWith('/__natif/api/')) return relay(req, res, url.pathname.slice('/__natif'.length) + url.search, true);
  let base = root, rel = decodeURIComponent(url.pathname);
  if (rel === '/natif' || rel.startsWith('/natif/')) { base = www; rel = rel.slice('/natif'.length) || '/'; }
  let file = path.normalize(path.join(base, rel));
  if (!file.startsWith(base + path.sep) && file !== base) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (/\/(\.git|server|node_modules|\.wrangler)(\/|$)/.test(path.relative(root, file).replace(/\\/g, '/').replace(/^/, '/')) || !fs.existsSync(file)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(SITE_PORT, '127.0.0.1', () => {
  console.log(`\nEssai du compte : http://localhost:${SITE_PORT}/?compte=essai   (code de connexion : 123456)`);
  if (fs.existsSync(path.join(www, 'index.html'))) console.log(`App iPhone simulée (paquet mobile/www) : http://localhost:${SITE_PORT}/natif/`);
  console.log(`Arrêt : Ctrl+C. Les données de l’essai restent dans server/ob-api/${PERSIST} (local, ignoré par git).\n`);
});
