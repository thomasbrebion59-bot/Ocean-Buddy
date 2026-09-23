"""Check catalogue image integrity and flag source resolution for review."""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parent.parent
records = json.loads((ROOT / 'assets/spots/sources.json').read_text())
problems, review = [], []
for spot_id, record in records.items():
    for key in ('src', 'thumb'):
        path = ROOT / record.get(key, '')
        if not path.is_file():
            problems.append(f'{spot_id}: missing {key}')
            continue
        with Image.open(path) as image:
            width, height = image.size
            if key == 'src':
                if (width, height) != (record.get('width'), record.get('height')):
                    problems.append(f'{spot_id}: source dimensions differ from manifest')
                if min(width, height) < 600:
                    review.append(f'{spot_id}: {width} × {height}')
            elif width > 640:
                problems.append(f'{spot_id}: card variant too wide')
    if not all(record.get(key) for key in ('source', 'author', 'license')):
        problems.append(f'{spot_id}: incomplete credit')
print(f'{len(records)} photos checked; {len(review)} original images have a side under 600 px.')
for line in review:
    print('REVIEW', line)
for line in problems:
    print('ERROR', line)
if problems:
    raise SystemExit(1)
