#!/usr/bin/env node
/*
 * Points de vue 360° du « Voyage dans le spot » → assets/voyage/viewpoints.json
 *
 * Aucune image n'est téléchargée : le fichier ne contient que des identifiants de vues,
 * des coordonnées, des URL Wikimedia Commons et leurs crédits. Tout se charge à la demande.
 *
 * Étapes (les réponses sont mises en cache, on peut relancer sans tout refaire) :
 *   node scripts/build-spot-viewpoints.mjs osm        # repères OpenStreetMap : plages, parkings, belvédères, jetées, côte
 *   node scripts/build-spot-viewpoints.mjs commons    # panoramas 360° libres (Wikimedia Commons) à moins de 5 km
 *   node scripts/build-spot-viewpoints.mjs probe      # vérifie où Google Street View a une vue (intégration publique, navigateur sans interface)
 *   node scripts/build-spot-viewpoints.mjs write      # assemble le fichier final en appliquant scripts/viewpoints-review.json
 *
 * « probe » demande Playwright : PLAYWRIGHT_MODULE=/chemin/vers/node_modules/playwright (et CHROME_PATH au besoin).
 * Cache : node_modules/.cache/ob-viewpoints (ou --cache=<dossier>).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const stage = args.find(a => !a.startsWith('--'));
const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const CACHE = opt('cache') || path.join(ROOT, 'node_modules/.cache/ob-viewpoints');
const ONLY = opt('only') ? new Set(opt('only').split(',')) : null;
const OUT = path.join(ROOT, 'assets/voyage/viewpoints.json');
const REVIEW = path.join(ROOT, 'scripts/viewpoints-review.json');
const UA = 'OceanBuddyViewpoints/1.0 (https://github.com/thomasbrebion59-bot/Ocean-Buddy)';
for (const d of ['osm', 'commons', 'probe', 'shots']) fs.mkdirSync(path.join(CACHE, d), {recursive: true});

/* ---------- Catalogue ---------- */
function spots() {
  const ctx = {window: {}};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'catalog-runtime.js'), 'utf8'), ctx);
  return ctx.window.OCEAN_CATALOG.filter(s => s.coords && (!ONLY || ONLY.has(s.id)));
}

/* ---------- Géométrie ---------- */
const R = 6371000, rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
function dist(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function bearing(a, b) {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}
function move(p, brg, m) {
  const d = m / R, t = rad(brg), la = rad(p.lat), lo = rad(p.lon);
  const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(t));
  const lo2 = lo + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
  return {lat: deg(la2), lon: ((deg(lo2) + 540) % 360) - 180};
}
/* Point le plus proche sur les traits de côte OSM (la mer est à droite du sens de tracé). */
function nearestCoast(p, coast) {
  let best = null;
  const k = Math.cos(rad(p.lat));
  for (const line of coast) for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i];
    const ax = (a.lon - p.lon) * k, ay = a.lat - p.lat, bx = (b.lon - p.lon) * k, by = b.lat - p.lat;
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1e-12;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L));
    const q = {lat: p.lat + ay + t * dy, lon: p.lon + (ax + t * dx) / k};
    const d = dist(p, q);
    if (!best || d < best.d) {
      const side = dx * (-ay - t * dy) - dy * (-ax - t * dx); // >0 : p à gauche (terre), <0 : à droite (mer)
      best = {d, q, sea: (bearing(a, b) + 90) % 360, atSea: side < 0};
    }
  }
  return best;
}

/* ---------- Réseau ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getJSON(url, init = {}, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(typeof url === 'function' ? url(i) : url, {signal: AbortSignal.timeout(init.timeout || 60000), ...init, headers: {'User-Agent': UA, ...(init.headers || {})}});
      if (r.ok) return await r.json();
      if (process.env.DEBUG) console.warn('HTTP', r.status, String(typeof url === 'function' ? url(i) : url).slice(8, 30));
      if (![429, 502, 503, 504].includes(r.status)) throw Error(`HTTP ${r.status}`);
    } catch (e) { if (process.env.DEBUG) console.warn('réseau', e.message); if (i === tries - 1) throw e; }
    await sleep(4000 * (i + 1));
  }
  throw Error('échec réseau');
}
const cached = (dir, id) => path.join(CACHE, dir, id + '.json');
const readCache = (dir, id) => { try { return JSON.parse(fs.readFileSync(cached(dir, id), 'utf8')); } catch { return null; } };
const writeCache = (dir, id, v) => fs.writeFileSync(cached(dir, id), JSON.stringify(v));

/* ---------- Étape 1 : OpenStreetMap (Overpass) ---------- */
const OVERPASS = ['https://z.overpass-api.de/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
async function osm(s, n) {
  const {lat, lon} = s.coords, dLat = .022, dLon = .022 / Math.max(.2, Math.cos(rad(lat)));
  const box = [lat - dLat, lon - dLon, lat + dLat, lon + dLon].map(v => v.toFixed(4)).join(',');
  // Filtres par emprise (bbox) : bien plus légers pour les serveurs Overpass que « around ».
  const q = `[out:json][timeout:60][bbox:${box}];(
    nwr[amenity=parking];nwr[tourism=viewpoint];nwr[natural=beach];nwr[leisure~"^(slipway|beach_resort|bathing_place)$"];
    nw[man_made~"^(pier|breakwater|groyne)$"];nw[sport~"surfing|scuba_diving|diving|snorkeling"];nw[natural=reef];
  );out center tags qt;way[natural=coastline];out geom(${box});`;
  const d = await getJSON(i => n ? OVERPASS[2] : OVERPASS[1], {timeout: 90000, method: 'POST', body: 'data=' + encodeURIComponent(q), headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
  const keep = ['name', 'amenity', 'tourism', 'natural', 'leisure', 'man_made', 'sport', 'access', 'shop', 'office', 'club', 'parking', 'fee'];
  const pois = [], coast = [];
  for (const e of d.elements) {
    if (e.tags?.natural === 'coastline' && e.geometry) { coast.push(e.geometry.filter(Boolean).map(g => ({lat: +g.lat.toFixed(6), lon: +g.lon.toFixed(6)}))); continue; }
    const c = e.center || (e.lat != null ? {lat: e.lat, lon: e.lon} : null);
    if (!c) continue;
    const tags = Object.fromEntries(keep.filter(k => e.tags?.[k]).map(k => [k, e.tags[k]]));
    pois.push({lat: +c.lat.toFixed(6), lon: +c.lon.toFixed(6), t: tags});
  }
  return {pois, coast};
}

/* ---------- Étape 2 : Wikimedia Commons ---------- */
const API = 'https://commons.wikimedia.org/w/api.php?';
async function commons(s) {
  const {lat, lon} = s.coords;
  const search = `nearcoord:5km,${lat},${lon} (hastemplate:Pano360 OR incategory:"360°_panoramas" OR 360 OR 360° OR equirectangular OR photosphere OR "photo sphere" OR spherical)`;
  const p = new URLSearchParams({action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '50', gsrsearch: search,
    prop: 'imageinfo|coordinates|categories', iiprop: 'size|url|extmetadata|mime', iiextmetadatafilter: 'LicenseShortName|Artist|UsageTerms|ImageDescription',
    cllimit: 'max', clshow: '!hidden', colimit: 'max'});
  const d = await getJSON(API + p);
  const out = [];
  for (const pg of Object.values(d.query?.pages || {})) {
    const ii = pg.imageinfo?.[0], co = pg.coordinates?.[0];
    if (!ii || !co || !/jpeg|png/.test(ii.mime || '')) continue;
    const ratio = ii.width / ii.height;
    const cats = (pg.categories || []).map(c => c.title.replace(/^Category:/, ''));
    const is360 = /360|equirect|spheric|photo ?sphere|pano360/i.test(pg.title + ' ' + cats.join(' '));
    if (Math.abs(ratio - 2) > .06 || ii.width < 3000 || !is360) continue;
    const m = ii.extmetadata || {};
    const strip = v => String(v || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    out.push({title: pg.title.replace(/^File:/, ''), url: ii.url, page: ii.descriptionurl, w: ii.width, h: ii.height,
      lat: co.lat, lon: co.lon, d: Math.round(dist(s.coords, co)), license: strip(m.LicenseShortName?.value), author: strip(m.Artist?.value).slice(0, 80),
      desc: strip(m.ImageDescription?.value).slice(0, 160), cats: cats.slice(0, 12)});
  }
  return out.sort((a, b) => a.d - b.d);
}

/* ---------- Plan des points à tester ---------- */
const norm = v => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const STOP = new Set('plage praia playa beach spot the la le les de du des do da dos das del el bay baie bahia and et sur reef point pointe lac lake island ile isla oahu bali'.split(' '));
function tokens(src) {
  return [...new Set(norm(src).split(' ').filter(w => w.length >= 4 && !STOP.has(w)))];
}
const isBusiness = t => t.amenity || t.shop || t.office || t.club || t.tourism;
function plan(s, o) {
  const P = s.coords, pois = o?.pois || [], coast = o?.coast || [];
  // Le nom du spot compte plus que ses zones secondaires (ex. Hossegor : « La Gravière » avant « La Centrale »).
  const main = tokens(s.name), zones = tokens((s.zones || []).map(z => z.n).join(' / '));
  const hasTok = (p, toks) => { const n = norm(p.t.name).split(' '); return toks.some(w => n.includes(w)); };
  const named = p => hasTok(p, main) || hasTok(p, zones);
  const beaches = pois.filter(p => p.t.natural === 'beach' || p.t.leisure === 'beach_resort' || p.t.leisure === 'bathing_place');
  const surfSpots = pois.filter(p => /surfing/.test(p.t.sport || '') && !isBusiness(p.t));
  const diveSites = pois.filter(p => (/diving|snorkeling/.test(p.t.sport || '') && !isBusiness(p.t)) || p.t.natural === 'reef');
  const sea = s.waterType === 'sea';
  // Ancre : le lieu nommé comme le spot, sinon le point de côte le plus proche, sinon les coordonnées du catalogue.
  const byDist = l => l.filter(p => dist(P, p) < 3500).sort((a, b) => dist(P, a) - dist(P, b));
  let anchor = byDist([...surfSpots, ...beaches].filter(p => hasTok(p, main)))[0] || byDist([...surfSpots, ...beaches].filter(p => hasTok(p, zones)))[0];
  let coastAt = sea && coast.length ? nearestCoast(anchor || P, coast) : null;
  if (coastAt && coastAt.d > 2500) coastAt = null;
  const A = anchor ? {lat: anchor.lat, lon: anchor.lon} : coastAt ? coastAt.q : {...P};
  const seaBearing = coastAt ? Math.round(coastAt.sea) : null;
  const nearCoast = p => !sea || !coast.length || (nearestCoast(p, coast)?.d ?? 0) < 450;
  const pick = (list, from, max, extra = () => true) => list.filter(p => dist(from, p) <= max && extra(p)).sort((a, b) => dist(from, a) - dist(from, b))[0];
  const ring = (p, r = 40) => [p, ...[0, 90, 180, 270].map(b => move(p, b, r))];
  // Repères ajoutés à la main pour les spots phares (scripts/viewpoints-review.json → extra), testés en premier.
  const roles = (JSON.parse(fs.readFileSync(REVIEW, 'utf8')).extra?.[s.id] || []).map(e => ({k: e.k, name: e.name || '', pts: [e, ...[0, 60, 120, 180, 240, 300].map(b => move(e, b, 30))]}));
  const beach = (anchor && beaches.includes(anchor) ? anchor : null) || pick(beaches.filter(named), A, 2500) || pick(beaches, A, 1200, nearCoast);
  if (beach) {
    const pts = [beach];
    if (coastAt) { const c = nearestCoast(beach, coast); if (c) { pts.push(move(c.q, c.sea + 180, 25), move(c.q, c.sea + 90, 80), move(c.q, c.sea - 90, 80)); } }
    else pts.push(...ring(beach, 50).slice(1));
    roles.push({k: 'plage', name: beach.t.name || '', pts});
  } else if (coastAt) roles.push({k: 'plage', name: '', pts: [move(A, (seaBearing + 180) % 360, 20), move(A, (seaBearing + 180) % 360, 70)]});
  const parkFrom = beach || A;
  const park = pick(pois.filter(p => p.t.amenity === 'parking' && !/private|customers|no|permit/.test(p.t.access || '')), parkFrom, 800);
  if (park) roles.push({k: 'parking', name: park.t.name || '', pts: ring(park, 35)});
  const view = pick(pois.filter(p => p.t.tourism === 'viewpoint'), A, 2500);
  if (view) roles.push({k: 'vue', name: view.t.name || '', pts: ring(view, 35)});
  const pier = pick(pois.filter(p => /pier|breakwater|groyne/.test(p.t.man_made || '')), A, 1200);
  if (pier) roles.push({k: 'jetee', name: pier.t.name || '', pts: [pier]});
  if (seaBearing != null) roles.push({k: 'eau', name: '', pts: [move(A, seaBearing, 60), move(A, seaBearing, 150), move(A, seaBearing, 320), ...(dist(A, P) > 80 ? [P] : [])]});
  else if (s.waterType !== 'sea') roles.push({k: 'eau', name: '', pts: [P]});
  for (const d of diveSites.filter(p => dist(P, p) < 3500).slice(0, 3)) roles.push({k: 'sous', name: d.t.name || '', pts: [d]});
  roles.push({k: 'centre', name: '', pts: ring(P, 45)});
  return {anchor: A, sea: seaBearing, roles};
}

/* ---------- Étape 3 : Street View (intégration publique sans clé) ---------- */
async function probeAll(list) {
  const pw = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, 'index.mjs')).href : 'playwright');
  const chromium = pw.chromium || pw.default.chromium;
  const browser = await chromium.launch(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {});
  const ctx = await browser.newContext({viewport: {width: 640, height: 400}, locale: 'fr-FR'});
  const memo = new Map();
  async function probe(page, p) {
    const key = p.lat.toFixed(5) + ',' + p.lon.toFixed(5);
    if (memo.has(key)) return memo.get(key) && {...memo.get(key), stale: true};
    await page.setContent(`<iframe style="width:620px;height:380px;border:0" src="https://www.google.com/maps?layer=c&cbll=${p.lat.toFixed(6)},${p.lon.toFixed(6)}&cbp=12,0,0,0,0&output=svembed"></iframe>`);
    let r = null;
    for (let i = 0; i < 40 && !r; i++) {
      await page.waitForTimeout(150);
      const f = page.frames()[1];
      if (!f) continue;
      r = await f.evaluate(() => {
        const txt = document.body?.innerText || '';
        if (/Aucune image|No imagery/i.test(txt)) return {none: true};
        const a = [...document.querySelectorAll('a')].find(x => /maps\/@/.test(x.href));
        return a ? {href: a.href, label: txt.split('\n')[0].trim()} : null;
      }).catch(() => null);
    }
    let out = null;
    if (r?.href) {
      const m = r.href.match(/@(-?[\d.]+),(-?[\d.]+).*?!1s([^!?]+)!2e(\d+)/);
      if (m) out = {lat: +m[1], lon: +m[2], id: decodeURIComponent(m[3]), user: m[4] !== '0', label: r.label === 'Afficher dans Google Maps' ? '' : r.label};
    }
    memo.set(key, out);
    return out;
  }
  const queue = [...list];
  const workers = await Promise.all(Array.from({length: +opt('workers') || 4}, () => ctx.newPage()));
  let done = 0;
  await Promise.all(workers.map(async page => {
    while (queue.length) {
      const job = queue.shift();
      const res = [];
      for (const role of job.plan.roles) {
        for (const pt of role.pts) {
          const hit = await probe(page, pt).catch(() => null);
          if (hit && dist(pt, hit) < 120) {
            if (!hit.stale && !res.some(r => r.id === hit.id)) {
              // Vignette pour la relecture visuelle (reste dans le cache, jamais publiée).
              await page.waitForTimeout(1600);
              await page.screenshot({path: path.join(CACHE, 'shots', `${job.id}-${res.length}-${role.k}.jpg`), type: 'jpeg', quality: 45}).catch(() => {});
            }
            const {stale, ...h} = hit; res.push({k: role.k, name: role.name, from: pt, ...h}); break;
          }
        }
      }
      writeCache('probe', job.id, {plan: job.plan, hits: res});
      if (++done % 10 === 0) console.log(`Street View : ${done}/${list.length}`);
    }
  }));
  await browser.close();
}

/* ---------- Étape 4 : assemblage ---------- */
const r5 = v => Math.round(v * 1e5) / 1e5;
function commonsPath(url) { const m = url.split('?')[0].match(/\/commons\/([0-9a-f]\/[0-9a-f]{2}\/[^/]+)$/); return m ? decodeURIComponent(m[1]) : null; }
function write(list) {
  const review = JSON.parse(fs.readFileSync(REVIEW, 'utf8'));
  const drop = new Set(review.drop || []);
  const out = {v: 1, generated: new Date().toISOString().slice(0, 10), s: {}};
  const stats = {spots: 0, views: 0, google: 0, commons: 0, water: 0, under: 0, byCount: {}};
  for (const s of list) {
    const pr = readCache('probe', s.id), cm = readCache('commons', s.id) || [];
    const views = [];
    const o = pr?.plan?.anchor || s.coords, seaB = pr?.plan?.sea ?? null;
    for (const h of pr?.hits || []) {
      if (drop.has(h.id)) continue;
      if (views.some(v => v.id === h.id || dist(v, h) < 30)) continue;
      const [k, rename] = [].concat(review.kind?.[h.id] || h.k);
      // « Dans l'eau » et « Sous l'eau » : uniquement des vues vérifiées à l'œil (scripts/viewpoints-review.json).
      if ((h.k === 'eau' || h.k === 'sous') && !review.kind?.[h.id]) continue;
      if ((k === 'centre' && views.length >= 3) || views.some(v => v.k === k)) continue; // un seul point de vue par type
      // Regarder vers l'eau depuis la terre ; vers le rivage depuis l'eau.
      let head = seaB;
      if (k === 'eau' || k === 'sous') head = seaB != null && dist(h, o) < 250 ? (seaB + 180) % 360 : Math.round(bearing(h, o));
      else if (dist(h, o) > 300 || (dist(h, o) > 60 && (seaB == null || k === 'parking' || k === 'centre'))) head = Math.round(bearing(h, o));
      views.push({k, lat: h.lat, lon: h.lon, id: h.id, head: head ?? 0, name: rename ?? (h.name || ''), user: h.user});
    }
    for (const c of cm) {
      if (drop.has(c.title) || !(review.commons || {})[c.title]) continue;
      const r = review.commons[c.title];
      if (r.only && !r.only.includes(s.id)) continue;
      const pathC = commonsPath(c.url);
      if (!pathC) continue;
      const kc = views.some(v => v.k === r.k) ? 'pano' : r.k;
      if (views.some(v => v.k === kc)) continue;
      views.push({k: kc, lat: c.lat, lon: c.lon, commons: [pathC, c.w, c.author || 'Wikimedia Commons', c.license || ''], name: r.name || '', head: 0});
    }
    if (!views.length) continue;
    const order = ['parking', 'centre', 'plage', 'vue', 'jetee', 'bord', 'pano', 'eau', 'sous'];
    views.sort((a, b) => order.indexOf(a.k) - order.indexOf(b.k));
    out.s[s.id] = {o: [r5(o.lat), r5(o.lon)], w: seaB, p: views.map(v => {
      // Google : coordonnées exactes de la vue (6 décimales) ; l'intégration sans clé retombe sur cette même vue.
      const r6 = x => Math.round(x * 1e6) / 1e6;
      const row = v.commons ? [v.k, r5(v.lat), r5(v.lon), v.head, v.name, 'c', ...v.commons] : [v.k, r6(v.lat), r6(v.lon), v.head, v.name, 'g'];
      return row;
    })};
    stats.spots++; stats.views += views.length;
    stats.byCount[views.length] = (stats.byCount[views.length] || 0) + 1;
    for (const v of views) { if (v.commons) stats.commons++; else stats.google++; if (v.k === 'eau') stats.water++; if (v.k === 'sous') stats.under++; }
  }
  fs.mkdirSync(path.dirname(OUT), {recursive: true});
  const json = JSON.stringify(out);
  fs.writeFileSync(OUT, json);
  console.log(JSON.stringify(stats), (json.length / 1024).toFixed(1) + ' Ko');
}

/* ---------- Programme ---------- */
const list = spots();
if (stage === 'osm') {
  let n = 0;
  const todo = list.filter(s => !readCache('osm', s.id));
  await Promise.all([0, 1, 2].map(async lane => {
    for (let i = lane; i < todo.length; i += 3) {
      const s = todo[i];
      try { writeCache('osm', s.id, await osm(s, lane)); } catch (e) { console.warn('OSM', s.id, e.message); }
      if (++n % 20 === 0) console.log(`OSM : ${n}/${todo.length}`);
      await sleep(800);
    }
  }));
} else if (stage === 'commons') {
  for (const s of list) {
    if (readCache('commons', s.id)) continue;
    try { writeCache('commons', s.id, await commons(s)); } catch (e) { console.warn('Commons', s.id, e.message); }
    await sleep(250);
  }
  const all = list.flatMap(s => (readCache('commons', s.id) || []).map(c => ({spot: s.id, ...c})));
  fs.writeFileSync(path.join(CACHE, 'commons-candidates.json'), JSON.stringify(all, null, 1));
  console.log(`${all.length} panoramas 360° candidats → ${path.join(CACHE, 'commons-candidates.json')}`);
} else if (stage === 'probe') {
  const todo = list.filter(s => (args.includes('--force') || !readCache('probe', s.id)) && (args.includes('--all') || readCache('osm', s.id))).map(s => ({id: s.id, plan: plan(s, readCache('osm', s.id))}));
  console.log(`${todo.length} spots à tester`);
  await probeAll(todo);
} else if (stage === 'plan') {
  for (const s of list.slice(0, 20)) console.log(s.id, JSON.stringify(plan(s, readCache('osm', s.id)).roles.map(r => [r.k, r.name, r.pts.length])));
} else if (stage === 'write') {
  write(list);
} else {
  console.log('Étapes : osm | commons | probe | write (voir l’en-tête du fichier)');
}
