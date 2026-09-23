/* Bundle local web content only: no remote website, credentials or server code. */
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'mobile/www');
async function main(){
  fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
  const declaredScripts=new Set([...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^\"]+)"[^>]*><\/script>/g)].map(match=>match[1].split('?')[0]).filter(src=>!src.includes('/')&&src.endsWith('.js')));
  for(const item of fs.readdirSync(root,{withFileTypes:true}))if(item.isFile()&&(/\.(html|css|ico)$/.test(item.name)||declaredScripts.has(item.name)))fs.copyFileSync(path.join(root,item.name),path.join(dest,item.name));
  fs.cpSync(path.join(root,'assets'),path.join(dest,'assets'),{recursive:true});
  fs.mkdirSync(path.join(dest,'vendor'),{recursive:true});
  fs.cpSync(path.join(root,'node_modules/leaflet/dist'),path.join(dest,'vendor/leaflet'),{recursive:true});
  fs.cpSync(path.join(root,'vendor/maplibre'),path.join(dest,'vendor/maplibre'),{recursive:true});
  const fonts=[['barlow-condensed','Barlow Condensed',[600,700,800,900]],['manrope','Manrope',[400,500,600,700,800]],['dm-sans','DM Sans',[400,500,600,700]]];
  let css='';
  fs.mkdirSync(path.join(dest,'vendor/fonts'),{recursive:true});
  for(const [pkg,family,weights] of fonts){
    for(const weight of weights){const filename=`${pkg}-latin-${weight}-normal.woff2`;fs.copyFileSync(path.join(root,'node_modules/@fontsource',pkg,'files',filename),path.join(dest,'vendor/fonts',filename));css+=`@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('./${filename}') format('woff2')}\n`;}
    fs.copyFileSync(path.join(root,'node_modules/@fontsource',pkg,'LICENSE'),path.join(dest,'vendor/fonts',pkg+'-LICENSE.txt'));
  }
  fs.writeFileSync(path.join(dest,'vendor/fonts/fonts.css'),css);
  fs.copyFileSync(path.join(root,'node_modules/leaflet/LICENSE'),path.join(dest,'vendor/leaflet/LICENSE.txt'));
  fs.copyFileSync(path.join(root,'mobile/native.css'),path.join(dest,'native.css'));
  await esbuild.build({entryPoints:[path.join(root,'mobile/client.js')],outfile:path.join(dest,'native.js'),bundle:true,minify:true,format:'iife',target:['safari15','chrome100']});
  let html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
  html=html.replace(/<link[^>]+https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\n?/g,'');
  html=html.replace('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','vendor/leaflet/leaflet.css').replace('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','vendor/leaflet/leaflet.js');
  html=html.replace('</head>','<link rel="stylesheet" href="vendor/fonts/fonts.css"><link rel="stylesheet" href="native.css"></head>');
  const scripts=[];html=html.replace(/<script src="([^\"]+)"[^>]*><\/script>/g,(_,src)=>{scripts.push(src);return '';});
  const loader=`<script src="native.js"></script><script>OceanMobile.boot().then(async()=>{for(const src of ${JSON.stringify(scripts)})await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.append(s)});}).catch(()=>{document.body.innerHTML='<main class="native-load-error"><h1>Ocean Buddy</h1><p>L’application n’a pas pu démarrer.</p><button onclick="location.reload()">Réessayer</button></main>'});</script>`;
  html=html.replace('</body>',loader+'</body>');fs.writeFileSync(path.join(dest,'index.html'),html);
  if(/https:\/\/(fonts\.|unpkg\.com)/.test(html))throw Error('Remote boot dependencies remain');
  console.log(`Mobile bundle ready: ${scripts.length} local scripts, fonts and Leaflet included.`);
}
main().catch(error=>{console.error(error);process.exit(1)});
