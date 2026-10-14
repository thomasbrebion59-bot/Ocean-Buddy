#!/usr/bin/env node
/*
 * Garde-fou du démarrage d'Ocean Buddy / Ocean Buddy boot regression gate.
 *
 *   npm run check:boot                       # tous les scénarios / all scenarios
 *   node scripts/check-boot.mjs --scenario native-returning --verbose
 *   node scripts/check-boot.mjs --www mobile/www --no-build   # (utilisé par publish-app-update)
 *   node scripts/check-boot.mjs --self-test  # vérifie la logique avec deux pages jetables
 *
 * Options : --scenario <nom> (répétable) --throttle <n> --keep --verbose --no-build --www <dir> --web-root <dir> --out <dir> --no-shots
 * Scénarios : native-returning, native-restore, native-new, web-returning, native-returning-wide (430x932).
 * Contrat de démarrage vérifié : html.ob-booting, #obBoot, window.OceanBoot {t0,lifted,liftedAt,reason}, événement ocean:home-ready,
 * levée au plus tard 4000 ms après t0. Sans OceanBoot (ancien code), "visible" = dès le premier rendu.
 * Chrome requis (variable CHROME pour un autre chemin). Les captures et la chronologie vont dans out/boot-check/<scénario>/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { runScenario } from './boot-check/runner.mjs';
import { makeFixtures } from './boot-check/fixtures.mjs';
const require = createRequire(import.meta.url);
const { flatness } = require('./boot-check/png.cjs');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const flag = n => argv.includes('--' + n);
const val = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const vals = n => argv.flatMap((a, i) => a === '--' + n && argv[i + 1] ? [argv[i + 1]] : []);

const APP_SEED = `chosenLevel='debutant';chosenSport='all';finishOnb();saveState();`;
const LIMITS = { lift: 4300, cls: 0.02, clsWindow: 6000, scrollWindow: 4000, heroWithin: 450, flat: 0.9 };

export function analyze(sc, d) {
  const S = d.s, ev = d.ev, fails = [], notes = [];
  const fail = (rule, fr, en) => fails.push({ rule, fr, en });
  const hasBoot = S.some(s => s.boot.has);
  const t0 = S.find(s => s.boot.t0 != null)?.boot.t0 ?? 0;
  let liftT = null, reason = null;
  if (hasBoot) { liftT = S.find(s => s.boot.liftedAt != null)?.boot.liftedAt ?? d.liftEvent?.t ?? null; reason = S.findLast?.(s => s.boot.reason)?.boot.reason ?? d.liftEvent?.reason ?? null; }
  else { liftT = S.find(s => s.fp != null)?.fp ?? null; }
  const painted = s => s.fp != null;
  const afterLift = s => liftT != null && s.t >= liftT;
  const exposed = s => painted(s) && (!hasBoot ? true : (s.boot.lifted || !s.boot.covered));
  const span = a => a.length ? `${a[0].t}–${a.at(-1).t} ms (${a.length} échantillons/samples)` : '';
  const returning = sc.mode !== 'new';
  const metrics = { hasBoot, t0: Math.round(t0), liftAt: liftT == null ? null : Math.round(liftT), liftAfterT0: liftT == null ? null : Math.round(liftT - t0), reason };

  /* Lift / contract */
  if (hasBoot) {
    if (liftT == null) fail('lift', 'Le rideau ne se lève jamais.', 'The curtain never lifts.');
    else {
      if (liftT - t0 > LIMITS.lift) fail('lift', `Rideau levé trop tard : ${Math.round(liftT - t0)} ms après t0 (max ${LIMITS.lift}).`, `Curtain lifted too late: ${Math.round(liftT - t0)} ms after t0 (max ${LIMITS.lift}).`);
      if (reason !== 'ready' && reason !== 'timeout') fail('lift-reason', `Raison de levée invalide : ${reason}.`, `Invalid lift reason: ${reason}.`);
      if (reason === 'timeout') notes.push('lifted by timeout / levé par le délai maximal');
      const late = S.filter(s => s.t >= liftT + 1500 && s.boot.booting); if (late.length) fail('contract', 'html.ob-booting n’est pas retirée après la levée.', 'html.ob-booting is not removed after the lift.');
      const cur = S.filter(s => s.t >= liftT + 2000 && s.boot.curtainVisible); if (cur.length) fail('contract', '#obBoot reste visible 2 s après la levée.', '#obBoot is still visible 2 s after the lift.');
    }
    if (!S.some(s => s.boot.curtain) ) fail('contract', '#obBoot absent.', '#obBoot missing.');
  } else {
    notes.push('window.OceanBoot absent: "lift" = first paint / pas de rideau : « levée » = premier rendu');
    if (sc.native) fail('contract', 'window.OceanBoot est absent (pas de rideau de démarrage dans l’app native).', 'window.OceanBoot is missing (no boot curtain in the native app).');
    if (liftT == null) fail('lift', 'Aucun rendu détecté.', 'No paint detected.');
  }
  if (liftT == null) return { metrics, fails, notes };
  const post = S.filter(afterLift), exp = S.filter(exposed);

  if (!returning) {
    if (!post.some(s => s.onb)) fail('onboarding-missing', 'Nouvel utilisateur : l’accueil de bienvenue (#onb) n’est pas visible après la levée.', 'New user: onboarding (#onb) is not visible after the lift.');
  } else {
    const onb = exp.filter(s => s.onb); if (onb.length) fail('onboarding-flash', `Onboarding (#onb) visible pour un utilisateur existant : ${span(onb)}.`, `Onboarding (#onb) visible for a returning user: ${span(onb)}.`);
    const leg = exp.filter(s => s.intro || s.heroText || s.centerBtn);
    if (leg.length) { const what = [...new Set(leg.flatMap(s => [s.intro && '.home-intro', s.heroText && '« PRENDS LE LARGE »', s.centerBtn && '.nav .center (trophée)'].filter(Boolean)))].join(', '); fail('legacy-home', `Ancien accueil visible (${what}) : ${span(leg)}.`, `Legacy home visible (${what}): ${span(leg)}.`); }
    const nav = exp.filter(s => (s.nav.visible && s.nav.labelled < 4) || (afterLift(s) && !s.nav.visible));
    if (nav.length) { const m = Math.min(...nav.map(s => s.nav.labelled)); fail('tabbar', `Barre d’onglets incomplète (${m} onglet(s) avec libellé, 4 requis ; ou absente) : ${span(nav)}.`, `Tab bar incomplete (${m} labelled tab(s), 4 required; or missing): ${span(nav)}.`); }
    const rb = []; for (const e of ev.filter(e => e.type === 'feed-rebuild' && e.t >= liftT)) if (!rb.length || e.t - rb.at(-1).t > 100) rb.push(e); /* un rendu = une rafale / one render = one burst */
    if (rb.length) fail('feed-rebuild', `Le fil de l’accueil (.hf-feed) est reconstruit ${rb.length} fois après la levée (t=${rb.map(e => e.t).join(', ')} ms).`, `Home feed (.hf-feed) rebuilt ${rb.length} time(s) after the lift (t=${rb.map(e => e.t).join(', ')} ms).`);
    metrics.feedRebuilds = rb.length;
    let sw = ev.filter(e => (e.type === 'scroll-write' || e.type === 'scroll-moved') && e.t <= liftT + LIMITS.scrollWindow);
    const hidden = sc.mode === 'restore' && hasBoot ? sw.filter(e => e.t < liftT) : [];
    sw = sw.filter(e => !hidden.includes(e));
    if (hidden.length) notes.push(`${hidden.length} scroll write(s) before lift ignored in restore mode (hidden by curtain) / écriture(s) de défilement avant la levée ignorée(s) (masquées par le rideau)`);
    metrics.scrollWrites = sw.length;
    if (sw.length) fail('scroll', `${sw.length} écriture(s)/saut(s) de défilement vertical de la page entre t0 et levée+4 s : ${sw.slice(0, 4).map(e => `${e.t}ms ${e.api || 'scroll'} ${e.target}${e.args ? ' ' + e.args : ' ' + e.from + '->' + e.y}${e.stack ? ' [' + e.stack.split(' < ').slice(0, 2).join(' < ') + ']' : ''}`).join(' ; ')}.`, `${sw.length} vertical page scroll write(s)/jump(s) between t0 and lift+4 s.`);
    const cls = ev.filter(e => e.type === 'cls' && !e.input && e.t >= liftT && e.t <= liftT + LIMITS.clsWindow), sum = cls.reduce((a, e) => a + e.value, 0);
    metrics.clsAfterLift = +sum.toFixed(4);
    metrics.clsTop = cls.sort((a, b) => b.value - a.value).slice(0, 3).map(e => `${e.value.toFixed(3)}@${e.t}ms ${e.sources.join(' | ')}`);
    if (sum > LIMITS.cls) fail('cls', `Décalages de mise en page après la levée : CLS ${sum.toFixed(3)} > ${LIMITS.cls}. Principaux : ${metrics.clsTop.join(' ; ')}`, `Layout shifts after the lift: CLS ${sum.toFixed(3)} > ${LIMITS.cls}.`);
    const heroOk = S.some(s => s.t >= liftT && s.t <= liftT + LIMITS.heroWithin && s.hero);
    if (!heroOk) fail('blank', `Le héros/première section de l’accueil (.hf-top) n’est pas visible dans les 300 ms après la levée.`, `Home hero/first section (.hf-top) is not visible within 300 ms after the lift.`);
    const toast = hasBoot ? S.filter(s => s.toast && !s.boot.lifted) : []; /* sans rideau, rien n’est peint avant le « lift » */ if (toast.length) fail('toast', `Le toast « Bon retour » est visible avant la levée : ${span(toast)}.`, `The « Bon retour » toast is visible before the lift: ${span(toast)}.`);
    const clip = post.filter(s => s.hOverflow > 2 || (s.nav.present && (s.nav.left < -1 || s.nav.right > (sc.width || 390) + 1)));
    if (clip.length) fail('clipping', `Débordement horizontal / barre d’onglets rognée à ${sc.width || 390}px : ${span(clip)}.`, `Horizontal overflow / tab bar clipped at ${sc.width || 390}px: ${span(clip)}.`);
  }
  if (d.shot300) { try { const f = flatness(d.shot300); metrics.flat = +f.share.toFixed(3); metrics.flatColor = f.color; if (f.share > LIMITS.flat) fail('blank', `La page semble vide 300 ms après la levée : ${(f.share * 100).toFixed(0)} % d’une seule couleur (${f.color}).`, `Page looks blank 300 ms after the lift: ${(f.share * 100).toFixed(0)}% a single colour (${f.color}).`); } catch (e) { notes.push('screenshot not analysed: ' + e.message); } }
  else notes.push('no screenshot taken at lift+300ms');
  if (d.errors.length) fail('errors', `${d.errors.length} erreur(s) JS : ${d.errors.slice(0, 3).map(e => e.kind + ': ' + e.text).join(' ; ')}`, `${d.errors.length} JS error(s).`);
  metrics.errors = d.errors.length;
  return { metrics, fails, notes };
}

function writeOut(sc, d, res) {
  fs.mkdirSync(sc.outDir, { recursive: true });
  const lines = [`# ${sc.name}  ${JSON.stringify(res.metrics)}`, ''];
  for (const e of d.ev) { const { type, t, ...r } = e; lines.push(`${String(t).padStart(6)}ms ${type.padEnd(13)} ${Object.entries(r).map(([k, v]) => k + '=' + (typeof v === 'object' ? JSON.stringify(v) : v)).join(' ')}`); }
  lines.push('', '# samples');
  let prev = '';
  for (const s of d.s) { const k = JSON.stringify({ ...s, t: 0, fp: 0 }); if (k !== prev) { lines.push(`${String(s.t).padStart(6)}ms ` + JSON.stringify({ boot: s.boot, onb: s.onb, intro: s.intro, heroText: s.heroText, center: s.centerBtn, nav: s.nav, hero: s.hero, toast: s.toast })); prev = k; } }
  lines.push('', '# errors', ...d.errors.map(e => `${e.kind}: ${e.text}`));
  fs.writeFileSync(path.join(sc.outDir, 'timeline.txt'), lines.join('\n') + '\n');
  fs.writeFileSync(path.join(sc.outDir, 'summary.json'), JSON.stringify({ scenario: sc.name, passed: !res.fails.length, ...res }, null, 1));
}

function report(sc, res, verbose) {
  const m = res.metrics, ok = !res.fails.length;
  const out = [`${ok ? 'PASS' : 'FAIL'}  ${sc.name}`];
  out.push(`   lift: ${m.liftAt == null ? 'never/jamais' : m.hasBoot ? m.liftAfterT0 + ' ms after t0, reason=' + m.reason : 'first paint @' + m.liftAt + ' ms (no OceanBoot)'}` + (m.clsAfterLift != null ? `   CLS after lift: ${m.clsAfterLift}   feed rebuilds: ${m.feedRebuilds}   scroll writes: ${m.scrollWrites}` : '') + `   errors: ${m.errors ?? 0}` + (m.flat != null ? `   flat: ${(m.flat * 100).toFixed(0)}%` : ''));
  if (m.clsTop?.length) out.push('   CLS top: ' + m.clsTop[0]);
  for (const f of res.fails) out.push(`   x [${f.rule}] ${f.fr}\n              ${f.en}`);
  if (verbose) for (const n of res.notes) out.push('   . ' + n);
  return out.join('\n');
}

export async function runAll(scenarios, opts) {
  const results = [];
  for (const sc of scenarios) {
    const t = Date.now();
    let res, d;
    try { d = await runScenario(sc); res = analyze(sc, d); writeOut(sc, d, res); }
    catch (e) { res = { metrics: {}, notes: [], fails: [{ rule: 'harness', fr: 'Erreur du banc de test : ' + e.message, en: 'Harness error: ' + e.message }] }; }
    res.secs = Math.round((Date.now() - t) / 1000);
    results.push({ sc, res });
    console.log(report(sc, res, opts.verbose) + `   (${res.secs}s)`);
  }
  return results;
}

function defineScenarios(o) {
  const mk = (name, extra) => ({ name, root: o.www, mode: 'returning', native: true, width: 390, height: 844, seedJs: APP_SEED, throttle: o.throttle, startPort: 8790, cdpPort: 9333, outDir: path.join(o.out, name), shots: o.shots, ...extra });
  return [
    mk('native-returning'),
    mk('native-restore', { mode: 'restore' }),
    mk('native-new', { mode: 'new' }),
    mk('web-returning', { root: o.webRoot, native: false }),
    mk('native-returning-wide', { width: 430, height: 932 }),
  ];
}

async function main() {
  if (flag('self-test')) return selfTest();
  const o = { www: path.resolve(val('www', path.join(repo, 'mobile/www'))), webRoot: path.resolve(val('web-root', repo)), out: path.resolve(val('out', path.join(repo, 'out/boot-check'))), throttle: +val('throttle', 6), shots: !flag('no-shots'), verbose: flag('verbose') };
  if (!flag('no-build')) {
    console.log('Construction de mobile/www / building mobile/www (build-mobile.cjs écrit toujours dans mobile/www, ignoré par Git)…');
    const b = spawnSync(process.execPath, [path.join(repo, 'scripts/build-mobile.cjs')], { cwd: repo, stdio: o.verbose ? 'inherit' : 'pipe' });
    if (b.status !== 0) { console.error('Échec de la construction / build failed:\n' + (b.stderr || '') + (b.stdout || '')); process.exit(2); }
  }
  if (!fs.existsSync(path.join(o.www, 'index.html'))) { console.error('mobile/www introuvable / not found: ' + o.www); process.exit(2); }
  let list = defineScenarios(o);
  const want = vals('scenario');
  if (want.length) { const bad = want.filter(w => !list.some(s => s.name === w)); if (bad.length) { console.error('Scénario inconnu / unknown: ' + bad.join(', ') + '. Valides: ' + list.map(s => s.name).join(', ')); process.exit(2); } list = list.filter(s => want.includes(s.name)); }
  const t = Date.now();
  const results = await runAll(list, o);
  const failed = results.filter(r => r.res.fails.length);
  console.log(`\n${failed.length ? 'ÉCHEC / FAILED' : 'OK'} : ${results.length - failed.length}/${results.length} scénarios conformes, ${Math.round((Date.now() - t) / 1000)} s. Détails / details : ${path.relative(repo, o.out)}/<scénario>/`);
  if (failed.length) console.log('Scénarios en échec / failing: ' + failed.map(r => r.sc.name).join(', '));
  process.exit(failed.length ? 1 : 0);
}

async function selfTest() {
  const fx = makeFixtures(); const out = path.join(fx.base, 'out');
  const base = { mode: 'returning', native: true, width: 390, height: 844, seedJs: `localStorage.setItem('oceanbuddy_v1','{}')`, throttle: 4, startPort: 8830, cdpPort: 9380, shots: false, afterLiftMs: 6500 };
  const cases = [
    { sc: { ...base, name: 'fixture-good', root: fx.good, outDir: path.join(out, 'good') }, expect: true },
    { sc: { ...base, name: 'fixture-shifting', root: fx.shifting, outDir: path.join(out, 'shifting') }, expect: false },
    { sc: { ...base, name: 'fixture-new-user-sees-onboarding', mode: 'new', root: fx.good, outDir: path.join(out, 'new') }, expect: false },
  ];
  let bad = 0;
  for (const c of cases) {
    const d = await runScenario(c.sc), res = analyze(c.sc, d), pass = !res.fails.length;
    console.log(report(c.sc, res, true));
    const okTest = pass === c.expect; if (!okTest) bad++;
    console.log(`   => self-test ${okTest ? 'OK' : 'KO'} (attendu/expected ${c.expect ? 'PASS' : 'FAIL'})\n`);
  }
  fs.rmSync(fx.base, { recursive: true, force: true });
  console.log(bad ? `Self-test ÉCHEC (${bad})` : 'Self-test OK'); process.exit(bad ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(2); });
