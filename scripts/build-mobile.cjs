/* Bundle local web content only: no remote website, credentials or server code. */
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'mobile/www');
function copyLocales(dest){fs.mkdirSync(path.join(dest,'locales'),{recursive:true});for(const f of fs.readdirSync(path.join(root,'locales')))if(f.endsWith('.js'))fs.copyFileSync(path.join(root,'locales',f),path.join(dest,'locales',f));}
async function main(){
  fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
  const declaredScripts=new Set([...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^\"]+)"[^>]*><\/script>/g)].map(match=>match[1].split('?')[0]).filter(src=>!src.includes('/')&&src.endsWith('.js')));
  for(const item of fs.readdirSync(root,{withFileTypes:true}))if(item.isFile()&&(/\.(html|css|ico)$/.test(item.name)||declaredScripts.has(item.name)))fs.copyFileSync(path.join(root,item.name),path.join(dest,item.name));
  fs.cpSync(path.join(root,'assets'),path.join(dest,'assets'),{recursive:true});
  /* Le téléphone n’utilise que la texture 4K du globe ; photos de spots allégées pour l’app (le site garde les originaux). */
  fs.rmSync(path.join(dest,'assets/globe/earth-8k.webp'),{force:true});
  fs.rmSync(path.join(dest,'assets/globe/relief-8k.webp'),{force:true});
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
  await esbuild.build({entryPoints:[path.join(root,'mobile/client.js')],outfile:path.join(dest,'native.js'),bundle:true,minify:true,format:'iife',target:['safari15','chrome100']});
  let html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
  html=html.replace(/<link[^>]+https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\n?/g,'');
  html=html.replace('</head>','<link rel="stylesheet" href="vendor/fonts/fonts.css"><link rel="stylesheet" href="native.css"></head>');
  const scripts=[];html=html.replace(/<script src="([^\"]+)"[^>]*><\/script>/g,(tag,src)=>{if(src.split('?')[0]==='i18n.js')return tag;scripts.push(src);return '';});
  const loader=`<script src="native.js"></script><script>OceanMobile.boot().then(async()=>{for(const src of ${JSON.stringify(scripts)})await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.append(s)});}).catch(()=>{document.body.innerHTML='<main class="native-load-error"><h1>Ocean Buddy</h1><p>L’application n’a pas pu démarrer.</p><button onclick="location.reload()">Réessayer</button></main>'});</script>`;
  html=html.replace('</body>',loader+'</body>');fs.writeFileSync(path.join(dest,'index.html'),html);
  if(/https:\/\/(fonts\.|unpkg\.com)/.test(html))throw Error('Remote boot dependencies remain');
  console.log(`Mobile bundle ready: ${scripts.length} local scripts, fonts and map engine included.`);
}
main().catch(error=>{console.error(error);process.exit(1)});
