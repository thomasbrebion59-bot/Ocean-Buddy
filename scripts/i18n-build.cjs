#!/usr/bin/env node
/*
 * Compile locales/translations/<langue>.json en locales/<langue>.js (chargés par i18n.js)
 * et inscrit la version de chaque dictionnaire dans i18n.js pour éviter les caches périmés.
 * Seuls les textes encore présents dans locales/source/fr.json sont conservés.
 *
 *   node scripts/i18n-build.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'locales/source/fr.json'), 'utf8'));
const dir = path.join(root, 'locales/translations');
const versions = {};
const MIN_COVERAGE = 0.99; // une langue incomplète n'est pas publiée : l'anglais la remplace
const report = [];

for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const lang = file.replace(/\.json$/, '');
  const all = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const dict = {};
  let missing = 0;
  for (const key of source) {
    if (typeof all[key] === 'string' && all[key].trim()) dict[key] = all[key];
    else missing++;
  }
  if ((source.length - missing) / source.length < MIN_COVERAGE) {
    fs.rmSync(path.join(root, 'locales', lang + '.js'), { force: true });
    report.push(`${lang.padEnd(8)} ${String(source.length - missing).padStart(5)}/${source.length}  non publiée (incomplète)`);
    continue;
  }
  const body = '/* Généré par scripts/i18n-build.cjs — ne pas modifier à la main. */\nwindow.OB_I18N_DICT=' +
    JSON.stringify(dict) + ';\n';
  fs.writeFileSync(path.join(root, 'locales', lang + '.js'), body);
  versions[lang] = crypto.createHash('sha256').update(body).digest('hex').slice(0, 10);
  report.push(`${lang.padEnd(8)} ${String(source.length - missing).padStart(5)}/${source.length}` + (missing ? `  (${missing} manquants)` : ''));
}

const i18nPath = path.join(root, 'i18n.js');
const i18n = fs.readFileSync(i18nPath, 'utf8');
const next = i18n.replace(/\/\*VERSIONS\*\/[\s\S]*?\/\*\/VERSIONS\*\//, '/*VERSIONS*/' + JSON.stringify(versions) + '/*/VERSIONS*/');
if (next === i18n && !i18n.includes('/*VERSIONS*/')) throw new Error('Marqueur /*VERSIONS*/ absent de i18n.js');
fs.writeFileSync(i18nPath, next);
console.log(report.join('\n'));
console.log(`${Object.keys(versions).length} dictionnaire(s) compilé(s) dans locales/.`);
