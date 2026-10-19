/* Extrait des fonctions de scripts de navigateur (app.js...) pour les tester sans DOM complet. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function fnSource(src, name) {
  const m = new RegExp('(?:async\\s+)?function\\s+' + name + '\\s*\\(').exec(src);
  if (!m) throw new Error('fonction introuvable : ' + name);
  let i = src.indexOf('{', m.index + m[0].length), d = 0, q = null;
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
