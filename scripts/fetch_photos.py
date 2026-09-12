from pathlib import Path
import json,urllib.request,urllib.parse,concurrent.futures,sys
root=Path(__file__).resolve().parent.parent
meta=json.loads((root/'assets/photos/sources.json').read_text())
def fetch(item):
 id,p=item
 query=urllib.parse.urlencode({'action':'query','format':'json','titles':'File:'+p['file'],'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':1800 if id=='surf' else 1200})
 req=urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+query,headers={'User-Agent':'OceanBuddy-Design/1.0 (photo attribution retrieval)'})
 try:
  data=json.load(urllib.request.urlopen(req,timeout=30))
  info=next(iter(data['query']['pages'].values()))['imageinfo'][0]
  url=info.get('thumburl',info['url'])
  request=urllib.request.Request(url,headers={'User-Agent':'OceanBuddy-Design/1.0'})
  blob=urllib.request.urlopen(request,timeout=40).read()
  (root/f'assets/photos/{id}.jpg').write_bytes(blob)
  p['metadata']=info['extmetadata'];p['download']=url
  return id,p,len(blob)
 except Exception as e:return id,p,str(e)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 for id,p,result in pool.map(fetch,[(k,v) for k,v in meta.items() if 'file' in v and (len(sys.argv)==1 or k in sys.argv[1:])]):
  meta[id]=p;print(id,result,flush=True)
(root/'assets/photos/sources.json').write_text(json.dumps(meta,indent=2,ensure_ascii=False))
