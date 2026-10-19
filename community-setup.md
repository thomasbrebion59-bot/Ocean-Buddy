# Communauté : non disponible

La communauté n'a plus de serveur. `community-config.js` a un `endpoint` vide : l'app affiche « Le fil ouvre très bientôt » et « Les avis des explorateurs arrivent bientôt », sans appel réseau, sans chargement infini, sans donnée inventée. Les carnets locaux ne sont jamais téléversés.

Pour la rouvrir un jour, il faudra un nouveau serveur (fonction qui reprend le contrat de `community.js`), un projet Supabase (migration `supabase/migrations/20260923_community.sql`), un SMTP vérifié, la modération humaine, puis renseigner `supabaseUrl`, `publishableKey` et `endpoint` (HTTPS) dans `community-config.js` et ajouter l'origine du serveur à `connect-src` de `cloudflare/_headers`.
