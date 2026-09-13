# Catalogue de destinations

`catalog-expansion.json` ajoute 72 lieux aux 168 fiches historiques. Les activités et descriptions sont rapprochées des offices de tourisme, gestionnaires et organismes indiqués dans `sources`. La date `reviewed` concerne cette revue éditoriale, pas une observation des conditions sur place.

Les coordonnées désignent un **secteur côtier approximatif**, jamais un point de mise à l’eau validé. Les niveaux non documentés restent `variable`. Aucune note utilisateur, taille de houle, température, saison ou affluence n’est créée pour compléter une fiche.

Les photographies réelles et leurs licences figurent dans `assets/spots/sources.json`. `photoContext` précise les vues plus larges du littoral ou du village. Les images sont optimisées en WebP et présentées par recadrage CSS ; les paysages ne subissent pas de transformation générative.

Après une modification :

```sh
python3 scripts/build_catalog_expansion.py
python3 scripts/build_photo_catalog.py
python3 scripts/version-assets.py
node --test tests/catalog.test.js tests/trip-model.test.js
```

Le script `research_catalog_photos.py` prépare des candidats dans le dossier de travail `../output/catalogue-240`. Il faut vérifier le lieu, la licence et le cadrage avant d’inscrire une photo dans le manifeste. `cache_catalog_expansion.py` restaure uniquement les images déjà choisies dans ce manifeste.
