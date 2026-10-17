import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// Access model: clients never query tables directly (only Supabase Auth with the public key);
// the Netlify function uses the service key. So every table must be closed to anon/authenticated:
// RLS on, privileges revoked, and no policy that opens rows (a policy would only matter if grants came back).
const dir=join(dirname(fileURLToPath(import.meta.url)),'..','supabase','migrations');
const sql=readdirSync(dir).filter(name=>name.endsWith('.sql')).sort().map(name=>readFileSync(join(dir,name),'utf8').replace(/--[^\n]*/g,'')).join('\n').toLowerCase();
const tables=[...sql.matchAll(/create table(?: if not exists)?\s+(?:public\.)?([a-z_]+)/g)].map(m=>m[1]);

test('every migrated table has row level security enabled',()=>{
  assert.ok(tables.length>=5);
  for(const table of tables)assert.match(sql,new RegExp('alter table\\s+(?:public\\.)?'+table+'\\s+enable row level security'),table);
});

test('every table is revoked from anon and authenticated, and never granted back to them',()=>{
  const revoked=[...sql.matchAll(/revoke all on ([^;]+?) from ([^;]+);/g)].filter(m=>/\banon\b/.test(m[2])&&/\bauthenticated\b/.test(m[2])).flatMap(m=>m[1].split(',').map(t=>t.trim().replace(/^public\./,'')));
  for(const table of tables)assert.ok(revoked.includes(table),table+' reste accessible à anon/authenticated');
  assert.doesNotMatch(sql,/grant [^;]+ to [^;]*\b(anon|authenticated|public)\b/);
});

test('no permissive policy and no security definer function exposed to clients',()=>{
  assert.doesNotMatch(sql,/using\s*\(\s*true\s*\)/);
  assert.doesNotMatch(sql,/with check\s*\(\s*true\s*\)/);
  // Any future policy must tie rows to the caller.
  for(const m of sql.matchAll(/create policy[^;]+;/g))assert.match(m[0],/auth\.uid\(\)/,m[0]);
  assert.doesNotMatch(sql,/security definer/);
});
