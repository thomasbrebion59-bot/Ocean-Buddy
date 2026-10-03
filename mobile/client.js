import { Capacitor, CapacitorHttp } from '@capacitor/core';
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
  let timer;
  const result=await Promise.race([hydration,new Promise(resolve=>{timer=setTimeout(()=>resolve(null),5000);})]);
  clearTimeout(timer);
  if(result){ready=true;lastSnapshot=snapshot();}
  else hydration.then(({restored})=>{
    ready=true;lastSnapshot='';persist().catch(()=>{});
    if(restored)location.reload();
  });
  // All existing models retain their synchronous storage semantics. The native copy
  // follows writes, including removals, and is flushed before explicit app resets.
  for(const method of ['setItem','removeItem']){
    const original=Storage.prototype[method];
    Storage.prototype[method]=function(...args){const result=original.apply(this,args);if(this===localStorage&&owned(args[0]))persist().catch(()=>{});return result;};
  }
  document.documentElement.classList.add('native-app');
  StatusBar.setStyle({style:Style.Dark}).catch(()=>{});
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
        event.preventDefault();openExternal('https://thomasbrebion59-bot.github.io/Ocean-Buddy'+url.pathname+url.hash).catch(()=>window.toast?.('Le lien ne peut pas être ouvert pour le moment.'));
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
  const [latest,info]=await Promise.all([getJSON(UPDATE_BASE+'latest.json'),App.getInfo()]);
  if(!latest||!(Number(latest.seq)>BUNDLE.seq))return null;
  if(versionCmp(info.version,latest.native_min)<0)return {kind:'store'};
  if(latest.native_max&&versionCmp(info.version,latest.native_max)>0)return null;
  const version=String(latest.seq);
  let bundle=(await CapacitorUpdater.list()).bundles.find(b=>b.version===version&&['pending','success'].includes(b.status));
  if(!bundle){
    const manifest=await getJSON(UPDATE_BASE+latest.manifest);
    bundle=await CapacitorUpdater.download({url:UPDATE_BASE+latest.manifest,version,
      manifest:manifest.files.map(([file_name,file_hash])=>({file_name,file_hash,download_url:UPDATE_BASE+'files/'+file_hash}))});
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

window.OceanMobile={native,boot,persist,openExternal,shareJSON,appReady,bundle:BUNDLE,
  updates:{checkLive:checkLiveUpdate,applyLive:applyLiveUpdate,checkStore:checkStoreUpdate,openStore},
  getCurrentPosition:(success,failure,options)=>Geolocation.getCurrentPosition(options).then(success).catch(failure)};
