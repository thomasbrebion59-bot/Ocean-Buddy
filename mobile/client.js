import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Geolocation } from '@capacitor/geolocation';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';

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
  App.addListener('appStateChange',({isActive})=>{if(!isActive)persist().catch(()=>{});});
  App.addListener('backButton',()=>{
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
window.OceanMobile={native,boot,persist,openExternal,shareJSON,
  getCurrentPosition:(success,failure,options)=>Geolocation.getCurrentPosition(options).then(success).catch(failure)};
