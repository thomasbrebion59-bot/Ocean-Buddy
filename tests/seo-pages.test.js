'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('une page par spot, avec balises essentielles et JSON-LD valide', () => {
  const titles = new Set();
  for (const s of catalog) {
    const html = read(`spot/${s.id}/index.html`);
    assert.ok(Buffer.byteLength(html) < 30 * 1024, `${s.id} < 30 Ko`);
    const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
    assert.ok(title, `${s.id} title`); titles.add(title);
    assert.match(html, /<meta name="description" content="[^"]{20,}"/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://[^"]+/spot/${s.id}/">`));
    assert.match(html, /name="apple-itunes-app" content="app-id=6811870966"/);
    assert.match(html, /<h1>[^<]+<\/h1>/);
    assert.ok(html.includes(`href="../../?spot=${encodeURIComponent(s.id)}"`));
    assert.ok(html.includes('https://apps.apple.com/fr/app/ocean-buddy/id6811870966'));
    const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    assert.deepStrictEqual(ld.map((o) => o['@type']), ['TouristAttraction', 'BreadcrumbList']);
    assert.ok(!/href="\/|src="\//.test(html), `${s.id} aucun chemin absolu`);
    assert.ok(!/ratingValue|aggregateRating|reviewCount/.test(html));
  }
  assert.ok(titles.size > catalog.length * 0.99, 'titres quasi tous uniques');
});

test('sitemap : XML simple, 725 spots, robots.txt', () => {
  const sm = read('sitemap.xml');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.strictEqual(new Set(locs).size, locs.length);
  for (const s of catalog) assert.ok(locs.some((l) => l.endsWith(`/spot/${s.id}/`)), s.id);
  assert.strictEqual(locs.filter((l) => /\/spot\//.test(l)).length, catalog.length);
  assert.ok(/^<\?xml/.test(sm) && sm.trim().endsWith('</urlset>'));
  assert.match(read('robots.txt'), /Allow: \/\n[\s\S]*Sitemap: https:\/\/.+\/sitemap\.xml/);
});

test('liens internes relatifs des pages générées existent', () => {
  const files = [];
  const walk = (d) => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { const p = `${d}/${e.name}`; e.isDirectory() ? walk(p) : e.name === 'index.html' && files.push(p); } };
  walk('spot'); walk('spots');
  for (const f of files) {
    const html = read(f);
    for (const m of html.matchAll(/(?:href|src)="([^"#?:]+)(?:\?[^"]*)?"/g)) {
      const target = path.join(ROOT, path.dirname(f), decodeURIComponent(m[1]));
      assert.ok(fs.existsSync(target), `${f} -> ${m[1]}`);
    }
  }
});
