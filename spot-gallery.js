/* Real locations, full-screen photography and explicit, accessible controls. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dialog=document.createElement('dialog');dialog.id='spotGallery';dialog.className='spot-gallery';dialog.setAttribute('aria-labelledby','galleryTitle');document.body.append(dialog);
  let list=[],index=0,spot=null,opener=null,whole=false;
  const photos=s=>OceanPhotos.list(s.id,detailAct(s));
  const caption=(p,s)=>p.caption||s.photoContext||s.name+' · '+s.loc;
  const label=(p,i)=>p.label||(p.view==='underwater'?'Sous la surface':i===0?'Le panorama':'Autre regard');
  function frame(focus){
    const p=list[index];if(!p)return;
    dialog.classList.toggle('show-whole',whole);
    dialog.innerHTML=`<figure><img class="gallery-scene" src="${esc(p.src)}" alt="${esc(caption(p,spot))}" style="object-position:${esc(p.position||'center')}"><figcaption><span class="gallery-place">${esc(spot.loc)}</span><h2>${esc(label(p,index))}</h2><p>${esc(caption(p,spot))}</p><a href="${esc(p.source)}" target="_blank" rel="noopener">Photo : ${esc(p.author)} · ${esc(p.license)} ↗</a></figcaption></figure><header><span><small>OCEAN BUDDY · ESCALE EN IMAGES</small><b id="galleryTitle">${esc(spot.name)}</b></span><button data-gallery-close aria-label="Fermer les photos" autofocus>×</button></header><footer><div class="gallery-controls"><button data-gallery-prev aria-label="Photo précédente" ${list.length<2?'disabled':''}>←</button><span aria-live="polite">${index+1} / ${list.length}</span><button data-gallery-next aria-label="Photo suivante" ${list.length<2?'disabled':''}>→</button><button data-gallery-fit aria-pressed="${whole}">${whole?'Vue immersive':'Image entière'}</button></div><div class="gallery-thumbs" role="group" aria-label="Choisir une photographie">${list.map((p,i)=>`<button data-gallery-pick="${i}" aria-label="${esc(label(p,i))}, photo ${i+1}" aria-pressed="${i===index}"><img src="${esc(p.thumb||p.src)}" alt="" loading="lazy"><span>${esc(label(p,i))}</span></button>`).join('')}</div></footer>`;
    const img=dialog.querySelector('.gallery-scene');img.onerror=()=>{img.hidden=true;dialog.querySelector('figcaption p').textContent='Cette photo n’a pas pu être chargée. Passe à la suivante ou réessaie avec une connexion.';};
    if(focus)dialog.querySelector(focus)?.focus({preventScroll:true});
  }
  function open(s,start=0){list=photos(s);if(!list.length)return;spot=s;index=Math.max(0,Math.min(start,list.length-1));whole=false;opener=document.activeElement;frame();if(!dialog.open)dialog.showModal();}
  dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
  function move(step){index=(index+step+list.length)%list.length;frame(step>0?'[data-gallery-next]':'[data-gallery-prev]');}
  dialog.addEventListener('click',e=>{
    if(e.target.closest('[data-gallery-close]'))dialog.close();
    if(e.target.closest('[data-gallery-prev]'))move(-1);
    if(e.target.closest('[data-gallery-next]'))move(1);
    if(e.target.closest('[data-gallery-fit]')){whole=!whole;frame('[data-gallery-fit]');}
    const pick=e.target.closest('[data-gallery-pick]');if(pick){index=+pick.dataset.galleryPick;frame(`[data-gallery-pick="${index}"]`);}
  });
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();dialog.close();return;}if(list.length<2)return;if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}});
  let touch=null;
  dialog.addEventListener('touchstart',e=>{touch=e.target.closest('figure')&&e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
  dialog.addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;touch=null;if(list.length>1&&Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);},{passive:true});
  dialog.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  function update(s){
    const all=photos(s),first=all[0];if(!first)return;
    const more=$('#dHeroMore');more.setAttribute('aria-label','Ouvrir '+(all.length>1?'les '+all.length+' photos':'la photo en grand')+' de '+s.name);more.title='Ouvrir la galerie immersive';more.innerHTML='<span>Entrer dans le décor</span><b>'+all.length+' photo'+(all.length>1?'s':'')+' ↗</b>';more.onclick=()=>open(s);
    const photo=$('#dHeroPhoto');photo.alt=caption(first,s);photo.style.objectPosition=first.position||'center';if(photo.getAttribute('src')!==first.src){photo.classList.remove('on');photo.onload=()=>photo.classList.add('on');photo.onerror=()=>photo.classList.remove('on');photo.src=first.src;}if(photo.complete&&photo.naturalWidth)photo.classList.add('on');
    $('#dHeroCred').textContent=first.author+' · '+first.license+' — Wikimedia Commons';
    $('#detailHero').classList.toggle('underwater-hero',first.view==='underwater');
    let strip=$('#spotPhotoStrip');if(!strip){strip=document.createElement('section');strip.id='spotPhotoStrip';strip.className='spot-photo-strip';strip.setAttribute('aria-label','Le spot en images');$('#detailHero').after(strip);}
    strip.hidden=all.length<2;strip.innerHTML=`<div class="photo-strip-intro"><small>CHANGE DE POINT DE VUE</small><b>${all.some(p=>p.view==='underwater')?'De la surface aux profondeurs.':'Un lieu, plusieurs regards.'}</b><span>${all.length} photographies du lieu</span></div><div class="photo-strip-views">${all.map((p,i)=>`<button data-gallery-index="${i}" aria-label="${esc(label(p,i))} : voir la photo ${i+1} de ${esc(s.name)}"><img src="${esc(p.thumb||p.src)}" alt="" loading="lazy"><span><small>0${i+1}</small>${esc(label(p,i))} ↗</span></button>`).join('')}</div>`;strip.onclick=e=>{const b=e.target.closest('[data-gallery-index]');if(b)open(s,+b.dataset.galleryIndex);};
  }
  window.OceanGallery={update,open};
})();
