/* Extrait des fonctions de scripts de navigateur (app.js...) pour les tester sans DOM complet. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function fnSource(src, name) {
  const m = new RegExp('(?:async\\s+)?function\\s+' + name + '\\s*\\(').exec(src);
  if (!m) throw new Error('fonction introuvable : ' + name);
  let p = 1, k = m.index + m[0].length;
  for (; p > 0; k++) { if (src[k] === '(') p++; else if (src[k] === ')') p--; }
  let i = src.indexOf('{', k), d = 0, q = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (c === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (c === '{') d++;
    else if (c === '}' && --d === 0) return src.slice(m.index, j + 1);
  }
  throw new Error('accolade non fermée : ' + name);
}
/* Charge les fonctions nommées de `file` dans un contexte vm muni de `globals`. */
function load(file, names, globals) {
  const src = read(file), ctx = vm.createContext(Object.assign({ console }, globals));
  vm.runInContext(names.map(n => fnSource(src, n)).join('\n'), ctx);
  return ctx;
}
module.exports = { read, fnSource, load, root };
/* Contexte vm avec le vrai moteur i18n.js et le dictionnaire de la langue (fr : sans dictionnaire). */
function i18nContext(lang, globals) {
  const doc = { readyState: 'loading', documentElement: {}, currentScript: null, addEventListener() {}, getElementById() { return null; }, title: '', write() {} };
  const ctx = vm.createContext(Object.assign({ document: doc, localStorage: { getItem: () => lang, setItem() {} }, navigator: { languages: [lang] },
    location: { search: '', href: 'http://x/' }, URLSearchParams, URL, Intl, Number, console, setTimeout, NodeFilter: {} }, globals));
  ctx.window = ctx;
  if (lang !== 'fr') vm.runInContext(read('locales/' + lang + '.js'), ctx);
  vm.runInContext(read('i18n.js'), ctx);
  return ctx;
}
function loadInto(ctx, file, names) { const src = read(file); vm.runInContext(names.map(n => fnSource(src, n)).join('\n'), ctx); return ctx; }
module.exports.i18nContext = i18nContext; module.exports.loadInto = loadInto;
