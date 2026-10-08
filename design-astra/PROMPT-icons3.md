Tu es directeur artistique pour Ocean Buddy, une app de spots nautiques destinée à des adultes (surf, bodyboard, baignade, paddle, kayak, snorkeling, plongée, kitesurf, windsurf). Ton premium, sobre, mature : type application de voyage haut de gamme ou appli sport adulte. Pas de style enfantin, pas de bonhomme bâton, pas de visage, pas de sourire, pas de dessin « illustration », pas de dégradé, pas d’ombre portée.

Tâche : crée 12 pictogrammes SVG cohérents dans le dossier courant (répertoire de travail), chacun en deux versions.
- `<id>.svg` : version couleur. Deux couleurs maximum : encre #0B1F4D pour la forme principale, bleu #1F5BFF pour un seul élément (une ligne de vague ou une accroche). Le corail #FF5A44 est autorisé une seule fois, uniquement pour l’icône windsurf/kitesurf (voile ou aile) — partout ailleurs, pas de corail.
- `<id>-mono.svg` : même dessin en une seule couleur, `fill="currentColor"` sur tous les éléments (pour les puces blanches).

Liste des identifiants et du sujet :
- all : tous les sports (une rose des vents ou une houle simple, lisible comme « tout voir »)
- surf : une planche de surf sous une vague qui se creuse
- bodyboard : une planche de bodyboard allongée sur une vague
- baignade : une nage calme (silhouette de nageur géométrique) au-dessus de l’eau
- paddle : une planche de stand-up paddle avec une pagaie en diagonale
- kayak : un kayak vu de côté avec sa pagaie
- snorkeling : un masque et un tuba (silhouette lisible)
- plongee : une bouteille de plongée avec son détendeur, ou une bulle qui monte, lisible au premier coup d’œil
- kitesurf : une aile de kite en arc avec ses lignes et une planche
- windsurf : une voile triangulaire sur une planche
- debutant : trois barres de niveau dont une seule remplie (niveau débutant)
- intermediaire : trois barres dont deux remplies
- expert : trois barres entièrement remplies

Règles techniques strictes :
- viewBox="0 0 48 48", fond transparent, aucune bordure ni cadre, aucune image embarquée, aucun texte.
- Marge intérieure de 3 unités au minimum ; zone utile centrée.
- Formes géométriques : cercles, arcs, lignes à angle franc ou courbes propres. Pas de contours fins de moins de 1,5 unité.
- Poids visuel identique d’une icône à l’autre (même épaisseur de trait et même densité).
- Lisible à 24 px : pas de détails inférieurs à 2 unités.
- Le bleu de vague est toujours la même forme de ligne de base, pour une famille cohérente : une bande ondulée en bas de la zone utile (sauf pour les niveaux).
- Code SVG propre, sans attributs superflus, sans `<style>` ni `class`.

Après création, vérifie chaque fichier avec un parseur XML (python3 xml.etree) : racine svg, viewBox 0 0 48 48, aucune couleur interdite dans les versions mono. Puis écris `README-icons3.md` dans le dossier avec une ligne par icône décrivant ce qu’elle représente et un seul point d’amélioration si tu en vois un.

Réponds en français, de façon brève : liste des fichiers créés et résultat de la vérification.
