import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Geolocation } from '@capacitor/geolocation';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

const native=Capacitor.isNativePlatform(), backupKey='oceanbuddy_native_backup_v1';
let ready=false, pending=Promise.resolve(), lastSnapshot='';
const owned=key=>typeof key==='string'&&key.startsWith('oceanbuddy_');
function restoreBackup(value){
  if(!value)return false;
  const data=JSON.parse(value);
  if(!data||typeof data!=='object'||Array.isArray(data))return false;
  let restored=false;
  for(const [key,val] of Object.entries(data))if(owned(key)&&typeof val==='string'&&localStorage.getItem(key)===null){localStorage.setItem(key,val);restored=true;}
  return restored;
}
function snapshot(){const data={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(owned(key))data[key]=localStorage.getItem(key);}return JSON.stringify(data);}
function persist(){
  if(!native||!ready)return pending;
  const value=snapshot();if(value===lastSnapshot)return pending;lastSnapshot=value;
  pending=pending.catch(()=>{}).then(()=>Preferences.set({key:backupKey,value})).catch(error=>{lastSnapshot='';throw error;});
  return pending;
}
async function boot(){
  if(!native)return;
  // A stalled native bridge must not keep the whole interface behind the splash.
  // Until the backup answers, local data stays usable and native writes stay off.
  const hydration=Preferences.get({key:backupKey}).then(({value})=>({restored:restoreBackup(value)})).catch(()=>({restored:false}));
  /* Profil déjà là (sport, niveau, onboarding : oceanbuddy_v1) : l’app démarre sans attendre le pont natif, le rideau
     n’est jamais retardé. La copie native ne sert qu’à remplir les clés manquantes (jamais d’écrasement ni de rechargement).
     Stockage du WebView vidé (iOS peut le perdre) : on attend la copie, pour que l’app relise le choix et ne repose
     pas les questions de l’onboarding. */
  let local=false;try{local=localStorage.getItem('oceanbuddy_v1')!==null;}catch(_){}
  let timer;
  const result=local?null:await Promise.race([hydration,new Promise(resolve=>{timer=setTimeout(()=>resolve(null),5000);})]);
  clearTimeout(timer);
  if(result){ready=true;lastSnapshot=snapshot();}
  else hydration.then(({restored})=>{
    ready=true;lastSnapshot='';persist().catch(()=>{});
    if(restored&&!local)location.reload();
  });
  // All existing models retain their synchronous storage semantics. The native copy
  // follows writes, including removals, and is flushed before explicit app resets.
  for(const method of ['setItem','removeItem']){
    const original=Storage.prototype[method];
    Storage.prototype[method]=function(...args){const result=original.apply(this,args);if(this===localStorage&&owned(args[0]))persist().catch(()=>{});return result;};
  }
  document.documentElement.classList.add('native-app');
  /* Fond crème par défaut : barre d’état à texte foncé (Style.Light du plugin, à confirmer sur simulateur). */
  StatusBar.setStyle({style:Style.Light}).catch(()=>{});
  /* L’interface 1.3 passe sous la barre d’état : textes clairs sur la Terre et les photos, foncés sur les pages claires. */
  let barStyle='';
  window.addEventListener?.('ocean:statusbar',event=>{const next=event.detail==='light'?Style.Light:Style.Dark;if(next===barStyle)return;barStyle=next;StatusBar.setStyle({style:next}).catch(()=>{});});
  window.OceanShell?.statusbar?.();
  App.addListener('appStateChange',({isActive})=>{if(!isActive)persist().catch(()=>{});});
  App.addListener('backButton',()=>{
    if(window.OceanShell?.closeTopOverlay?.())return;
    const dialog=document.querySelector('dialog[open]');
    if(dialog){dialog.close();return;}
    if(document.querySelector('#chatSheet.open')){window.closeChat?.();return;}
    if(document.querySelector('#settingsModal.open')){window.closeSettings?.();return;}
    if(history.state?.index>0){window.OceanNavigation?.back();return;}
    App.minimizeApp();
  });
  document.addEventListener('click',event=>{
    const anchor=event.target.closest('a[href]');if(!anchor||anchor.download)return;
    const url=new URL(anchor.href,location.href);
    if(url.origin===location.origin&&anchor.target==='_blank'){
      // A system browser cannot open the private capacitor:// origin. Use the
      // matching public document for credits, support and the privacy policy.
      if(['/privacy.html','/support.html','/photos.html','/community-rules.html'].includes(url.pathname)){
        event.preventDefault();openExternal(SITE_BASE+url.pathname.slice(1)+url.hash).catch(()=>window.toast?.('Le lien ne peut pas être ouvert pour le moment.'));
      }
    }else if(['https:','http:'].includes(url.protocol)&&url.origin!==location.origin){event.preventDefault();openExternal(url.href).catch(()=>window.toast?.('Le lien ne peut pas être ouvert pour le moment.'));}
  });
}
async function openExternal(url){
  const parsed=new URL(url);if(!['https:','http:'].includes(parsed.protocol))return;
  if(native)await Browser.open({url:parsed.href,toolbarColor:'#174bd3'});else window.open(parsed.href,'_blank','noopener');
}
async function shareJSON(name,data){
  const safe=(name.replace(/[^a-zA-Z0-9À-ÿ -]/g,'').slice(0,60)||'ocean-buddy')+'.json';
  const file=await Filesystem.writeFile({path:'exports/'+Date.now()+'-'+safe,data:JSON.stringify(data,null,2),directory:Directory.Cache,encoding:Encoding.UTF8,recursive:true});
  try{await Share.share({title:name,files:[file.uri],dialogTitle:'Partager ton voyage Ocean Buddy'});}catch(_){/* Closing the native share sheet keeps the trip intact. */}
}

/* Mises à jour. Le contenu web (écrans, spots, styles) arrive directement dans l’app :
 * seuls les fichiers modifiés sont téléchargés depuis GitHub Pages, vérifiés par SHA-256,
 * puis appliqués quand la personne accepte (ou au prochain lancement). Les changements
 * natifs passent toujours par l’App Store : l’app propose alors d’ouvrir sa fiche. */
const BUNDLE=__OB_BUNDLE__, UPDATE_BASE=__OB_UPDATE_BASE__;
/* Secours des mises à jour directes (GitHub Pages) et adresse publique du site : voir scripts/site-base.cjs. */
const UPDATE_FALLBACK=typeof __OB_UPDATE_FALLBACK__==='string'?__OB_UPDATE_FALLBACK__:'';
const SITE_BASE=typeof __OB_SITE_BASE__==='string'?__OB_SITE_BASE__:'https://oceanbuddy.app/';
const APP_STORE_ID='6811870966', STORE_URL='itms-apps://apps.apple.com/app/id'+APP_STORE_ID;
const versionCmp=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d)return Math.sign(d);}return 0;};
let liveBundle=null;
async function appReady(){if(native)await CapacitorUpdater.notifyAppReady().catch(()=>{});}
// Requêtes natives : pas de cache du WebView ni de dépendance aux en-têtes CORS de l’hébergeur.
async function getJSON(url){
  const r=await CapacitorHttp.get({url:url+(url.includes('?')?'&':'?')+'t='+Date.now(),headers:{'Cache-Control':'no-cache'}});
  if(r.status<200||r.status>=300)throw Error('HTTP '+r.status+' '+url);
  return typeof r.data==='string'?JSON.parse(r.data):r.data;
}
async function checkLiveUpdate(){
  if(!native)return null;
  if(liveBundle)return liveBundle;
  // Adresse principale d'abord ; si elle ne répond pas, GitHub Pages (publié aux deux endroits).
  let base=UPDATE_BASE,latest;
  try{latest=await getJSON(base+'latest.json');}catch(error){if(!UPDATE_FALLBACK)throw error;base=UPDATE_FALLBACK;latest=await getJSON(base+'latest.json');}
  const info=await App.getInfo();
  if(!latest||!(Number(latest.seq)>BUNDLE.seq))return null;
  if(versionCmp(info.version,latest.native_min)<0)return {kind:'store'};
  if(latest.native_max&&versionCmp(info.version,latest.native_max)>0)return null;
  const version=String(latest.seq);
  let bundle=(await CapacitorUpdater.list()).bundles.find(b=>b.version===version&&['pending','success'].includes(b.status));
  if(!bundle){
    const manifest=await getJSON(base+latest.manifest);
    bundle=await CapacitorUpdater.download({url:base+latest.manifest,version,
      manifest:manifest.files.map(([file_name,file_hash])=>({file_name,file_hash,download_url:base+'files/'+file_hash}))});
  }
  // Sans réponse de la personne, la nouvelle version s’installe dès que l’app passe en arrière-plan.
  await CapacitorUpdater.next({id:bundle.id});
  liveBundle={kind:'live',id:bundle.id,seq:latest.seq};
  return liveBundle;
}
async function applyLiveUpdate(){if(liveBundle){await persist().catch(()=>{});await CapacitorUpdater.set({id:liveBundle.id});}}
async function checkStoreUpdate(){
  if(Capacitor.getPlatform()!=='ios')return null;
  const info=await App.getInfo(), region=(navigator.language.split('-')[1]||'fr').toLowerCase();
  for(const country of [region,'fr']){
    const store=(await getJSON(`https://itunes.apple.com/lookup?id=${APP_STORE_ID}&country=${country}`))?.results?.[0]?.version;
    if(store)return versionCmp(store,info.version)>0?{kind:'store',version:store}:null;
  }
  return null;
}
const openStore=()=>{location.href=STORE_URL;};

/* Compte gratuit (version 1.5.0 et plus). Le plugin Swift OceanAccount garde les jetons dans le Trousseau iOS ;
 * sans lui (apps 1.4.x qui reçoivent ce même code par mise à jour directe), capabilities.account reste faux et
 * l'interface du compte ne se charge pas (privacy.js). Requêtes natives (CapacitorHttp) : ni Origin ni cookie,
 * le Worker rend les jetons dans le corps ; ils passent ici, vont au Trousseau et ne sont JAMAIS rendus à la page,
 * ni écrits dans localStorage, les Préférences ou un journal. account-sync.js ne voit que {ok:true}. */
const ACCOUNT_API=typeof __OB_ACCOUNT_API__==='string'?__OB_ACCOUNT_API__:SITE_BASE+'api/v1';
const accountPlugin=native&&typeof Capacitor.isPluginAvailable==='function'&&Capacitor.isPluginAvailable('OceanAccount')?registerPlugin('OceanAccount'):null;
const ACCOUNT_PATH=/^\/(?:health|me|consent|sync\/(?:pull|push)|account(?:\/export)?|auth\/(?:otp\/request|otp\/verify|refresh|logout))$/;
let session=null,sessionRead=null;
const accountError=(code,status)=>{const e=Error(code);e.code=code;e.status=status;return e;};
function readSession(){
  sessionRead??=accountPlugin.getTokens().then(t=>{session=t&&typeof t.access==='string'&&typeof t.refresh==='string'?{access:t.access,refresh:t.refresh}:null;},()=>{session=null;sessionRead=null;});
  return sessionRead.then(()=>session);
}
async function keepSession(t){await accountPlugin.setTokens({access:t.access_token,refresh:t.refresh_token});session={access:t.access_token,refresh:t.refresh_token};sessionRead=Promise.resolve();}
async function forgetSession(){session=null;sessionRead=Promise.resolve();try{await accountPlugin.clearTokens();}catch(_){}}
async function accountRequest(path,{method='GET',body}={}){
  if(!accountPlugin)throw accountError('unavailable',0);
  if(!ACCOUNT_PATH.test(path))throw accountError('not_found',404);
  const login=path==='/auth/otp/verify'||path==='/auth/refresh',s=await readSession();
  let data=body;
  if(path==='/auth/otp/verify')data={...(body||{}),client:'native'};
  if(path==='/auth/refresh'){if(!s)throw accountError('unauthenticated',401);data={client:'native',refresh_token:s.refresh};}
  const headers={'Content-Type':'application/json',Accept:'application/json'};
  if(s&&!login&&!path.startsWith('/auth/otp/'))headers.Authorization='Bearer '+s.access;
  let r;
  try{r=await CapacitorHttp.request({url:ACCOUNT_API+path,method,headers,data,responseType:'json',connectTimeout:15000,readTimeout:30000});}
  catch(_){if(path==='/auth/logout')await forgetSession();throw accountError('network',0);}
  let out=r.data;if(typeof out==='string'){try{out=out?JSON.parse(out):null;}catch(_){out=null;}}
  const ok=r.status>=200&&r.status<300;
  if(login&&ok){
    if(!out||typeof out.access_token!=='string'||typeof out.refresh_token!=='string')throw accountError('unavailable',502);
    try{await keepSession(out);}catch(_){throw accountError('keychain',500);}
    out={ok:true};
  }
  if((path==='/auth/refresh'&&r.status===401)||path==='/auth/logout'||(path==='/account'&&method==='DELETE'&&ok))await forgetSession();
  if(!ok)throw accountError(out&&typeof out.error==='string'?out.error:'http_'+r.status,r.status);
  return out;
}
const capabilities=Object.freeze({account:!!accountPlugin});

window.OceanMobile={native,boot,persist,openExternal,shareJSON,appReady,bundle:BUNDLE,capabilities,
  ...(accountPlugin?{account:Object.freeze({request:accountRequest})}:{}),
  updates:{checkLive:checkLiveUpdate,applyLive:applyLiveUpdate,checkStore:checkStoreUpdate,openStore},
  getCurrentPosition:(success,failure,options)=>Geolocation.getCurrentPosition(options).then(success).catch(failure)};
