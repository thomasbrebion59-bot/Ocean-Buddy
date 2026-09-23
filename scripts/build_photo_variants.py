"""Create compact, deterministic card images without altering the originals.

Run with the bundled Python environment that includes Pillow. Sources and
derivative paths are recorded in the canonical data/catalog.json.
"""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parent.parent
catalog = json.loads((ROOT / 'data/catalog.json').read_text())
thumb_dir = ROOT / 'assets/spots/thumbs'
thumb_dir.mkdir(exist_ok=True)
for spot in catalog:
    spot_id, record = spot['id'], spot['photo']
    if not record:
        continue
    source = ROOT / record['src']
    if not source.is_file():
        raise SystemExit(f'Missing spot photograph: {source}')
    destination = ROOT / record['thumb']
    if destination.parent != thumb_dir or destination.name != f'{spot_id}.webp':
        raise SystemExit(f'Unexpected card variant path: {destination}')
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((640, 640), Image.Resampling.LANCZOS)
        image.save(destination, 'WEBP', quality=76, method=6)
print(len(catalog), 'card variants built')
