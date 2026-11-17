#!/usr/bin/env python3
"""Give local JS/CSS deterministic URLs so a published design avoids stale caches."""
import hashlib
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
page = root / 'index.html'

def version(match):
    attribute, filename = match.group(1), match.group(2)
    if filename.startswith(('https://', 'http://', '//')):
        return match.group(0)
    asset = root / filename
    digest = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
    return f'{attribute}="{filename}?v={digest}"'

# Compte et sauvegarde : privacy.js charge lui-même account-sync-model.js et account-sync.js après la levée du rideau ;
# leur empreinte commune change l'adresse de ces deux fichiers à chaque nouvelle version.
privacy = root / 'privacy.js'
account_files = [root / 'account-sync-model.js', root / 'account-sync.js']
if privacy.exists() and all(f.exists() for f in account_files):
    h = hashlib.sha256()
    for f in account_files:
        h.update(f.name.encode()); h.update(f.read_bytes())
    code = privacy.read_text()
    stamped = re.sub(r"const ACCOUNT_V='[^']*';", f"const ACCOUNT_V='{h.hexdigest()[:12]}';", code)
    if stamped != code:
        privacy.write_text(stamped)
        print('Version des fichiers du compte mise à jour.')

# Découverte des cultures : cultures-boot.js charge à la demande cultures-model.js, cultures.js et un fichier de données
# par langue (assets/data/cultures.<fr|en|es>.json). Même calcul, au caractère près, que scripts/build-cultures.cjs :
# sha256 de (nom + contenu) de cultures-model.js puis cultures.js, puis du contenu des trois fichiers de données
# (fr, en, es), 12 premiers caractères. Sans cela, modifier cultures.js sans relancer build-cultures laisserait
# l'ancien fichier dans le cache.
boot = root / 'cultures-boot.js'
if boot.exists():
    h = hashlib.sha256()
    for name in ('cultures-model.js', 'cultures.js'):
        f = root / name
        if f.exists():
            h.update(name.encode()); h.update(f.read_bytes())
    for lang in ('fr', 'en', 'es'):
        f = root / 'assets' / 'data' / f'cultures.{lang}.json'
        if f.exists():
            h.update(f.read_bytes())
    code = boot.read_text(encoding='utf-8')
    stamped = re.sub(r"const V='[^']*';", f"const V='{h.hexdigest()[:12]}';", code, count=1)
    if stamped != code:
        boot.write_text(stamped, encoding='utf-8')
        print('Version des fichiers des cultures mise à jour.')

# Globe 3D : ocean-globe.js charge lui-même son moteur et ses textures ; une empreinte commune
# de ces fichiers change leur adresse à chaque nouvelle version (le cache hors ligne les garde sinon).
globe = root / 'ocean-globe.js'
if globe.exists():
    files = sorted((root / 'vendor' / 'three').glob('*.js')) + sorted((root / 'assets' / 'globe').iterdir())
    h = hashlib.sha256()
    for f in files:
        h.update(f.name.encode()); h.update(f.read_bytes())
    code = globe.read_text()
    stamped = re.sub(r"const ASSET_V='[^']*';", f"const ASSET_V='{h.hexdigest()[:12]}';", code)
    if stamped != code:
        globe.write_text(stamped)
        print('Version des fichiers du globe mise à jour.')

original = page.read_text()
updated = re.sub(r'(src|href)="([^"?#]+\.(?:css|js))(?:\?v=[^"]+)?"', version, original)
if updated != original:
    page.write_text(updated)
    print('URLs des ressources mises à jour.')
else:
    print('URLs des ressources déjà à jour.')
