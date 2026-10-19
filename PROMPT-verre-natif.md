# PROMPT : verre natif iOS 26 + fluidité (Ocean Buddy)

Brief pour l'agent de code. Worktree : `~/Projects/Ocean-Buddy-verre`, branche `verre-natif`, depuis `origin/main` 9cb862d (v1.3.2, build 202610192).

## 0. Lire avant de coder

- [ ] Lire `AGENTS.md` / `CLAUDE.md` à la racine du worktree.
- [ ] Vérifier la branche : `verre-natif` doit partir de `origin/main` 9cb862d.
- [ ] Rappel : Ocean Buddy n'est PAS Expo / React Native. C'est une app web vanille HTML/CSS/JS, enveloppée dans Capacitor 8.5.
- [ ] Projet iOS : `ios/App`, Swift (`AppDelegate.swift`, `SceneDelegate.swift`), SPM dans `ios/App/CapApp-SPM`, deployment target iOS 16.4.
- [ ] Commandes utiles : `npm run build:mobile` (sortie `mobile/www`), `npx cap sync ios`, `npm test`.
- [ ] Mises à jour web OTA via `@capgo/capacitor-updater`.
- [ ] Xcode 27 et SDK iOS 27 sont installés localement. `UIGlassEffect` et `UIGlassContainerEffect` sont disponibles (API iOS 26+).
- [ ] `expo-glass-effect` est inutilisable ici. L'équivalent retenu : un plugin Capacitor local en Swift, qui appelle `UIGlassEffect` d'Apple.
- [ ] Aucun plugin Capacitor « liquid glass » prêt à l'emploi n'a été trouvé (seulement des plugins Flutter). On écrit le nôtre.

## 1. Objectif (3 lignes)

1. Afficher le vrai verre Liquid Glass d'Apple (`UIGlassEffect`) sur iOS 26 et plus, pour la barre d'onglets et le bouton Poulpy.
2. Améliorer la fluidité : moins de `backdrop-filter` coûteux, rien sur les listes qui défilent, 60 fps visé.
3. Ne jamais casser l'app sur les anciens téléphones : retour automatique au CSS actuel sur iOS < 26, Android et le site web.

## 2. Règles non négociables

- [ ] Identité intacte : cobalt, navy, lime, coral, mascotte Poulpy, `ocean-blue.css`. Aucune nouvelle palette.
- [ ] Aucun flou CSS présenté comme natif. Si c'est du CSS, on le dit.
- [ ] Aucun push, aucune OTA, aucune soumission App Store sans le OK explicite de l'utilisateur. Le mode auto bloque ces actions : l'utilisateur les lance lui-même avec des commandes `!`.
- [ ] Tests de fluidité : toujours sous THROTTLE (CPU x4 à x6, réseau lent).
- [ ] Chrome headless sur un port différent de 8765, service worker bypassé.
- [ ] Ne toucher à aucun autre fichier que ceux du périmètre décrit ci-dessous.

## 3. Partie A : verre natif

### A1. Plugin Swift `OceanGlass`

- [ ] Créer le plugin Capacitor local `OceanGlass` en Swift, enregistré dans la cible de l'app (`CAPBridgedPlugin`).
- [ ] Méthodes exposées : `available()` (renvoie vrai seulement si iOS >= 26), `show(items, selected, tint)`, `setSelected(id)`, `setBadges(map)`, `setTint(color)`, `setTucked(bool)`, `hide()`, `show()`.
- [ ] Événements émis vers JS : `tabSelected(id)` et `poulpyTap`.
- [ ] Toute l'API native est gardée par `if #available(iOS 26, *)`. Hors de ce cas, `available()` renvoie faux et le JS garde la CSS.

### A2. Barre et bouton natifs

- [ ] `UITabBar` natif en bas d'écran, 6 onglets. iOS 26 lui donne le Liquid Glass et la « lentille » de sélection automatiquement.
- [ ] Icônes : mapper chaque icône SVG web vers un SF Symbol (tâche Haiku, voir section 7).
- [ ] Bouton Poulpy rond à droite de la barre : `UIButton` avec `UIButton.Configuration.glass()` ou `UIVisualEffectView(effect: UIGlassEffect())`.
- [ ] Sélection synchronisée dans les deux sens avec le routeur web (l'élément `button[data-s]` ayant `aria-current="page"`).
- [ ] Badges (`.tab-badge`) reportés sur `tabBarItem.badgeValue`.
- [ ] Libellés venant de l'i18n fr / en / es, transmis par JS au plugin. Aucun texte codé en dur en Swift.
- [ ] Teinte suivant la palette d'activité (`html[data-act]`, variable `--t-tint`).
- [ ] Repli (tuck) au scroll (`body.tabs-tucked`), masquage en explorateur immersif, en écran plein, et quand le clavier est ouvert.
- [ ] Zone de contenu : le padding bas du web doit suivre la hauteur réelle de la barre native. Pas de contenu caché derrière elle.
- [ ] Le `.nav` web n'est masqué que si `html.native-glass` est posé, c'est-à-dire après confirmation que la barre native est affichée. Sinon la CSS reste en place.

### A3. Pont JS `native-glass.js`

- [ ] Fichier `native-glass.js` : détection (`Capacitor.isNativePlatform()` + `OceanGlass.available()`), init, synchronisation d'état, écoute des événements.
- [ ] Séparer la logique pure (mapping onglets, décision d'affichage / repli / masquage, choix de la teinte) du DOM, pour la tester unitairement.
- [ ] Repli explicite : toute erreur du plugin laisse la CSS en place et n'ajoute pas `html.native-glass`.
- [ ] Étape 2 facultative, seulement si le gain est mesuré : verre natif derrière les boutons ronds du header. Sinon, ne pas le faire.

## 4. Partie B : fluidité

- [ ] Inventaire des `backdrop-filter` : environ 16 dans `app-shell.css` (variable `--as-blur`, `blur(22px) saturate(1.8)`), 28 dans `base.css`, 9 dans `design.css`, 7 dans `spot-voyage.css`.
- [ ] Retirer le `backdrop-filter` des éléments qui défilent ou s'animent (listes, cartes en scroll).
- [ ] Réduire le nombre de couches de flou superposées.
- [ ] Repli léger : `@media (prefers-reduced-transparency)` et appareils anciens. Fond semi-opaque sans flou.
- [ ] `will-change` seulement sur les éléments réellement animés.
- [ ] Mesure avant / après avec une trace Chrome Performance sous THROTTLE : scroll, changement d'onglet, ouverture d'écran. Relever les FPS et les long tasks.
- [ ] Cible : 60 fps sur scroll et changement d'onglet.
- [ ] Aucune régression sur les transitions d'écrans (comparer les captures et les traces).

## 5. Partie C : vérifications

- [ ] `npm test` vert.
- [ ] Tests unitaires du pont JS (`native-glass.js`, logique pure).
- [ ] `npm run build:mobile` puis `npx cap sync ios` sans erreur.
- [ ] Build et lancement sur simulateur iOS 26+ (verre natif actif).
- [ ] Repli CSS : seul le runtime iOS 27 est installé ; tester le repli en forçant `available()=false` (drapeau de debug), et sur le site web. Un simulateur iOS 18 demanderait de télécharger son runtime (~8 Go).
- [ ] Captures avant / après : fond clair, fond sombre, écran globe.
- [ ] VoiceOver : libellés des 6 onglets et du bouton Poulpy.
- [ ] Dynamic Type : les libellés restent lisibles et ne cassent pas la barre.
- [ ] Safe areas : iPhone SE jusqu'aux Pro Max, et iPad.
- [ ] Vérifier que la barre web reste visible dès que la native ne l'est pas.

## 6. Partie D : livraison

- [ ] Commits sur la branche `verre-natif`. Fin de message : `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- [ ] Le changement natif impose un nouveau build App Store, version 1.4.0. L'OTA ne peut pas livrer du Swift. Mettre à jour version et build en conséquence.
- [ ] Préparer le build, mais ne pas lancer l'upload ni la soumission.
- [ ] Donner à l'utilisateur les commandes `!` à lancer (sync, archive, etc.) et attendre son OK explicite avant upload ou soumission.
- [ ] La partie CSS web seule (fluidité) peut passer en OTA, mais seulement après le OK de l'utilisateur.

## 7. Répartition des modèles

- [ ] Opus 5.5 : architecture du plugin Swift et revue finale.
- [ ] Sonnet 5.5 (agents) : CSS de fluidité, tests, captures simulateur.
- [ ] Haiku 5.5 (agents) : petites tâches mécaniques (mapping icônes SF Symbols, chaînes i18n fr / en / es, checklists).
- [ ] Ne pas déléguer l'ensemble du brief à un seul agent.

## 8. Ne pas faire

- [ ] Pas de migration vers Expo ni React Native.
- [ ] Pas de faux flou présenté comme du verre natif.
- [ ] Pas de nouvelle palette de couleurs.
- [ ] Pas de paquet tiers non vérifié (maintenance, licence, compatibilité iOS 26). Les plugins Flutter ne comptent pas.
- [ ] Pas de push, d'OTA ou de soumission sans OK explicite.
- [ ] Pas de tests de fluidité sans THROTTLE, ni sur le port 8765.

## 9. Rendu attendu en fin de travail

- [ ] Liste des commits sur `verre-natif`.
- [ ] Mesures FPS et long tasks avant / après, sous THROTTLE.
- [ ] Captures avant / après (iOS 26 et iOS 18, clair / sombre / globe).
- [ ] Commandes `!` pour l'utilisateur (sync, archive, upload) et points restés ouverts.
- [ ] Ce qui n'a pas été fait (étape 2 du header, par exemple) et pourquoi.
