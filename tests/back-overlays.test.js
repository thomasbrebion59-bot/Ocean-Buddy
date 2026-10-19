/* demarrage-navigation-2 : le Retour (Android, navigateur) ferme d’abord la couche la plus haute,
   y compris la confirmation, la mise à jour, la feuille « Choisis ton mois » et le relief terrestre. */
const test = require('node:test'), assert = require('node:assert');
const { read, load } = require('./src-extract.cjs');

/* Faux DOM minimal : chaque sélecteur interrogé par closeTopOverlay renvoie l’élément enregistré. */
function el(name, log, children = {}) {
  return { name, hidden: false, isConnected: true, classList: { contains: () => false },
    click() { log.push(name); }, querySelector: s => children[s] || null };
}
function setup(present, extra = {}) {
  const log = [], reg = {};
  for (const [sel, e] of Object.entries(present)) reg[sel] = e(log);
  const $ = s => reg[s] || null;
  const document = { documentElement: { classList: { contains: () => false } },
    querySelectorAll: s => (reg[s] ? [reg[s]] : []), dispatchEvent: () => log.push('escape') };
  const g = Object.assign({ $, document, body: { dataset: { screen: extra.screen || 'home' } },
    visible: e => !!e && !e.hidden, KeyboardEvent: class { constructor(t, o) { Object.assign(this, o); } },
    closeSettings: () => log.push('settings'), closeChat: () => log.push('chat') }, extra.globals || {});
  g.window = g;
  const ctx = load('app-shell.js', ['closeTopOverlay'], g);
  return { ctx, log };
}

test('Retour sur la feuille « Choisis ton mois » : elle se ferme, l’app ne part pas en arrière-plan', () => {
  const log = [];
  const { ctx } = setup({}, { globals: { OceanPlan: { isOpen: () => true, close: () => log.push('plan') } } });
  assert.strictEqual(ctx.closeTopOverlay(), true);
  assert.deepStrictEqual(log, ['plan']);
});

test('spot-plan.js expose isOpen et close pour le Retour', () => {
  const src = read('spot-plan.js');
  assert.match(src, /window\.OceanPlan = \{[^\n]*\bisOpen\b/);
  assert.match(src, /window\.OceanPlan = \{[^\n]*\bclose\b/);
});

test('Retour sur une confirmation au-dessus des Réglages : la confirmation est annulée, les Réglages restent', () => {
  const { ctx, log } = setup({
    '#settingsModal.open': l => el('settings-el', l),
    '.as-confirm.open': l => el('confirm', l, { '[data-v="0"]': el('confirm-cancel', l) })
  });
  assert.strictEqual(ctx.closeTopOverlay(), true);
  assert.deepStrictEqual(log, ['confirm-cancel']);
});

test('Retour sur la fenêtre de mise à jour : « Plus tard », rien d’autre', () => {
  const { ctx, log } = setup({
    '#settingsModal.open': l => el('settings-el', l),
    '.app-update.show': l => el('update', l, { '.app-update-later': el('update-later', l) })
  });
  assert.strictEqual(ctx.closeTopOverlay(), true);
  assert.deepStrictEqual(log, ['update-later']);
});

test('Retour sur le relief terrestre : il se ferme avant la carte du spot dessous', () => {
  const { ctx, log } = setup({
    '#spotMapWrap .omap-card': l => el('card', l, { '.omap-card-close': el('card-close', l) }),
    '.terrain-overlay': l => el('terrain', l, { '[data-terrain-close]': el('terrain-close', l) })
  }, { screen: 'spots' });
  assert.strictEqual(ctx.closeTopOverlay(), true);
  assert.deepStrictEqual(log, ['terrain-close']);
});

test('Sans couche ouverte : false (le Retour peut naviguer)', () => {
  const { ctx } = setup({});
  assert.strictEqual(ctx.closeTopOverlay(), false);
});
