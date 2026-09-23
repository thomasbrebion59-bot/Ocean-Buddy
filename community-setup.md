# Mise en service de la communauté

La communauté est **désactivée par défaut**. Les carnets locaux et les anciens avis ne sont jamais téléversés. Ne pas afficher le bouton de publication comme opérationnel tant que les étapes ci-dessous et le test de bout en bout ne sont pas terminés.

## Services et secrets

1. Créer un projet Supabase contrôlé par le propriétaire, puis appliquer `supabase/migrations/20260923_community.sql` dans son éditeur SQL. Activer la confirmation des e-mails. Dans le modèle d'e-mail « Magic Link / OTP », utiliser `{{ .Token }}` afin d'envoyer le code à six chiffres attendu par l'interface.
2. Configurer un expéditeur de domaine vérifié et un **SMTP personnalisé** Brevo dans Supabase. Le SMTP par défaut de Supabase n'est pas adapté à une communauté publique. Vérifier la délivrabilité sur deux adresses externes et l'expiration du code.
3. Dans l'environnement Netlify, définir `COMMUNITY_SUPABASE_URL`, `COMMUNITY_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`), `COMMUNITY_SUPABASE_SECRET_KEY` (`sb_secret_…`), `COMMUNITY_OWNER_ID` (UUID du compte modérateur), `COMMUNITY_ENABLED=true`. La clé secrète reste exclusivement côté Netlify. Les anciens noms `COMMUNITY_SUPABASE_ANON_KEY` et `COMMUNITY_SUPABASE_SERVICE_ROLE_KEY` sont acceptés uniquement pour une migration depuis un projet existant. Configurer `COMMUNITY_ALLOWED_ORIGINS` seulement si les origines publiques changent ; la valeur par défaut inclut GitHub Pages, le site Netlify et l'application Capacitor.
4. Dans `community-config.js`, inscrire seulement l'URL Supabase, la clé **publishable publique** et l'URL de la fonction Netlify. Déployer la fonction et le site. Vérifier que `GET /.netlify/functions/community?view=status` répond `{"enabled":true}` avant d'ouvrir la communauté aux utilisateurs.
5. Utiliser un compte secondaire pour envoyer un message, vérifier qu'il reste invisible au public, puis se connecter avec le compte modérateur et le valider. Répéter pour avis, réponse, proposition de spot et copie de voyage. Vérifier signalement, masquage, retrait, blocage, suppression du compte et absence des champs privés non cochés dans la réponse publique. La suppression réelle via l'API Auth Admin doit être testée avant ouverture : les nouvelles clés Supabase se transmettent dans l'en-tête `apikey`, pas comme jeton Bearer.

## Exploitation

- Vérifier quotidiennement la file de modération et les signalements. Ne jamais approuver un itinéraire contenant des données personnelles, une adresse précise ou un conseil de sécurité non vérifié.
- Sauvegarder régulièrement les tables communautaires dans un emplacement privé et chiffré ; la formule gratuite de Supabase ne fournit pas une garantie de sauvegarde ni de disponibilité. Ne jamais placer d'export de données utilisateurs dans le dépôt public.
- Si Supabase ou Netlify est indisponible, laisser le catalogue et les carnets locaux fonctionner. La communauté affiche un état indisponible et interdit tout nouvel envoi.
- Le retrait d'une contribution change son état immédiatement. La suppression du compte passe par l'API Admin Supabase, puis les liens `on delete cascade` effacent profil, contributions, signalements et blocages. Vérifier cette cascade avec un compte de test avant ouverture publique.
- Après un changement de version des règles, modifier `RULES_VERSION` côté client et serveur ensemble ; tous les nouveaux envois exigent l'acceptation de la version courante.

Références : [OTP Supabase](https://supabase.com/docs/guides/auth/auth-email-passwordless), [SMTP personnalisé](https://supabase.com/docs/guides/auth/auth-smtp), [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).
