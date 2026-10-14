# Prompt : stabiliser le démarrage de l'app iOS Ocean Buddy, pour de bon

Tu es un agent de code senior (Claude Opus). Ce document est complet : tu n'as pas besoin d'autre contexte pour l'exécuter. Il contient les faits vérifiés, le plan à suivre dans l'ordre, les critères d'acceptation et la procédure de publication.

Dépôt : `~/Projects/Ocean-Buddy-git` (branche `main`, publié sur GitHub Pages). Lis `AGENTS.md` avant toute modification et respecte-le à la lettre. Ne refais pas l'enquête : les causes ci-dessous sont déjà vérifiées.

---

## 0. Objectif

Au lancement de l'app iOS, l'écran change environ 6 fois en 6 secondes. L'utilisateur voit un ancien accueil, une barre d'onglets qui apparaît en retard, une page qui saute, une planète qui devient une boule noire, puis un dernier saut. Des utilisateurs quittent l'app pendant ce temps.

Résultat attendu :

- un écran de départ unique et stable, du premier pixel jusqu'à la fin ;
- l'accueil final peint une seule fois, sans ancien accueil ni ancienne barre visibles ;
- aucun décalage de mise en page après la levée du rideau (CLS visible = 0) ;
- un test automatique (`npm run check:boot`) qui échoue si l'un de ces défauts revient ;
- une section de règles permanentes dans `AGENTS.md`.

---

## 1. Contexte technique

- L'app iOS est une coque Capacitor 1.3.0 qui exécute `mobile/www`, construit par `scripts/build-mobile.cjs`.
- Le contenu web reçoit ses mises à jour à distance (OTA) via `scripts/publish-app-update.cjs`, qui écrit dans `app-update/`.
- Seul le contenu web peut changer. Interdit : modifier le code natif (Xcode, Info.plist, Swift/ObjC) ou ajouter un plugin Capacitor.
- `capacitor.config.json` : `appReadyTimeout` = 15 s. `appReady()` (notifyAppReady) doit être appelé avant ce délai, sinon l'OTA est annulée. Tout nouveau mécanisme de démarrage (rideau, attente) doit donc avoir un délai maximal.
- Le site web (GitHub Pages) n'a aucun de ces défauts (CLS 0). Le problème vient du chargeur natif et de l'ordre d'exécution, pas du contenu.

---

## 2. Symptômes observés

Enregistrement iPhone, démarrage à froid, utilisateur qui revient :

| Temps | Ce qu'on voit |
|---|---|
| 0,6 s | écran blanc |
| 0,8 s | l'onboarding « L'océan t'appelle » clignote |
| 0,9 s | ANCIEN accueil « PRENDS LE LARGE » et ancienne barre d'onglets ; la barre devient une pilule blanche vide |
| 1,5 s et 2,1 s | la page « saute » (Aujourd'hui / Explorer, Lac de Serre-Ponçon) |
| 2,5 à 3,1 s | page presque vide, seulement le toast « Bon retour » |
| 3,2 s | NOUVEL accueil (Kite Beach, planète en CSS) |
| 3,8 s | tout descend d'environ 40 px ; « sans frissonner. » est coupé sous la barre d'état ; la planète devient une petite boule noire WebGL ; la nouvelle barre d'onglets arrive |
| 5,1 s | la page descend d'environ 240 px, puis remonte à 5,8 s |
| ~6 s | stable |

Le toast « Bon retour » reste par-dessus le contenu.

---

## 3. Causes racines (vérifiées)

1. **Chargeur natif séquentiel.** `scripts/build-mobile.cjs:36-41` retire tous les `<script>` sauf i18n, puis les réinjecte un par un après `OceanMobile.boot()`, chacun attendu (`await load`). Le navigateur peint entre deux scripts, donc chaque état intermédiaire devient visible. `#onb` est visible par défaut (`index.html:62`) et n'est caché qu'à `app.js:2596-2598`, puis dans `design.js:131`.

2. **Trois couches dessinent l'accueil sans se connaître.**
   - L'accueil historique statique, avec `renderHome()` (`app.js:1658`, appelé à `app.js:2590`, puis de nouveau à `design.js:131`). `design.js:38-48` et `:82-84` ajoutent boutons et statistiques.
   - Des modules qui insèrent leurs blocs : `ocean-hub.js:95` et `:140` (`#oceanHub`), `poulpy.js:56` (`.poulpy-activities`), `field-guide.js:106-109` (`.field-arrivals`), `ocean-home.js:49-50` (`#obDive` + `arrange()` au chargement et `setTimeout` de 1500 ms).
   - Le nouvel accueil `home-feed.js`. `home-feed.css:2` cache `.home-intro` (`#home.hf-on`) seulement quand `home-feed.js` arrive : le héros de 672 px disparaît d'un coup (layout shift de 0,149).
   - `ocean-home.js` `arrange()` et `home-feed.js` `order()` (`home-feed.js:247-259`, rejoué au chargement et dans un `setTimeout` de 1700 ms, `:278-279`) déplacent les mêmes 4 nœuds en sens contraire : 4 allers-retours entre 2,0 et 2,5 s.

3. **`home-feed` monte 3 fois.** `mount()` est appelé à `home-feed.js:308` (synchrone), `:306` (après `seasons.json` + `photo-scores.json`) et `:309` (après `OceanSpotData.load('lite')`). À chaque montage, `stopPlanet()` détruit le globe et `feed.innerHTML = render()` reconstruit tout ; les images sont refondues (`polish.js:44-55`, img-wait). D'où une page presque vide entre 2,1 et 3,5 s. Le rail « … sans frissonner. » (`home-feed.js:231`) n'existe qu'au 3e montage.

4. **Insertions tardives.** `app-shell.js` (dernier script) réécrit la barre d'onglets (`app-shell.js:25-34`) : avant cela, le CSS n'affiche que la pastille `#navPill`, d'où la « pilule vide ». L'ancienne `.nav` est dans `index.html:396-404` (bouton trophée `.center`). `app-shell.js:62` insère le grand titre `.as-large` (environ 57 px), qui pousse tout vers le bas. La classe `html.native-app` est ajoutée après la première peinture (`mobile/client.js:47`) alors qu'elle change le fond et les marges (`native.css`, `app-shell.css:361`).

5. **Écran blanc.** Aucun fond inline dans `<head>` : le fond bleu n'arrive qu'avec `native-app`. Environ 35 feuilles CSS bloquantes.

6. **Globe WebGL.** Créé par un `IntersectionObserver` (`home-feed.js:169-190`). La sphère CSS est cachée (`.is-live`) avant la première image éclairée. Les textures 4k sont attendues (`ocean-globe.js:898`), puis une bascule 8k/16k (`ocean-globe.js:912`) et un fondu `uReveal` (`ocean-globe.js:220`) : d'où la boule noire.

7. **Bruit visuel.** Toast « Bon retour » à `app.js:2599` (`setTimeout` de 900 ms, sans lien avec la stabilité de l'accueil). Vignettes `.hf-card` sombres sans ratio fixe. Polices en `font-display: swap` (`vendor/fonts/fonts.css`). Le carrousel fait un `scrollTo` horizontal toutes les 6 s (`home-feed.js:210`) : à garder, mais jamais pendant le démarrage.

8. **Onboarding qui revient (secondaire).** L'onboarding est considéré fait seulement si `oceanbuddy_v1.level` est défini (`app.js:48-56`, `:2596`). Les chemins `goNearMe` (`app.js:321`) et `quickGate` (`app.js:1604`, `:1869`) ne fixent pas de niveau : l'onboarding revient à chaque lancement pour ces utilisateurs.

9. **Défilement.** Aucune écriture de défilement au démarrage à froid : les « sauts » sont des layout shifts. Exception : après un rechargement du WebView (OTA appliquée, `mobile/client.js:41`), `navigation.js:125` appelle `restore()`, qui appelle `go('home')` (`navigation.js:105`), qui pose `scrollTop = 1100` (`navigation.js:78`). Autres écrivains de défilement : `app.js:843` (`#homeTabs.scrollIntoView`), `app.js:1985-1986`, `:1997`, `:2017-2019` (dans `go()`), `trips.js:44`.

---

## 4. Risques : ne rien casser

Des scripts interrogent l'ancien DOM. Avant de supprimer ou déplacer un nœud, vérifie qui le lit.

- `home-feed.js:271` : tableau `order` (`.home-intro`, `.poulpy-activities`, `#obDive`, `#oceanHub`).
- `ocean-hub.js:98`, `ocean-home.js:49-50`.
- `navigation.js:98` : `showHomeCat` / `#homeTabs`. `app.js:843` : `#homeTabs.scrollIntoView`.
- `renderHome()` alimente `#homeActivity`, `#xpFill`, `#xpText`, `#octoHi`, `#welcomeCard`, `#homeHello`.
- `trips.js`, `field-guide.js`, `poulpy.js` insèrent des blocs par rapport à ces nœuds. `OceanPoulpy.refresh()` les met à jour.
- `activity-theme.js:74` et `ocean-home.js:49` dépendent de `document.readyState` ou de `load` : à revérifier si le chargeur change.

Règles :

- Ne rien supprimer à l'aveugle. Masquer dès la première peinture ; garder les nœuds s'ils servent encore.
- Tout nouveau rideau a un délai maximal.
- Le rideau ne retarde jamais `appReady()`.

---

## 5. Plan d'exécution (dans cet ordre)

Pour chaque étape : fais le changement, puis vérifie le critère avant de passer à la suivante. Note dans ton rapport ce que chaque étape a changé.

### Étape A : rideau de démarrage

**Fichiers** : `index.html` (tête et corps), `scripts/build-mobile.cjs` si nécessaire.

**Actions**
1. Premier élément de `<head>` : un `<style>` inline `html, body { background: #174bd3 }`.
2. Juste après : un `<script>` inline (synchrone, sans dépendance) qui :
   - pose `html.native-app` si on est dans Capacitor (`window.Capacitor` ou protocole `capacitor:`) ;
   - pose la classe `html.ob-booting` ;
   - si `localStorage` indique que l'utilisateur a déjà terminé l'onboarding (étape G), pose aussi une classe qui masque `#onb` dès la première peinture. Entoure l'accès à `localStorage` de try/catch.
3. Premier élément de `<body>` : un rideau inline `#obBoot`, fond `#174bd3`, logo/Poulpy identique au splash natif. Il est au-dessus de tout.
4. Tant que `html.ob-booting` est présent, l'interface (`.phone` ou équivalent) reste invisible (`visibility: hidden` ou `opacity: 0`, sans `display: none` qui changerait la mise en page).
5. Un seul signal « accueil prêt ». **Contrat exact (le test `check:boot` vérifie ces noms)** : le script inline du `<head>` crée `window.OceanBoot = { t0: performance.now(), lifted: false, liftedAt: null, reason: null, ready(reason) }`. À la levée : `lifted = true`, `liftedAt = performance.now()`, `reason = 'ready'` ou `'timeout'`, retrait de `html.ob-booting`, puis événement `window` `ocean:home-ready` avec `detail: { reason }`. `ready()` est idempotent. La levée a lieu quand :
   - `app-shell.js` a fini ;
   - `home-feed` a fait son montage définitif (étape D) ;
   - l'image du héros est décodée (`img.decode()`).
   Plafond dur : 4000 ms après `OceanBoot.t0` (minuterie posée dans le script inline du `<head>`, donc indépendante des autres scripts). Au-delà, on lève le rideau quand même (`reason = 'timeout'`) ; tout ce qui arrive ensuite se met à jour EN PLACE, sans décalage.
6. Ensuite : un seul fondu (250 ms maximum), puis suppression du rideau et de `ob-booting`.
7. Le rideau ne retarde jamais `appReady()`, qui reste appelé dès que le chargement est terminé, rideau levé ou non.

**Critère** : aucune frame blanche ni ancien contenu entre le premier pixel et la levée du rideau ; la levée a lieu au plus tard 4000 ms après `OceanBoot.t0` ; `appReady()` est appelé en moins de 15 s dans tous les cas.

### Étape B : chargeur natif

**Fichier** : `scripts/build-mobile.cjs:36-41`.

**Actions**
1. Remplacer le chargement séquentiel par des `<script>` insérés d'un coup avec `script.async = false` : le navigateur télécharge en parallèle et exécute dans l'ordre.
2. Garder l'ordre exact du HTML d'origine.
3. Attendre le dernier script (`load`), puis appeler `appReady()`.
4. Vérifier, script par script, les dépendances à `load` et à `document.readyState` (voir section 4, `activity-theme.js:74`, `ocean-home.js:49`).

**Critère** : même ordre d'exécution qu'avant (comparer la liste des scripts exécutés avant et après) ; `check:boot` ne signale aucune erreur console.

### Étape C : un seul propriétaire de l'accueil

**Fichiers** : `home-feed.js`, `home-feed.css:2`, `ocean-home.js:49-50` (et `arrange()`), `design.js:131`, `app-shell.js:25-34` et `:62`, `index.html:396-404`, `mobile/client.js:47`, `app.js:1658`, `app.js:2590`.

**Actions**
1. Classe `hf-on` (ou équivalent) présente dès le HTML statique pour l'utilisateur qui revient : l'ancien héros (`.home-intro`) n'est jamais peint.
2. `home-feed.js` est le seul à ordonner les sections. Supprimer `arrange()` d'`ocean-home.js` ou le rendre inerte. Supprimer le `order()` concurrent : un seul ordonnancement.
3. Retirer le second `renderHome()` au démarrage (`design.js:131`). Garder le premier appel seulement si les nœuds qu'il nourrit en ont encore besoin (voir section 4).
4. L'ancienne `.nav` (`index.html:396-404`) n'est jamais visible : la barre définitive (icônes et libellés posés par `app-shell.js`) est dans le HTML statique, ou posée avant la levée du rideau.
5. `.as-large` (`app-shell.js:62`) est présent avec sa hauteur finale avant la levée du rideau.
6. `html.native-app` est posé en amont (étape A), pas après la première peinture (`mobile/client.js:47`).
7. Mettre les blocs insérés par `ocean-hub.js`, `poulpy.js`, `field-guide.js` à l'intérieur d'une hauteur réservée, ou les faire entrer par `home-feed` dans l'ordre final.

**Critère** : le test `check:boot` ne voit ni ancien héros, ni ancienne barre, ni `arrange()` ni `order()` qui déplace un nœud après la levée du rideau.

### Étape D : `home-feed` monte une seule fois de façon visible

**Fichiers** : `home-feed.js:306`, `:308`, `:309`, `polish.js:44-55`.

**Actions**
1. Attendre `seasons.json`, `photo-scores.json` et `OceanSpotData.load('lite')` avec `Promise.all`, avec plafond. Un seul montage définitif.
2. Les rafraîchissements de données se font EN PLACE : pas de `feed.innerHTML = render()` global, et jamais `stopPlanet()` pour une simple mise à jour de données.
3. Réserver les hauteurs : `aspect-ratio` ou `min-height` pour les rails, les vignettes `.hf-card` et la carte planète.
4. Les `img` du montage définitif sont décodées avant `ready()` (étape A).

**Critère** : un seul montage visible (compteur de montages dans `check:boot`) ; aucune page presque vide entre le rideau levé et la fin du démarrage.

### Étape E : globe WebGL

**Fichiers** : `home-feed.js:169-190`, `ocean-globe.js:220`, `:898`, `:912`.

**Actions**
1. Garder la sphère CSS tant que le globe WebGL n'a pas rendu sa première image éclairée à la bonne taille.
2. Créer le globe seulement après la levée du rideau.
3. Pas de bascule 8k/16k pendant les 10 premières secondes.

**Critère** : aucune boule noire pendant le démarrage ; le globe prend le relais sans saut de mise en page.

### Étape F : toast « Bon retour »

**Fichier** : `app.js:2599`.

**Actions** : le toast ne s'affiche qu'après la levée du rideau. Il est placé au-dessus de la barre d'onglets, sans masquer de contenu important, discret, 2,5 s. Choix retenu : le garder pour l'utilisateur qui revient.

**Critère** : le toast n'apparaît jamais avant la levée du rideau et ne couvre pas le héros ni la barre.

### Étape G : onboarding

**Fichiers** : `app.js:48-56`, `:321`, `:1604`, `:1869`, `:2596`, `index.html:62`.

**Actions**
1. Drapeau explicite `oceanbuddy_v1.onboarded = true`, posé par `finishOnb()`, `goNearMe` et `quickGate`.
2. Migration : un utilisateur existant qui a déjà `sport` ou `level` est considéré comme ayant terminé l'onboarding.
3. `#onb` est masqué dès la première peinture pour lui (décision prise dans le script inline du `<head>`, à partir de `localStorage`, étape A).

**Critère** : l'onboarding n'apparaît plus à chaque lancement pour les utilisateurs de `goNearMe` et `quickGate` ; un nouvel utilisateur voit toujours l'onboarding complet.

### Étape H : défilement

**Fichiers** : `navigation.js:78`, `:98`, `:105`, `:125`, `app.js:843`.

**Actions**
1. Au démarrage, l'accueil est en haut (`scrollTop = 0`) et aucun code ne défile avant la levée du rideau.
2. `navigation.js` `restore()` ne restaure jamais une position de défilement de l'accueil au lancement.
3. Vérifier `app.js:843` (`#homeTabs.scrollIntoView`) : pas d'appel pendant le démarrage.

**Critère** : `check:boot` ne détecte aucune écriture de défilement au démarrage, ni dans le cas normal ni dans `--restore`.

### Étape I : polices

**Fichiers** : `vendor/fonts/fonts.css`, `index.html`.

**Actions** : précharger les 2 polices de titres (`<link rel="preload" as="font">`) ou utiliser `font-display: optional` pour les titres.

**Critère** : pas de changement visible de police après la levée du rideau.

---

## 6. Garde-fou « plus jamais »

### 6.1 Test `check:boot`

Un test de démarrage existe ou est en cours de préparation : `scripts/check-boot.mjs`, lancé par `npm run check:boot`. S'il n'existe pas encore quand tu commences, crée-le selon la spec ci-dessous (ou demande à l'orchestrateur).

Spec :
- construit `mobile/www` ;
- ouvre Chrome headless en émulation iPhone 390 × 844 ;
- CPU ×6 ;
- profil « utilisateur qui revient » ;
- chargeur natif.

Il échoue si :
- l'onboarding est visible ;
- l'ancien accueil ou l'ancienne barre sont visibles ;
- la page est vide après la levée du rideau ;
- il y a plus d'un montage visible de l'accueil ;
- une écriture de défilement a lieu au démarrage ;
- le CLS visible est supérieur à 0,02 après la levée du rideau ;
- le rideau est levé après le plafond de 4000 ms (tolérance 300 ms).

Variantes :
- `--restore` : rechargement après une OTA (`mobile/client.js:41`) ;
- `web` : racine du dépôt (site GitHub Pages).

Il doit afficher, pour chaque run : CLS, nombre de montages, temps de levée du rideau, erreurs console.

### 6.2 Obligations

- `npm run check:boot` (natif, `--restore`, `web`) doit être vert **avant tout commit**.
- Il est **obligatoire avant chaque publication OTA** : `scripts/publish-app-update.cjs` refuse de publier s'il échoue.

### 6.3 Section à ajouter dans `AGENTS.md`

Ajoute cette section (en français, en fin de fichier ou dans la section appropriée) :

> ## Stabilité du démarrage (règles permanentes)
>
> - Un seul propriétaire de l'accueil : `home-feed.js`.
> - Aucun nouveau script ne réécrit, ne réordonne ni ne remonte l'accueil ou la barre d'onglets après la levée du rideau.
> - Toute nouvelle étape de démarrage passe par le signal « accueil prêt » (`OceanBoot.ready()` / `ocean:home-ready`).
> - Aucune insertion qui décale l'accueil sans hauteur réservée.
> - Toujours tester avec le chargeur natif et un throttle CPU, jamais seulement le site web sur Mac.
> - `npm run check:boot` est obligatoire avant toute publication OTA.

---

## 7. Vérifications à exiger

Toutes doivent passer avant le commit.

- [ ] `npm test` : tous verts (134 tests attendus avant la modification ; ajoute les tests des nouvelles règles, sans retirer les anciens).
- [ ] `npm run check:boot` : natif, `--restore`, `web` : verts.
- [ ] Captures d'écran à 390 px et 430 px de large, pour un utilisateur **nouveau** (onboarding complet toujours fonctionnel) et un utilisateur **qui revient**.
- [ ] Parcours manuels, sans erreur console : changement d'activité, Explorer, fiche spot, voyage 360°.
- [ ] `python3 scripts/version-assets.py` exécuté après la dernière modification JS ou CSS.
- [ ] Aucun fichier hors périmètre modifié.

---

## 8. Publication (dernière phase)

Suis `AGENTS.md`. Dans l'ordre :

1. `python3 scripts/version-assets.py`.
2. `npm run check:boot` : doit être vert (sinon, arrête-toi).
3. `node scripts/publish-app-update.cjs`.
4. Commit en français, avec les trailers demandés par l'environnement.
5. `git push origin HEAD:main` (avance rapide uniquement ; pas de force).
6. Vérifie le déploiement GitHub Pages et que `latest.json` est en ligne et correspond à la version publiée.

Si un orchestrateur te dit de t'arrêter avant le commit, arrête-toi après les vérifications et rends un rapport.

---

## 9. Rapport final attendu

Ton rapport final doit contenir :

1. **Fichiers modifiés** : liste, avec la raison de chaque modification.
2. **Résultats chiffrés de `check:boot`**, avant et après :
   - CLS après levée du rideau ;
   - nombre de montages visibles de l'accueil ;
   - temps de levée du rideau ;
   - nombre d'écritures de défilement au démarrage.
3. **Tests** : résultat de `npm test`, `npm run check:boot` (natif, `--restore`, `web`), captures 390 et 430 px.
4. **Publication** : version publiée, résultat de `latest.json` et du déploiement Pages (ou la raison de l'arrêt).
5. **Risques restants** : ce qui n'est pas couvert ou qui reste fragile.
6. **Ce qui nécessiterait une version App Store** (sans le faire) : par exemple `launchAutoHide: false` pour le splash natif, ou toute modification native.
