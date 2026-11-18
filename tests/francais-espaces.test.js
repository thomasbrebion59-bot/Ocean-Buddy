const test = require('node:test'), assert = require('node:assert/strict');
const { i18nContext, read, fnSource } = require('./src-extract.cjs');
/* Français : espace insécable (U+00A0) devant : ; ! ? » et après «, posée à l’affichage par le passage français
   d’i18n.js (arrowsOnly), pour qu’un signe ne passe jamais seul en début de ligne (« tubulaires / : ne va à l’eau »).
   Faux DOM minimal : éléments (tag, parent, closest) et nœuds de texte dont on compte les écritures. */
const NB = ' ';
let writes = 0;
function txt(s) {
  let v = s;
  return { nodeType: 3, get nodeValue() { return v; }, set nodeValue(x) { writes++; v = x; } };
}
function el(tag, kids = [], attrs = {}) {
  const e = { nodeType: 1, tag, attrs, kids: [], parentNode: null,
    closest(sel) {
      const list = sel.split(',');
      for (let x = this; x && x.nodeType === 1; x = x.parentNode) {
        if (list.some(s => s === x.tag || (s.startsWith('[') && s.slice(1, -1) in x.attrs))) return x;
      }
      return null;
    } };
  for (const k of kids) { k.parentNode = e; e.kids.push(k); }
  return e;
}
const texts = root => root.nodeType === 3 ? [root] : root.kids.flatMap(texts);
function french(body) {
  let observer = null;
  const doc = { readyState: 'complete', documentElement: {}, currentScript: null, body, title: '', write() {},
    addEventListener() {}, getElementById() { return null; },
    createTreeWalker(root) { const list = texts(root); return { nextNode: () => list.shift() || null }; } };
  i18nContext('fr', { document: doc, NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver: class { constructor(cb) { observer = cb; } observe() {} } });
  return records => observer(records);
}

test('français : insécable devant : ; ! ? », après «, y compris en début de nœud et sans lettre avant', () => {
  const danger = txt('Vague sur récif, avec plusieurs sections tubulaires : ne va à l’eau que si tu es à l’aise ; sinon reste au bord !');
  const question = txt('Où veux-tu aller ?');
  const quote = txt('Ouvre « Mon sport et mon niveau » dans Réglages.');
  const start = txt(' : top');
  const arrow = txt('Marée ↔ : montante');
  const body = el('body', [el('p', [danger]), el('h2', [question]), el('p', [quote]), el('div', [el('b', [txt('Saison')]), start]), el('span', [arrow])]);
  french(body);
  assert.equal(danger.nodeValue, `Vague sur récif, avec plusieurs sections tubulaires${NB}: ne va à l’eau que si tu es à l’aise${NB}; sinon reste au bord${NB}!`);
  assert.equal(question.nodeValue, `Où veux-tu aller${NB}?`);
  assert.equal(quote.nodeValue, `Ouvre «${NB}Mon sport et mon niveau${NB}» dans Réglages.`);
  assert.equal(start.nodeValue, `${NB}: top`, '« <b>Saison</b> : top » : l’espace en début de nœud est prise');
  assert.equal(arrow.nodeValue, `Marée ↔︎${NB}: montante`, 'nœud avec flèche : la flèche passe en texte ET l’espace devient insécable');
});

test('français : ni « :// », ni deux-points entre deux chiffres ; un chiffre avant une phrase reste traité', () => {
  const link = txt('Lien ://exemple');
  const hour = txt('Rendez-vous à 10 : 30');
  const level = txt('Niveau 2 : avancé');
  french(el('body', [el('p', [link]), el('p', [hour]), el('p', [level])]));
  assert.equal(link.nodeValue, 'Lien ://exemple');
  assert.equal(hour.nodeValue, 'Rendez-vous à 10 : 30');
  assert.equal(level.nodeValue, `Niveau 2${NB}: avancé`);
});

test('français : jamais dans ce qu’on saisit ni dans du code (textarea, contenteditable, select, pre, code, script, style)', () => {
  const kept = ['textarea', 'pre', 'code', 'script', 'style'].map(tag => [tag, txt('Note : à revoir !')]);
  const editable = txt('Mon carnet : à remplir ?');
  const option = txt('Tous ?');
  const body = el('body', [...kept.map(([tag, t]) => el(tag, [t])), el('div', [el('p', [editable])], { contenteditable: '' }), el('select', [el('option', [option])])]);
  french(body);
  for (const [tag, t] of kept) assert.equal(t.nodeValue, 'Note : à revoir !', tag);
  assert.equal(editable.nodeValue, 'Mon carnet : à remplir ?', 'contenteditable (même sur un ancêtre)');
  assert.equal(option.nodeValue, 'Tous ?', 'option sans value : son texte serait la valeur enregistrée');
});

test('français : idempotent (l’observateur ne réécrit rien) et nœuds ajoutés plus tard traités', () => {
  const a = txt('Prêt ?'), b = txt('Sans ponctuation');
  const body = el('body', [el('p', [a]), el('p', [b])]);
  writes = 0;
  const observe = french(body);
  assert.equal(writes, 1, 'une seule écriture, sur le nœud qui en a besoin');
  observe([{ type: 'characterData', target: a }, { type: 'characterData', target: b }]);
  assert.equal(writes, 1, 'la mutation produite par la correction ne change plus rien : pas de boucle');
  const later = txt('Bon retour, Thomas ! L’océan t’attendait.');
  observe([{ type: 'childList', addedNodes: [el('div', [later])] }]);
  assert.equal(later.nodeValue, `Bon retour, Thomas${NB}! L’océan t’attendait.`);
  observe([{ type: 'characterData', target: later }]);
  assert.equal(writes, 2);
});

test('anglais et espagnol intacts : les espaces françaises ne vivent que dans le passage français d’i18n.js', () => {
  const src = read('i18n.js');
  const fr = src.indexOf("if (lang === 'fr')"), engine = src.indexOf('/* ---------- Moteur de traduction');
  assert.ok(fr > 0 && engine > fr, 'le passage français rend la main avant le moteur de traduction');
  assert.match(src.slice(fr, src.indexOf('\n', src.indexOf('\n', fr) + 1)), /arrowsOnly\);[^\n]*arrowsOnly\(\);/);
  assert.match(src.slice(fr, engine), /return;/);
  const calls = [...src.matchAll(/frenchSpaces\(/g)].map(m => m.index);
  const only = fnSource(src, 'arrowsOnly'), at = src.indexOf(only);
  assert.equal(calls.filter(i => i < at || i > at + only.length).length, 1, 'frenchSpaces : sa définition, puis appelée seulement dans arrowsOnly');
  /* Les dictionnaires restent tels quels : aucune insécable ajoutée par ce changement. */
  for (const l of ['en', 'es']) assert.ok(!read(`locales/${l}.js`).includes('Challenge complete !'), l);
});

test('« Bon retour » compare son texte sans les insécables posées à l’affichage (sinon il ne se retirait plus sous une fenêtre)', () => {
  const app = read('app.js');
  assert.match(app, /const plain=s=>String\(s\)\.replace\(\/\\u00a0\/g,' '\),t=document\.getElementById\('toast'\),said=plain\(t\.textContent\);/);
  assert.match(app, /plain\(t\.textContent\)!==said/);
});
