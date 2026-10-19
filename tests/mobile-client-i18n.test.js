const test = require('node:test'), assert = require('node:assert/strict');
const vm = require('node:vm'), { read } = require('./src-extract.cjs');
/* demarrage-navigation-5 : tout toast de mobile/client.js a sa traduction en et es. */
test('les toasts de mobile/client.js figurent dans les dictionnaires en et es', () => {
  const strings = [...read('mobile/client.js').matchAll(/toast\?*\.?\(\s*'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'"));
  assert.ok(strings.length >= 1);
  for (const l of ['en', 'es']) {
    const c = vm.createContext({ window: {} }); vm.runInContext(read('locales/' + l + '.js'), c);
    for (const s of strings) assert.ok(c.window.OB_I18N_DICT[s], l + ' : ' + s);
  }
});
