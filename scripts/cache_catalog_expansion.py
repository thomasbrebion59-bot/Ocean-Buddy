"""Restore missing catalogue images using the reviewed photographic manifest.

Landscape content is not generated or retouched. Requires Pillow.
"""
from pathlib import Path
from PIL import Image, ImageOps
import io, json, time, urllib.request
ROOT=Path(__file__).resolve().parent.parent
spots=json.loads((ROOT/'data/catalog-expansion.json').read_text())['spots']
manifest=json.loads((ROOT/'assets/spots/sources.json').read_text())
for spot in spots:
    row=manifest[spot['id']]
    target=ROOT/row['src']
    if target.exists():
        continue
    time.sleep(3)
    request=urllib.request.Request(row['download'],headers={'User-Agent':'OceanBuddy/1.0 (credited landscape photographs)'})
    with urllib.request.urlopen(request,timeout=40) as response:
        photo=ImageOps.exif_transpose(Image.open(io.BytesIO(response.read()))).convert('RGB')
    photo.thumbnail((row['width'],row['height']),Image.Resampling.LANCZOS)
    photo.save(target,'WEBP',quality=85,method=6)
    print(spot['id'],photo.size,flush=True)
