"""Build the local photo catalogue and complete attribution page."""
from pathlib import Path
import html, json, re, subprocess
ROOT = Path(__file__).resolve().parent.parent
meta = json.loads((ROOT/'assets/spots/sources.json').read_text())
old = json.loads((ROOT/'assets/photos/sources.json').read_text())
app = (ROOT/'app.js').read_text()
spots = json.loads(subprocess.check_output(['node','-e',"const fs=require('fs'),vm=require('vm');const s=fs.readFileSync('app.js','utf8');console.log(JSON.stringify(vm.runInNewContext(s.slice(s.indexOf('const SPOTS='),s.indexOf('const SCORES='))+';SPOTS')))"] ,cwd=ROOT))
names = {s['id']:s['name'] for s in spots}
worlds = {
 'fr':('calanques','Calanque d’En-Vau, France'),
 'eu':('navagio','Navagio, Grèce'),
 'af':('anse_source','Anse Source d’Argent, Seychelles'),
 'na':('islamujeres','Isla Mujeres, Mexique'),
 'sa':('noronha','Fernando de Noronha, Brésil'),
 'as':('rajaampat','Raja Ampat, Indonésie'),
 'oc':('whitehaven','Whitehaven, Australie')
}
catalog = {k:{field:p[field] for field in ['src','source','author','license','licenseUrl']} for k,p in meta.items()}
(ROOT/'photo-catalog.js').write_text('/* Real photographs. Sources and licences: photos.html. */\nwindow.SPOT_PHOTOS = '+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n')
world = {k:{**catalog[id],'place':place} for k,(id,place) in worlds.items()}
app = re.sub(r'var WORLD_PHOTOS=.*?;\nfunction worldVisited',lambda m:'var WORLD_PHOTOS='+json.dumps(world,ensure_ascii=False)+';\nfunction worldVisited',app,flags=re.S)
(ROOT/'app.js').write_text(app)
esc=lambda s:html.escape(str(s),quote=True)
labels={'fr':'France','eu':'Europe','af':'Afrique','na':'Amérique du Nord','sa':'Amérique du Sud','as':'Asie','oc':'Océanie'}
def card(id,p,label,title):
 url=p.get('licenseUrl') or ('https://creativecommons.org/publicdomain/zero/1.0/' if 'CC0' in p['license'] else p['source'])
 return f'<article id="{esc(id)}"><img src="{esc(p["src"])}" alt="{esc(title)}" loading="lazy"><div><small>{esc(label)}</small><h2>{esc(title)}</h2><p>Photographie : {esc(p["author"])}</p><a href="{esc(p["source"])}" target="_blank" rel="noopener">Photo originale ↗</a><a href="{esc(url)}" target="_blank" rel="noopener">{esc(p["license"])} ↗</a></div></article>'
cards=[card(k,p,labels[k],p['place']) for k,p in world.items()]
hero={**old['hero'],'src':'assets/photos/hero.jpg','licenseUrl':'https://unsplash.com/license'}
cards.append(card('hero',hero,'Accueil',hero['place']))
spot_cards=[card(k,p,'Spot',names.get(k,k)) for k,p in sorted(catalog.items(),key=lambda item:names.get(item[0],item[0]))]
page='''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Photographies — Ocean Buddy</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f5f0;color:#193551;font:15px/1.7 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:35px 25px 70px}a{color:#2154dc;text-underline-offset:4px}h1{font-size:clamp(32px,6vw,64px);line-height:1.05;margin:32px 0 18px}header p{color:#536b80;max-width:800px}section{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;margin-top:30px}article{background:#fff;border:1px solid #dce4e9;border-radius:18px;overflow:hidden}article img{width:100%;height:210px;object-fit:cover;display:block}article div{padding:20px}article small{color:#2154dc;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:1px}article h2{font-size:18px;line-height:1.4;margin:9px 0}article p{font-size:12px;color:#536b80;overflow-wrap:anywhere}article a{font-size:12px;margin-right:15px;display:inline-block}footer{margin-top:35px;color:#536b80;font-size:13px}summary{font-size:24px;font-weight:750;cursor:pointer;margin-top:40px}.intro-links{display:flex;gap:20px;margin:25px 0}@media(max-width:700px){section{grid-template-columns:1fr 1fr}article img{height:150px}}@media(max-width:480px){section{grid-template-columns:1fr}}
</style></head><body><main><a href="index.html">← Revenir à Ocean Buddy</a><header><h1>De vrais lieux.<br>De vrais regards.</h1><p>Des photographies de paysages réels, avec leurs auteurs et leurs sources. Les images sont redimensionnées pour l’application ; le cadrage et le voile de contraste s’adaptent à l’écran. Aucune transformation générative n’est appliquée aux paysages.</p></header><h2>Les grands horizons</h2><section>'''+''.join(cards)+f'''</section><details open><summary>Le catalogue des spots · {len(catalog)} photographies locales</summary><section>'''+''.join(spot_cards)+'''</section></details><footer>Les photographies et leurs présentations recadrées restent soumises à la licence mentionnée pour chaque image. Pour les licences avec partage à l’identique, les adaptations de ces photographies sont proposées sous la même licence. Poulpy reste une illustration de l’identité Ocean Buddy.</footer></main></body></html>'''
(ROOT/'photos.html').write_text(page)
print(f'{len(catalog)} spot photos; {len(world)} destination covers; credits complete.')
