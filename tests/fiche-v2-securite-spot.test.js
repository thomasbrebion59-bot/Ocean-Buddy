/* Fiche v2, onglets Sécurité et Le spot (18 nov. 2026, demande du fondateur : « trop d'infos, trop moche »).
   Sécurité : rien de replié, rien de tronqué ; danger, urgences (numéro en grand, bouton rouge « Appeler le {numéro} »
   avec le numéro local réel), À surveiller, baïnes et courants, courants du moment, drapeaux et avertissements.
   Le spot : la description entière, Le savais-tu ?, repères pratiques sourcés, conseil de Poulpy, le bon geste et une
   ligne vers la culture du pays, crédits, replis « Photos et carte », « J'ai surfé ici » en bas. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
const html = read('index.html'), app = read('app.js'), css = read('fiche.css');
const panel = html.slice(html.indexOf('<div class="dcat" data-cat="securite"'), html.indexOf('<!-- ============ CHALLENGES'));
const section = (name, next) => css.slice(css.indexOf('ONGLET ' + name), css.indexOf('fin de la section ' + next));
const secu = section('SÉCURITÉ', 'Sécurité'), spot = section('LE SPOT', 'Le spot');
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

test('Sécurité : toutes les informations d’avant restent dans l’onglet (numéros, bouton tel:, poste de secours, drapeaux, avertissements)', () => {
  for (const id of ['dDangers', 'spotSafetyLive', 'dEmerg', 'dSea', 'dCall', 'dRescue', 'dSafeNote'])
    assert.match(panel, new RegExp(`id="${id}"`), id);
  assert.match(panel, /Numéro d'urgence ici/);
  assert.match(panel, /Poste de secours le plus proche/);
  assert.match(panel, /Drapeaux de baignade<\/h3>\s*<p class="field-flags-note">Repère le balisage, les panneaux et les consignes du poste de secours\./);
  assert.match(panel, /Vérifie le numéro local et les horaires de surveillance avant ta sortie\./);
  assert.match(panel, /112 est le numéro commun de l’Union européenne<\/a> ; à l’étranger, consulte les consignes locales\./);
  /* Secours en mer, autres numéros, date de vérification : toujours posés par openSpot. */
  assert.match(app, /document\.getElementById\('dSea'\)\.textContent=/);
  assert.match(app, /_ck\.textContent=_shown\?`Numéro vérifié le /);
  assert.match(app, /_more\.id='dEmergMore'/);
  /* Aucun repli, aucune vue dans l’onglet. */
  assert.doesNotMatch(panel, /<details|data-obf|\shidden[\s>=]/);
  assert.doesNotMatch(read('replis.js'), /securite: \[/);
});

test('Sécurité : « Appeler le {numéro} » avec le numéro local réel, jamais le 112 en dur', () => {
  assert.match(app, /if\(em\.call\)callButton\.href='tel:'\+em\.call;else callButton\.removeAttribute\('href'\);/);
  assert.match(app, /if\(em\.call\)\{var _ci=callButton\.querySelector\('svg'\);callButton\.replaceChildren\(\.\.\.\(_ci\?\[_ci\]:\[\]\),document\.createTextNode\(`Appeler le \$\{em\.call\}`\)\);\}/);
  assert.doesNotMatch(app, /Appeler le 112/);
  assert.match(app, /callButton\.hidden=!em\.call;/, 'sans numéro composable, pas de bouton');
  /* Bouton large, rouge (rouge réservé au danger), texte clair, jamais coupé. */
  const rule = secu.match(/\.sx-urg #dCall\{([^}]*)\}/);
  assert.ok(rule, 'règle du bouton d’appel');
  assert.match(rule[1], /min-height:52px/);
  assert.match(rule[1], /background:var\(--t-danger\)/);
  assert.match(rule[1], /color:var\(--t-on-alert\)/);
  assert.match(rule[1], /white-space:normal/);
  assert.match(rule[1], /border-radius:999px/);
  const tr = k => [JSON.parse(read('locales/translations/en.json'))[k], JSON.parse(read('locales/translations/es.json'))[k]];
  assert.deepEqual(tr('Appeler le {0}'), ['Call {0}', 'Llamar al {0}']);
});

test('Sécurité : ordre danger, urgences, À surveiller, baïnes, courants du moment, drapeaux ; rien de coupé', () => {
  const order = sel => Number((secu.match(new RegExp(`#detail \\.dcat\\[data-cat="securite"\\]>${sel.replace(/[.#]/g, m => '\\' + m)}\\{order:(\\d+)\\}`)) || [])[1]);
  const seq = ['#dDanger', '.safety-block', '.sx-watch', '#sdRip', '#spotSafetyLive', '.sx-foot'].map(order);
  assert.ok(seq.every(Number.isFinite), JSON.stringify(seq));
  assert.deepEqual([...seq].sort((a, b) => a - b), seq, 'ordre croissant');
  const body = noComments(secu);
  assert.doesNotMatch(body, /text-overflow:ellipsis|line-clamp|white-space:nowrap|max-height/);
  assert.doesNotMatch(body, /\.(sx-urg|sx-watch|sx-foot|danger-item|sd-rip)[^{]*\{[^}]*overflow:(hidden|clip)/);
  /* Corps de texte : seulement les variables de la fiche. */
  assert.doesNotMatch(body, /font:\d+ \d+(\.\d+)?px|font-size:\d/);
  assert.match(html, /<div class="block sx-watch"><h3 class="fx-title fx-title-s" id="dDangersTitle">À surveiller<\/h3><div id="dDangers"><\/div><\/div>/);
});

test('À surveiller : le danger principal, déjà en tête de l’onglet, n’est pas répété ; les autres lignes restent entières', () => {
  assert.match(app, /const dangerRow=\(d,i\)=>[^\n]*<div class="danger-item"\$\{i===0\?' data-main':''\}>/);
  assert.match(app, /ownDangers\.map\(dangerRow\)/);
  assert.match(secu, /#detail \.sx-watch #dDangers>\.danger-item\[data-main\]\{display:none\}/);
  /* Même règle que la tête de l’onglet (SpotFitModel.mainDanger) : premier danger du catalogue, sinon du carnet. */
  const F = require('../spot-fit-model.js');
  assert.equal(F.mainDanger({ dangers: [['🌊', 'Vagues puissantes.'], ['🌀', 'Baïnes.']] }).text, 'Vagues puissantes.');
  assert.equal(F.mainDanger({ dangers: [], carnet: { dangers: [['🌀', 'Courants.']] } }).text, 'Courants.');
});

test('Courants à vérifier : titre en casse de phrase, aucune chaîne reliée par des points médians dans les relevés', () => {
  const exp = read('spot-experience.js');
  assert.match(exp, /const head = '<h3 class="fx-title fx-title-s" id="spotSafetyLiveTitle">Courants & dangers à vérifier<\/h3>';/);
  assert.doesNotMatch(exp, /LECTURE DU SECTEUR|Courant marin · modèle|\} m · modèle/);
  assert.match(exp, /Ouvre les vidéos proposées sur YouTube, lues seulement si tu les lances\./);
});

test('Le spot : description, repères pratiques et culture du pays en casse de phrase, sans pastilles ni doublons', () => {
  const fg = read('field-guide.js'), sg = read('spot-guide.js');
  assert.match(fg, /const head='<h3 class="fx-title fx-title-s" id="fieldVisitTitle">Repères pratiques<\/h3>';/);
  assert.match(fg, /<small>Source du catalogue<\/small>/);
  assert.doesNotMatch(fg, /SOURCE DU CATALOGUE|REPÈRES PRATIQUES/);
  /* La mention éditoriale reste, en note. */
  assert.match(app, /'Informations éditoriales à confirmer auprès de sources locales\.'/);
  assert.match(spot, /\.field-story \.spot-provenance\{[^}]*font:400 var\(--fiche-note\)/);
  /* Retirés de l’affichage : tuiles de l’en-tête, numéros de chapitre, pastilles du mot du coin et du plat. */
  assert.match(spot, /#detail \.dcat\[data-cat="infos"\] #fieldAtAGlance\{display:none!important\}/);
  assert.match(spot, /#detail \.guide-chapter-number\{display:none!important\}/);
  assert.match(spot, /#detail \.dcat\[data-cat="infos"\] #guideGlance\{display:none!important\}/);
  const spirit = sg.slice(sg.indexOf('function spiritHTML('), sg.indexOf('/* ---------- À découvrir autour'));
  assert.doesNotMatch(spirit, /guide-chapter|guide-spirit-cover|guide-vibe|La bonne saison|<img/);
  /* Description entière : aucun repli ni découpe dans l’onglet. */
  assert.doesNotMatch(noComments(spot), /line-clamp|text-overflow:ellipsis|max-height/);
  assert.doesNotMatch(noComments(spot), /font:\d+ \d+(\.\d+)?px|font-size:\d/);
  /* « Photos et carte » reste replié ; « J’ai surfé ici » ferme l’onglet, une seule fois dans la fiche. */
  assert.match(read('replis.js'), /id: 'images', title: 'Photos et carte'/);
  assert.equal((html.match(/id="dLogBtn"/g) || []).length, 1);
  assert.match(read('replis.css'), />#dLogBtn\{order:95\}/);
  const btn = spot.match(/>#dLogBtn\{([^}]*)\}/);
  assert.ok(btn && /white-space:normal/.test(btn[1]) && /overflow:visible/.test(btn[1]), 'libellé jamais coupé');
  for (const [k, en, es] of [['Repères pratiques', 'Practical guidance', 'Referencias prácticas'], ['Le mot du coin :', 'Local lingo:', 'La palabra local:'], ['À goûter :', 'Must-try:', 'Para probar:'], ['Source du catalogue', 'Catalogue source', 'Fuente del catálogo']]) {
    assert.equal(JSON.parse(read('locales/translations/en.json'))[k], en, k);
    assert.equal(JSON.parse(read('locales/translations/es.json'))[k], es, k);
  }
});

test('À surveiller : un pictogramme en trait par ligne de danger, pour toutes les familles du catalogue', () => {
  const vm = require('node:vm');
  const start = app.indexOf('var DANGER_FAMILY'), end = app.indexOf('function spotTokens');
  const ctx = { window: {} };
  vm.runInNewContext(read('poulpy-icons.js'), ctx);
  vm.runInNewContext(app.slice(start, end) + ';this.dangerStyle=dangerStyle;this.dangerTrait=dangerTrait;this.T=DANGER_TRAIT;', ctx);
  const catalog = JSON.parse(read('data/catalog.json'));
  const keys = new Set();
  for (const s of catalog) for (const d of [...(s.dangers || []), ...((s.carnet && s.carnet.dangers) || [])]) if (Array.isArray(d) && d[1]) keys.add(ctx.dangerStyle(d[0], d[1])[0]);
  const vigil = ctx.dangerTrait('vigilance');
  for (const k of keys) {
    const svg = ctx.dangerTrait(k);
    /* Trait seul (aucun aplat, aucune image), couleur du texte, caché des lecteurs d’écran (le texte suit). */
    assert.match(svg, /^<svg class="fx-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1\.6"[^>]*aria-hidden="true"/, k);
    assert.doesNotMatch(svg, /<image|\.webp|fill="currentColor"/, k);
  }
  /* Les familles fréquentes ont leur dessin propre (pas le triangle de repli). */
  for (const k of ['spirale', 'wave', 'rocher', 'bateau', 'vent', 'corail', 'requin', 'meduse', 'surveillance', 'secours_eloignes', 'cyclone_typhon']) assert.notEqual(ctx.dangerTrait(k), vigil, k);
  assert.equal(ctx.dangerTrait('clé inconnue'), vigil);
  /* La ligne de danger n’a plus de pastille colorée ni de picto illustré. */
  assert.match(app, /<span class="di">\$\{dangerTrait\(dangerTraitKey\(d\[0\],d\[1\]\)\)\}<\/span><span>\$\{esc\(d\[1\]\)\}<\/span>/);
  /* Emoji d’animal, phrase sur autre chose : la phrase choisit (« 🐠 Forte affluence. ») ; sinon l’emoji reste. */
  vm.runInNewContext('this.K=dangerTraitKey;', ctx);
  assert.equal(ctx.K('🐠', 'Forte affluence.'), 'affluence');
  assert.equal(ctx.K('🐠', 'Raies et poissons-pierres.'), 'poisson');
  assert.equal(ctx.K('🌀', 'Courants latéraux par grosse houle.'), 'spirale');
  assert.match(secu, /\.sx-watch \.danger-item \.di\{[^}]*color:var\(--t-ink\)!important/);
});

test('Sécurité sans danger listé : « Danger non évalué » n’est pas répété, la consigne reste', () => {
  assert.match(app, /'<p data-unrated><b>Danger non évalué<\/b><\/p><p>Vérifie les consignes locales avant ta sortie\.<\/p>'/);
  assert.match(secu, /#detail \.sx-watch #dDangers>p\[data-unrated\]\{display:none\}/);
  assert.match(read('spot-before.js'), /g\.n == null \? 'Danger non évalué'/);
});

test('Schémas des courants : légendes en casse de phrase, sans point médian, traduites', () => {
  const exp = read('spot-experience.js');
  const labels = [...exp.matchAll(/<text x="\d+" y="\d+">([^<]+)<\/text>/g)].map(m => m[1]);
  assert.ok(labels.length >= 14, String(labels.length));
  const en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json'));
  for (const l of labels) {
    assert.notEqual(l, l.toUpperCase(), 'capitales : ' + l);
    assert.doesNotMatch(l, /·/, l);
    assert.ok(en[l] && es[l], 'traduction : ' + l);
  }
  /* Consignes de sortie gardées mot pour mot. */
  assert.ok(labels.includes('Sortir sur le côté, ne pas lutter'));
  assert.ok(labels.includes('Ne lutte pas, rejoins la rive en biais'));
  assert.match(secu, /\.safety-diagram text\{[^}]*letter-spacing:0/);
});

test('Sources : « Source : {libellé}, consultée le {date} », sans point médian (repères pratiques, baïnes, consignes)', () => {
  for (const f of ['field-guide.js', 'spot-experience.js', 'spot-data.js']) {
    const src = read(f);
    assert.doesNotMatch(src, /\} · consultée le \$\{/, f);
    assert.match(src, /Source : \$\{esc\(x\.l\)\}, consultée le \$\{/, f);
  }
  assert.equal(JSON.parse(read('locales/translations/en.json'))['Source : {1}, consultée le {2}'], 'Source: {1}, accessed on {2}');
  assert.equal(JSON.parse(read('locales/translations/es.json'))['Source : {1}, consultée le {2}'], 'Fuente: {1}, consultada el {2}');
});

test('Photos et carte : ni sur-titre en capitales, ni filet, ni carte autour de la carte du secteur', () => {
  assert.match(spot, /:is\(#spotVideoPanel \.experience-heading small,#spotAreaMap \.area-map-heading small,#obVoyageBanner small,\.gallery-empty>small\)\{display:none\}/);
  assert.match(spot, />:is\(#spotVideoPanel,#spotAreaMap\)\{margin:0 0 var\(--fiche-gap\);padding:0;border:0;border-radius:0;background:none/);
  assert.match(spot, /#spotAreaMap \.area-map-footer a\{[^}]*min-height:44px/);
});

test('Le spot : « Le bon geste » ne répète pas le conseil de Poulpy', () => {
  const vm = require('node:vm');
  const src = read('spot-guide.js'), i = src.indexOf('function spiritHTML('), j = src.indexOf('/* ---------- À découvrir autour');
  const block = { attrs: {}, toggleAttribute(k, v) { this.attrs[k] = v; } };
  const ctx = vm.createContext({ culture: () => ctx.c, country: () => 'France', esc: v => String(v ?? ''), NT: '', svg: () => '', P: {}, document: { getElementById: () => ({ closest: () => block }) } });
  vm.runInContext(src.slice(i, j) + ';this.spiritHTML=spiritHTML;', ctx);
  const run = (respect, s) => { ctx.c = { respect, grounded: true }; return ctx.spiritHTML(s); };
  /* Identique (ponctuation et casse mises à part) : pas de bon geste, le conseil reste. */
  assert.doesNotMatch(run('Évite les berges vaseuses.', { tip: 'Évite les berges vaseuses' }), /Le bon geste/);
  assert.equal(block.attrs['data-in-geste'], false);
  /* Le bon geste prolonge le conseil du catalogue : il le remplace. */
  assert.match(run('Entre avec des chaussons, ne te tiens jamais à l’épave.', { tip: 'Entre avec des chaussons.' }), /Le bon geste/);
  assert.equal(block.attrs['data-in-geste'], true);
  /* Conseil du carnet (non vérifié) : il reste affiché avec sa mention. */
  run('Entre avec des chaussons, ne te tiens jamais à l’épave.', { carnet: { tip: 'Entre avec des chaussons.' } });
  assert.equal(block.attrs['data-in-geste'], false);
  /* Textes différents : les deux restent. */
  assert.match(run('Sois discret.', { tip: 'Rame au large.' }), /Le bon geste/);
  assert.equal(block.attrs['data-in-geste'], false);
  assert.match(spot, /\.field-tip\[data-in-geste\]\{display:none!important\}/);
});

test('Le spot : la carte du secteur reste dans l’onglet (repli « Photos et carte »), crédits et provenance sans point médian', () => {
  const exp = read('spot-experience.js');
  assert.match(exp, /const infos=\$\('#detail \.dcat\[data-cat="infos"\]'\);if\(infos&&panel\.parentNode!==infos\)infos\.append\(panel\);/);
  assert.doesNotMatch(exp, /around\.after\(panel\)/);
  assert.match(app, /host\.append\('\. ',v\);/);
  assert.match(app, /Carnet Ocean Buddy, non vérifié<\/small>/);
  const fg = read('field-guide.js');
  assert.doesNotMatch(fg, /\+' · ':s\.photoContext/);
  const vm = require('node:vm');
  const credit = (caption, ctxt) => { const m = fg.match(/textContent=photo\?(\(\(photo\.caption\|\|s\.photoContext\)[^;]*?)\+'Photographie : '/); return vm.runInNewContext(m[1], { photo: { caption }, s: { photoContext: ctxt } }); };
  assert.equal(credit('Vue de la plage, à Bali.'), 'Vue de la plage, à Bali. ');
  assert.equal(credit('Vue de la plage'), 'Vue de la plage. ');
  assert.equal(credit('', 'Le port'), 'Le port. ');
  assert.equal(credit(''), '');
});

test('Le spot en anglais ou en espagnol : le doublon se repère sur le texte français du carnet', () => {
  const vm = require('node:vm');
  const src = read('spot-guide.js'), i = src.indexOf('function culture('), j = src.indexOf('/* ---------- À découvrir autour');
  const block = { attrs: {}, toggleAttribute(k, v) { this.attrs[k] = v; } };
  const fr = { spots: { x: { r: 'Entre avec des chaussons.' } }, countries: {} };
  const es = { spots: { x: { r: 'Entra con escarpines.' } }, countries: {} };
  const ctx = vm.createContext({ data: es, window: { OCEAN_SPOT_GUIDES: fr }, country: () => 'France', esc: v => String(v ?? ''), NT: '', svg: () => '', P: {},
    document: { getElementById: () => ({ closest: () => block }) } });
  vm.runInContext(src.slice(i, j) + ';this.spiritHTML=spiritHTML;', ctx);
  /* Bon geste espagnol identique (en français) au conseil : pas de bon geste. */
  assert.doesNotMatch(ctx.spiritHTML({ id: 'x', tip: 'Entre avec des chaussons.' }), /Le bon geste/);
  assert.match(ctx.spiritHTML({ id: 'x', tip: 'Rame au large.' }), /Le bon geste[\s\S]*Entra con escarpines\./);
});
