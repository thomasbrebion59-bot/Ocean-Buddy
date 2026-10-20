# Cahier : Ocean Buddy trouvable sur Google (site SEO)

Worktree : `/Users/brebionthomas/Projects/Ocean-Buddy-site`, branche `site-seo` (depuis `origin/main` c79fddd).
Lire `AGENTS.md` avant toute action. Il contient les règles de publication et de stabilité du démarrage.

## 0. Contexte (vérifié le 19 oct. 2026)

- Demande de l'utilisateur : beaucoup de personnes ne trouvent pas Ocean Buddy sur l'App Store. Il veut un site que les moteurs de recherche indexent, et qu'en tapant « Ocean Buddy » sur Google, le site apparaisse.
- Site existant : GitHub Pages sert la racine de `main` sur `https://thomasbrebion59-bot.github.io/Ocean-Buddy/`. Chemins relatifs obligatoires (sous-chemin `/Ocean-Buddy/`).
- Cloudflare Pages : `scripts/build-cloudflare.cjs` (via `scripts/build-static.cjs` vers `.build/static`). Netlify n’est plus utilisé.
- Problèmes : aucun `robots.txt`, aucun `sitemap.xml`, pas de `canonical`, pas de JSON-LD, pas de lien App Store ni de Smart App Banner. Le `<title>` et la meta description de `index.html` existent. Les 718 spots sont rendus en JavaScript dans une app monopage, donc presque rien n'est indexable.
- Données : `data/catalog.json` = 718 spots `{id, name, loc, level, desc, dangers, tip, sports, world, coords, waterType, source, reviewed, editorialStatus, photo, …}`. Langues : fr (défaut), en, es (`locales/en.js`, `locales/es.js`).
- App Store : id `6811870966`, `https://apps.apple.com/fr/app/ocean-buddy/id6811870966`, version 1.3.1 en vente.
- Contraintes parallèles : une autre session repeint l'app en crème (`#FEF9EB`, bleu pétrole `#074459`, soleil `#FDBB53`, logo manta dans `assets/brand/` sur sa branche, pas encore sur `main`). Une autre ajoute de la motion. Ne pas modifier les CSS/JS existants sauf nécessité minime et documentée. Préférer de NOUVEAUX fichiers.

## 1. Objectif mesurable

- [ ] Taper « Ocean Buddy » sur Google affiche notre site (ou l'App Store) en premier résultat. Vérifié à la main, par l'utilisateur, après indexation.
- [ ] Chaque spot est trouvable via une requête du type « spot de surf <nom> » : une page HTML réelle par spot.
- [ ] `sitemap.xml` soumis dans Search Console et Bing Webmaster Tools, avec 718 URL de spots plus les pages d'index.
- [ ] Lighthouse SEO = 100 sur l'accueil et sur 3 pages spots prises au hasard.
- [ ] Zéro texte caché, zéro bourrage de mots-clés, zéro avis, note ou nombre de téléchargements inventé.

## 2. Chantier A : pages statiques générées (Sonnet 5.5)

- [ ] Créer `scripts/build-seo.cjs` (Node, sans dépendance). Il lit `data/catalog.json` et écrit `spot/<id>/index.html` pour les 718 spots.
- [ ] Chaque page contient du HTML réel : `h1` (nom du spot), description, niveau, sports, dangers, conseil, coordonnées, photo avec `alt`, source.
- [ ] Titres et descriptions uniques par spot, générés depuis les champs du catalogue. Pas de texte inventé. Si un champ est vide, on l'omet.
- [ ] Par page : `<link rel="canonical">`, balises `og:` et `twitter:`, `<meta name="apple-itunes-app" content="app-id=6811870966">`.
- [ ] JSON-LD : `TouristAttraction` ou `Place` + `BreadcrumbList`. Valide selon le validateur Schema.org.
- [ ] Lien « Ouvrir dans Ocean Buddy » vers `../../?spot=<id>` (chemin relatif, compatible `/Ocean-Buddy/`).
- [ ] Badge App Store vers `https://apps.apple.com/fr/app/ocean-buddy/id6811870966`.
- [ ] Pages d'index `spots/<continent>/index.html` et `spots/<continent>/<pays>/index.html`, générées depuis `world` et `loc`.
- [ ] Générer `sitemap.xml` (URL absolue avec la base du site) et `robots.txt` (autoriser tout, renvoyer vers le sitemap).
- [ ] CSS léger dans un NOUVEAU fichier `seo.css`, couleurs via variables (palette crème). Aucun JavaScript requis.
- [ ] Pages < 30 Ko hors image.
- [ ] Script idempotent : deux exécutions successives donnent un résultat identique (`git diff` vide la seconde fois).

## 3. Chantier B : accueil et ouverture par lien (Sonnet 5.5)

- [ ] `index.html` : `canonical`, JSON-LD `WebSite` + `MobileApplication` (lien App Store, AUCUNE note ni avis inventé).
- [ ] `apple-itunes-app` sur l'accueil.
- [ ] `hreflang` seulement si le contenu est réellement traduit dans la page concernée. Sinon, rien.
- [ ] Texte d'accueil indexable sans casser le démarrage : `<noscript>` ou section déjà rendue côté HTML, sans décalage visuel (hauteur réservée). Respecter `AGENTS.md` (un seul propriétaire de l'accueil : `home-feed.js`).
- [ ] Lien vers les pages spots et les index (section discrète, sous le fold ou dans le `noscript`).
- [ ] Nouveau petit fichier `deep-link.js` : lit `?spot=<id>` et ouvre le spot dans l'app. Il est branché via le signal `ocean:home-ready` (ne pas réécrire l'accueil).
- [ ] Tester avec le chargeur natif et un throttle CPU, pas seulement sur le Mac. `npm run check:boot` doit passer.

## 4. Chantier C : contrôles et publication (Sonnet 5.5, revue Opus)

- [ ] Tests `node --test` dans `tests/seo.test.js` :
  - [ ] sitemap valide (XML bien formé, 718 pages de spots présentes) ;
  - [ ] 718 pages `spot/<id>/index.html` ;
  - [ ] chaque page a `title`, `description`, `canonical`, JSON-LD parsable ;
  - [ ] aucun lien interne cassé ;
  - [ ] aucun chemin absolu `/...` qui casse sous `/Ocean-Buddy/`.
- [ ] Lighthouse SEO dans Chrome headless, sur un port autre que 8765.
- [ ] Mettre à jour les scripts de build. GitHub Pages sert le dépôt tel quel : les pages générées sont COMMITÉES. Cloudflare : `scripts/build-static.cjs` doit copier `spot/`, `spots/`, `sitemap.xml`, `robots.txt`.
- [ ] Lancer `python3 scripts/version-assets.py` après la dernière modification JS/CSS.
- [ ] Guide pas à pas pour l'utilisateur, dans le message final et dans `docs/seo-guide.md` :
  - [ ] valider la propriété dans Google Search Console (fichier ou balise fournis par l'utilisateur) ;
  - [ ] soumettre `sitemap.xml` ;
  - [ ] valider dans Bing Webmaster Tools (import depuis Search Console possible) ;
  - [ ] domaine recommandé : `oceanbuddy.app` ou `oceanbuddy.fr` (~10 à 20 €/an). À RECOMMANDER, pas à acheter. Brancher sur GitHub Pages avec un fichier `CNAME` et les enregistrements DNS indiqués par GitHub.
- [ ] Recommandations App Store (sous-titre, mots-clés, pays de disponibilité) : écrire dans le guide. NE RIEN modifier dans App Store Connect.
- [ ] Publication : commit sur `site-seo`, puis intégration et push `origin/main` par avance rapide seulement, après validation de l'utilisateur. Voir `AGENTS.md`.

## 5. Répartition des agents

- Sonnet 5.5 : chantiers A, B, C.
- Haiku 5.5 : petites tâches (vérification des liens, relecture des textes FR, génération du sitemap de test).
- Opus : revue finale avant toute demande de publication.

## 6. Ne pas faire

- [ ] Ne jamais pousser (`git push`), ne jamais publier, ne jamais soumettre d'OTA ni d'app. L'utilisateur publie lui-même avec des commandes « ! ».
- [ ] Ne pas modifier App Store Connect.
- [ ] Ne pas inventer d'avis, de notes, de nombre de téléchargements ni de classement.
- [ ] Pas de texte caché (`display:none`, `text-indent` négatif, etc.), pas de bourrage de mots-clés, pas de pages-portes sans contenu.
- [ ] Ne pas acheter de nom de domaine.
- [ ] Ne pas modifier les CSS/JS existants sauf nécessité minime et documentée. Préférer de nouveaux fichiers.
- [ ] Ne pas toucher aux assets de la session parallèle (crème, logo manta) ni à la motion.
- [ ] Ne pas réécrire ni réordonner l'accueil après la levée du rideau.
- [ ] Ne pas supprimer les anciennes versions de l'app ni `app-update/`.

## 7. Rendu attendu

- [ ] Branche `site-seo` avec les commits, sans push.
- [ ] `scripts/build-seo.cjs`, `seo.css`, `deep-link.js`, `spot/` (718 pages), `spots/` (index), `sitemap.xml`, `robots.txt`, `tests/seo.test.js`, `docs/seo-guide.md`.
- [ ] Résultat des tests `node --test`, du script `npm run check:boot` et du Lighthouse SEO (score par page testée).
- [ ] Liste des points à faire par l'utilisateur : Search Console, Bing, sitemap, domaine, recommandations App Store.
- [ ] Un court message final : ce qui est prêt, ce qui reste, et le blocage éventuel.
