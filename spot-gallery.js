/* Immersive, credited photographs; local assets only. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dialog=document.createElement('dialog');dialog.id='spotGallery';dialog.className='spot-gallery';dialog.setAttribute('aria-labelledby','galleryTitle');document.body.append(dialog);
  let list=[],index=0,spot=null,opener=null;
  const photos=s=>[SPOT_PHOTOS[s.id],...(window.SPOT_GALLERIES?.[s.id]||[])].filter(Boolean);
  function frame(){
    const p=list[index];if(!p)return;
    dialog.innerHTML=`<header><span><small>OCÉAN BUDDY · LE VOYAGE EN IMAGES</small><b id="galleryTitle">${esc(spot.name)}</b></span><button data-gallery-close aria-label="Fermer les photos" autofocus>×</button></header><figure><img src="${esc(p.src)}" alt="${esc(p.caption||spot.photoContext||spot.name+' · '+spot.loc)}"><figcaption><span>${esc(p.caption||spot.photoContext||spot.loc)}</span><a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.author)} · ${esc(p.license)} ↗</a></figcaption></figure><footer><button data-gallery-prev aria-label="Photo précédente" ${list.length<2?'disabled':''}>←</button><span aria-live="polite">${index+1} / ${list.length}</span><button data-gallery-next aria-label="Photo suivante" ${list.length<2?'disabled':''}>→</button></footer>`;
  }
  function open(s,start=0){spot=s;list=photos(s);index=Math.min(start,list.length-1);opener=document.activeElement;frame();dialog.showModal();}
  dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
  function move(step){index=(index+step+list.length)%list.length;frame();const selector=step>0?'[data-gallery-next]':'[data-gallery-prev]';dialog.querySelector(selector)?.focus({preventScroll:true});}
  dialog.addEventListener('click',e=>{if(e.target.closest('[data-gallery-close]'))dialog.close();if(e.target.closest('[data-gallery-prev]'))move(-1);if(e.target.closest('[data-gallery-next]'))move(1);});
  dialog.addEventListener('keydown',e=>{if(list.length<2)return;if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}});
  function update(s){
    const all=photos(s),more=$('#dHeroMore');more.setAttribute('aria-label','Voir '+(all.length>1?'les '+all.length+' photos':'la photo en grand')+' de '+s.name);more.title='Ouvrir la galerie';more.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m3 16 6-6 6 6 3-3 3 3"/><circle cx="16" cy="8" r="1.5"/></svg><span>'+ (all.length>1?all.length+' photos':'Agrandir')+'</span>';more.onclick=()=>open(s);
    const photo=$('#dHeroPhoto');photo.alt=s.photoContext||s.name+' · '+s.loc;
    let strip=$('#spotPhotoStrip');if(!strip){strip=document.createElement('div');strip.id='spotPhotoStrip';strip.className='spot-photo-strip';$('#detailHero').after(strip);}
    strip.hidden=all.length<2;strip.innerHTML=all.map((p,i)=>`<button data-gallery-index="${i}" aria-label="Voir la photo ${i+1} de ${esc(s.name)}"><img src="${esc(p.src)}" alt="" loading="lazy"><span>${i===0?'Le panorama':'Autre regard'} ↗</span></button>`).join('');strip.onclick=e=>{const b=e.target.closest('[data-gallery-index]');if(b)open(s,+b.dataset.galleryIndex);};
  }
  window.OceanGallery={update,open};
})();
