/* Exécute un scénario de démarrage dans Chrome headless (CDP, sans dépendance) et renvoie les données brutes.
 * Runs one boot scenario in headless Chrome (CDP, no dependencies) and returns the raw data. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const instrument = require('./instrument.cjs');

export const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', woff2: 'font/woff2', woff: 'font/woff', ico: 'image/x-icon', txt: 'text/plain', wasm: 'application/wasm', mp3: 'audio/mpeg', mp4: 'video/mp4' };

export function chromePath() {
  const c = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
  const f = c.find(p => fs.existsSync(p));
  if (!f) throw Error('Chrome introuvable / Chrome not found (set CHROME=/path/to/chrome)');
  return f;
}

export function freePort(start) {
  return new Promise(resolve => {
    const tryPort = p => { const s = net.createServer(); s.once('error', () => tryPort(p + 1)); s.listen(p, '127.0.0.1', () => s.close(() => resolve(p))); };
    tryPort(start);
  });
}

export async function serve(root, startPort) {
  const port = await freePort(startPort);
  const server = http.createServer((req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'content-type': MIME[path.extname(f).slice(1)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      fs.createReadStream(f).pipe(res);
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  await new Promise(r => server.listen(port, '127.0.0.1', r));
  return { port, close: () => server.close() };
}

class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pend = new Map(); this.listeners = [];
    ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && this.pend.has(d.id)) { this.pend.get(d.id)(d); this.pend.delete(d.id); } else this.listeners.forEach(f => f(d)); });
  }
  send(method, params = {}) { return new Promise((res, rej) => { const i = ++this.id; this.pend.set(i, d => d.error ? rej(Error(method + ': ' + d.error.message)) : res(d.result)); this.ws.send(JSON.stringify({ id: i, method, params })); }); }
  async eval(expr) { const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.result?.value; }
  on(f) { this.listeners.push(f); }
}

/* scenario: {root,mode:'returning'|'restore'|'new',native,width,height,seedJs,throttle,startPort,cdpPort,outDir,shots,maxWaitMs,afterLiftMs} */
export async function runScenario(sc, log = () => {}) {
  const srv = await serve(sc.root, sc.startPort);
  const cdpPort = await freePort(sc.cdpPort);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-bootcheck-'));
  const chrome = spawn(chromePath(), ['--headless=new', `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
  const cleanup = () => { try { chrome.kill('SIGKILL'); } catch (_) {} srv.close(); if (!process.argv.includes('--keep')) { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {} } };
  try {
    let wsUrl;
    for (let i = 0; i < 75 && !wsUrl; i++) { try { const j = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); wsUrl = j.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(200); }
    if (!wsUrl) throw Error('Chrome n’a pas démarré / Chrome did not start');
    const ws = new WebSocket(wsUrl); await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
    const c = new Cdp(ws); const errors = [];
    c.on(d => {
      if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; errors.push({ kind: 'exception', text: (x.exception?.description || x.text || '').split('\n').slice(0, 3).join(' | ').slice(0, 300) }); }
      if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push({ kind: 'console.error', text: d.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 300) });
    });
    await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Network.enable');
    await c.send('Network.setBypassServiceWorker', { bypass: true });
    await c.send('Emulation.setDeviceMetricsOverride', { width: sc.width || 390, height: sc.height || 844, deviceScaleFactor: 3, mobile: true });
    await c.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await c.send('Emulation.setUserAgentOverride', { userAgent: UA, platform: 'iPhone' });
    try { await c.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 47, bottom: 34, left: 0, right: 0 } }); } catch (_) {}
    const url = `http://127.0.0.1:${srv.port}/index.html`;

    /* Passe 1 : profil neuf, on prépare l'utilisateur (hors mesure). / Pass 1: seed the user (not measured). */
    if (sc.mode !== 'new') {
      await c.send('Page.navigate', { url });
      for (let i = 0; i < 60; i++) { if (await c.eval(`document.readyState==='complete'&&typeof finishOnb==='function'||!!window.__seedReady`)) break; await sleep(250); }
      await sleep(800);
      const seeded = await c.eval(`(()=>{try{${sc.seedJs}}catch(e){return 'ERR '+e.message}return !!localStorage.getItem('oceanbuddy_v1')})()`);
      if (seeded !== true) throw Error('Préparation de l’utilisateur impossible / seeding failed: ' + seeded);
      await sleep(1200);
      if (sc.mode === 'restore') {
        await c.eval(`go('home')`); await sleep(1200);
        await c.eval(`(()=>{document.getElementById('screenWrap').scrollTop=1100})()`); await sleep(800);
        await c.eval(`history.replaceState({...history.state,route:{...(history.state&&history.state.route),scroll:1100,screen:'home'}},'')`);
      }
    }
    else { /* échauffement de Chrome (premier chargement lent), puis stockage vidé / warm Chrome up, then wipe storage */
      await c.send('Page.navigate', { url });
      for (let i = 0; i < 60; i++) { if (await c.eval(`document.readyState==='complete'`)) break; await sleep(250); }
      await sleep(1500);
      await c.send('Storage.clearDataForOrigin', { origin: `http://127.0.0.1:${srv.port}`, storageTypes: 'all' });
      await c.eval(`(()=>{try{localStorage.clear();sessionStorage.clear()}catch(_){}})()`);
    }
    if (sc.mode !== 'restore') { await c.send('Page.navigate', { url: 'about:blank' }); await sleep(300); }
    errors.length = 0; /* on ne garde que les erreurs de la mesure / measured pass only */

    /* Passe 2 : démarrage mesuré. / Pass 2: measured start. */
    await c.send('Page.addScriptToEvaluateOnNewDocument', { source: instrument({ native: !!sc.native }) });
    if (sc.throttle > 1) await c.send('Emulation.setCPUThrottlingRate', { rate: sc.throttle });
    fs.mkdirSync(sc.outDir, { recursive: true });
    for (const f of fs.readdirSync(sc.outDir)) if (/^(shot-|lift|timeline|summary)/.test(f)) fs.rmSync(path.join(sc.outDir, f));
    const tStart = Date.now(); let lastShot = -1e9, nShots = 0;
    c.on(d => {
      if (d.method !== 'Page.screencastFrame') return;
      const t = Date.now() - tStart; c.send('Page.screencastFrameAck', { sessionId: d.params.sessionId }).catch(() => {});
      if (!sc.shots || t - lastShot < 250) return; lastShot = t; nShots++;
      fs.writeFileSync(path.join(sc.outDir, `shot-${String(t).padStart(5, '0')}ms.jpg`), Buffer.from(d.params.data, 'base64'));
    });
    if (sc.shots) await c.send('Page.startScreencast', { format: 'jpeg', quality: 40, maxWidth: 390, maxHeight: 844, everyNthFrame: 1 });
    await c.send(sc.mode === 'restore' ? 'Page.reload' : 'Page.navigate', sc.mode === 'restore' ? {} : { url });

    /* On attend la levée du rideau (ou le premier rendu), puis on laisse tourner afterLiftMs. */
    const afterLift = sc.afterLiftMs || 6500, maxWait = sc.maxWaitMs || 40000;
    let liftPageT = null, shot300 = null;
    while (Date.now() - tStart < maxWait) {
      await sleep(120);
      const st = await c.eval(`(()=>{const B=window.__bc;if(!B)return null;const o=window.OceanBoot;const fp=performance.getEntriesByName('first-paint')[0];return {has:!!o,lifted:o?!!o.lifted:null,liftedAt:o&&o.liftedAt,fp:fp&&fp.startTime,now:performance.now()}})()`).catch(() => null);
      if (!st) continue;
      const lt = st.has ? (st.lifted ? st.liftedAt ?? st.now : null) : (st.now > 1500 && st.fp != null ? st.fp : null);
      if (lt == null) continue;
      if (liftPageT == null) liftPageT = lt;
      if (!shot300 && st.now >= liftPageT + 300) {
        try { const s = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: sc.width || 390, height: sc.height || 844, scale: 1 } }); shot300 = Buffer.from(s.data, 'base64'); fs.writeFileSync(path.join(sc.outDir, 'lift+300.png'), shot300); } catch (_) {}
      }
      if (st.now >= liftPageT + afterLift) break;
    }
    if (sc.shots) await c.send('Page.stopScreencast').catch(() => {});
    const raw = await c.eval(`JSON.stringify({s:window.__bc.s,ev:window.__bc.ev,liftEvent:window.__bc.liftEvent})`);
    return { ...JSON.parse(raw), errors, shot300, nShots };
  } finally { cleanup(); }
}
