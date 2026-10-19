/* Prépare le dossier Cloudflare Pages (.cloudflare/publish) : paquet statique public + _headers (CSP avec empreinte du script de démarrage). */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),src=path.join(root,'.build/static'),dest=path.join(root,'.cloudflare/publish');
execFileSync(process.execPath,[path.join(__dirname,'build-static.cjs')],{stdio:'inherit'});
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.cpSync(src,dest,{recursive:true});
/* build-static.cjs oublie le globe 3D (vendor/three) : on l'ajoute ici. */
fs.mkdirSync(path.join(dest,'vendor/three'),{recursive:true});fs.copyFileSync(path.join(root,'vendor/three/three.globe.min.js'),path.join(dest,'vendor/three/three.globe.min.js'));
/* Mises à jour directes de l'app : publiées aux deux endroits (GitHub Pages et Cloudflare), voir docs/ADRESSE-PUBLIQUE.md. */
if(fs.existsSync(path.join(root,'app-update/latest.json')))fs.cpSync(path.join(root,'app-update'),path.join(dest,'app-update'),{recursive:true});
/* Fichiers internes (notes, prompts de génération) : jamais publiés. */
(function purge(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())purge(f);else if(!f.startsWith(path.join(dest,'app-update')+path.sep)&&/\.(md|txt|map)$/i.test(e.name)&&!(d===dest&&e.name==='robots.txt')||/prompts\.json$/.test(e.name))fs.rmSync(f);}})(dest);
const html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
if(inline.length!==1)throw new Error('Attendu : exactement un script inline dans index.html, trouvé '+inline.length);
const hash='sha256-'+crypto.createHash('sha256').update(inline[0],'utf8').digest('base64');
fs.writeFileSync(path.join(dest,'_headers'),fs.readFileSync(path.join(root,'cloudflare/_headers'),'utf8').replaceAll('__BOOT_HASH__',hash));
console.log('Cloudflare Pages prêt dans .cloudflare/publish ('+hash+')');
