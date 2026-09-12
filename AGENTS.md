# Ocean Buddy

## Autorisation permanente de publication

L’utilisateur demande que chaque modification terminée et vérifiée de cette application soit publiée sur GitHub, puis mise en ligne. Cette consigne s’applique aux prochaines tâches, sauf instruction explicite contraire. Une simple mise à jour de l’application ne nécessite pas de redemander l’autorisation de publier.

- Dépôt : `https://github.com/thomasbrebion59-bot/Ocean-Buddy.git`
- Branche publiée : `main`
- Site : `https://thomasbrebion59-bot.github.io/Ocean-Buddy/`
- GitHub Pages utilise la racine de `main` ; conserver `.nojekyll`.

## À la fin d’une modification

Après la dernière modification JavaScript ou CSS, exécuter `python3 scripts/version-assets.py` avant les vérifications finales et le commit. Ce script met à jour les URL des ressources dans `index.html` pour que les visiteurs reçoivent bien la nouvelle version, même si leur navigateur a conservé les anciens fichiers en cache.

1. Vérifier les changements avec les contrôles adaptés. Pour une modification fonctionnelle du modèle de voyage, lancer `node --test tests/trip-model.test.js`. Pour une modification visuelle, vérifier les écrans concernés dans le navigateur, sur mobile et sur ordinateur selon la portée.
2. Inspecter les changements et l’état Git. Préserver le travail existant de l’utilisateur ; ne pas publier une modification étrangère à la tâche ou inachevée. Ne pas inclure de secrets ou de configuration locale.
3. Enregistrer les changements terminés dans un commit. Récupérer l’état du dépôt distant et intégrer les éventuelles nouveautés sans écraser leur historique.
4. Publier sur `origin/main` par avance rapide, par exemple `git push origin HEAD:main`, après avoir vérifié que `origin/main` est un ancêtre de `HEAD`. Ne jamais forcer la publication.
5. Vérifier que le déploiement GitHub Pages correspond au commit envoyé. Lors de la publication précédente, GitHub avait conservé un ancien déploiement : si nécessaire, déclencher une construction Pages via `POST /repos/thomasbrebion59-bot/Ocean-Buddy/pages/builds` et attendre son résultat.
6. Vérifier le site public et les fichiers concernés, puis communiquer le lien. Ne pas annoncer une mise en ligne sur la seule base d’un `git push` réussi.

En cas d’échec d’authentification, de conflit ou de déploiement, expliquer le blocage exact et conserver les changements locaux. Les contrôles de sécurité et les demandes de confirmation applicables aux accès sensibles restent obligatoires.
