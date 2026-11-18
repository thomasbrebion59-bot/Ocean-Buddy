/* Découverte des cultures, sur un faux DOM léger (vrais cultures-boot.js, cultures-model.js et cultures.js) :
   - lien #culture=<pays> : attend la fin de l’onboarding (#onb) comme deep-link.js ; hashchange (app déjà ouverte) ;
   - « Le mot du jour » hors connexion : message, carte gardée à remplir, un seul nouvel essai au retour du réseau. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const DATA = { reviewed: '2026-11-16', countries: {
  Japon: { name: 'Japon', w: 'as', langs: 'Japonais', hello: ['Konnichiwa', 'kon-ni-tchi-wa'], thanks: { word: 'Arigatō', lang: 'japonais' } },
  Maroc: { name: 'Maroc', w: 'af', langs: 'Arabe, amazighe', hello: ['Salam', 'sa-lam'], thanks: { word: 'Choukrane', lang: 'arabe' } },
  Islande: { name: 'Islande', w: 'eu', langs: 'Islandais', hello: ['Halló', 'ha-lo'], thanks: { word: 'Takk', lang: 'islandais' } },
  Grèce: { name: 'Grèce', w: 'eu', langs: 'Grec', hello: ['Yassou', 'ya-sou'], thanks: { word: 'Efcharistó', lang: 'grec' } }
} };

function classes(init) {
  const s = new Set(init);
  return { contains: c => s.has(c), add: c => s.add(c), remove: c => s.delete(c), toggle(c, on) { if (on ?? !s.has(c)) s.add(c); else s.delete(c); } };
}
/* Monde d’essai : minuteurs à la main, réseau coupé ou non (scripts et données séparément), onboarding ouvert ou non. */
function world({ hash = '', onb = false, scripts = true, json = true, view = null } = {}) {
  const w = { timers: [], listeners: {}, mos: [], net: { scripts, json }, log: { replace: 0, opened: [], toasts: [], fetches: 0, started: 0, dialogs: 0 } };
  const onbEl = { style: { display: onb ? '' : 'none' }, classList: classes(onb ? [] : ['hide']) };
  const q = { textContent: 'Un mot du bout du monde : devine d’où il vient.' };
  const quiz = { classList: classes(['cult-quiz-body', 'is-wait']), attrs: { 'aria-busy': 'true' }, replaced: null,
    removeAttribute(n) { delete this.attrs[n]; }, querySelector: s => s === '.cult-quiz-q' ? q : null, replaceWith(x) { this.replaced = x; } };
  const location = { hash, pathname: '/', search: '' };
  class MO { constructor(cb) { this.cb = cb; this.on = false; w.mos.push(this); } observe(el, o) { this.on = true; this.el = el; this.opts = o; } disconnect() { this.on = false; } }
  const ctx = {
    console, location, MutationObserver: MO, localStorage: { getItem: () => null, setItem() {} },
    history: { state: null, replaceState(st, t, url) { w.log.replace++; const i = url.indexOf('#'); location.hash = i < 0 ? '' : url.slice(i); } },
    setTimeout: f => { w.timers.push(f); return w.timers.length; }, clearTimeout() {},
    addEventListener(type, fn, o) { (w.listeners[type] ||= []).push({ fn, once: !!o?.once }); },
    toast: m => w.log.toasts.push(m), OceanBoot: { after: fn => { w.later = fn; } },
    fetch: () => { w.log.fetches++; return w.net.json ? Promise.resolve({ ok: true, json: () => Promise.resolve(DATA) }) : Promise.reject(new TypeError('Failed to fetch')); },
    document: {
      documentElement: { lang: 'fr', classList: classes([]) }, readyState: 'complete', addEventListener() {},
      getElementById: id => id === 'onb' ? onbEl : null,
      querySelector: s => s === '[data-cult-quiz-body].is-wait' ? (!quiz.replaced && quiz.classList.contains('is-wait') ? quiz : null)
        : s === '[data-cult-quiz-body]' ? (quiz.replaced ? null : quiz) : null,
      querySelectorAll: () => [],
      createElement(tag) {
        if (tag === 'dialog') w.log.dialogs++;
        return { tag, remove() {}, innerHTML: '', get firstElementChild() { return { html: this.innerHTML }; } };
      },
      body: { classList: classes([]), append(s) {
        /* Script injecté : chargé (vrai fichier exécuté) ou en échec, comme hors connexion. */
        Promise.resolve().then(() => {
          if (!w.net.scripts) return s.onerror();
          const f = s.src.split('?')[0];
          if (f === 'cultures.js' && view) w.ctx.OceanCultures._view = view; else vm.runInContext(read(f), w.ctx);
          s.onload();
        });
      } }
    }
  };
  ctx.window = ctx;
  w.ctx = vm.createContext(ctx);
  w.onb = onbEl; w.quiz = quiz; w.q = q; w.location = location;
  w.fire = type => { const l = w.listeners[type] || []; w.listeners[type] = l.filter(x => !x.once); l.forEach(x => x.fn({ type })); };
  w.count = type => (w.listeners[type] || []).length;
  w.mutate = () => w.mos.filter(m => m.on).forEach(m => m.cb([]));
  w.settle = async () => { for (let i = 0; i < 12; i++) { await new Promise(r => setImmediate(r)); w.timers.splice(0).forEach(f => f()); } };
  vm.runInContext(read('cultures-boot.js'), w.ctx);
  return w;
}
/* Vue factice (cultures.js) pour les liens : on note les pages ouvertes. */
const fakeView = w => ({ start() { w.log.started++; }, open(c, o) { w.log.opened.push([c, o.from]); } });
function withView(opts) { const w = world(opts); w.ctx.OceanCultures._view = fakeView(w); return w; }

/* ---------- lien #culture=<pays> ---------- */
test('lien #culture= : nouveau visiteur, la page attend la fin de l’onboarding (comme deep-link.js)', async () => {
  const w = withView({ hash: '#culture=Japon', onb: true });
  w.later(); await w.settle();
  assert.equal(w.log.started, 1, 'les mots de l’accueil arrivent quand même');
  assert.deepEqual(w.log.opened, [], 'rien par-dessus l’onboarding');
  assert.equal(w.location.hash, '#culture=Japon', 'le lien reste dans l’adresse pendant l’onboarding');
  assert.equal(w.mos.length, 1);
  assert.equal(w.mos[0].el, w.onb);
  assert.deepEqual([...w.mos[0].opts.attributeFilter].sort(), ['class', 'style']);
  w.mutate(); await w.settle();
  assert.deepEqual(w.log.opened, [], 'onboarding encore ouvert : toujours rien');
  w.onb.classList.add('hide'); w.mutate(); await w.settle();
  assert.deepEqual(w.log.opened, [['Japon', 'link']]);
  assert.equal(w.mos[0].on, false, 'observateur débranché');
  assert.equal(w.log.replace, 1);
  assert.equal(w.location.hash, '', 'lien retiré de l’adresse');
});
test('lien #culture= : visiteur connu, la page s’ouvre après la levée du rideau', async () => {
  const w = withView({ hash: '#culture=Maroc' });
  w.later(); await w.settle();
  assert.deepEqual(w.log.opened, [['Maroc', 'link']]);
  assert.equal(w.mos.length, 0);
  assert.equal(w.location.hash, '');
});
test('lien #culture= suivi dans l’onglet (hashchange) : ouvre la page, nettoie l’adresse, sans boucle', async () => {
  const w = withView({});
  w.later(); await w.settle();
  assert.equal(w.count('hashchange'), 1);
  assert.deepEqual(w.log.opened, []);
  w.location.hash = '#culture=Gr%C3%A8ce'; w.fire('hashchange'); await w.settle();
  assert.deepEqual(w.log.opened, [['Grèce', 'link']]);
  assert.equal(w.log.replace, 1);
  /* replaceState ne déclenche pas hashchange ; un hashchange sans lien ne fait rien. */
  w.fire('hashchange'); await w.settle();
  assert.equal(w.log.opened.length, 1);
  w.location.hash = '#spots'; w.fire('hashchange'); await w.settle();
  assert.equal(w.log.opened.length, 1);
  assert.equal(w.log.replace, 1, 'une autre ancre reste en place');
  /* Lien mal encodé : rien ne s’ouvre, l’adresse est nettoyée. */
  w.location.hash = '#culture=%E0%A4%A'; w.fire('hashchange'); await w.settle();
  assert.equal(w.log.opened.length, 1);
  assert.equal(w.location.hash, '');
  /* Le même lien suivi une seconde fois rouvre la page. */
  w.location.hash = '#culture=Gr%C3%A8ce'; w.fire('hashchange'); await w.settle();
  assert.equal(w.log.opened.length, 2);
});
test('hashchange pendant l’onboarding : un seul observateur, seul le dernier lien s’ouvre', async () => {
  const w = withView({ onb: true });
  w.later(); await w.settle();
  w.location.hash = '#culture=Japon'; w.fire('hashchange');
  w.location.hash = '#culture=Islande'; w.fire('hashchange'); await w.settle();
  assert.equal(w.mos.length, 1);
  assert.deepEqual(w.log.opened, []);
  w.onb.style.display = 'none'; w.mutate(); await w.settle();
  assert.deepEqual(w.log.opened, [['Islande', 'link']]);
});
test('lien #culture= : seuls les vrais pays ouvrent une page (vraie vue)', async () => {
  const w = world({ hash: '#culture=constructor' });
  w.later(); await w.settle();
  assert.equal(w.log.dialogs, 0, 'aucune feuille pour « constructor »');
  assert.equal(w.location.hash, '');
});

/* ---------- « Le mot du jour » hors connexion ---------- */
test('mot du jour : données injoignables, message sur place puis un seul nouvel essai au retour du réseau', async () => {
  const w = world({ json: false });
  w.later(); await w.settle();
  assert.equal(w.log.fetches, 1);
  assert.equal(w.q.textContent, 'Le mot du jour arrive dès que tu es en ligne.');
  assert.ok(w.quiz.classList.contains('is-wait'), 'carte gardée à remplir');
  assert.equal(w.quiz.attrs['aria-busy'], undefined);
  assert.equal(w.count('online'), 1, 'une seule écoute');
  /* Nouvelles demandes d’écoute pendant la coupure : ignorées. */
  w.ctx.OceanCultures.whenOnline(() => {}); w.ctx.OceanCultures.whenOnline(() => {});
  assert.equal(w.count('online'), 1);
  await w.settle();
  assert.equal(w.log.fetches, 1, 'aucune requête sans retour du réseau');
  /* Réseau annoncé mais encore instable : un essai, puis une seule nouvelle écoute. */
  w.fire('online'); await w.settle();
  assert.equal(w.log.fetches, 2);
  assert.equal(w.count('online'), 1);
  assert.equal(w.quiz.replaced, null);
  /* Réseau revenu : la carte est remplie sur place. */
  w.net.json = true; w.fire('online'); await w.settle();
  assert.equal(w.log.fetches, 3);
  assert.equal(w.count('online'), 0);
  assert.ok(w.quiz.replaced, 'jeu posé à la place de l’attente');
  assert.match(w.quiz.replaced.html, /data-cult-quiz-body/);
  assert.doesNotMatch(w.quiz.replaced.html, /is-wait/);
  await w.settle();
  assert.equal(w.log.fetches, 3, 'pas de boucle de requêtes');
});
test('mot du jour : scripts injoignables au démarrage, nouvel essai au retour du réseau', async () => {
  const w = world({ scripts: false, json: false });
  w.later(); await w.settle();
  assert.equal(w.q.textContent, 'Le mot du jour arrive dès que tu es en ligne.');
  assert.equal(w.count('online'), 1);
  assert.equal(w.ctx.OceanCultures._view, undefined);
  w.net.scripts = true; w.net.json = true; w.fire('online'); await w.settle();
  assert.ok(w.ctx.OceanCultures._view, 'vue chargée');
  assert.ok(w.quiz.replaced, 'jeu posé');
  assert.equal(w.count('online'), 0);
  assert.equal(w.log.fetches, 1);
});

test('mot du jour compact (téléphone) : question, message hors ligne ou attente sur deux lignes au plus, sans agrandir la carte', () => {
  const css = read('fiches-organisation.css'), m = css.slice(css.indexOf('.cult-quiz{height:160px'), css.indexOf('.cult-quiz-next{display:none}'));
  assert.match(m, /\.cult-quiz\{height:160px;margin:8px 0 4px;padding:8px 12px 10px\}/, 'hauteur réservée de l’accueil inchangée');
  assert.match(m, /\.cult-quiz-head\{height:22px\}/);
  assert.match(m, /\.cult-quiz-body\{height:120px\}/, 'corps = 160 − 8 − 10 − 22 px');
  assert.match(m, /\.cult-quiz-q\{flex:none;height:auto;max-height:calc\(2 \* 1\.25em\);margin:0 0 4px;font-size:13\.5px;line-height:1\.25;-webkit-line-clamp:2\}/);
  assert.match(m, /\.cult-quiz-word\{flex:0 1 38px;height:auto;min-height:30px;margin:0;font-size:30px\}/, 'le mot cède la place, jamais sous la taille de sa police');
  assert.match(m, /\.cult-quiz-choices,\.cult-quiz-done\{flex:none;margin-top:auto\}/, 'les choix restent en bas');
  /* Deux lignes de question + mot au minimum + marge + choix (52 px) tiennent dans le corps. */
  assert.ok(2 * 13.5 * 1.25 + 30 + 4 + 52 <= 120);
  /* Les messages posés sur place (hors ligne) utilisent cette même case. */
  assert.match(read('cultures-boot.js'), /querySelector\('\.cult-quiz-q'\);if\(q\)q\.textContent='Le mot du jour arrive dès que tu es en ligne\.'/);
});
