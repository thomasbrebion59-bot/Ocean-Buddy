"""Build the browser catalogue from the reviewed, editable data file."""
from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
data=json.loads((root/'data/catalog-expansion.json').read_text())
spots=[]
for row in data['spots']:
 source=data['sources'][row['sourceKey']]
 s={k:v for k,v in row.items() if k not in ('photoQuery','sourceKey')}
 s.update({'source':source,'reviewed':data['reviewed'],'catalogNew':True,'sky':'#c9dfed','sky2':'#8bbbd7','sea':'#2c789b','sea2':'#17486e','wind':'—','swell':'—','temp':'—','tide':'—','danger':0,'dangers':[], 'tip':''})
 spots.append(s)
(root/'catalog-expansion.js').write_text('/* Reviewed destination catalogue. Edit data/catalog-expansion.json then rebuild. */\nwindow.OCEAN_SPOT_EXPANSION = '+json.dumps(spots,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(spots),'catalogue entries built')
