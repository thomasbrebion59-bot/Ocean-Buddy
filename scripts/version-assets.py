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

original = page.read_text()
updated = re.sub(r'(src|href)="([^"?#]+\.(?:css|js))(?:\?v=[^"]+)?"', version, original)
if updated != original:
    page.write_text(updated)
    print('URLs des ressources mises à jour.')
else:
    print('URLs des ressources déjà à jour.')
