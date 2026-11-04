// Contract tests for the generated SEO site (pages, sitemap, robots, home markup, Netlify bundle).
// Run: node --test tests/seo-site.test.js   (needs chantiers A and B generated)
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const SPOTS = require('node:fs').existsSync(path.join(root, 'data/catalog.json')) ? JSON.parse(require('node:fs').readFileSync(path.join(root, 'data/catalog.json'), 'utf8')).length : 0;

test('generated SEO site passes every check', async () => {
  const { checkSeo } = await import(pathToFileURL(path.join(root, 'scripts/check-seo.mjs')).href);
  const { errors, stats } = checkSeo(root);
  assert.strictEqual(stats.spotPages, SPOTS, 'one page per spot');
  assert.ok(stats.sitemapUrls >= SPOTS, 'sitemap lists every spot');
  assert.deepStrictEqual(errors.slice(0, 20), []);
});
