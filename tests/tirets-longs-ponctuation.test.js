const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle final 3 : tirets longs (—) employés comme ponctuation dans l’onboarding, les textes de « Préserver » et la note
   du circuit mondial (Défis). Remplacés par une virgule, un deux-points ou un point selon le sens ; traductions EN/ES
   reprises. Les noms de spots (« Hossegor — La Gravière ») restent tels quels : c’est au fondateur de trancher. */
const html = read('index.html'), app = read('app.js');
const tr = l => JSON.parse(read(`locales/translations/${l}.json`));

test('onboarding et circuit mondial : plus de tiret long de ponctuation', () => {
  assert.ok(html.includes('Choisis ton sport nautique. Tu pourras changer quand tu veux.'));
  assert.ok(html.includes('Je ne sais pas, montre-moi les activités près de moi'));
  assert.ok(html.includes("la météo et les marées, et gagne de l'XP en protégeant l'océan avec Poulpy."));
  assert.ok(html.includes('<b>Championship Tour 2026</b> : le calendrier officiel du circuit mondial'));
  const onb = html.slice(html.indexOf('id="onb"'), html.indexOf('id="onb"') + 12000);
  assert.ok(!/<div class="tag"[^>]*>[^<]*—/.test(onb), 'aucun sous-titre de l’onboarding avec un tiret long');
  assert.ok(!/class="evt-note">[^\n]*—/.test(html));
});

test('Préserver : les gestes et les présentations de zone sans tiret long', () => {
  const line = app.split('\n').find(l => l.startsWith('var PRESERVE='));
  assert.ok(line && !line.includes('—'));
  assert.ok(line.includes("S'en approcher le fait fuir à l'eau et l'épuise : reste loin et observe."));
  assert.ok(line.includes("(en France, le Réseau national échouages). Ne le remets pas à l'eau toi-même."));
});

test('traductions anglaises et espagnoles des textes repris, sans tiret long ; noms de spots inchangés', () => {
  const src = JSON.parse(read('locales/source/fr.json'));
  const keys = src.filter(k => /Tu pourras changer quand tu veux|Je ne sais pas, montre-moi|et les marées, et gagne|Championship Tour 2026<\/b> :|^: le calendrier officiel|l'épuise : reste loin|échouages\)\. Ne le remets|dépendants, même avec du pain|grands poissons, et où|réchauffement, mais pas au contact|en saison : on n'y circule|ne les touche pas : c'est interdit/.test(k));
  assert.equal(keys.length, 12);
  for (const l of ['en', 'es']) { const d = tr(l); for (const k of keys) { assert.ok(d[k], l + ' : ' + k.slice(0, 40)); assert.ok(!d[k].includes('—'), l + ' : ' + d[k].slice(0, 40)); } }
  assert.equal(tr('en')['Je ne sais pas, montre-moi les activités près de moi'], 'I’m not sure, show me activities near me');
  assert.match(read('spot-name.js') + read('catalog-runtime.js'), /Hossegor — La Gravière/, 'noms de spots : non touchés');
});
