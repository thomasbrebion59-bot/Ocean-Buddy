# Ocean Buddy — Surf trips

Refonte de l’application existante, préparée le 12 septembre 2026 sur la branche `codex/ocean-redesign`.

## Ouvrir l’application

Depuis ce dossier :

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Ouvrir http://127.0.0.1:8765/. Aucun build ni installation npm n’est nécessaire.

## Cette version

La palette associe cobalt, sable, corail et citron vert. Les cartes de destinations ont une photographie lumineuse et un cartouche blanc ; le lieu représenté est indiqué. La navigation reste latérale sur ordinateur et inférieure sur téléphone.

L’aquarium est remplacé par **Surf trips** : plusieurs voyages, dates facultatives, étapes à choisir parmi les 168 spots ou les favoris, ordre modifiable, carte, notes par étape, checklist personnalisable, hébergements, transports et budget. Chaque fiche de spot propose « Ajouter à un voyage ». Trois idées de départ sont proposées sans créer de voyage automatiquement : côte basque, Portugal et Bali.

Les voyages sont enregistrés dans le stockage du navigateur. Ils peuvent être archivés puis restaurés et exportés en JSON. Il n’y a pas de synchronisation entre appareils ni de moteur de réservation. La ligne de la carte relie les étapes ; elle ne calcule pas un trajet routier. Les données de profil, favoris, progression et sessions sont conservées.

Les sept couvertures de destinations ont été remplacées. Les 168 photos de spots sont maintenant locales, avec une sélection revue pour les lieux mis en avant. Leurs auteurs, sources et licences sont accessibles dans `photos.html`. Les paysages sont des photographies réelles sans transformation générative ; Poulpy conserve son identité illustrée.

## Fichiers principaux

- `index.html` : structure des écrans.
- `base.css`, `design.css`, `adventure.css` : structure et couches historiques de styles.
- `coastal.css`, `trips.css` : palette actuelle et carnet de voyage.
- `app.js` : catalogue, conditions, défis, profil et progression.
- `design.js` : navigation, recherche globale et accès au clavier.
- `trip-model.js`, `trips.js` : données et interface des voyages.
- `photo-catalog.js`, `photos.html`, `assets/spots/` : photographies locales et provenance.
- `scripts/build_photo_catalog.py` : reconstruit le catalogue et les crédits depuis le manifeste.
- `tests/trip-model.test.js` : validation des dates, persistance, ordre des étapes et cas d’erreur.

```sh
node --test tests/trip-model.test.js
```

## Publication

Application statique compatible avec GitHub Pages et le chemin `/Ocean-Buddy/`. Publier l’ensemble des fichiers HTML, CSS et JavaScript à la racine, ainsi que le dossier `assets`. Le ZIP de livraison contient ces éléments. Cette modification n’a pas été déployée sur le site public.

Les conditions Open-Meteo, les cartes OpenStreetMap, Google Fonts et Leaflet nécessitent une connexion. La prévisualisation localhost et GitHub Pages ont chacune leur stockage. Le carnet de voyages utilise une clé indépendante (`oceanbuddy_trips_v1`) pour préserver les anciennes données de progression.
