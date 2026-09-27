/* Accueil et fiches : portes d’entrée vers le « Voyage dans le spot ». */
(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byId=id=>(typeof SPOTS!=='undefined'?SPOTS:[]).find(s=>s.id===id);
  const photo=(id,w)=>(typeof spotPhotoUrl==='function'&&spotPhotoUrl(id,w))||'assets/photos/hero.jpg';
  const orbit='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><ellipse cx="12" cy="12" rx="9.5" ry="4"/><path d="M12 3.5v17"/></svg>';
  const play='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
  const ICONIC=['hanauma','navagio','borabora','teahupoo','rajaampat','nazare','anse_source','luckybay','whitehaven','donnant','uluwatu','moorea','comino','sarakiniko','bigbay','calodesmoro'];

  const sphere=id=>(window.OCEAN_PANORAMAS?.[id]||[]).some(p=>p.mode==='sphere');
  function picks(){
    const panos=window.OCEAN_PANORAMAS||{};
    const list=ICONIC.map(byId).filter(s=>s&&photo(s.id,720));
    const has=s=>panos[s.id]?.length,withPano=list.filter(has),rest=list.filter(s=>!has(s));
    return [...withPano,...rest].slice(0,10);
  }
  function renderDive(){
    const home=$('#home');if(!home)return;
    let host=$('#obDive');
    if(!host){host=document.createElement('section');host.id='obDive';host.className='ob-dive';host.setAttribute('aria-labelledby','obDiveTitle');
      const anchor=$('#oceanHub')||home.querySelector('.home-intro');anchor?anchor.after(host):home.prepend(host);
      host.addEventListener('click',e=>{const b=e.target.closest('[data-voyage]');if(!b)return;const s=byId(b.dataset.voyage);if(s)window.OceanVoyage?.open(s);});}
    const panos=window.OCEAN_PANORAMAS||{};
    const total=(typeof SPOTS!=='undefined'?SPOTS.length:0);
    host.innerHTML=`<div class="ob-dive-head"><div><small>Nouveau · Voyage dans le spot</small><h2 id="obDiveTitle">Pars en <span>immersion.</span></h2><p>Plein écran, son des vagues, vues à 360° et balade autour du spot. ${total} destinations t’attendent.</p></div></div>
      <div class="ob-dive-track">${picks().map((s,i)=>`<button type="button" class="ob-story${i===0?' is-lead':''}" data-voyage="${esc(s.id)}" aria-label="Voyage immersif : ${esc(s.name)}"><img src="${esc(photo(s.id,i===0?1280:720))}" alt="" loading="lazy" decoding="async"><span class="ob-story-ring"><i>${sphere(s.id)?orbit:play}</i>${sphere(s.id)?'360°':panos[s.id]?.length?'PANORAMA':'IMMERSION'}</span><span class="ob-story-txt"><small>${esc(s.loc)}</small><b>${esc(s.name.split(' — ')[0])}</b></span></button>`).join('')}</div>`;
  }

  /* Bandeau d’entrée dans chaque fiche. */
  function banner(s){
    const detail=$('#detail .detail-body');if(!detail||!s)return;
    let b=$('#obVoyageBanner');
    if(!b){b=document.createElement('button');b.type='button';b.id='obVoyageBanner';b.className='ob-voyage-banner';
      const anchor=$('#dTabs');anchor?anchor.before(b):detail.prepend(b);
      b.addEventListener('click',()=>{const cur=byId(b.dataset.spot);if(cur)window.OceanVoyage?.open(cur);});}
    const pano=sphere(s.id),wide=(window.OCEAN_PANORAMAS?.[s.id]||[]).length;
    b.dataset.spot=s.id;b.style.setProperty('--ob-cover',`url("${photo(s.id,1280)}")`);
    b.innerHTML=`<span><small>VOYAGE DANS LE SPOT${pano?' · 360°':''}</small><b>Vis ${esc(s.name.split(' — ')[0])}</b><em>${pano?'Vue à 360°, scènes animées et balade autour du spot.':wide?'Panoramas, scènes animées et balade autour du spot.':'Scènes animées, son des vagues et balade autour du spot.'}</em></span><span class="go" aria-hidden="true">${play}</span>`;
  }

  /* Ordre de l’accueil : héros, immersion, cockpit, puis le reste. */
  function arrange(){
    const intro=$('#home .home-intro'),dive=$('#obDive'),hub=$('#oceanHub');
    if(intro&&dive&&intro.nextElementSibling!==dive)intro.after(dive);
    if(dive&&hub&&dive.nextElementSibling!==hub)dive.after(hub);
  }
  function init(){
    renderDive();arrange();addEventListener('load',arrange,{once:true});setTimeout(arrange,1500);
    const original=window.openSpot;
    if(typeof original==='function'&&!original.__voyage){
      const wrapped=function(id){const r=original.apply(this,arguments);try{banner(byId(id)||currentSpotObject());}catch(_){}return r;};
      wrapped.__voyage=true;window.openSpot=wrapped;
    }
  }
  function currentSpotObject(){return typeof currentSpot!=='undefined'?byId(currentSpot):null;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.OceanHome={refresh:renderDive};
})();
