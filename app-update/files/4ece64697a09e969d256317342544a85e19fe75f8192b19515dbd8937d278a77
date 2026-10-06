/* Ocean Buddy 1.3 — passeport océan (profil).
   Une carte du monde (NASA Blue Marble) où s’allument les spots visités (sessions du carnet)
   et les favoris (envies), avec les pays, continents et fiches découverts. Tout reste sur l’appareil. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const profile=$('#profile');if(!profile||typeof SPOTS==='undefined')return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  /* La carte couvre les latitudes 84° N à 58° S (l’Antarctique est rognée). */
  const pos=c=>({x:(c.lon+180)/360*100,y:(84-c.lat)/142*100});
  const WORLD_NAMES={fr:'Europe',eu:'Europe',af:'Afrique',na:'Amérique du Nord',sa:'Amérique du Sud',as:'Asie',oc:'Océanie'};
  function data(){
    const byName=new Map(SPOTS.map(s=>[String(s.name).split(' — ')[0],s])),byId=new Map(SPOTS.map(s=>[s.id,s]));
    const visited=new Map();
    for(const x of (typeof sessions!=='undefined'?sessions:[])){const s=byId.get(x.id)||byName.get(x.spot);if(s)visited.set(s.id,s);}
    const wished=[...(typeof favs!=='undefined'?favs:[])].map(id=>byId.get(id)).filter(Boolean).filter(s=>!visited.has(s.id));
    const countries=new Set([...visited.values()].map(s=>s.country).filter(Boolean));
    const worlds=new Set([...visited.values()].map(s=>WORLD_NAMES[s.world]).filter(Boolean));
    const seen=window.OceanProgress?.seenCount?.(false)||0;
    return {visited:[...visited.values()],wished,countries,worlds,seen};
  }
  function render(){
    let card=$('#oceanPassport');
    if(!card){
      card=document.createElement('section');card.id='oceanPassport';card.className='pp';card.setAttribute('aria-label','Mon passeport océan');
      /* Entre la vitrine des trophées et « Mes statistiques ». */
      const stats=$('#profStats'),head=stats?.previousElementSibling?.matches('.sec')?stats.previousElementSibling:stats;
      if(head)head.before(card);else profile.append(card);
    }
    const d=data();
    const dot=(s,cls)=>{const c=COORDS[s.id];if(!c)return '';const p=pos(c);if(p.y<0||p.y>100)return '';return `<i class="pp-dot ${cls}" style="left:${p.x.toFixed(2)}%;top:${p.y.toFixed(2)}%" title="${esc(s.name)}"></i>`;};
    const stat=(n,label)=>`<div class="pp-stat"><b>${n}</b><span>${label}</span></div>`;
    const empty=!d.visited.length&&!d.wished.length;
    card.innerHTML=`<div class="pp-head"><div><small>Ocean Buddy · Passeport</small><h2>Mon passeport océan</h2></div><span class="pp-stamp" aria-hidden="true">${d.countries.size}</span></div>
      <div class="pp-map"><img src="assets/globe/earth-map.webp" alt="Carte du monde de tes spots" loading="lazy" decoding="async">${d.wished.map(s=>dot(s,'wish')).join('')}${d.visited.map(s=>dot(s,'been')).join('')}</div>
      <div class="pp-legend"><span><i class="pp-dot been"></i> Visités</span><span><i class="pp-dot wish"></i> Envies (favoris)</span></div>
      <div class="pp-stats">${stat(d.countries.size,'pays')}${stat(`${d.worlds.size}/6`,'continents')}${stat(d.visited.length,'spots visités')}${stat(d.seen,'fiches vues')}</div>
      ${empty?`<p class="pp-empty">Ajoute des favoris ❤ et note tes sessions sur les fiches : ta carte du monde s’allume au fil de tes voyages.</p>`:''}
      <button type="button" class="pp-go">Remplir mon passeport</button>`;
    card.querySelector('.pp-go').onclick=()=>{go('spots');};
  }
  const original=window.renderProfile;
  if(typeof original==='function'){window.renderProfile=function(...a){const r=original.apply(this,a);try{render();}catch(e){console.warn(e);}return r;};}
  render();
  window.OceanPassport={render};
})();
