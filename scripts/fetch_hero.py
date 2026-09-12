from pathlib import Path
import urllib.request,json
root=Path(__file__).resolve().parent.parent
url='https://images.unsplash.com/photo-1760758527332-22b0906e2fe7?auto=format&fit=max&fm=jpg&q=90&w=2200'
req=urllib.request.Request(url,headers={'User-Agent':'OceanBuddy-Design/1.0'})
(root/'assets/photos/hero.jpg').write_bytes(urllib.request.urlopen(req,timeout=45).read())
p=root/'assets/photos/sources.json';meta=json.loads(p.read_text());meta['hero']={'author':'byronetmedia','license':'Unsplash License','source':'https://unsplash.com/photos/mVo4KkRAxXQ','download':url,'place':'Vague et surfeur','file':'A massive wave barrels over a surfer in the ocean'};p.write_text(json.dumps(meta,ensure_ascii=False,indent=2));print('Photo de vague téléchargée')
