#!/usr/bin/env node
/*
 * Essai de bout en bout du compte (LOCAL uniquement : faux fournisseur, code 123456), dans un Chrome headless isolé
 * au format iPhone 430 × 932. Aucune requête vers le service en ligne : l'app simulée ne parle qu'à l'essai local.
 *
 *   1. OB_ESSAI_PORT=8798 OB_ESSAI_API_PORT=8797 node scripts/compte-essai.mjs                (dans un autre terminal)
 *   2. OB_ACCOUNT_API=http://localhost:8798/__natif/api/v1 node scripts/build-mobile.cjs      (paquet de l'app simulée)
 *   3. node scripts/compte-essai-e2e.mjs --site http://localhost:8798 --out <dossier des captures>
 *
 * Scénarios : site (première visite → onboarding → « Crée ton compte » → code → sauvegarde) ; « Plus tard » puis un seul
 * rappel au 3e favori ; app iPhone simulée AVEC le plugin OceanAccount (faux pont Capacitor : Trousseau simulé,
 * CapacitorHttp relayé sans Origin ni cookie) ; app 1.4.x simulée SANS le plugin (aucun compte) ; écran d'accueil EN/ES.
 * Chrome : profil jetable, port CDP 9347 (OB_E2E_CDP), service worker contourné avant toute navigation.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromePath } from './boot-check/runner.mjs';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d; };
const SITE = opt('site', 'http://localhost:8788').replace(/\/$/, '');
const OUT = path.resolve(opt('out', 'out/compte-e2e'));
const CDP = Number(process.env.OB_E2E_CDP) || 9347;
const W = 430, H = 932;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(SITE)) throw Error('Essai local seulement : --site http://localhost:<port>');

class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pend = new Map(); this.listeners = [];
    ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && this.pend.has(d.id)) { this.pend.get(d.id)(d); this.pend.delete(d.id); } else this.listeners.forEach((f) => f(d)); });
  }
  send(method, params = {}) { return new Promise((res, rej) => { const i = ++this.id; this.pend.set(i, (d) => (d.error ? rej(Error(method + ': ' + d.error.message)) : res(d.result))); this.ws.send(JSON.stringify({ id: i, method, params })); }); }
  async eval(expr) { const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; }
}

/* Faux pont Capacitor iOS (injecté avant tout script) : plateforme « ios », plugins déclarés comme le ferait l'app.
   Le Trousseau et les Préférences simulés sont rangés sous des clés « __sim_ios_* », exclues des contrôles de fuite. */
const fakeBridge = ({ withAccount, site }) => `(()=>{
  const SITE=${JSON.stringify(site)},LOG=[];window.__simLog=LOG;
  const kc=()=>{try{return JSON.parse(localStorage.getItem('__sim_ios_keychain')||'null');}catch(_){return null;}};
  const P=(name,methods)=>({name,methods:methods.map(m=>typeof m==='string'?{name:m,rtype:'promise'}:m)});
  const headers=[P('CapacitorHttp',['request','get','post','put','patch','delete']),P('Preferences',['get','set','remove','keys','clear']),
    P('App',['getInfo','minimizeApp',{name:'addListener',rtype:'callback'},'removeAllListeners']),P('StatusBar',['setStyle','show','hide']),
    P('SplashScreen',['show','hide']),P('CapacitorUpdater',['notifyAppReady','list','download','next','set','current']),P('Browser',['open']),P('Share',['share']),P('Filesystem',['writeFile'])];
  ${withAccount ? "headers.push(P('OceanAccount',['getTokens','setTokens','clearTokens']));" : ''}
  window.webkit={messageHandlers:{bridge:{postMessage(){}}}};
  const impl={
    CapacitorHttp:{async request(o){const url=String(o.url||'');LOG.push({method:o.method||'GET',url,auth:!!(o.headers&&(o.headers.Authorization||o.headers.authorization))});
      if(!url.startsWith(SITE+'/__natif/'))return {status:404,data:'',headers:{}};
      const r=await fetch(url,{method:o.method||'GET',headers:o.headers||{},body:o.data===undefined?undefined:JSON.stringify(o.data),credentials:'omit',cache:'no-store'});
      const t=await r.text();let data=t;try{data=t?JSON.parse(t):'';}catch(_){}return {status:r.status,data,headers:{}};},
      async get(o){return impl.CapacitorHttp.request({...o,method:'GET'});}},
    Preferences:{async get({key}){return {value:localStorage.getItem('__sim_ios_prefs:'+key)};},async set({key,value}){localStorage.setItem('__sim_ios_prefs:'+key,value);return {};},async remove({key}){localStorage.removeItem('__sim_ios_prefs:'+key);return {};}},
    App:{async getInfo(){return {version:'1.5.0',build:'1'};}},
    CapacitorUpdater:{async notifyAppReady(){return {};},async list(){return {bundles:[]};}},
    OceanAccount:{async getTokens(){return kc()||{};},async setTokens({access,refresh}){localStorage.setItem('__sim_ios_keychain',JSON.stringify({access,refresh}));return {};},async clearTokens(){localStorage.removeItem('__sim_ios_keychain');return {};}},
  };
  let cb=0;
  window.Capacitor={PluginHeaders:headers,
    nativePromise(plugin,method,options){const f=impl[plugin]&&impl[plugin][method];return f?Promise.resolve().then(()=>f(options||{})):Promise.resolve({});},
    nativeCallback(){return 'cb'+(++cb);},
    addListener(){return {remove(){}};}};
  window.__simKeychain=kc;
})();`;

async function launch() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-compte-e2e-'));
  const chrome = spawn(chromePath(), ['--headless=new', `--remote-debugging-port=${CDP}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--lang=fr-FR', 'about:blank'], { stdio: 'ignore' });
  let wsUrl;
  for (let i = 0; i < 75 && !wsUrl; i++) { try { const j = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); wsUrl = j.find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(200); }
  if (!wsUrl) throw Error(`Chrome n’a pas démarré (port CDP ${CDP} occupé ?)`);
  const ws = new WebSocket(wsUrl); await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  const c = new Cdp(ws), errors = [];
  c.listeners.push((d) => {
    if (d.method === 'Runtime.exceptionThrown') errors.push((d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').split('\n')[0].slice(0, 200));
  });
  await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Network.enable');
  await c.send('Network.setBypassServiceWorker', { bypass: true });
  await c.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 3, mobile: true });
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await c.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148', platform: 'iPhone' });
  try { await c.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 59, bottom: 34, left: 0, right: 0 } }); } catch (_) {}
  const close = () => { try { chrome.kill('SIGKILL'); } catch (_) {} try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {} };
  return { c, errors, close };
}

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'OK ' : 'KO '} ${name}${detail ? ' — ' + detail : ''}`); };
async function until(c, expr, ms = 15000, label = expr) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await c.eval(expr).catch(() => false)) return true; await sleep(200); }
  throw Error('Délai dépassé : ' + label);
}
async function shot(c, name) { const s = await c.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(s.data, 'base64')); }
async function type(c, selector, text) { await c.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.focus();e.value='';return true;})()`); await c.send('Input.insertText', { text }); }
const click = (c, selector) => c.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('absent: '+${JSON.stringify(selector)});e.click();return true;})()`);
async function onboarding(c) {
  await until(c, `!!document.querySelector('#onb .onb-step.active .onb-btn')&&getComputedStyle(document.getElementById('onb')).display!=='none'&&document.documentElement.classList.contains('ob-booting')===false`, 30000, 'onboarding');
  await click(c, '#onb .onb-step[data-step="0"] .onb-btn'); await sleep(400);
  await click(c, '#sportGrid .sport-card[data-sp="surf"]'); await click(c, '#onb .onb-step[data-step="1"] .onb-btn'); await sleep(400);
  await click(c, '#lvlCards .lvl-card[data-lvl="debutant"]'); await click(c, '#onb .onb-step[data-step="2"] .onb-btn'); await sleep(400);
  await click(c, '#onb .onb-step[data-step="3"] .onb-btn');
}
const INVITE = `!!document.querySelector('.oba.open #obaEmail')&&/Crée ton compte|Create your account|Crea tu cuenta/.test(document.getElementById('obaTitle')?.textContent||'')`;
const LEAK = `(()=>{const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('__sim_ios_keychain'))continue;const v=localStorage.getItem(k)||'';if(/eyJ[A-Za-z0-9_-]{10,}\\./.test(v))out.push(k);}
  for(let i=0;i<sessionStorage.length;i++){const k=sessionStorage.key(i);if(/eyJ[A-Za-z0-9_-]{10,}\\./.test(sessionStorage.getItem(k)||''))out.push('session:'+k);}
  if(/ob_at|ob_rt|eyJ/.test(document.cookie))out.push('document.cookie');return out;})()`;
const geometry = `(()=>{const r=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {top:Math.round(b.top),bottom:Math.round(b.bottom),h:Math.round(b.height),w:Math.round(b.width)};};
  return {later:r('.oba.open .oba-later'),main:r('.oba.open .oba-main'),email:r('.oba.open #obaEmail'),close:r('.oba.open .oba-x'),vh:innerHeight,focused:document.activeElement&&document.activeElement.id};})()`;

async function signIn(c, email, prefix) {
  await type(c, '#obaEmail', email);
  await click(c, '.oba.open .oba-main');
  await until(c, `!!document.querySelector('.oba.open #obaCode')`, 15000, 'écran du code');
  const code = await c.eval(`(()=>{const e=document.getElementById('obaCode');return {type:e.type,inputmode:e.inputMode,ac:e.autocomplete}})()`);
  check(`${prefix} : champ du code (clavier numérique, code à usage unique)`, code.inputmode === 'numeric' && code.ac === 'one-time-code', JSON.stringify(code));
  await shot(c, `${prefix}-02-code`);
  await type(c, '#obaCode', '123456');
  await until(c, `!!document.querySelector('.oba.open #obaAge')`, 15000, 'écran de consentement').catch(async (e) => {
    const why = await c.eval(`JSON.stringify({err:document.querySelector('.oba-err')?.textContent,log:(window.__simLog||[]).slice(-4)})`).catch(() => '');
    throw Error(e.message + ' ' + why);
  });
  await shot(c, `${prefix}-03-consentement`);
  await c.eval(`document.getElementById('obaAge').checked=true`);
  await click(c, '.oba.open .oba-main');
  await until(c, `!!document.querySelector('.oba.open')&&/C’est sauvegardé|It’s saved|Guardado/.test(document.getElementById('obaTitle')?.textContent||'')`, 30000, 'sauvegarde faite');
  await shot(c, `${prefix}-04-sauvegarde`);
}

async function web() {
  const { c, errors, close } = await launch();
  try {
    await c.send('Page.navigate', { url: `${SITE}/?compte=essai&lang=fr` });
    await onboarding(c);
    await until(c, INVITE, 15000, 'invitation après l’onboarding');
    await sleep(500);
    const g = await c.eval(geometry);
    check('site : « Crée ton compte » juste après l’onboarding, avec le champ e-mail', !!g.email);
    check('site : « Plus tard » visible sans défiler, zone ≥ 44 px', g.later && g.later.bottom <= g.vh && g.later.h >= 44, JSON.stringify(g.later));
    check('site : pas de clavier d’office (aucun champ sélectionné)', g.focused !== 'obaEmail', 'focus=' + g.focused);
    const attrs = await c.eval(`(()=>{const e=document.getElementById('obaEmail');return {type:e.type,inputmode:e.inputMode,ac:e.autocomplete}})()`);
    check('site : clavier e-mail', attrs.type === 'email' && attrs.inputmode === 'email' && attrs.ac === 'email', JSON.stringify(attrs));
    await shot(c, 'site-01-invitation');
    await signIn(c, `site.${Date.now()}@example.com`, 'site');
    check('site : aucun jeton lisible (cookies HttpOnly, rien dans le stockage)', (await c.eval(LEAK)).length === 0);
    await click(c, '.oba.open .oba-main');
    await c.eval(`openSettings()`); await sleep(800);
    const set = await c.eval(`document.getElementById('obaSettings')?.innerText||''`);
    check('site : Réglages → Mon compte et sauvegarde (connecté, export, suppression)', /Connecté/.test(set) && /Supprimer mon compte/.test(set), set.replace(/\s+/g, ' ').slice(0, 120));
    await c.eval(`document.getElementById('obaSettings').scrollIntoView({block:'start'})`); await sleep(300);
    await shot(c, 'site-05-reglages');
    check('site : aucune erreur JavaScript', errors.length === 0, errors.join(' | '));
  } finally { close(); }
}

async function later() {
  const { c, errors, close } = await launch();
  try {
    await c.send('Page.navigate', { url: `${SITE}/?compte=essai&lang=fr` });
    await onboarding(c);
    await until(c, INVITE, 15000, 'invitation');
    await click(c, '.oba.open .oba-later');
    await sleep(600);
    check('« Plus tard » ferme l’écran, l’app reste utilisable', !(await c.eval(`!!document.querySelector('.oba')`)));
    await c.send('Page.reload'); await sleep(9000);
    check('jamais reproposé en boucle (rien au lancement suivant)', !(await c.eval(`!!document.querySelector('.oba')`)));
    await c.eval(`(()=>{const ids=SPOTS.slice(0,3).map(s=>s.id);ids.forEach(id=>toggleFav(id));return ids.length})()`);
    await until(c, `!!document.querySelector('.oba-snack.open')`, 20000, 'rappel au 3e favori');
    const snackText = await c.eval(`document.querySelector('.oba-snack')?.innerText||''`);
    await shot(c, 'rappel-01-troisieme-favori');
    check('un rappel discret au 3e favori (sans chevaucher le message « Ajouté à tes favoris »)', /favoris/.test(snackText) && !(await c.eval(`!!document.querySelector('#toast.show')`)), snackText.replace(/\s+/g, ' '));
    await sleep(10000);
    await c.eval(`(()=>{SPOTS.slice(3,6).forEach(s=>toggleFav(s.id));return true})()`); await sleep(17000);
    check('pas de deuxième rappel', !(await c.eval(`!!document.querySelector('.oba-snack.open')`)));
    check('rappel : aucune erreur JavaScript', errors.length === 0, errors.join(' | '));
  } finally { close(); }
}

async function natif(withAccount) {
  const { c, errors, close } = await launch();
  const tag = withAccount ? 'app' : 'app-1.4';
  try {
    await c.send('Page.addScriptToEvaluateOnNewDocument', { source: fakeBridge({ withAccount, site: SITE }) });
    await c.send('Page.navigate', { url: `${SITE}/natif/index.html?lang=fr` });
    await until(c, `!!window.OceanMobile&&OceanMobile.native===true`, 20000, 'pont natif simulé');
    const cap = await c.eval(`OceanMobile.capabilities&&OceanMobile.capabilities.account`);
    check(`${tag} : capacité « account » ${withAccount ? 'présente (plugin OceanAccount)' : 'absente (pas de plugin)'}`, cap === withAccount);
    await onboarding(c);
    if (!withAccount) {
      await sleep(9000);
      check('app 1.4.x : aucun écran de compte après l’onboarding', !(await c.eval(`!!document.querySelector('.oba')||!!window.OceanAccount`)));
      await shot(c, 'app-1.4-sans-compte');
      return;
    }
    await until(c, INVITE, 20000, 'invitation dans l’app');
    await sleep(500);
    const g = await c.eval(geometry);
    check('app : « Crée ton compte » après l’onboarding, « Plus tard » visible', g.later && g.later.bottom <= g.vh && g.later.h >= 44, JSON.stringify(g.later));
    await shot(c, 'app-01-invitation');
    await signIn(c, `app.${Date.now()}@example.com`, 'app');
    const kc = await c.eval(`window.__simKeychain()`);
    check('app : jetons rangés dans le Trousseau (simulé)', kc && /^eyJ/.test(kc.access) && /^eyJ/.test(kc.refresh));
    check('app : aucun jeton dans localStorage, les Préférences, sessionStorage ni les cookies', (await c.eval(LEAK)).length === 0, JSON.stringify(await c.eval(LEAK)));
    const log = await c.eval(`window.__simLog`);
    const accountCalls = log.filter((x) => x.url.includes('/__natif/api/v1/'));
    check('app : requêtes du compte par CapacitorHttp vers l’API (aucune vers le service en ligne)', accountCalls.length >= 4 && log.every((x) => !/oceanbuddy\.app\/api/.test(x.url)), accountCalls.map((x) => x.method + ' ' + x.url.split('/api/v1')[1] + (x.auth ? ' (Bearer)' : '')).join(', '));
    check('app : Bearer après connexion', accountCalls.some((x) => /\/sync\/push|\/sync\/pull|\/me$/.test(x.url) && x.auth));
    await click(c, '.oba.open .oba-main');
    await c.eval(`openSettings()`); await sleep(800);
    await c.eval(`document.getElementById('obaSettings').scrollIntoView({block:'start'})`); await sleep(300);
    await shot(c, 'app-05-reglages');
    await c.eval(`OceanConfirm=async()=>true`);
    await c.eval(`document.querySelector('#obaSettings [data-a="logout"]').click()`); await sleep(1500);
    check('app : « Se déconnecter » efface le Trousseau', !(await c.eval(`window.__simKeychain()`)));
    check('app : aucune erreur JavaScript', errors.filter((e) => !/OceanGlass|not implemented/i.test(e)).length === 0, errors.join(' | '));
  } finally { close(); }
}

async function langs() {
  for (const lang of ['en', 'es']) {
    const { c, close } = await launch();
    try {
      await c.send('Page.navigate', { url: `${SITE}/?compte=essai&lang=${lang}` });
      await onboarding(c);
      await until(c, INVITE, 15000, 'invitation ' + lang);
      await sleep(900);
      const t = await c.eval(`document.querySelector('.oba-card').innerText`);
      const fr = /Retrouve tes favoris|Plus tard|Recevoir mon code/.test(t);
      check(`invitation traduite (${lang})`, !fr, t.replace(/\s+/g, ' ').slice(0, 140));
      await shot(c, `site-01-invitation-${lang}`);
    } finally { close(); }
  }
}

const only = opt('only', 'web,later,natif,natif14,langs').split(',');
try {
  if (only.includes('web')) await web();
  if (only.includes('later')) await later();
  if (only.includes('natif')) await natif(true);
  if (only.includes('natif14')) await natif(false);
  if (only.includes('langs')) await langs();
} catch (e) { check('déroulement', false, e.message); }
const ko = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(OUT, 'resultats.json'), JSON.stringify(results, null, 1));
console.log(`\n${ko.length ? 'ÉCHEC' : 'OK'} : ${results.length - ko.length}/${results.length} contrôles. Captures : ${OUT}`);
process.exit(ko.length ? 1 : 0);
