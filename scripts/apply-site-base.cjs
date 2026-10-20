#!/usr/bin/env node
/*
 * Recopie OB_SITE_BASE (scripts/site-base.cjs) dans les fichiers statiques qui
 * contiennent une URL absolue du site, puis régénère les pages SEO.
 *
 *   node scripts/apply-site-base.cjs            → applique l'adresse par défaut
 *   OB_SITE_BASE=https://… node scripts/apply-site-base.cjs
 *   node scripts/apply-site-base.cjs --check    → échoue si un fichier n'est pas à jour
 *
 * Idempotent. Ne touche ni app-update/ (contenu déjà publié aux apps), ni la
 * documentation qui cite volontairement l'adresse historique GitHub Pages.
 */
'use strict';
const fs = require('node:fs'), path = require('node:path'), { spawnSync } = require('node:child_process');
const { OB_SITE_BASE, KNOWN_SITE_BASES } = require('./site-base.cjs');
const root = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');

/* Fichiers dont les URL absolues suivent l'adresse publique. */
const FILES = [
  'index.html', 'polish.js', 'photos.html', 'photo-catalog.js', 'catalog-runtime.js',
  'data/catalog.json', 'assets/spots/sources.json',
  'scripts/add_ai_images.py', 'mobile/store/app-store-fr.md',
];

const others = KNOWN_SITE_BASES.filter((b) => b !== OB_SITE_BASE);
const stale = [];
for (const rel of FILES) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  for (const old of others) after = after.split(old).join(OB_SITE_BASE);
  if (after === before) continue;
  stale.push(rel);
  if (!CHECK) fs.writeFileSync(file, after);
}

if (CHECK) {
  if (stale.length) { console.error('Adresse publique pas à jour (' + OB_SITE_BASE + ') dans : ' + stale.join(', ') + '\n→ node scripts/apply-site-base.cjs'); process.exit(1); }
  console.log('Adresse publique cohérente : ' + OB_SITE_BASE);
  process.exit(0);
}
console.log(stale.length ? 'Mis à jour (' + OB_SITE_BASE + ') : ' + stale.join(', ') : 'Rien à changer (' + OB_SITE_BASE + ')');
/* Pages SEO, sitemap.xml et robots.txt sont générés depuis la même adresse. */
const r = spawnSync(process.execPath, [path.join(__dirname, 'build-seo.cjs')], { stdio: 'inherit', env: { ...process.env, OB_SITE_BASE } });
process.exit(r.status || 0);
