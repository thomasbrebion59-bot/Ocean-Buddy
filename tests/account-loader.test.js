/* Compte et sauvegarde : drapeau désactivé par défaut, chargement après la levée du rideau, aucune écriture sur l'accueil. */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {read,fnSource}=require('./src-extract.cjs');

const privacy=read('privacy.js');
const gate=(()=>{const ctx=vm.createContext({});vm.runInContext(fnSource(privacy,'accountEnabled'),ctx);return ctx.accountEnabled;})();
const mem=(init={})=>{const m=new Map(Object.entries(init));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),m};};
const loc=u=>{const x=new URL(u);return {protocol:x.protocol,hostname:x.hostname,search:x.search};};

test('le drapeau du compte est désactivé par défaut',()=>{
  assert.match(privacy,/const ACCOUNT=\{enabled:false,hosts:\['oceanbuddy\.app'\]\};/);
  const off={enabled:false,hosts:['oceanbuddy.app']};
  assert.equal(gate(off,loc('https://oceanbuddy.app/'),mem(),undefined),false);
  assert.equal(gate(off,loc('http://localhost:8080/'),mem(),undefined),false,'check:boot et le site local restent inchangés');
});

test('activé : seulement sur oceanbuddy.app en https (jamais sur les copies de secours)',()=>{
  const on={enabled:true,hosts:['oceanbuddy.app']};
  assert.equal(gate(on,loc('https://oceanbuddy.app/'),mem(),undefined),true);
  for(const u of ['https://ocean-buddy.pages.dev/','https://thomasbrebion59-bot.github.io/Ocean-Buddy/','http://oceanbuddy.app/','https://localhost/'])
    assert.equal(gate(on,loc(u),mem(),undefined),false,u);
});

test('essai local : ?compte=essai sur localhost seulement, mémorisé sur cet appareil',()=>{
  const off={enabled:false,hosts:['oceanbuddy.app']},s=mem();
  assert.equal(gate(off,loc('http://localhost:8788/?compte=essai'),s,undefined),true);
  assert.equal(gate(off,loc('http://localhost:8788/'),s,undefined),true);
  assert.equal(gate(off,loc('http://127.0.0.1:8788/'),mem(),undefined),false);
  assert.equal(gate(off,loc('https://oceanbuddy.app/?compte=essai'),mem(),undefined),false);
});

test('app native : jamais sans la capacité « account » (version 1.5.0), même avec le drapeau',()=>{
  const on={enabled:true,hosts:['oceanbuddy.app']};
  assert.equal(gate(on,loc('capacitor://localhost/'),mem({ob_account_dev:'1'}),{native:true}),false);
  assert.equal(gate(on,loc('capacitor://localhost/'),mem(),undefined),false);
  assert.equal(gate({enabled:false,hosts:[]},loc('http://localhost/'),mem({ob_account_dev:'1'}),{native:true,capabilities:{account:true}}),false);
  assert.equal(gate(on,loc('https://oceanbuddy.localhost/'),mem(),{native:true,capabilities:{account:true}}),true);
});

test('chargement après la levée du rideau, jamais dans index.html',()=>{
  const html=read('index.html');
  assert.doesNotMatch(html,/account-sync/);
  const loader=privacy.slice(privacy.indexOf('const ACCOUNT='));
  assert.match(loader,/OceanBoot\.after\(later\)/);
  assert.match(loader,/addEventListener\('ocean:home-ready',later,\{once:true\}\)/);
});

test('le module du compte n’écrit jamais sur l’accueil ni la barre d’onglets et ne garde aucun jeton',()=>{
  const src=read('account-sync.js');
  for(const bad of [/getElementById\('home/,/querySelector\('#home/,/\.nav\b/,/\btabbar\b/i,/insertAdjacentHTML/])assert.doesNotMatch(src,bad);
  for(const bad of [/access_token/,/refresh_token/,/supabase\.co/,/sb_publishable/,/apikey/i])assert.doesNotMatch(src,bad);
  /* Les clés d'activité ne sont écrites que par le modèle (formats existants), puis l'app est rechargée. */
  assert.doesNotMatch(src,/localStorage\.setItem\(M\.KEYS|localStorage\.setItem\('oceanbuddy_(v1|trips)/);
  assert.match(src,/M\.apply\(localStorage,m\.local\);[\s\S]{0,300}location\.reload\(\)/);
  /* Tout ce qui s'affiche hors Réglages est en position fixe. */
  assert.match(src,/\.oba\{position:fixed/);assert.match(src,/\.oba-snack\{position:fixed/);
});

test('les fichiers du compte partent avec le site et reçoivent une empreinte de version',()=>{
  assert.match(read('scripts/build-static.cjs'),/'account-sync-model\.js','account-sync\.js'/);
  assert.match(read('scripts/version-assets.py'),/ACCOUNT_V/);
});
