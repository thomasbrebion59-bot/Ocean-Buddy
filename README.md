# Ocean Buddy — nouvelle interface

Refonte de l’application existante, préparée le 12 septembre 2026 sur la branche `codex/ocean-redesign`.

## Ouvrir l’application

Depuis ce dossier :

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Puis ouvrir http://127.0.0.1:8765/ dans un navigateur. Aucun build ni installation npm n’est nécessaire.

## Direction visuelle

Une interface tournée vers le voyage et la découverte : photographie immersive, bleu profond, vert lagon, fonds écrus, touches orange et Poulpy comme compagnon. Manrope pour les titres et DM Sans pour la lecture.

- Accueil avec panorama original, recommandation, conditions et défi du jour.
- Navigation latérale sur ordinateur et barre inférieure sur téléphone.
- Destinations, cartes de spots, recherche globale et carte interactive.
- Fiches de spots : informations, météo, houle, marées, activités, faune et préservation.
- Défis, quiz, compétition, profil, carnet de sessions, badges et réglages.
- Aquarium, collections, fiches marines, vue immersive et discussion avec Poulpy.
- Accueil de première visite et choix d’activité/niveau.

Les 168 spots, les données et les illustrations existantes sont conservés. La recherche et le filtre de niveau s’appliquent également aux marqueurs de la carte. La recommandation de l’accueil affiche une explication cohérente avec le spot choisi. Les visiteurs déjà inscrits reviennent directement à l’accueil et peuvent changer leur activité à tout moment.

## Fichiers

- `index.html` : structure des écrans.
- `base.css` : règles de l’application initiale.
- `design.css` : nouvelle identité et compositions adaptatives.
- `app.js` : logique, catalogue, météo, progression et fonctions existantes.
- `design.js` : navigation, recherche globale, comportement de l’interface et améliorations clavier.
- `assets/original/` : 137 illustrations WebP extraites à l’identique du HTML initial.
- `assets/design/` : nouveaux visuels optimisés. Le PNG source du panorama n’est pas requis en production.
- `DESIGN-NOTES.md` : provenance des images et vérifications.

## Mise en ligne GitHub Pages

La livraison reste une application statique compatible avec le chemin `/Ocean-Buddy/`. Tous les chemins locaux sont relatifs.

Publier ensemble `index.html`, `app.js`, `design.js`, `base.css`, `design.css` et le dossier `assets`. Aucun secret ni configuration supplémentaire n’est nécessaire pour l’interface. La version publique n’a pas été remplacée pendant la refonte.

Les fonctionnalités qui accèdent à Open-Meteo, Wikimedia, OpenStreetMap, Google Fonts ou Leaflet nécessitent une connexion et dépendent de ces services. Les crédits photo et les indications sur les données modélisées restent présents dans l’application. Le guide intégré de Poulpy reste disponible sans son éventuel service de discussion distant.

La progression utilise le stockage local de l’application initiale : une prévisualisation localhost et la version GitHub Pages ont chacune leur stockage. Les valeurs de démonstration initiales de l’application sont conservées.
