"""Collect Commons photo candidates; selection is reviewed before publication."""
from pathlib import Path
import json, urllib.request, urllib.parse, urllib.error, time
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT.parent/'output/catalogue-240/photo-candidates.json'
OUT.parent.mkdir(parents=True,exist_ok=True)
entries=json.loads((ROOT/'data/catalog-expansion.json').read_text())['spots']
cache=json.loads(OUT.read_text()) if OUT.exists() else {}
def lookup(s):
 q={'action':'query','format':'json','generator':'search','gsrsearch':s['photoQuery']+' filetype:bitmap','gsrnamespace':6,'gsrlimit':7,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':480}
 url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(q)
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'OceanBuddy/1.0 (photo selection with attribution)'})
  with urllib.request.urlopen(req,timeout=30) as r:data=json.load(r)
  found=[]
  for p in sorted(data.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',0)):
   if not p.get('imageinfo'):continue
   info=p['imageinfo'][0]
   if info['width']<700 or info['height']<400:continue
   found.append({'title':p['title'],**info})
  return s['id'],found
 except Exception as e:return s['id'],{'error':str(e)}
for item in entries:
 if isinstance(cache.get(item['id']),list) and cache[item['id']]:continue
 time.sleep(6)
 id,rows=lookup(item)
 if isinstance(rows,dict) and '429' in rows.get('error',''):
  print('Photo service rate limit — pause 70s',flush=True)
  time.sleep(70)
  id,rows=lookup(item)
  if isinstance(rows,dict):print(id,rows,flush=True);break
 cache[id]=rows;OUT.write_text(json.dumps(cache,ensure_ascii=False,indent=2));print(id,len(rows) if isinstance(rows,list) else rows,flush=True)
