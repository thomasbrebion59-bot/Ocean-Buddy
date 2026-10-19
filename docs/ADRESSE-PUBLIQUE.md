# Adresse publique d'Ocean Buddy

Une seule variable : `OB_SITE_BASE`, définie dans `scripts/site-base.cjs`.

| Rôle | Adresse |
| --- | --- |
| Principale (par défaut) | https://oceanbuddy.app/ (domaine acheté chez Cloudflare, branché sur le projet Cloudflare Pages `ocean-buddy`) |
| Secours | https://ocean-buddy.pages.dev/ (même déploiement Cloudflare Pages) |
| Historique | https://thomasbrebion59-bot.github.io/Ocean-Buddy/ (GitHub Pages, branche `main`) |

## Ce qui en dépend

- `index.html` : `og:image`, `canonical`, JSON-LD ; `polish.js` : lien « Partager ».
- Pages SEO `spot/`, `spots/`, `sitemap.xml`, `robots.txt` (`scripts/build-seo.cjs`).
- Liens « source » des photos : `data/catalog.json`, `assets/spots/sources.json` et leurs copies générées (`photo-catalog.js`, `catalog-runtime.js`, `photos.html`, `netlify/functions/lib/catalog.json`).
- App mobile (`scripts/build-mobile.cjs`) : pages publiques ouvertes depuis l'app (confidentialité, assistance, photos, règles) et base des mises à jour directes `OB_SITE_BASE + app-update/`, avec GitHub Pages en secours.
- Fiche App Store (`mobile/store/app-store-fr.md`) et URL de confidentialité (`scripts/asc-privacy-url.mjs`).

## Changer d'adresse

1. Modifier `DEFAULT_SITE_BASE` dans `scripts/site-base.cjs` (ou lancer avec `OB_SITE_BASE=https://…/`).
2. `node scripts/apply-site-base.cjs` : recopie l'adresse dans les fichiers ci-dessus et régénère les pages SEO.
3. `node scripts/apply-site-base.cjs --check` doit répondre « cohérente » (aussi vérifié par `npm test`).
4. Redéployer Cloudflare (`node scripts/build-cloudflare.cjs` puis `npx wrangler pages deploy .cloudflare/publish --project-name=ocean-buddy --branch=main`).

Pour revenir provisoirement à l'adresse de secours si oceanbuddy.app ne répond pas encore :
`OB_SITE_BASE=https://ocean-buddy.pages.dev/ node scripts/apply-site-base.cjs`.

## Brancher oceanbuddy.app

Cloudflare > Workers & Pages > `ocean-buddy` > Custom domains > ajouter `oceanbuddy.app` (et `www.oceanbuddy.app` en redirection). Vérifier ensuite :
`curl -sI https://oceanbuddy.app/ https://oceanbuddy.app/app-update/latest.json https://oceanbuddy.app/privacy`.
Puis Google Search Console : déclarer `https://oceanbuddy.app/` et son `sitemap.xml` (voir `docs/SEO-GUIDE.md`).

## Apps déjà installées : ne rien casser

Les apps iOS 1.2.0 à 1.3.2 lisent leurs mises à jour sur `https://thomasbrebion59-bot.github.io/Ocean-Buddy/app-update/` et leur page de confidentialité sur `…github.io/Ocean-Buddy/privacy.html`.

- GitHub Pages reste actif sur `main` (garder `.nojekyll`). Ne jamais rendre le dépôt privé ni désactiver Pages tant que ces versions circulent.
- Les nouvelles versions (et toute app recevant une mise à jour directe construite avec ce code) lisent d'abord `oceanbuddy.app/app-update/`, puis GitHub Pages si l'adresse principale ne répond pas.

## Publier une mise à jour directe (OTA) aux deux endroits

```sh
npm run check:boot
node scripts/publish-app-update.cjs           # remplit app-update/
git add app-update && git commit && git push origin HEAD:main   # 1) GitHub Pages
node scripts/build-cloudflare.cjs             # copie app-update/ dans .cloudflare/publish
npx wrangler pages deploy .cloudflare/publish --project-name=ocean-buddy --branch=main   # 2) Cloudflare
```

Contrôle : `latest.json` doit être identique aux deux adresses.
