const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle final 3 (mineur) : « Eau 17°C » (conditions du moment) à côté de « Eau ≈ 16 °C » (normales). Même écriture partout,
   avec l’espace avant « °C » ; les lecteurs de ces textes (parseFloat) lisent toujours le nombre. */
test('température de l’eau du moment : « 17 °C », comme les normales', () => {
  const app = read('app.js');
  assert.match(app, /temp:sst!=null\?`\$\{Math\.round\(sst\)\} °C`:'—'/);
  assert.match(app, /data\.temp=`\$\{Math\.round\(mc\.sea_surface_temperature\)\} °C`;/);
  assert.doesNotMatch(app, /\)\}°C`/);
  assert.equal(parseFloat('17 °C'.replace(',', '.')), 17, 'spot-data-model.js (num1) lit toujours 17');
});
