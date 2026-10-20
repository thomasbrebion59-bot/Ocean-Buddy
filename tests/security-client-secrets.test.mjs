import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

// Everything here runs in the browser or the native WebView: no server secret may ever land in it.
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const SECRET=[/service_role/i,/\bsb_secret_/,/\bsk-[A-Za-z0-9_-]{10,}/,/-----BEGIN [A-Z ]*KEY-----/,/\bAIza[0-9A-Za-z_-]{20,}/,/\b(?:OPENAI_API_KEY|COMMUNITY_SUPABASE_SECRET_KEY|COMMUNITY_SUPABASE_SERVICE_ROLE_KEY)\b/,/\bprocess\.env\b/,/\bNetlify\.env\b/,/\bnfp_[A-Za-z0-9]{12,}/,/\bgh[pousr]_[A-Za-z0-9]{12,}/];
const jwtRole=text=>[...text.matchAll(/\beyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]+/g)].map(m=>{try{return JSON.parse(Buffer.from(m[1],'base64url').toString()).role||''}catch(_){return ''}});
function browserFiles(){
  const files=readdirSync(root).filter(name=>/\.(?:js|html)$/.test(name)).map(name=>join(root,name));
  const walk=dir=>{for(const name of readdirSync(dir)){const path=join(dir,name),info=statSync(path);if(info.isDirectory())walk(path);else if(/\.(?:js|mjs|html|json)$/.test(name))files.push(path);}};
  for(const dir of ['mobile/www','app-update','ios/App/App/public','android/app/src/main/assets/public'])if(existsSync(join(root,dir)))walk(join(root,dir));
  return files;
}

test('no server secret, secret variable name or service-role JWT in files run by the browser',()=>{
  const offenders=[];
  for(const path of browserFiles()){
    const text=readFileSync(path,'utf8');
    for(const pattern of SECRET)if(pattern.test(text))offenders.push(path.slice(root.length+1)+' '+pattern);
    if(jwtRole(text).some(role=>role&&role!=='anon'))offenders.push(path.slice(root.length+1)+' JWT non anon');
  }
  assert.deepEqual(offenders,[]);
});

test('public client configs only carry public values',()=>{
  const window={};
  for(const name of ['community-config.js','poulpy-config.js'])vm.runInNewContext(readFileSync(join(root,name),'utf8'),{window});
  const community=window.OCEAN_COMMUNITY_CONFIG,poulpy=window.POULPY_CONFIG;
  assert.deepEqual(Object.keys(community).sort(),['endpoint','publishableKey','supabaseUrl']);
  // Poulpy answers on the device: its config carries no service address at all.
  assert.deepEqual(Object.keys(poulpy),['endpoint']);assert.equal(poulpy.endpoint,'');
  // A publishable key may be filled in later; it must then be the public kind, never the secret one.
  assert.ok(community.publishableKey===''||/^sb_publishable_/.test(community.publishableKey)||jwtRole(community.publishableKey).every(role=>role==='anon'));
  // No community server today: an empty endpoint keeps the app on its "coming soon" state; a future one must be HTTPS.
  assert.ok(community.endpoint===''||/^https:\/\//.test(community.endpoint));
});
