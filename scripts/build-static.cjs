/* An explicit public bundle: never deploy credentials, Git metadata or server source. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'.netlify/publish');
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
for(const item of fs.readdirSync(root,{withFileTypes:true})){
  if(item.isFile()&&(/\.(html|css|js|ico)$/.test(item.name)||item.name==='.nojekyll'))fs.copyFileSync(path.join(root,item.name),path.join(dest,item.name));
}
fs.cpSync(path.join(root,'assets'),path.join(dest,'assets'),{recursive:true});
fs.cpSync(path.join(root,'vendor/maplibre'),path.join(dest,'vendor/maplibre'),{recursive:true});
console.log('Static application ready in .netlify/publish');
