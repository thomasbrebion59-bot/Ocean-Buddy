import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';

// Tests must never reach a real Supabase project: every server handler gets an explicit env, the
// community handler a fake fetcher (Poulpy calls no outside service), and no test reads the developer's environment.
const here=dirname(fileURLToPath(import.meta.url)),self=basename(fileURLToPath(import.meta.url));
const files=readdirSync(here).filter(name=>/\.test\.m?js$/.test(name)&&name!==self).map(name=>[name,readFileSync(join(here,name),'utf8')]);

test('every handler built in a test receives an explicit env, and the community one a fake fetcher',()=>{
  const missing=[];
  for(const [name,text] of files)for(const m of text.matchAll(/create(Poulpy|Community)Handler\(([^)]*)/g)){
    const args=text.slice(m.index,m.index+600);
    if(!/\benv\s*[:,}]/.test(args)||(m[1]==='Community'&&!/\bfetcher\s*[:,}]/.test(args)))missing.push(name+': '+m[0].slice(0,80));
  }
  assert.deepEqual(missing,[]);
});

test('no test reads process.env or targets a real Supabase or Netlify host',()=>{
  for(const [name,text] of files){
    assert.doesNotMatch(text,/process\.env/,name);
    for(const host of text.match(/https:\/\/[a-z0-9.-]+\.(?:supabase\.co|netlify\.app)/gi)||[])assert.match(host,/\/\/example\./,name+' '+host);
  }
});
