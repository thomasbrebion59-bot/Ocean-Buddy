#!/usr/bin/env node
/*
 * Mises à jour directes de l’app mobile (sans repasser par l’App Store).
 *
 *   node scripts/publish-app-update.cjs --baseline 1.2.0
 *       À lancer pour chaque build envoyé à Apple : construit mobile/www et enregistre
 *       l’empreinte de chaque fichier embarqué dans mobile/ota-baselines/1.2.0.json.
 *       Utiliser ce même mobile/www pour `cap sync` puis l’archive Xcode.
 *
 *   node scripts/publish-app-update.cjs [--native-min 1.2.0]
 *       Construit le contenu actuel et le publie dans app-update/ (servi par GitHub Pages) :
 *       latest.json, manifests/<seq>.json et files/<sha256> pour les seuls fichiers absents
 *       des apps installées. Les téléphones réutilisent tout le reste depuis leur copie locale.
 *       Ensuite : commit + push comme d’habitude.
 *
 * Seul le contenu web change ainsi. Nouveau plugin, autorisation ou réglage natif
 * => nouvelle version App Store, puis --baseline et --native-min de cette version.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),www=path.join(root,'mobile/www'),out=path.join(root,'app-update'),baseDir=path.join(root,'mobile/ota-baselines');
const arg=name=>{const i=process.argv.indexOf(name);return i>0?process.argv[i+1]:null;};
const cmp=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d)return Math.sign(d);}return 0;};
const KEEP=4;

function build(){
  const seq=Number(new Date().toISOString().replace(/\D/g,'').slice(0,12));
  const r=spawnSync(process.execPath,[path.join(root,'scripts/build-mobile.cjs')],{stdio:'inherit',env:{...process.env,OB_BUNDLE_SEQ:String(seq)}});
  if(r.status!==0)process.exit(r.status||1);
  return seq;
}
function hashes(){
  const files={};
  (function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(e.name==='.DS_Store')continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory())walk(full);
    else files[path.relative(www,full).split(path.sep).join('/')]=crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
  }})(www);
  return files;
}

const baselineVersion=arg('--baseline');
if(baselineVersion){
  if(!/^\d+\.\d+\.\d+$/.test(baselineVersion))throw Error('Version attendue : 1.2.0');
  const seq=build(),files=hashes();
  fs.mkdirSync(baseDir,{recursive:true});
  fs.writeFileSync(path.join(baseDir,baselineVersion+'.json'),JSON.stringify({native:baselineVersion,seq,files},null,0)+'\n');
  console.log(`Référence ${baselineVersion} (contenu ${seq}, ${Object.keys(files).length} fichiers). Lancer maintenant : npx cap sync, puis archiver dans Xcode.`);
  process.exit(0);
}

const baselines=fs.existsSync(baseDir)?fs.readdirSync(baseDir).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(baseDir,f),'utf8'))):[];
if(!baselines.length)throw Error('Aucune référence native : lancer d’abord --baseline <version> pour le build envoyé à Apple.');
const nativeMin=arg('--native-min')||baselines.map(b=>b.native).sort(cmp).at(-1);
const supported=baselines.filter(b=>cmp(b.native,nativeMin)>=0);
if(!supported.length)throw Error('Aucune référence pour '+nativeMin);

const seq=build(),files=hashes();
// Un fichier doit être hébergé dès qu’une app compatible ne l’a pas, au même chemin, à l’identique.
const needed=Object.entries(files).filter(([p,h])=>supported.some(b=>b.files[p]!==h));
fs.mkdirSync(path.join(out,'files'),{recursive:true});fs.mkdirSync(path.join(out,'manifests'),{recursive:true});
let bytes=0;
for(const [p,h] of needed){const dest=path.join(out,'files',h);bytes+=fs.statSync(path.join(www,p)).size;if(!fs.existsSync(dest))fs.copyFileSync(path.join(www,p),dest);}
const manifestName=`manifests/${seq}.json`;
fs.writeFileSync(path.join(out,manifestName),JSON.stringify({seq,native_min:nativeMin,files:Object.entries(files),hosted:needed.map(([,h])=>h)})+'\n');
fs.writeFileSync(path.join(out,'latest.json'),JSON.stringify({seq,native_min:nativeMin,manifest:manifestName,download_files:needed.length,download_bytes:bytes},null,2)+'\n');

// Ménage : garder les derniers manifestes et les fichiers qu’ils utilisent.
const manifests=fs.readdirSync(path.join(out,'manifests')).filter(f=>/^\d+\.json$/.test(f)).sort();
for(const old of manifests.slice(0,-KEEP))fs.rmSync(path.join(out,'manifests',old));
const used=new Set(manifests.slice(-KEEP).flatMap(f=>JSON.parse(fs.readFileSync(path.join(out,'manifests',f),'utf8')).hosted||[]));
for(const f of fs.readdirSync(path.join(out,'files')))if(!used.has(f))fs.rmSync(path.join(out,'files',f));
console.log(`Mise à jour ${seq} prête pour les apps ≥ ${nativeMin} : ${needed.length} fichiers à télécharger (${(bytes/1e6).toFixed(1)} Mo). Committer app-update/ puis pousser sur main.`);
