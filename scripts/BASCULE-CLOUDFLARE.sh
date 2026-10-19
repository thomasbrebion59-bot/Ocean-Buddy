#!/bin/zsh
# Bascule d'Ocean Buddy de GitHub Pages vers Cloudflare Pages.
# À lancer par l'utilisateur : ! zsh ~/Projects/Ocean-Buddy-cloudflare/BASCULE-CLOUDFLARE.sh
set -e
cd ~/Projects/Ocean-Buddy-cloudflare
SITE=7ae2ef2c-4a19-4c1a-a505-5ed29c808d83
NEW=https://ocean-buddy.pages.dev
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
  case ",$CUR," in *",$NEW,"*) echo "$VAR contient déjà $NEW" ;;
    *) npx -y netlify-cli@23 env:set $VAR "$CUR,$NEW" ;; esac
done
npx -y netlify-cli@23 deploy --build --prod --site $SITE

echo "3/3 Contrôle"
curl -sI $NEW/ | grep -iE '^(http|content-security|strict-transport)' | cut -c1-120
echo "Ensuite : changer l'URL de confidentialité dans App Store Connect vers $NEW/…,"
echo "puis seulement après : gh repo edit thomasbrebion59-bot/Ocean-Buddy --visibility private --accept-visibility-change-consequences"
