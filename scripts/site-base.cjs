/*
 * Adresse publique unique d'Ocean Buddy : OB_SITE_BASE.
 *
 * Toutes les URL absolues du site en dérivent : canonical, og:image, JSON-LD et
 * pages SEO (build-seo.cjs), sitemap.xml, robots.txt, lien « Partager », pages
 * publiques ouvertes depuis l'app (confidentialité, assistance, photos), base des
 * mises à jour directes (build-mobile.cjs) et liens « source » des photos
 * (data/catalog.json, assets/spots/sources.json et leurs copies générées).
 *
 *   Par défaut     : https://oceanbuddy.app/          (domaine principal, Cloudflare)
 *   Secours        : https://ocean-buddy.pages.dev/   (même déploiement Cloudflare Pages)
 *   Historique     : https://thomasbrebion59-bot.github.io/Ocean-Buddy/
 *                    (GitHub Pages : les apps déjà installées y lisent app-update/ et
 *                    privacy.html ; à garder en ligne, voir docs/ADRESSE-PUBLIQUE.md)
 *
 * Changer d'adresse : modifier DEFAULT_SITE_BASE ci-dessous (ou exporter
 * OB_SITE_BASE=https://…/), puis lancer `node scripts/apply-site-base.cjs`.
 */
'use strict';
const DEFAULT_SITE_BASE = 'https://oceanbuddy.app/';
const FALLBACK_SITE_BASE = 'https://ocean-buddy.pages.dev/';
const LEGACY_SITE_BASE = 'https://thomasbrebion59-bot.github.io/Ocean-Buddy/';

function normalize(url) {
  const base = String(url).trim().replace(/\/?$/, '/');
  if (!/^https:\/\/[^/?#\s]+\/[^?#\s]*$/.test(base)) throw Error('OB_SITE_BASE doit être une adresse https:// : ' + url);
  return base;
}

const OB_SITE_BASE = normalize(process.env.OB_SITE_BASE || process.env.SITE_BASE || DEFAULT_SITE_BASE);
/* Mises à jour directes : d'abord l'adresse publique, puis GitHub Pages (apps installées, secours). */
const OB_UPDATE_BASE = OB_SITE_BASE + 'app-update/';
const LEGACY_UPDATE_BASE = LEGACY_SITE_BASE + 'app-update/';
const KNOWN_SITE_BASES = [DEFAULT_SITE_BASE, FALLBACK_SITE_BASE, LEGACY_SITE_BASE];

module.exports = { OB_SITE_BASE, OB_UPDATE_BASE, LEGACY_UPDATE_BASE, DEFAULT_SITE_BASE, FALLBACK_SITE_BASE, LEGACY_SITE_BASE, KNOWN_SITE_BASES, normalize };
