# Guide : faire trouver Ocean Buddy sur Google

Ce guide explique, pas à pas, ce que TU dois faire toi-même. Rien ne se fait tout seul : Google et Bing doivent d'abord connaître le site, puis l'indexer. Compte de quelques jours à quelques semaines.

Adresse du site : https://oceanbuddy.app/ (secours : https://ocean-buddy.pages.dev/ ; voir docs/ADRESSE-PUBLIQUE.md)
Le plan du site pour les moteurs : https://oceanbuddy.app/sitemap.xml

Honnêteté : personne ne peut garantir une première place sur Google pour « Ocean Buddy ». Un nom de marque rare a de bonnes chances, mais seul Google décide. On met toutes les chances de notre côté, sans triche.

## 1. Google Search Console (le plus important)

1. Va sur https://search.google.com/search-console et connecte-toi avec ton compte Google.
2. Clique « Ajouter une propriété ».
3. Choisis « Préfixe d'URL » et colle : `https://oceanbuddy.app/`
4. Google te propose des méthodes de validation. Prends « Balise HTML » (ou « Fichier HTML »).
   - Balise : copie la ligne `<meta name="google-site-verification" content="...">` et envoie-la moi. Je l'ajoute dans `index.html`.
   - Fichier : télécharge le fichier `google....html` et envoie-le moi. Je le place à la racine du dépôt.
5. Après publication du site avec cette balise ou ce fichier, reviens et clique « Valider ».
6. Menu « Sitemaps » : écris `sitemap.xml` et clique « Envoyer ». Statut attendu : « Réussite ».
7. Menu « Inspection d'URL » : colle l'adresse de l'accueil, puis « Demander une indexation ». Refais-le pour 2 ou 3 pages de spots. Ne le fais pas pour les 718 pages : le sitemap s'en charge.
8. Reviens dans 3 à 7 jours : menu « Pages » pour voir combien sont indexées.

## 2. Bing Webmaster Tools

Bing alimente aussi DuckDuckGo, Ecosia et d'autres.

1. Va sur https://www.bing.com/webmasters et connecte-toi.
2. Le plus simple : « Importer depuis Google Search Console ». Autorise l'accès, et le site, la validation et le sitemap sont repris.
3. Sinon, ajoute le site à la main, valide avec la balise ou le fichier qu'ils donnent (envoie-les moi), puis soumets `sitemap.xml`.

## 3. Un vrai nom de domaine (recommandé, pas acheté)

L'adresse `thomasbrebion59-bot.github.io/Ocean-Buddy/` est longue et ne ressemble pas à une marque. Un domaine propre aide à la confiance et aux recherches de marque.

- Candidats : `oceanbuddy.app` (environ 15 à 20 euros par an) ou `oceanbuddy.fr` (environ 8 à 12 euros par an). Vérifie la disponibilité chez un registrar (Gandi, OVH, Cloudflare, Namecheap). Je n'ai rien acheté.
- Une fois acheté, dis-le moi. Je ferai :
  1. un fichier `CNAME` à la racine du dépôt contenant uniquement le domaine (par exemple `oceanbuddy.app`) ;
  2. la mise à jour des adresses du sitemap, de robots.txt et des balises canonical vers le nouveau domaine.
- De ton côté, chez le registrar, ajoute les enregistrements DNS que GitHub indique (GitHub, dépôt, Settings, Pages, Custom domain). En général :
  - domaine nu (`oceanbuddy.app`) : quatre enregistrements `A` vers `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` ;
  - sous-domaine `www` : un enregistrement `CNAME` vers `thomasbrebion59-bot.github.io`.
  Vérifie ces valeurs dans la page GitHub avant de les saisir, elles peuvent changer.
- Dans GitHub Pages, saisis le domaine et coche « Enforce HTTPS » quand la case est disponible.
- Ensuite, ajoute le nouveau domaine dans Search Console et Bing, et utilise « Changement d'adresse » dans Search Console pour l'ancien site.

## 4. Recommandations pour la fiche App Store (à faire toi-même)

Je n'ai rien modifié dans App Store Connect. Idées à appliquer toi-même :

- Nom de l'app : « Ocean Buddy » (déjà n°1 sur la recherche « ocean buddy » en France).
- Sous-titre (30 caractères maximum) : décris l'usage réel, par exemple « Spots de surf et plongée » (vérifie qu'il tient en 30 caractères). Le sous-titre est indexé par l'App Store.
- Champ mots-clés (100 caractères maximum, séparés par des virgules, sans espaces) : ne répète pas les mots déjà dans le nom et le sous-titre. Pense à surf, plongée, vagues, spots, marées, océan, kitesurf, snorkeling, et leurs équivalents anglais.
- Pays et régions : rends l'app disponible dans tous les pays où elle fonctionne, pas seulement la France. Les fiches en anglais et en espagnol sont utiles puisque l'app est traduite en trois langues.
- Localisations : remplis nom, sous-titre, description et mots-clés en anglais et en espagnol, pas seulement en français.
- Captures d'écran : les trois ou quatre premières comptent le plus. Elles doivent montrer de vrais écrans de l'app.
- Lien vers le site : mets l'adresse du site dans « URL marketing » et « URL d'assistance ».
- Pas de faux chiffres dans la description (ni téléchargements, ni notes).

Lien de la fiche : https://apps.apple.com/fr/app/ocean-buddy/id6811870966

## 5. Autres gestes simples

- Mets l'adresse du site dans les bios (Instagram, TikTok, YouTube) et sous chaque vidéo. Plus de liens vers le site aident Google.
- Partage une page de spot quand tu parles d'un spot précis.
- Ne crée jamais de faux avis ni de faux classement : Google et l'App Store le détectent.

## 6. Ce qui est déjà prêt dans le site

- Une page par spot (`spot/<id>/`), avec titre et description uniques, données structurées et lien vers l'App Store.
- Des pages d'index par continent et par pays (`spots/`).
- `sitemap.xml` et `robots.txt`. Attention : sous `github.io/Ocean-Buddy/`, Google ne lit que le `robots.txt` placé à la racine de l'hôte (qui appartient à un autre dépôt), donc ce fichier est ignoré et le sitemap n'est PAS annoncé automatiquement. Il faut le soumettre à la main dans Search Console et Bing (étape 6). Le `robots.txt` ne prendra effet qu'avec un domaine personnalisé à la racine.
- Une bannière Smart App Banner pour les visiteurs iPhone.
- Contrôle automatique : `node scripts/check-seo.mjs` (ou `node --test tests/seo-site.test.js`). Il vérifie les 718 pages, le sitemap, les liens, les chemins relatifs, les données structurées et l'absence de texte caché ou de fausse note.
- `scripts/build-static.cjs` (build Cloudflare) copie aussi les pages et le sitemap.

## 7. Vérifier que ça marche

- Dans Google, tape `site:thomasbrebion59-bot.github.io/Ocean-Buddy` : le nombre de résultats grandit avec le temps.
- Tape « Ocean Buddy » et « Ocean Buddy surf » : note la position après 2 à 4 semaines.
- Test de données structurées : https://search.google.com/test/rich-results (colle l'adresse d'une page spot).
