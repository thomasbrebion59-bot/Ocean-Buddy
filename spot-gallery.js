/* Real locations, full-screen photography and explicit, accessible controls. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dialog=document.createElement('dialog');dialog.id='spotGallery';dialog.className='spot-gallery';dialog.setAttribute('aria-labelledby','galleryTitle');dialog.setAttribute('aria-describedby','galleryCaption');document.body.append(dialog);
  let list=[],index=0,spot=null,opener=null,whole=false,immersive=false;
  let audioContext=null,audioNodes=null,audioStarting=false,audioEpoch=0,commonsSearching=false,commonsMessage='';
  const commonsCache=new Map(),commonsPending=new Map();
  const photos=s=>window.OceanPhotos?.list(s.id,typeof detailAct==='function'?detailAct(s):undefined)||[];
  const caption=(p,s)=>p.caption||s.photoContext||s.name+' · '+s.loc;
  const label=(p,i)=>p.label||(p.view==='underwater'?'Sous la surface':i===0?'Le panorama':'Autre regard');
  const safeUrl=value=>/^https:\/\//i.test(String(value||''))?String(value):'';
  const soundAvailable=!!(window.AudioContext||window.webkitAudioContext);
  const plain=value=>{const doc=new DOMParser().parseFromString(String(value||''),'text/html');return (doc.body.textContent||'').replace(/\s+/g,' ').trim();};
  const hostUrl=(value,host)=>{try{const url=new URL(value);return url.protocol==='https:'&&url.hostname===host?url.href:'';}catch(_){return '';}};
  const reusableLicense=value=>/^CC BY(?:-SA)?(?:\s|$)/i.test(value)||/^CC0(?:\s|$)/i.test(value)||/^Public domain\b/i.test(value);
  async function commonsPhotos(s){
    const key=String(s.id);if(commonsCache.has(key))return commonsCache.get(key);if(commonsPending.has(key))return commonsPending.get(key);
    const job=(async()=>{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
      try{
        const queries=[`${s.name.split(' — ')[0]} ${s.loc.split(',')[0]}`,s.name.split(' — ')[0]];
        for(const query of [...new Set(queries)]){
        const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:query,gsrnamespace:'6',gsrlimit:'24',prop:'imageinfo',iiprop:'url|extmetadata|mime',iiurlwidth:'1280',iiextmetadatalanguage:'fr',iiextmetadatafilter:'LicenseShortName|LicenseUrl|Artist|Credit|Creator|ImageDescription',origin:'*',format:'json',formatversion:'2'});
        const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params,{signal:controller.signal});
        if(!response.ok)throw new Error('Commons HTTP '+response.status);
        const data=await response.json(),pages=Array.isArray(data?.query?.pages)?data.query.pages:Object.values(data?.query?.pages||{});
        const photos=pages.map(page=>{
          const info=page.imageinfo?.[0],meta=info?.extmetadata||{};if(!info)return null;
          const license=plain(meta.LicenseShortName?.value),licenseUrl=hostUrl(meta.LicenseUrl?.value,'creativecommons.org')||hostUrl(meta.LicenseUrl?.value,'commons.wikimedia.org');
          if(!reusableLicense(license))return null;
          const src=hostUrl(info.thumburl,'upload.wikimedia.org'),source=hostUrl(info.descriptionurl,'commons.wikimedia.org');
          if(!src||!source||!/^image\//i.test(info.thumbmime||info.mime||''))return null;
          const author=plain(meta.Artist?.value||meta.Credit?.value||meta.Creator?.value);
          if(/^CC BY/i.test(license)&&!author)return null;
          const description=plain(meta.ImageDescription?.value).slice(0,280),title=plain(page.title?.replace(/^File:/,'').replace(/_/g,' '));
          return {src,thumb:src,source,author:(author||'Domaine public · auteur non indiqué').slice(0,160),license,licenseUrl,commonsTitle:page.title,label:title||'Photo proposée',caption:(description||title||'Image proposée par Wikimedia Commons.')+' · lieu à confirmer',external:true};
        }).filter(Boolean);
        const unique=[...new Map(photos.map(photo=>[photo.commonsTitle,photo])).values()].slice(0,12);if(unique.length){commonsCache.set(key,unique);return unique;}
        }
        return [];
      }finally{clearTimeout(timer);}
    })().finally(()=>commonsPending.delete(key));
    commonsPending.set(key,job);return job;
  }
  const isPlaying=()=>!!audioContext&&audioContext.state==='running';
  function soundButton(){const b=dialog.querySelector('[data-gallery-sound]');if(!b)return;b.disabled=!soundAvailable;b.setAttribute('aria-pressed',String(isPlaying()));b.textContent=!soundAvailable?'Son indisponible':isPlaying()?'Couper le son':'Activer le son';}
  /* This quiet synthetic texture evokes the sea; it is never labelled as a recording of a location. */
  async function startSound(){
    if(!soundAvailable||audioContext||audioStarting||!dialog.open)return;
    audioStarting=true;
    const epoch=audioEpoch;
    const Context=window.AudioContext||window.webkitAudioContext;
    let context;
    try{
      context=new Context();
      const buffer=context.createBuffer(1,context.sampleRate*4,context.sampleRate),samples=buffer.getChannelData(0);
      let previous=0;
      for(let i=0;i<samples.length;i++){previous=(previous+(Math.random()*2-1)*.025)/1.025;samples[i]=previous*2.3;}
      const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
      const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1100;
      const volume=context.createGain();volume.gain.value=0;
      const swell=context.createOscillator();swell.frequency.value=.075;
      const depth=context.createGain();depth.gain.value=.045;
      source.connect(filter).connect(volume).connect(context.destination);swell.connect(depth).connect(volume.gain);
      source.start();swell.start();await context.resume();
      if(!dialog.open||document.hidden||epoch!==audioEpoch){source.stop();swell.stop();await context.close();return;}
      audioContext=context;audioNodes={source,swell,volume};volume.gain.setTargetAtTime(.085,context.currentTime,.25);
    }catch(_){if(context&&context.state!=='closed')context.close().catch(()=>{});}
    finally{audioStarting=false;soundButton();}
  }
  function stopSound(){
    audioEpoch++;
    const context=audioContext,nodes=audioNodes;audioContext=null;audioNodes=null;
    if(context&&nodes){nodes.volume.gain.cancelScheduledValues(context.currentTime);nodes.volume.gain.setTargetAtTime(0,context.currentTime,.08);setTimeout(()=>{try{nodes.source.stop();nodes.swell.stop();}catch(_){}context.close().catch(()=>{});},280);}
    soundButton();
  }
  function frame(focus){
    const p=list[index];if(!p&&!spot)return;
    dialog.classList.toggle('show-whole',whole);
    dialog.classList.toggle('is-immersive',immersive);
    const source=safeUrl(p?.source),credit=source?`<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Photo : ${esc(p.author||'Auteur non indiqué')} · ${esc(p.license||'licence à vérifier')} ↗</a>`:'<span>Crédit photographique à vérifier</span>';
    const scene=p?`<img class="gallery-scene" src="${esc(p.src)}" alt="${esc(caption(p,spot))}">`:`<div class="gallery-empty"><small>LE CARNET PHOTO COMMENCE ICI</small><b>Aucune photo locale pour ce spot</b><span>Recherche des images réutilisables avec leurs crédits.</span></div>`;
    const note=p?.external?'Photo proposée par Wikimedia Commons · lieu à confirmer.':p?caption(p,spot):'Tu peux découvrir des images libres avec leurs auteurs et licences.';
    const findLabel=commonsSearching?'Recherche sur Commons…':commonsMessage||'Trouver d’autres photos';
    dialog.innerHTML=`<figure>${scene}<figcaption><span class="gallery-place">${esc(spot.loc)}</span><h2>${esc(p?label(p,index):'Découvrir en images')}</h2><p id="galleryCaption" aria-live="polite">${esc(note)}</p>${credit}</figcaption></figure><header><span><small>${immersive?'OCEAN BUDDY · IMMERSION':'OCEAN BUDDY · ESCALE EN IMAGES'}</small><b id="galleryTitle">${esc(spot.name)}</b></span><button type="button" data-gallery-close aria-label="Fermer la galerie">×</button></header><footer><div class="gallery-controls"><button type="button" data-gallery-prev aria-label="Photo précédente" ${list.length<2?'disabled':''}>←</button><span aria-live="polite">${list.length?index+1+' / '+list.length:'0 photo'}</span><button type="button" data-gallery-next aria-label="Photo suivante" ${list.length<2?'disabled':''}>→</button><button type="button" data-gallery-fit ${p?'':'disabled'}>${whole?'Vue immersive':'Image entière'}</button><button type="button" data-gallery-sound aria-label="Ambiance sonore illustrative" aria-pressed="${isPlaying()}">${isPlaying()?'Couper le son':'Activer le son'}</button></div><div class="gallery-thumbs" role="group" aria-label="Choisir une photo ou en chercher d’autres"><button type="button" class="gallery-find" data-gallery-search ${commonsSearching?'disabled':''} aria-label="${esc(findLabel)}"><span aria-hidden="true">⌕</span><small>WIKIMEDIA COMMONS</small><b>${esc(findLabel)}</b></button>${list.map((photo,i)=>`<button type="button" data-gallery-pick="${i}" aria-label="${esc(label(photo,i))}, photo ${i+1}" aria-pressed="${i===index}"><img src="${esc(photo.thumb||photo.src)}" alt="" loading="lazy"><span>${esc(label(photo,i))}</span></button>`).join('')}</div><p class="gallery-sound-note">Les images Commons sont proposées avec leurs crédits et licences. Vérifie le lieu représenté avant de t’y fier. Ambiance sonore illustrative, créée pour Ocean Buddy.</p></footer>`;
    const img=dialog.querySelector('.gallery-scene');if(img){img.style.objectPosition=/^[\w\d% .-]{1,40}$/.test(p.position||'')?p.position:'center';img.onerror=()=>{img.hidden=true;dialog.querySelector('figcaption p').textContent='Cette photo n’a pas pu être chargée. Passe à la suivante ou réessaie avec une connexion.';};}
    soundButton();
    if(focus)dialog.querySelector(focus)?.focus({preventScroll:true});
  }
  function open(s,start=0,options={}){const next=[...photos(s),...(commonsCache.get(String(s.id))||[])];stopSound();list=next;spot=s;index=Math.max(0,Math.min(Number(start)||0,list.length-1));whole=false;immersive=!!options.immersive;commonsSearching=false;commonsMessage='';opener=document.activeElement;frame();if(!dialog.open)dialog.showModal();dialog.querySelector('[data-gallery-close]')?.focus({preventScroll:true});if(!next.length)discoverCommons(false);return true;}
  dialog.addEventListener('close',()=>{stopSound();if(opener?.isConnected)opener.focus({preventScroll:true});});
  function move(step){if(list.length<2)return;index=(index+step+list.length)%list.length;frame(step>0?'[data-gallery-next]':'[data-gallery-prev]');}
  dialog.addEventListener('click',e=>{
    if(e.target===dialog||e.target.closest('[data-gallery-close]')){dialog.close();return;}
    if(e.target.closest('[data-gallery-prev]'))move(-1);
    if(e.target.closest('[data-gallery-next]'))move(1);
    if(e.target.closest('[data-gallery-fit]')){whole=!whole;frame('[data-gallery-fit]');}
    if(e.target.closest('[data-gallery-sound]'))isPlaying()?stopSound():startSound();
    if(e.target.closest('[data-gallery-search]'))discoverCommons(true);
    const pick=e.target.closest('[data-gallery-pick]');if(pick){index=+pick.dataset.galleryPick;frame(`[data-gallery-pick="${index}"]`);}
  });
  async function discoverCommons(announce){
    if(!spot||commonsSearching)return;
    const requested=spot,existing=list.slice(),currentSource=list[index]?.commonsTitle||list[index]?.src;
    commonsSearching=true;commonsMessage='';frame('[data-gallery-search]');
    try{
      const found=await commonsPhotos(requested);if(spot?.id!==requested.id)return;
      const seen=new Set(existing.flatMap(item=>[item.commonsTitle||item.src,item.source].filter(Boolean)));
      const added=found.filter(item=>!seen.has(item.commonsTitle||item.src)&&!seen.has(item.source));
      list=[...existing,...added];
      if(added.length){index=existing.length;commonsMessage=`${added.length} photos à explorer`;}
      else if(found.length){list=[...existing,...found.filter(item=>!existing.some(old=>old.commonsTitle===item.commonsTitle))];index=list.findIndex(item=>(item.commonsTitle||item.src)===currentSource);if(index<0)index=0;commonsMessage='Toutes les photos trouvées sont déjà affichées';}
      else commonsMessage='Aucune photo libre trouvée pour ce lieu';
    }catch(_){commonsMessage='Recherche indisponible · réessaie';}
    finally{commonsSearching=false;if(dialog.open&&spot?.id===requested.id){frame('[data-gallery-search]');if(announce)dialog.querySelector('[data-gallery-search]')?.focus({preventScroll:true});}}
  }
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();dialog.close();return;}if(list.length<2)return;if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}});
  let touch=null;
  dialog.addEventListener('touchstart',e=>{touch=e.target.closest('figure')&&e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
  dialog.addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;touch=null;if(list.length>1&&Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);},{passive:true});
  dialog.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSound();});
  window.addEventListener('pagehide',stopSound);
  function update(s){
    const all=photos(s),first=all[0],more=$('#dHeroMore'),photo=$('#dHeroPhoto'),credit=$('#dHeroCred');
    let strip=$('#spotPhotoStrip');if(!strip){strip=document.createElement('section');strip.id='spotPhotoStrip';strip.className='spot-photo-strip';strip.setAttribute('aria-label','Le spot en images');$('#detailHero')?.after(strip);}
    if(!first){
      if(more){more.hidden=false;more.setAttribute('aria-label','Chercher des photos de '+s.name);more.title='Chercher des photos de ce spot';more.onclick=()=>open(s);}
      if(photo){photo.classList.remove('on');photo.removeAttribute('src');photo.alt='';}
      if(credit)credit.textContent='Illustration Ocean Buddy · photo du lieu à vérifier';
      $('#detailHero')?.classList.remove('underwater-hero');
      strip.hidden=true;strip.replaceChildren();return;
    }
    if(more){more.hidden=false;more.setAttribute('aria-label','Ouvrir les photos de '+s.name+' ou en chercher d’autres');more.title='Ouvrir les photos et en chercher d’autres';more.innerHTML='<span>Entrer dans le décor</span><b>'+all.length+' photo'+(all.length>1?'s':'')+' · en trouver ↗</b>';more.onclick=()=>open(s);}
    if(photo){photo.alt=caption(first,s);photo.style.objectPosition=/^[\w\d% .-]{1,40}$/.test(first.position||'')?first.position:'center';if(photo.getAttribute('src')!==first.src){photo.classList.remove('on');photo.onload=()=>photo.classList.add('on');photo.onerror=()=>photo.classList.remove('on');photo.src=first.src;}if(photo.complete&&photo.naturalWidth)photo.classList.add('on');}
    if(credit)credit.textContent=(first.caption?first.caption+' · ':'')+(first.author||'Auteur non indiqué')+' · '+(first.license||'licence à vérifier');
    $('#detailHero')?.classList.toggle('underwater-hero',first.view==='underwater');
    strip.hidden=all.length<2;strip.innerHTML=`<div class="photo-strip-intro"><small>CHANGE DE POINT DE VUE</small><b>${all.some(p=>p.view==='underwater')?'De la surface aux profondeurs.':'Un lieu, plusieurs regards.'}</b><span>${all.length} photographies du lieu</span></div><div class="photo-strip-views">${all.map((p,i)=>`<button data-gallery-index="${i}" aria-label="${esc(label(p,i))} : voir la photo ${i+1} de ${esc(s.name)}"><img src="${esc(p.thumb||p.src)}" alt="" loading="lazy"><span><small>0${i+1}</small>${esc(label(p,i))} ↗</span></button>`).join('')}</div>`;strip.onclick=e=>{const b=e.target.closest('[data-gallery-index]');if(b)open(s,+b.dataset.galleryIndex);};
  }
  window.OceanGallery={update,open,close:()=>{if(dialog.open)dialog.close();},stopSound};
})();
