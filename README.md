# Ocean Buddy — Surf trips

Application de découverte des destinations nautiques et de préparation des voyages, maintenue sur la branche `codex/ocean-redesign`.

## Ouvrir l’application

Depuis ce dossier :

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Ouvrir http://127.0.0.1:8765/. Aucun build ni installation npm n’est nécessaire.

## Cette version

La palette associe cobalt, sable, corail et citron vert. Les cartes de destinations ont une photographie lumineuse et un cartouche blanc ; le lieu représenté est indiqué. La navigation reste latérale sur ordinateur et inférieure sur téléphone.

L’aquarium est remplacé par **Surf trips** : plusieurs voyages, dates facultatives, étapes à choisir parmi les 280 spots ou les favoris, ordre modifiable, carte, notes par étape, checklist personnalisable, hébergements, transports et budget. Chaque fiche de spot propose « Ajouter à un voyage ». Trois idées de départ sont proposées sans créer de voyage automatiquement : côte basque, Portugal et Bali.

Les voyages sont enregistrés dans le stockage du navigateur. Ils peuvent être archivés puis restaurés et exportés en JSON. Le bouton **Supprimer** est disponible sur les cartes de voyages, dans les fiches et dans les archives. Après confirmation, le voyage rejoint une **corbeille locale** : il disparaît des voyages disponibles et reste récupérable avec ses étapes, notes et préparatifs. La restauration remet un voyage archivé dans les archives. Aucune suppression définitive automatique n’est appliquée. Il n’y a pas de synchronisation entre appareils ni de moteur de réservation. La ligne de la carte relie les étapes ; elle ne calcule pas un trajet routier. Les données de profil, favoris, progression et sessions sont conservées.

Les sept couvertures de destinations et 278 photographies principales sont locales ; deux spots n’ont pas encore de photo locale. Vingt-quatre spots proposent déjà 29 vues supplémentaires. La galerie peut, après une action de l’utilisateur, chercher d’autres images sur Wikimedia Commons et n’afficher que les fichiers portant une licence réutilisable avec leurs crédits. Ces résultats restent des suggestions : le lieu représenté doit être vérifié. Les fiches s’ouvrent sur un grand panorama, avec une galerie plein écran qui conserve l’image entière. Les auteurs, sources et licences locales sont accessibles dans `photos.html`. Les paysages sont des photographies réelles sans transformation générative ; Poulpy conserve son identité illustrée.

Les fiches proposent des repères colorés, une checklist adaptée à l’activité, un carnet personnel, un comparateur de trois lieux et une carte 2D de secteur qui s’ouvre à la demande. Un lien facultatif cherche aussi des vidéos du lieu sur YouTube. Les notes sont privées au navigateur ; elles ne sont pas envoyées à l’assistant. Les conditions proviennent du modèle Open-Meteo quand il est disponible ; les lacs ne reçoivent pas de données de houle ou de marée océanique. Les coordonnées situent un secteur, pas une mise à l’eau validée ; la carte n’affiche donc pas de point de courant ou de mise à l’eau inventé.

Douze petits Poulpy illustrent maintenant les neuf activités et les trois niveaux dans les filtres, les fiches, la carte, les voyages et le choix initial. Les illustrations et leurs prompts sont documentés dans [assets/poulpy/icons/README.md](assets/poulpy/icons/README.md).

Dans chaque fiche, **Prends tes repères** associe une photographie ouvrable en grand, trois repères adaptés à l’activité et des explications sur le vent, les vagues, la marée, l’eau et le niveau. Les schémas interactifs sont pédagogiques : ils ne représentent ni la géographie du spot, ni une mesure locale. Les prévisions disponibles sont identifiées séparément. Le contenu est adapté aux plans d’eau intérieurs ; les sources RNLI, NOAA et Open-Meteo sont liées auprès des explications. Les onglets et le curseur de marée fonctionnent au clavier.

L’intégration conversationnelle de Poulpy utilise une fonction Netlify et l’API Responses d’OpenAI. Son activation et sa configuration sont décrites dans [backend/README.md](backend/README.md). Si aucune URL de serveur n’est configurée, l’interface identifie explicitement le guide intégré.

## Fichiers principaux

- `index.html` : structure des écrans.
- `base.css`, `design.css`, `adventure.css` : structure et couches historiques de styles.
- `coastal.css`, `trips.css` : palette actuelle et carnet de voyage.
- `app.js` : catalogue, conditions, défis, profil et progression.
- `design.js` : navigation, recherche globale et accès au clavier.
- `trip-model.js`, `trips.js` : données et interface des voyages.
- `field-guide.js`, `field-guide.css` : fiches immersives, préparation et repères pratiques.
- `poulpy-icons.js`, `spot-immersion-model.js`, `spot-immersion.js`, `spot-immersion.css` : petits Poulpy et explications interactives des caractéristiques.
- `spot-gallery.js`, `spot-notebook-model.js`, `spot-notebook.js` : galerie, comparaison et notes personnelles.
- `poulpy-assistant.js`, `poulpy-config.js`, `netlify/functions/` : client et serveur de discussion.
- `photo-catalog.js`, `photos.html`, `assets/spots/` : photographies locales et provenance.
- `scripts/build_photo_catalog.py` : reconstruit le catalogue et les crédits depuis le manifeste.
- `tests/trip-model.test.js` : validation des dates, persistance, ordre des étapes et cas d’erreur.

```sh
node --test tests/*.test.js tests/*.test.mjs
```

## Publication

Application statique compatible avec GitHub Pages et le chemin `/Ocean-Buddy/`. Publier l’ensemble des fichiers HTML, CSS et JavaScript à la racine, ainsi que le dossier `assets`. Pour Netlify, `scripts/build-static.cjs` prépare un dossier public explicite dans `.netlify/publish` ; le code serveur est déployé séparément en fonction. Aucun secret ne doit être placé dans le dépôt.

Adresse publique : [Ocean Buddy](https://thomasbrebion59-bot.github.io/Ocean-Buddy/). GitHub Pages publie automatiquement la branche principale.

Les conditions Open-Meteo, les cartes OpenStreetMap, Google Fonts et Leaflet nécessitent une connexion. La prévisualisation localhost et GitHub Pages ont chacune leur stockage. Le carnet de voyages utilise une clé indépendante (`oceanbuddy_trips_v1`) pour préserver les anciennes données de progression.
