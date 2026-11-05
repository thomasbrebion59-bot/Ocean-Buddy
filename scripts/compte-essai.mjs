#!/usr/bin/env node
/*
 * Essai LOCAL du compte gratuit, de bout en bout, sans compte Supabase ni déploiement.
 *
 *   node scripts/compte-essai.mjs            puis ouvrir http://localhost:8788/?compte=essai
 *
 * - Worker ob-api en local (wrangler dev) avec D1 local et le FAUX fournisseur d'identité (code 123456) ;
 *   ce faux fournisseur est refusé partout ailleurs que sur http://localhost (voir server/ob-api/src/index.js, devMode).
 * - Le site est servi sur le port 8788 et /api/* est relayé vers le Worker : même origine, comme sur oceanbuddy.app.
 * - Deux appareils : deux navigateurs (ou une fenêtre privée) avec la même adresse e-mail = le même compte.
 * Prérequis : `npm install --prefix server/ob-api` (wrangler) une fois.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const api = path.join(root, 'server/ob-api');
const SITE_PORT = 8788, API_PORT = 8787;
const wrangler = path.join(api, 'node_modules/.bin/wrangler');
if (!fs.existsSync(wrangler)) {
  console.error('wrangler est absent : lance d’abord  npm install --prefix server/ob-api');
  process.exit(1);
}
if (!fs.existsSync(path.join(api, '.dev.vars'))) fs.copyFileSync(path.join(api, '.dev.vars.example'), path.join(api, '.dev.vars'));

const mig = spawnSync(wrangler, ['d1', 'migrations', 'apply', 'ob-comptes', '--local'], { cwd: api, stdio: 'inherit', input: 'y\n' });
if (mig.status !== 0) process.exit(mig.status ?? 1);
/* Un Worker d'essai déjà lancé sur le port (session précédente) est réutilisé tel quel. */
const running = await fetch(`http://127.0.0.1:${API_PORT}/api/v1/health`).then((r) => r.json()).then((h) => h.mode === 'essai-local').catch(() => false);
if (!running) {
  const worker = spawn(wrangler, ['dev', '--local', '--port', String(API_PORT), '--ip', '127.0.0.1'], { cwd: api, stdio: ['ignore', 'inherit', 'inherit'] });
  process.on('exit', () => worker.kill());
} else console.log(`Worker d'essai déjà en route sur le port ${API_PORT} : réutilisé.`);
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => process.exit(0));

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.avif': 'image/avif' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const headers = { ...req.headers };
    delete headers.host; delete headers.connection; delete headers['content-length'];
    try {
      const r = await fetch(`http://127.0.0.1:${API_PORT}${url.pathname}${url.search}`, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined, redirect: 'manual' });
      const out = {};
      r.headers.forEach((v, k) => { if (k !== 'set-cookie' && k !== 'content-encoding' && k !== 'content-length') out[k] = v; });
      const cookies = r.headers.getSetCookie();
      if (cookies.length) out['set-cookie'] = cookies;
      res.writeHead(r.status, out);
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end('{"error":"worker_unavailable"}');
    }
    return;
  }
  let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (/\/(\.git|server|node_modules|\.wrangler)(\/|$)/.test(path.relative(root, file).replace(/\\/g, '/').replace(/^/, '/')) || !fs.existsSync(file)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(SITE_PORT, '127.0.0.1', () => {
  console.log(`\nEssai du compte : http://localhost:${SITE_PORT}/?compte=essai   (code de connexion : 123456)`);
  console.log('Arrêt : Ctrl+C. Les données de l’essai restent dans server/ob-api/.wrangler (local, ignoré par git).\n');
});
