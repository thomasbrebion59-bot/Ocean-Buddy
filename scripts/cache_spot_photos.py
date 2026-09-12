"""Cache selected Commons photos. Sequential downloads respect rate limiting."""
from pathlib import Path
import json,urllib.request,urllib.parse,urllib.error,re,html,sys,time
ROOT=Path(__file__).resolve().parent.parent
DIR=ROOT/'assets/spots'
selection=json.loads((DIR/'selection.json').read_text())
manifest=json.loads((DIR/'sources.json').read_text()) if (DIR/'sources.json').exists() else {}
def request(url):
 for attempt in range(4):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'OceanBuddyDesign/1.0 (Commons photo credits)'})
   return urllib.request.urlopen(req,timeout=40).read()
  except urllib.error.HTTPError as e:
   if e.code!=429 or attempt==3:raise
   delay=max(65,int(e.headers.get('Retry-After','65')))
   print('Source rate limit; waiting',delay,'seconds',flush=True);time.sleep(delay)
def clean(s):return html.unescape(re.sub('<[^>]+>','',s)).strip()
priority=['calanques','navagio','anse_source','islamujeres','noronha','rajaampat','whitehaven','uluwatu','biarritz','ericeira','hossegor','supertubos','padang','keramas']
keys=[k for k in priority+list(selection) if k in selection]
keys=list(dict.fromkeys(keys));keys=[k for k in keys if len(sys.argv)==1 or k in sys.argv[1:]]
keys=[k for k in keys if not(k in manifest and manifest[k]['file']==selection[k][0] and (ROOT/manifest[k]['src']).exists())]
for offset in range(0,len(keys),20):
 batch=keys[offset:offset+20]
 q=urllib.parse.urlencode({'action':'query','format':'json','titles':'|'.join('File:'+selection[k][0] for k in batch),'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':1280})
 try:pages=json.loads(request('https://commons.wikimedia.org/w/api.php?'+q))['query']['pages']
 except Exception as e:print('Metadata unavailable:',str(e),flush=True);break
 lookup={p['title'].replace('_',' '):p for p in pages.values()}
 for key in batch:
  p=selection[key]
  try:
   page=lookup['File:'+p[0].replace('_',' ')];info=page['imageinfo'][0];meta=info['extmetadata']
   url=info.get('thumburl',info['url']);time.sleep(4);blob=request(url)
   ext='.png' if blob.startswith(b'\x89PNG') else '.jpg';path=DIR/(key+ext);path.write_bytes(blob)
   manifest[key]={'file':p[0],'src':str(path.relative_to(ROOT)),'source':info['descriptionurl'],'author':clean(meta.get('Artist',{}).get('value',p[1])),'license':clean(meta.get('LicenseShortName',{}).get('value',p[2])),'licenseUrl':meta.get('LicenseUrl',{}).get('value',''),'credit':meta.get('Credit',{}).get('value',''),'download':url,'width':info.get('thumbwidth',info.get('width')),'height':info.get('thumbheight',info.get('height'))}
   (DIR/'sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print(key,'OK',flush=True)
  except Exception as e:print(key,str(e),flush=True)
 time.sleep(5)
print('Cached:',len(manifest),flush=True)
