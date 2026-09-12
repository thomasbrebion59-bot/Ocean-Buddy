# Ocean Buddy — design aventure

Refonte de l’application existante, préparée le 12 septembre 2026 sur la branche `codex/ocean-redesign`.

## Ouvrir l’application

Depuis ce dossier :

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Ouvrir http://127.0.0.1:8765/ dans un navigateur. Aucun build ni installation npm n’est nécessaire.

## Direction visuelle

Une identité inspirée des affiches de surf : bleu nuit, turquoise, orange et titres Barlow Condensed. L’accueil associe une vraie photographie de vague à une carte orange dédiée à Poulpy. Les destinations deviennent de grandes cartes photographiques, avec le lieu représenté et le nombre de spots.

Les sept visuels de destinations sont des photographies réelles : Corse, Algarve, Seychelles, Mexique, Brésil, Indonésie et Australie. Leur provenance et leur licence sont accessibles dans `photos.html`, depuis l’accueil, les destinations et les réglages. Aucun traitement génératif n’est appliqué à ces photos.

La nouvelle palette s’étend aux fiches de spots, conditions, défis, profil et aquarium. Navigation latérale sur ordinateur, barre inférieure sur téléphone. Les 168 spots et les fonctions existantes sont conservés : filtres, recherche globale, carte, favoris, météo, marées, quiz, carnet, progression et guide Poulpy.

## Fichiers

- `index.html` : structure des écrans.
- `base.css` : règles historiques.
- `design.css` : structure adaptative et première couche de refonte.
- `adventure.css` : identité actuelle, photographie, typographies et contrastes.
- `app.js` : logique, catalogue et données.
- `design.js` : navigation, recherche globale, interface et clavier.
- `photos.html` : photographes et licences.
- `assets/photos/` : photographies locales et métadonnées de provenance.
- `assets/original/` : illustrations de l’application initiale.
- `assets/design/` : mascotte et éléments de la première direction visuelle.
- `DESIGN-NOTES.md` : conception, provenance et vérifications.

## Mise en ligne GitHub Pages

Application statique compatible avec le chemin `/Ocean-Buddy/`. Les chemins locaux sont relatifs.

Publier ensemble `index.html`, `photos.html`, `app.js`, `design.js`, `base.css`, `design.css`, `adventure.css` et le dossier `assets`. Le ZIP de livraison rassemble ces éléments. La version publique n’a pas été remplacée pendant cette refonte.

Les fonctions Open-Meteo, Wikimedia, OpenStreetMap, Google Fonts et Leaflet nécessitent une connexion et dépendent de ces services. Les photos des destinations sont locales. Les crédits des photos de spots et les indications sur les données modélisées restent présents. Le guide intégré de Poulpy fonctionne sans son éventuel service distant.

La progression est enregistrée dans le stockage local de l’application initiale. Une prévisualisation localhost et la version GitHub Pages ont chacune leur stockage ; les valeurs de démonstration initiales sont conservées.
