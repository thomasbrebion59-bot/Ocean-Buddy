# Ocean Buddy — retours utilisateurs du 29 oct. 2026

Worktree : `~/Projects/Ocean-Buddy-retours` (branche `retours-spots-carte`, depuis origin/main c2ee44c).
Règles du dépôt : `AGENTS.md` (version-assets, tests, check:boot avant OTA, publication en avance rapide).
Modèles : Opus 5.5 seulement pour le bug de la carte ; Sonnet 5.5 pour le code clair et les données ; Haiku 5.5 pour les recherches et vérifications simples.

## 1. Bug critique : la carte devient entièrement bleue (priorité 1, Opus 5.5)

**Symptôme (capture iPhone, app 1.4.x) :** dans Explorer, quand on change de spot ou qu'on déplace la carte, tout l'écran devient bleu pétrole uni : plus de globe, plus de tuiles, plus de pastilles. La barre du bas affiche quand même « 7 spots in this area · France ». Ça revient parfois après un long moment, parfois jamais : il faut fermer et rouvrir l'app.

**Pistes déjà repérées :**
- Aucun gestionnaire `webglcontextlost` / `webglcontextrestored` dans le code (`ocean-map.js`, `ocean-globe.js`). Sur iOS (WKWebView), le système retire le contexte WebGL quand la mémoire GPU manque ; le canevas reste vide et on ne voit que le fond.
- Plusieurs contextes WebGL coexistent : globe maison (`ocean-globe.js`, three), carte MapLibre (`ocean-map.js` l. ~232, styles globe/mercator/plongée, tuiles NASA GIBS + OpenFreeMap), carte relief (`terrainMap`, l. ~737).
- `maxTileCacheSize:120`, densité de pixels non plafonnée, `flyTo` enchaînés lors des changements de spot.

**Attendu :**
1. Trouver la vraie cause (lire le code, reproduire si possible dans Chrome avec throttle CPU / perte de contexte forcée via `WEBGL_lose_context`).
2. Récupération automatique : à la perte de contexte, afficher un état propre (pas de bleu vide) puis reconstruire la carte ou le globe à la même caméra, sans recharger la page. Si la reconstruction échoue, un bouton « Recharger la carte » visible.
3. Réduire la pression mémoire : un seul contexte WebGL actif à la fois quand c'est possible (globe en pause ou libéré quand la carte est active, relief détruit à la fermeture), densité de pixels plafonnée sur mobile, cache de tuiles raisonnable, pas d'animations `flyTo` empilées (annuler la précédente).
4. Repli : si une tuile ou le style ne charge pas, le fond ne doit pas rester bleu uni sans explication.
5. Tests node (`tests/`) pour la logique de récupération ; respecter les règles de démarrage d'AGENTS.md.

## 2. Spots manquants (Sonnet 5.5 + recherche Haiku 5.5)

Retour : « il manque La Gravière, Capbreton, Seignosse autour d'Hossegor, et Saint-Gilles-Croix-de-Vie (la petite Californie, Vendée) ».

État : `data/catalog.json` contient déjà `Hossegor — La Gravière`, `La Piste — Capbreton`, `Les Bourdaines — Seignosse`. Saint-Gilles-Croix-de-Vie n'existe pas.

**Attendu :**
1. Vérifier pourquoi les testeurs ne les trouvent pas : recherche (« Gravière », « Capbreton », « Seignosse », sans accents, minuscules), visibilité sur la carte à l'échelle France, regroupement des pastilles.
2. Ajouter des fiches à part entière, au même format que les autres (coordonnées précises, niveau, dangers, conseil, zones, faune, source, photo libre de droits Wikimedia Commons si possible) :
   - La Gravière (fiche dédiée ou Hossegor renommé clairement), Hossegor La Nord / Les Culs Nus si utile ;
   - Capbreton (Santocha, L'Estacade) ;
   - Seignosse (Le Penon, Les Estagnots, Le Prévent) ;
   - Saint-Gilles-Croix-de-Vie (Grande Plage) et ses voisins vendéens : Sion-sur-l'Océan, La Sauzaie (Brétignolles-sur-Mer), Bud Bud / Les Dunes.
3. Faits sourcés seulement (règle de la relecture sécurité : pas de fait sans citation ; sinon `editorialStatus: "unverified"`). Pas de niveau de danger inventé sans base.

## 3. Météo et conseils mieux expliqués, par niveau (Sonnet 5.5)

Retour : le détail de la météo fait « trop IA » ; il faut mieux expliquer aux débutants comment faire attention au spot (baïnes, courants, etc.) et comment lire la météo pour préparer sa session ; puis la même chose, plus pointue, pour les intermédiaires et les experts.

**Attendu :**
1. Repérer où la météo et les conseils sont affichés (`spot-data.js`, `spot-data-model.js`, `spot-guide*.js`, `spot-plan.js`, `field-guide.js`…).
2. Ton : phrases courtes et concrètes, comme un moniteur sur la plage. Retirer les tournures génériques, les emojis décoratifs en série, les formules creuses.
3. Débutant : lire houle (hauteur **et** période), vent (offshore/onshore, force), marée ; repérer une baïne et un courant ; où se mettre à l'eau ; que faire si on est emporté (ne pas lutter, nager parallèle, lever le bras) ; zones surveillées et drapeaux.
4. Intermédiaire : fenêtre de session (marée + vent), orientation de la houle par rapport au spot, période et puissance, priorités au pic, choix de planche.
5. Expert : lecture fine (période longue, direction précise, coefficients, bancs), dangers spécifiques du spot, limites et retours au bord.
6. Le niveau suit le réglage « Mon sport et mon niveau » existant ; repli lisible sur « tous niveaux ».
7. Textes en français d'abord, via le mécanisme i18n existant (lister les nouvelles chaînes pour la traduction).

## 4. Vérification et publication

- `npm test`, `python3 scripts/version-assets.py`, `npm run check:boot` (scénario par scénario si long).
- Vérification à l'écran dans Chrome (mobile et ordinateur) : carte, changement de spot, nouveaux spots, météo par niveau.
- Relecture par un agent avant de montrer au fondateur.
- Publication : main + Cloudflare (oceanbuddy.app) + OTA `--native-min 1.4.0`, lancées par le fondateur via `!` si le mode auto bloque.
