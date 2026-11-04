# Catalogue et photographies

`data/catalog.json` est la **source unique des 774 spots** : identifiant, nom, région, coordonnées, activités, niveau, description, guide, palette, photo et provenance. Les 168 fiches historiques, les 112 ajouts sourcés et les 438 ajouts de septembre 2026 (152 puis 286), les 10 ajouts d'octobre 2026 et les 46 ajouts « Noël au soleil » de décembre 2026 y sont réunis. `node scripts/build-ai-catalog.cjs` valide ce fichier et génère `catalog-runtime.js` pour l'application, `assets/spots/sources.json` pour les crédits et `netlify/functions/lib/catalog.json` pour les fonctions serveur. Les tests vérifient l'égalité des identités et des champs dérivés. Modifier uniquement la source canonique, jamais ces vues générées.

Les textes supplémentaires qui existaient dans des listes séparées sont aussi dans chaque fiche concernée : `anecdote`, `funFact`, `fauna` et `zones`. Ces champs sont facultatifs. L'absence de champ signifie qu'aucun texte spécifique n'a été fourni pour cette rubrique ; les textes historiques présents gardent leur statut éditorial non vérifié.

Les 168 descriptions historiques n'ont pas de vérification externe documentée : chacune porte `editorialStatus: "unverified"` et un libellé d'avertissement. Les 112 autres fiches ont une source et une date de revue. Une source de photographie ne valide pas les affirmations sur la sécurité, la saison ou la pratique. Les anciennes valeurs statiques de vent, température et houle restent dans certains objets pour compatibilité d'affichage et ne sont pas des observations actuelles.

Le bloc « Préparer la visite » montre sur les 280 fiches trois rubriques : accès, meilleure période et règles locales. Les indications présentes dans l'objet facultatif `visit` (`access`, `bestPeriod`, `localRules`, `reviewed`) sont reprises uniquement lorsque la fiche a une source éditoriale HTTPS et une date de consultation. Chaque rubrique absente affiche « À vérifier localement ». Sept fiches possèdent actuellement des indications pratiques tirées de leur source liée ; cela ne dispense pas de revérifier horaires, accès, météo et réglementation avant une sortie. Pour en ajouter, lire la source de la fiche, consigner seulement ce qu'elle atteste et dater la consultation.

Les 44 anciennes fiches bonus ont disparu de la recherche publique. `data/legacy-bonus-spots.json` conserve leurs identifiants et libellés pour les favoris et voyages existants. Seuls les lieux correspondant avec certitude à une fiche du catalogue ont un `canonicalId` ; les autres restent des étapes archivées que l'utilisateur peut remplacer sans perdre ses notes.

## Mise à jour

1. Modifier `data/catalog.json`. Pour une nouvelle photographie, vérifier le lieu, l'auteur et la licence, ajouter le fichier local et actualiser l'objet `photo` de la fiche.
2. Avec Pillow, exécuter `python3 scripts/build_photo_variants.py` pour créer les variantes légères définies dans les objets `photo`.
3. Exécuter `node scripts/build-ai-catalog.cjs` pour régénérer les vues navigateur, photo et serveur, puis `python3 scripts/build_photo_catalog.py` pour la page de crédits. Le premier script refuse les doublons, données essentielles manquantes, médias absents et crédits incomplets.
4. Exécuter `python3 scripts/audit_spot_photos.py` et les tests. Actualiser les versions d'actifs après les derniers changements JavaScript ou CSS.

Les anciennes copies séparées du catalogue et leurs scripts ont été retirés afin d'éviter toute dérive. `data/legacy-bonus-spots.json` reste la source de la migration des anciennes données privées ; après une édition, exécuter `python3 scripts/build_legacy_spots.py`.

L'audit initial a rectifié la photo du Great Blue Hole, qui montrait auparavant Half Moon Caye, et remplacé des images trop panoramiques ou peu nettes à La Baule, La Palue et Hourtin par des photographies de 1280 px. Les vues de Hauteville-sur-Mer, Sorake/Nias et Pantín ont été recadrées depuis leurs originaux Commons à haute définition, sans agrandissement, en conservant les crédits et licences. Six dimensions de manifeste étaient inexactes. Les photographies affectées à Tamarindo et à The Pass représentaient respectivement Playa Grande et Wategos Beach : elles ont été retirées et les deux fiches signalent qu'une photo du lieu reste à vérifier. Les légendes de Cumbuco et Ngor précisent que les vues montrent une zone voisine et la plage d'accès. **Quatorze originaux panoramiques ont encore un côté inférieur à 600 px** ; leurs petites variantes accélèrent les listes mais ne créent aucun détail absent de la source. Ils restent à remplacer par des photographies plus adaptées après vérification du lieu et des droits.

## Ajouter un lot de spots (exemple : édition « Noël au soleil », décembre 2026)

Un lot = `data/new-spots-<édition>-<lot>.cjs` (fiches sourcées, même forme que `data/new-spots-2026-10.cjs`), `data/new-spot-photos-<édition>-<lot>.json` (photos Wikimedia Commons : fichier, auteur, licence, URL `download` = vignette 1280 px de l'API Commons) et ses sources dans `data/sources/new-spots-<édition>-<lot>.md`. Plusieurs lots d'une même édition se fusionnent l'un après l'autre (le badge « Nouveau » est gardé pour toute l'édition).

1. `node scripts/add-spots.cjs data/new-spots-2026-12-<lot>.cjs data/new-spot-photos-2026-12-<lot>.json catalogue-2026-12` (idempotent : un identifiant déjà présent est ignoré).
2. `python3 scripts/fetch-spot-photos.py` télécharge les photos manquantes (User-Agent descriptif, une requête à la fois, licence et dimensions vérifiées contre Commons ; un fichier refusé est signalé, jamais contourné), puis `python3 scripts/build_photo_variants.py` crée les vignettes.
3. `node scripts/build-ai-catalog.cjs`, `python3 scripts/build_photo_catalog.py`, `python3 scripts/audit_spot_photos.py`.
4. Données dérivées : climat (`build-climate.py`), accès (`build-access.py`), faune (`build-wildlife.py`) et saisons (`build-seasons.cjs`). Les scripts `fetch-climate.py` / `fetch-wildlife.py` qui remplissent le dossier de cache ne sont pas dans le dépôt : en décembre 2026, climat et accès des 46 spots ont été calculés avec les mêmes fonctions sur un cache limité aux nouveaux spots (NASA POWER, NOAA OISST, ERA5 via Open-Meteo, OurAirports) puis fusionnés dans `climate.json` / `access.json` sans toucher aux autres fiches ; la faune n'a pas été régénérée.
5. Carnet : une entrée par spot dans `data/spot-guides.json` (+ `.en.json`, `.es.json`) avec au moins `respect` et `season` (« À vérifier localement » sans source), puis `node scripts/build-spot-guides.cjs`, `node scripts/build-seasons.cjs`. Un pays nouveau demande une entrée dans `data/sources/urgences.json` (puis `node scripts/build-emergency.cjs`).
6. Traductions EN et ES de chaque texte français dans `locales/translations/en.json` et `es.json`, puis `node scripts/i18n-extract.cjs` et `node scripts/i18n-build.cjs`.
7. `node scripts/build-seo.cjs`, `node scripts/check-seo.mjs`, `python3 scripts/version-assets.py`, `npm test`.

## Modifier un texte de conseil (tip, dangers, desc, visit, carnet)

Règle : aucun fait, chiffre, date ou règle sans source. Un texte de conseil publié repose sur une entrée de `data/sources/` (`faits.json`, `essentiel.json`, `schemas.json`), ou sur le climat interne avec la mention « d'après les normales NOAA », ou ne s'écrit pas. Retirer une affirmation douteuse est toujours permis ; ce qui n'est pas sourcé va dans `data/sources/a-verifier.json`.

1. Éditer `data/catalog.json` (conseil, `dangers`, `visit`, `carnet`) et, pour le carnet de destination, `data/spot-guides.json` (français) et `data/spot-guides.en.json` (anglais, mêmes phrases). Mettre à jour en même temps l'entrée de `data/sources/` : son `text` doit rester identique au texte publié (`tests/catalog-advice.test.js`).
2. Ajouter la traduction anglaise et espagnole de chaque nouveau texte français du catalogue dans `locales/translations/en.json` et `es.json`, la clé étant le texte français exact. Les textes du carnet de destination ne passent pas par cette étape.
3. Générer : `node scripts/build-ai-catalog.cjs` (valide `visit` et `carnet`, écrit `catalog-runtime.js` et `assets/spots/sources.json`), `node scripts/build-spot-guides.cjs`, `node scripts/build-seasons.cjs`, puis `node scripts/i18n-extract.cjs` et `node scripts/i18n-build.cjs`. Ne jamais modifier à la main les fichiers générés.
4. Lancer `node --test tests/catalog.test.js tests/catalog-advice.test.js tests/spot-safety-diagram.test.js tests/seasons.test.js`. Les schémas « passe » (62 spots aujourd'hui) se choisissent à la lecture du français des `dangers` : retirer le mot « courant » d'un danger de plongée change le schéma.

Fiches `reviewed` : `dangers` reste vide (le `tip` n'est écrit que s'il est sourcé). Les consignes sourcées vont dans `visit`, et les phrases du carnet dans `carnet`, toujours marquées « non vérifié ».
