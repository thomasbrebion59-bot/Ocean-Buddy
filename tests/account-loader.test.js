/* Compte et sauvegarde : drapeau désactivé par défaut, chargement après la levée du rideau, aucune écriture sur l'accueil. */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {read,fnSource}=require('./src-extract.cjs');

const privacy=read('privacy.js');
const gate=(()=>{const ctx=vm.createContext({});vm.runInContext(fnSource(privacy,'accountEnabled'),ctx);return ctx.accountEnabled;})();
const mem=(init={})=>{const m=new Map(Object.entries(init));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),m};};
const loc=u=>{const x=new URL(u);return {protocol:x.protocol,hostname:x.hostname,search:x.search};};

test('le compte est allumé uniquement pour oceanbuddy.app (mise en service du 5 nov. 2026)',()=>{
  assert.match(privacy,/const ACCOUNT=\{enabled:true,hosts:\['oceanbuddy\.app'\]\};/);
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

test('première ouverture : un seul écran « Crée ton compte » avec l’adresse e-mail, « Plus tard » bien visible, sans clavier d’office',()=>{
  const src=read('account-sync.js');
  const invite=src.slice(src.indexOf('    invite(){'),src.indexOf('    email(){'));
  assert.match(invite,/Crée ton compte/);assert.match(invite,/favoris, tes voyages et ton passeport sur tous tes appareils/);
  assert.match(invite,/\$\{emailField\(\)\}/);assert.match(invite,/class="oba-main">Recevoir mon code/);assert.match(invite,/class="oba-later">Plus tard/);
  assert.match(invite,/\{focus:false\}/,'pas de clavier qui surgit à la première ouverture');
  assert.match(invite,/oba-later'\)\.onclick=closeSheet/);
  /* Clavier e-mail, code à usage unique, zones tactiles de 44 px au moins. */
  assert.match(src,/id="obaEmail" class="oba-input" type="email" inputmode="email" autocomplete="email" autocapitalize="off"/);
  assert.match(src,/id="obaCode"[^>]*inputmode="numeric" autocomplete="one-time-code"/);
  for(const cls of ['oba-main','oba-later','oba-x','oba-link','oba-snack-go'])assert.match(src,new RegExp(`\\.${cls}(,[^{]*)?\\{[^}]*(min-height:(4[4-9]|5\\d)px|height:44px)`),cls);
  /* Proposée une seule fois (marque « invite »), après l'onboarding. */
  assert.match(src,/patch\(\{invite:\{at:Date\.now\(\)\}\}\);openSheet\('invite'\)/);
  assert.match(src,/if\(st\.linked\|\|st\.invite\)return;/);
});

test('un seul rappel discret plus tard (3e favori ou premier voyage), jamais en boucle, jamais avant l’invitation',()=>{
  const src=read('account-sync.js');
  const w=src.slice(src.indexOf('function watchReminder'),src.indexOf('function snack('));
  assert.match(w,/if\(load\(\)\.remindTrip\)return;/);assert.match(w,/if\(!st\.invite\)return;/);
  assert.match(w,/const calm=\(\)=>!\(overlayOpen\(\)\|\|typing\(\)\|\|document\.querySelector\('#toast\.show'\)\);/);
  assert.match(w,/f>=3&&f>start\.favs\?'fav'/);assert.match(w,/stop\(\);patch\(\{remindTrip:Date\.now\(\)\}\);snack\(why\)/);
  assert.doesNotMatch(w,/setInterval/,'aucune lecture périodique (voir tests/account-reminder.test.js)');
  assert.doesNotMatch(src,/watchFirstTrip/);
});

test('app iPhone : le compte passe par OceanMobile.account (Trousseau), jamais par fetch ni par un jeton visible',()=>{
  const src=read('account-sync.js');
  assert.match(src,/NATIVE=!!\(MOB&&MOB\.native&&MOB\.capabilities&&MOB\.capabilities\.account===true&&MOB\.account/);
  assert.match(src,/if\(NATIVE\)return MOB\.account\.request\(path,\{method,body\}\);/);
  assert.match(src,/if\(NATIVE&&typeof MOB\.shareJSON==='function'\)\{await MOB\.shareJSON\('ocean-buddy-export',data\)/);
  /* « Effacer toutes mes données sur cet appareil » déconnecte aussi le compte (cookies ou Trousseau). */
  assert.match(read('privacy.js'),/if\(window\.OceanAccount\?\.forget\)await OceanAccount\.forget\(\);else if\(window\.OceanMobile\?\.account\)await OceanMobile\.account\.request\('\/auth\/logout'/);
  assert.match(src,/then\(\(\)=>true,x=>x&&x\.status===401\?false:null\)/,'une coupure réseau ne délie pas le compte');
  /* Journaux natifs de Capacitor coupés : « TO JS » recopierait le début des réponses (jetons). */
  assert.equal(JSON.parse(read('capacitor.config.json')).loggingBehavior,'none');
  const client=read('mobile/client.js');
  assert.match(client,/Capacitor\.isPluginAvailable\('OceanAccount'\)\?registerPlugin\('OceanAccount'\)/);
  assert.match(client,/const capabilities=Object\.freeze\(\{account:!!accountPlugin\}\)/);
  assert.doesNotMatch(client,/localStorage\.setItem\([^)]*(access|refresh|token)/i);
  assert.doesNotMatch(client,/Preferences\.set\(\{key:[^}]*(token|session)/i);
  assert.doesNotMatch(client,/console\.(log|info|warn|error)\([^)]*(session|token)/i);
});

test('plugin Swift OceanAccount : Trousseau « cet appareil seulement », effacé à la réinstallation, enregistré et compilé',()=>{
  const swift=read('ios/App/App/OceanAccount.swift');
  assert.match(swift,/kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly/);
  assert.match(swift,/public let jsName = "OceanAccount"/);
  for(const m of ['getTokens','setTokens','clearTokens'])assert.match(swift,new RegExp(`CAPPluginMethod\\(name: "${m}"`));
  assert.doesNotMatch(swift,/CAPPluginMethod\(name: "load"/,'load() est réservé au cycle de vie du plugin');
  assert.match(swift,/override public func load\(\)[\s\S]{0,400}installMarker[\s\S]{0,300}deleteAll\(\)/);
  assert.doesNotMatch(swift,/UserDefaults[^\n]*(access|refresh)/,'aucun jeton dans les préférences');
  assert.doesNotMatch(swift,/\b(print|NSLog|os_log|Logger)\b/,'aucun journal');
  assert.doesNotMatch(swift,/URLSession|URLRequest/,'aucun appel réseau dans le plugin');
  assert.match(read('ios/App/App/OceanGlass.swift'),/bridge\?\.registerPluginInstance\(OceanAccountPlugin\(\)\)/);
  const pbx=read('ios/App/App.xcodeproj/project.pbxproj');
  assert.match(pbx,/OceanAccount\.swift in Sources \*\/ = \{isa = PBXBuildFile/);
  assert.equal((pbx.match(/OceanAccount\.swift in Sources/g)||[]).length,2,'déclaré et compilé');
});

test('paquet mobile : API du compte en https sur oceanbuddy.app ; l’essai local en http est refusé ailleurs que sur localhost',()=>{
  const b=read('scripts/build-mobile.cjs');
  assert.match(b,/const accountApi=process\.env\.OB_ACCOUNT_API\|\|site\.OB_SITE_BASE\+'api\/v1';/);
  assert.match(b,/__OB_ACCOUNT_API__:JSON\.stringify\(accountApi\)/);
  assert.match(b,/accountApi:'essai-local'/);
  assert.equal(require('../scripts/site-base.cjs').OB_SITE_BASE,'https://oceanbuddy.app/');
});

/* « Bon retour, … » ne recouvre jamais le texte d’une fenêtre ouverte : après la connexion au compte, la synchronisation
   recharge l’app et account-sync.js (chargé après la levée du rideau) rouvre « C’est sauvegardé » ; le message attend. */
test('bon retour : attend la fenêtre « C’est sauvegardé » annoncée puis ouverte, et s’affiche à sa fermeture', () => {
  const app = read('app.js'), a = app.indexOf('const overlayOpen=()=>'), b = app.indexOf('const welcome=()=>setTimeout(hello,700);');
  assert.ok(a > 0 && b > a, 'bloc du message de retour');
  let now = 0, sheet = false, after = '{"first":true}';
  const timers = [], shown = [];
  const toastEl = { textContent: '', classList: { s: new Set(), contains(c) { return this.s.has(c); }, remove(c) { this.s.delete(c); } } };
  const ctx = vm.createContext({
    userName: 'Explorateur',
    sessionStorage: { getItem: k => (k === 'ob_account_after' ? after : null) },
    document: { querySelector: s => (sheet && s.includes('.oba') ? {} : null), getElementById: () => toastEl },
    setTimeout: (f, ms) => timers.push({ at: now + ms, f }),
    toast: m => { shown.push([now, m, sheet]); toastEl.textContent = '🐙 ' + m; toastEl.classList.s.add('show'); }
  });
  vm.runInContext(app.slice(a, b) + 'this.hello=hello;', ctx);
  const run = ms => { const end = now + ms; for (;;) { const t = timers.filter(x => x.at <= end).sort((x, y) => x.at - y.at)[0]; if (!t) break; timers.splice(timers.indexOf(t), 1); now = t.at; t.f(); } now = end; };
  ctx.hello();
  run(1500); assert.equal(shown.length, 0, 'rechargement après synchronisation : la fenêtre va s’ouvrir, le message attend');
  after = null; sheet = true;
  run(5000); assert.equal(shown.length, 0, '« C’est sauvegardé » ouvert : rien par-dessus');
  sheet = false;
  run(600); assert.equal(shown.length, 1, 'fenêtre fermée : le message arrive');
  assert.deepEqual(shown[0].slice(1), ['Bon retour, Explorateur ! L’océan t’attendait.', false]);
  /* Une fenêtre qui s’ouvre pendant le message (invitation au compte…) le fait disparaître. */
  sheet = true; run(400);
  assert.equal(toastEl.classList.contains('show'), false);
});
