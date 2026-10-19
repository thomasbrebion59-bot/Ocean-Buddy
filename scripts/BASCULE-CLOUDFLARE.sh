#!/bin/zsh
# Bascule d'Ocean Buddy de GitHub Pages vers Cloudflare Pages.
# À lancer par l'utilisateur depuis le dépôt : ! zsh scripts/BASCULE-CLOUDFLARE.sh
# GitHub Pages reste en ligne : les apps installées y lisent app-update/ et privacy.html.
set -e
cd "$(dirname "$0")/.."
SITE=7ae2ef2c-4a19-4c1a-a505-5ed29c808d83
NEW=$(node -p "require('./scripts/site-base.cjs').OB_SITE_BASE.replace(/\/$/,'')")
SECOURS=https://ocean-buddy.pages.dev
DEFAULTS=https://thomasbrebion59-bot.github.io,https://exquisite-choux-61c0d9.netlify.app,capacitor://oceanbuddy.localhost,https://oceanbuddy.localhost

if [ "$1" != "--sans-cloudflare" ]; then
echo "1/3 Mise en production Cloudflare"
node scripts/build-cloudflare.cjs
npx wrangler pages deploy .cloudflare/publish --project-name=ocean-buddy --branch=main --commit-dirty=true
fi

echo "2/3 Netlify : autoriser $NEW pour Poulpy et la communauté"
# Les commandes env de netlify-cli 23 n'ont pas --site : le site vient de NETLIFY_SITE_ID.
export NETLIFY_SITE_ID=$SITE
for VAR in POULPY_ALLOWED_ORIGINS COMMUNITY_ALLOWED_ORIGINS; do
  CUR=$(npx -y netlify-cli@23 env:get $VAR 2>/dev/null | tail -1)
  case "$CUR" in https://*|capacitor://*) ;; *) CUR=$DEFAULTS ;; esac
  for ORIGIN in $NEW $SECOURS; do
    case ",$CUR," in *",$ORIGIN,"*) echo "$VAR contient déjà $ORIGIN" ;;
      *) CUR="$CUR,$ORIGIN"; npx -y netlify-cli@23 env:set $VAR "$CUR" ;; esac
  done
done
npx -y netlify-cli@23 deploy --build --prod --site $SITE

echo "3/3 Contrôle"
curl -sI $NEW/ | grep -iE '^(http|content-security|strict-transport)' | cut -c1-120
echo "Ensuite : node scripts/asc-privacy-url.mjs (lecture), puis --apply pour l'URL de confidentialité App Store."
echo "NE PAS rendre le dépôt privé : GitHub Pages doit continuer de servir app-update/ et privacy.html aux apps installées."
