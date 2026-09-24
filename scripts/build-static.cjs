/* An explicit public bundle: never deploy credentials, Git metadata or server source. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'.netlify/publish');
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
const declaredScripts=new Set([...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^\"]+)"[^>]*><\/script>/g)].map(match=>match[1].split('?')[0]).filter(src=>!src.includes('/')&&src.endsWith('.js')));
for(const item of fs.readdirSync(root,{withFileTypes:true})){
  if(item.isFile()&&(/\.(html|css|ico)$/.test(item.name)||declaredScripts.has(item.name)||['.nojekyll','sw.js','manifest.webmanifest'].includes(item.name)))fs.copyFileSync(path.join(root,item.name),path.join(dest,item.name));
}
fs.cpSync(path.join(root,'assets'),path.join(dest,'assets'),{recursive:true});
fs.cpSync(path.join(root,'vendor/maplibre'),path.join(dest,'vendor/maplibre'),{recursive:true});
console.log('Static application ready in .netlify/publish');
