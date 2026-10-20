#!/bin/zsh
# Mise en production d'Ocean Buddy sur Cloudflare Pages.
# À lancer par l'utilisateur depuis le dépôt : ! zsh scripts/BASCULE-CLOUDFLARE.sh
# GitHub Pages reste en ligne : les apps installées y lisent app-update/ et privacy.html.
set -e
cd "$(dirname "$0")/.."
NEW=$(node -p "require('./scripts/site-base.cjs').OB_SITE_BASE.replace(/\/$/,'')")

echo "1/2 Mise en production Cloudflare"
node scripts/build-cloudflare.cjs
npx wrangler pages deploy .cloudflare/publish --project-name=ocean-buddy --branch=main --commit-dirty=true

echo "2/2 Contrôle"
curl -sI $NEW/ | grep -iE '^(http|content-security|strict-transport)' | cut -c1-120
echo "Ensuite : node scripts/asc-privacy-url.mjs (lecture), puis --apply pour l'URL de confidentialité App Store."
echo "NE PAS rendre le dépôt privé : GitHub Pages doit continuer de servir app-update/ et privacy.html aux apps installées."
