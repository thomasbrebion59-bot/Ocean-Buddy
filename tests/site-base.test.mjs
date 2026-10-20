import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const site = require('../scripts/site-base.cjs');

test('une seule adresse publique, oceanbuddy.app par défaut', () => {
  assert.equal(site.DEFAULT_SITE_BASE, 'https://oceanbuddy.app/');
  assert.equal(site.OB_UPDATE_BASE, site.OB_SITE_BASE + 'app-update/');
  assert.equal(site.LEGACY_UPDATE_BASE, 'https://thomasbrebion59-bot.github.io/Ocean-Buddy/app-update/');
});

test('les fichiers statiques suivent OB_SITE_BASE', () => {
  const r = spawnSync(process.execPath, ['scripts/apply-site-base.cjs', '--check'], { encoding: 'utf8', env: {} });
  assert.equal(r.status, 0, r.stderr);
  const html = readFileSync('index.html', 'utf8');
  assert.match(html, /<link rel="canonical" href="https:\/\/oceanbuddy\.app\/">/);
  assert.match(readFileSync('robots.txt', 'utf8'), /Sitemap: https:\/\/oceanbuddy\.app\/sitemap\.xml/);
});

test('mises à jour directes : GitHub Pages reste en secours', () => {
  const client = readFileSync('mobile/client.js', 'utf8');
  assert.match(client, /UPDATE_FALLBACK/);
  const build = readFileSync('scripts/build-mobile.cjs', 'utf8');
  assert.match(build, /__OB_UPDATE_FALLBACK__/);
  assert.match(readFileSync('scripts/build-cloudflare.cjs', 'utf8'), /app-update/);
});
