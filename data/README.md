# Données des destinations

`catalog.json` est le catalogue canonique des 280 spots. Les fiches, activités, coordonnées, photographies, textes et sources y sont réunis. Les vues utilisées par le navigateur, les crédits photo et les fonctions serveur sont générées depuis ce fichier ; leur procédure de mise à jour est décrite dans `../docs/catalog-maintenance.md`.

Les coordonnées désignent un secteur approximatif, jamais un point de mise à l'eau garanti. Les niveaux non documentés restent `variable`. Le statut `unverified` indique une description historique sans source éditoriale externe documentée ; une photo créditée ne valide pas les conseils de sécurité. Les conditions datées sont chargées séparément et ne doivent pas être inventées dans le catalogue.

L'objet facultatif `visit` stocke les seuls renseignements pratiques appuyés par la source éditoriale de la fiche : `access`, `bestPeriod`, `localRules` et date `reviewed`. Les champs omis s'affichent « À vérifier localement » dans l'application. Une source photo seule ne suffit jamais pour renseigner ces champs.

`legacy-bonus-spots.json` conserve les 44 anciennes fiches génériques uniquement pour retrouver les favoris et voyages privés. Ces entrées ne figurent pas dans le catalogue public.
