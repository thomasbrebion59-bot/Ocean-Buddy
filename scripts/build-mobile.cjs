/* Bundle local web content only: no remote website, credentials or server code. */
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'mobile/www');
function copyLocales(dest){fs.mkdirSync(path.join(dest,'locales'),{recursive:true});for(const f of fs.readdirSync(path.join(root,'locales')))if(f.endsWith('.js'))fs.copyFileSync(path.join(root,'locales',f),path.join(dest,'locales',f));}
async function main(){
  fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
  const declaredScripts=new Set([...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^\"]+)"[^>]*><\/script>/g)].map(match=>match[1].split('?')[0]).filter(src=>!src.includes('/')&&src.endsWith('.js')));
  for(const item of fs.readdirSync(root,{withFileTypes:true}))if(item.isFile()&&(/\.(html|css|ico)$/.test(item.name)||declaredScripts.has(item.name)))fs.copyFileSync(path.join(root,item.name),path.join(dest,item.name));
  /* Fichiers sources de la marque (gros PNG et JPG de travail) : inutiles dans l’app, exclus du paquet. */
  const brandSource=/^(manta-[^/]*-source\.[a-z]+|manta-app-icon-[^/]*\.png)$/;
  fs.cpSync(path.join(root,'assets'),path.join(dest,'assets'),{recursive:true,filter:src=>!(path.dirname(src)===path.join(root,'assets','brand')&&brandSource.test(path.basename(src)))});
  /* Données de l’accueil (home-feed.js) : saisons des spots et éclat des photos, comme sur le site. */
  fs.mkdirSync(path.join(dest,'data'),{recursive:true});
  for(const f of ['seasons.json','photo-scores.json'])fs.copyFileSync(path.join(root,'data',f),path.join(dest,'data',f));
  /* Le téléphone n’utilise que les textures 4K du globe (pas de 8K ni d’emblèmes) ; photos de spots allégées pour l’app (le site garde les originaux). */
  for(const f of ['earth-8k.webp','earth-day-8k.webp','relief-8k.webp','emblems.webp','countries.json'])fs.rmSync(path.join(dest,'assets/globe',f),{force:true});
  const shrink=require('node:child_process').spawnSync('python3',[path.join(root,'scripts/compress-mobile-images.py'),path.join(dest,'assets/spots')],{stdio:'inherit'});
  if(shrink.status!==0)console.warn('Photos non allégées (Python + Pillow requis) : originaux conservés.');
  copyLocales(dest);
  fs.mkdirSync(path.join(dest,'vendor'),{recursive:true});
  fs.cpSync(path.join(root,'vendor/maplibre'),path.join(dest,'vendor/maplibre'),{recursive:true});
  fs.cpSync(path.join(root,'vendor/three'),path.join(dest,'vendor/three'),{recursive:true});
  const fonts=[['barlow-condensed','Barlow Condensed',[600,700,800,900]],['manrope','Manrope',[400,500,600,700,800]],['dm-sans','DM Sans',[400,500,600,700]]];
  let css='';
  fs.mkdirSync(path.join(dest,'vendor/fonts'),{recursive:true});
  for(const [pkg,family,weights] of fonts){
    // Every subset the package ships (latin-ext for cs/pl/ro/tr/hu…, vietnamese, cyrillic, greek), each
    // limited by its unicode-range so a device only loads what the chosen language needs.
    for(const weight of weights){
      const faces=[...fs.readFileSync(path.join(root,'node_modules/@fontsource',pkg,`${weight}.css`),'utf8').matchAll(/url\(\.\/files\/([^)]+\.woff2)\)[^;]*;\s*unicode-range:\s*([^;]+);/g)];
      if(!faces.some(face=>face[1]===`${pkg}-latin-${weight}-normal.woff2`))throw Error(`Latin subset missing for ${pkg} ${weight}`);
      for(const [,filename,range] of faces){fs.copyFileSync(path.join(root,'node_modules/@fontsource',pkg,'files',filename),path.join(dest,'vendor/fonts',filename));css+=`@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('./${filename}') format('woff2');unicode-range:${range.trim()}}\n`;}
    }
    fs.copyFileSync(path.join(root,'node_modules/@fontsource',pkg,'LICENSE'),path.join(dest,'vendor/fonts',pkg+'-LICENSE.txt'));
  }
  fs.writeFileSync(path.join(dest,'vendor/fonts/fonts.css'),css);
  fs.copyFileSync(path.join(root,'mobile/native.css'),path.join(dest,'native.css'));
  // Numéro du contenu embarqué : les mises à jour directes (scripts/publish-app-update.cjs) le comparent à app-update/latest.json.
  const seq=Number(process.env.OB_BUNDLE_SEQ)||Number(new Date().toISOString().replace(/\D/g,'').slice(0,12));
  /* Les mises à jour directes exécutent du code : leur adresse est toujours en HTTPS et se termine par « / ». */
  /* Adresse publique unique (scripts/site-base.cjs) ; OB_UPDATE_BASE reste accepté pour un essai ponctuel.
     Secours : GitHub Pages (app-update/ y est toujours publié pour les apps déjà installées). */
  const site=require('./site-base.cjs');
  const updateBase=process.env.OB_UPDATE_BASE||site.OB_UPDATE_BASE, updateFallback=site.LEGACY_UPDATE_BASE;
  for(const base of [updateBase,updateFallback])if(!/^https:\/\/[^/?#\s]+\/[^?#\s]*\/$/.test(base))throw Error('OB_UPDATE_BASE doit être une adresse https:// terminée par « / » : '+base);
  await esbuild.build({entryPoints:[path.join(root,'mobile/client.js')],outfile:path.join(dest,'native.js'),bundle:true,minify:true,format:'iife',target:['safari15','chrome100'],define:{__OB_BUNDLE__:JSON.stringify({seq}),__OB_UPDATE_BASE__:JSON.stringify(updateBase),__OB_UPDATE_FALLBACK__:JSON.stringify(updateFallback===updateBase?'':updateFallback),__OB_SITE_BASE__:JSON.stringify(site.OB_SITE_BASE)}});
  let html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
  html=html.replace(/<link[^>]+https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\n?/g,'');
  /* Manifeste d’application web : inutile dans l’app (et absent du paquet). */
  html=html.replace(/<link rel="manifest"[^>]*>\n?/,'');
  /* Polices des titres préchargées (Barlow Condensed des grands titres, DM Sans du grand titre d’accueil) : pas de changement de police visible après le rideau. */
  const preload=['barlow-condensed-latin-900-normal','barlow-condensed-latin-800-normal','dm-sans-latin-700-normal'].map(f=>`<link rel="preload" href="vendor/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`).join('');
  html=html.replace('</head>',preload+'<link rel="stylesheet" href="vendor/fonts/fonts.css"><link rel="stylesheet" href="native.css"></head>');
  const scripts=[];html=html.replace(/<script src="([^\"]+)"[^>]*><\/script>/g,(tag,src)=>{if(src.split('?')[0]==='i18n.js')return tag;scripts.push(src);return '';});
  /* Scripts insérés d’un coup avec async=false : téléchargés en parallèle, exécutés dans l’ordre du HTML.
     appReady() suit le dernier script, sans attendre le rideau de démarrage (OceanBoot). */
  const loader=`<script src="native.js"></script><script>OceanMobile.boot().then(()=>new Promise((resolve,reject)=>{let last;for(const src of ${JSON.stringify(scripts)}){const s=document.createElement('script');s.src=src;s.async=false;s.onerror=reject;document.body.append(s);last=s;}last.onload=resolve;})).then(()=>OceanMobile.appReady()).catch(()=>{document.body.innerHTML='<main class="native-load-error"><h1>Ocean Buddy</h1><p>L’application n’a pas pu démarrer.</p><button onclick="location.reload()">Réessayer</button></main>'});</script>`;
  html=html.replace('</body>',loader+'</body>');fs.writeFileSync(path.join(dest,'index.html'),html);
  if(/https:\/\/(fonts\.|unpkg\.com)/.test(html))throw Error('Remote boot dependencies remain');
  fs.writeFileSync(path.join(dest,'bundle.json'),JSON.stringify({seq})+'\n');
  console.log(`Mobile bundle ${seq} ready: ${scripts.length} local scripts, fonts and map engine included.`);
}
main().catch(error=>{console.error(error);process.exit(1)});
