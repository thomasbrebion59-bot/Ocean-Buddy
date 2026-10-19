// Contract tests for the generated SEO site (pages, sitemap, robots, home markup, Netlify bundle).
// Run: node --test tests/seo-site.test.js   (needs chantiers A and B generated)
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');

test('generated SEO site passes every check', async () => {
  const { checkSeo } = await import(pathToFileURL(path.join(root, 'scripts/check-seo.mjs')).href);
  const { errors, stats } = checkSeo(root);
  assert.strictEqual(stats.spotPages, 718, 'one page per spot');
  assert.ok(stats.sitemapUrls >= 718, 'sitemap lists every spot');
  assert.deepStrictEqual(errors.slice(0, 20), []);
});
