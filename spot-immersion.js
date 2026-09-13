/* Each visit sheet combines real photographs with clearly labelled teaching diagrams. */
(() => {
  'use strict';
  const M=window.OceanImmersionModel, $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=key=>PoulpyIcons.html(key);
  const source=(label,url)=>`<a class="im-source" href="${url}" target="_blank" rel="noopener">${label} ↗</a>`;
  const svg=(label,body)=>`<svg class="im-diagram" viewBox="0 0 480 260" role="img" aria-label="${esc(label)}">${body}</svg>`;
  const head=(k,t)=>`<span class="im-eyebrow">${k}</span><h4>${t}</h4>`;
  const explanation='Schéma pédagogique · il ne représente pas la géographie de ce spot.';
  const section=document.createElement('section');section.id='spotImmersion';section.className='spot-immersion';section.setAttribute('aria-labelledby','immersionTitle');
  $('#fieldOverview').after(section);
  const context=document.createElement('div');context.id='immersionContext';context.className='immersion-context';$('#detail .detail-body').prepend(context);
  let spot=null,act=null,topic='terrain',wind='offshore',wave='height',tide=50,level='debutant',live=null;

  function windDiagram(){
    const w=M.winds[wind],angle=Math.atan2(w.to[1]-w.from[1],w.to[0]-w.from[0])*180/Math.PI;
    return svg(w.name+'. Terre à gauche, eau à droite. La flèche indique le déplacement de l’air.',`
      <rect width="480" height="260" rx="16" fill="#dff1fd"/><path d="M0 0h135q-30 65 0 130t0 130H0Z" fill="#f9e5bb"/>
      <path d="M135 0q-30 65 0 130t0 130" stroke="#fff" stroke-width="8" fill="none"/>
      <g fill="none" stroke="#a6d4ef" stroke-width="2"><path d="M190 45q35-18 70 0t70 0t70 0M190 225q35-18 70 0t70 0t70 0"/></g>
      <text x="28" y="38">LA TERRE</text><text x="339" y="38">L’EAU</text>
      <path d="M${w.from.join(' ')}L${w.to.join(' ')}" stroke="#2154dc" stroke-width="7" stroke-linecap="round"/>
      <path d="m-17-10 17 10-17 10" transform="translate(${w.to.join(' ')}) rotate(${angle})" fill="none" stroke="#2154dc" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="172" y="172" width="70" height="70" rx="35" fill="#fff"/><image href="${PoulpyIcons.src(act)}" x="177" y="177" width="60" height="60"/>
    `);
  }
  function waveDiagram(){
    const water='M0 154C20 126 40 101 60 101S100 126 120 154S160 207 180 207S220 182 240 154S280 101 300 101S340 126 360 154S400 207 420 207S460 182 480 154';
    return svg(wave==='height'?'La hauteur se mesure verticalement entre un creux et une crête.':'La période est le temps entre deux crêtes successives à un même point.',`
      <rect width="480" height="260" rx="16" fill="#eaf5ff"/><path d="${water}V260H0Z" fill="#b9e4f5"/><path d="${water}" fill="none" stroke="#1678c2" stroke-width="5"/>
      <path d="M10 101h450M10 207h450" stroke="#88b4d1" stroke-dasharray="5 6"/>
      ${wave==='height'?'<path d="M270 101v106m-7-97 7-9 7 9m-14 88 7 9 7-9" fill="none" stroke="#e96942" stroke-width="3"/><rect x="288" y="138" width="163" height="35" rx="8" fill="#fff"/><text x="302" y="160" fill="#b94a2b">HAUTEUR · mètres</text>':'<path d="M60 66h240m-230-7-10 7 10 7m220-14 10 7-10 7" fill="none" stroke="#e96942" stroke-width="3"/><text x="72" y="43" fill="#b94a2b">PÉRIODE · secondes</text><circle cx="60" cy="101" r="7" fill="#e96942"/><circle cx="300" cy="101" r="7" fill="#e96942"/>'}
      <text x="23" y="237">${wave==='period'?'UN MÊME POINT AU FIL DU TEMPS →':'EXEMPLE · PAS UNE PRÉVISION'}</text>`);
  }
  function tideDiagram(){
    const g=M.tideGeometry(tide);
    return svg('Coupe simplifiée du rivage : quand le niveau monte, une plus grande partie du rivage est recouverte.',`
      <rect width="480" height="260" rx="16" fill="#e9f5ff"/><path d="M0 62 480 248v12H0Z" fill="#eddbb6"/>
      <path d="M${g.shoreX} ${g.waterY}H480V248Z" fill="#58b6e0" opacity=".65"/>
      <path d="M${g.shoreX} ${g.waterY}H480" stroke="#1475c6" stroke-width="3"/>
      <path d="M415 100v92m-6-83 6-9 6 9m-12 74 6 9 6-9" fill="none" stroke="#2154dc" stroke-width="3"/>
      <text x="23" y="35">LE MÊME RIVAGE</text><text x="250" y="235">NIVEAU DE L’EAU</text>`);
  }
  function currentReading(){
    const value=M.reading(topic,live,isInland(spot));
    return `<div class="im-reading"><span>${esc(spot.name.split(' — ')[0])}</span><b>${esc(value||'Donnée indisponible')}</b><small>${value?'Prévision Open-Meteo · secteur du spot':'Aucune valeur n’est déduite du schéma.'}</small></div>`;
  }
  function choices(items,key,current){return `<div class="im-choices" role="group" aria-label="${key==='wind'?'Direction du vent dans l’exemple':key==='wave'?'Caractéristique de la vague':'Repère d’expérience'}">${items.map(([id,label])=>`<button type="button" data-im-${key}="${id}" aria-pressed="${id===current}">${key==='level'?icon(id):''}${label}</button>`).join('')}</div>`;}
  function terrain(){
    const a=M.activity(act),p=OceanPhotos.lead(spot.id,act);
    return `<div class="im-terrain"><button class="im-postcard" data-im-gallery aria-label="S’immerger dans les photos de ${esc(spot.name)}"><img src="${esc(p.src)}" alt="${esc(p.caption||spot.photoContext||spot.name+' · '+spot.loc)}" loading="lazy"><span><small>${esc(spot.loc)}</small><b>Tu t’y vois déjà ?</b><span>Ouvrir les photos ↗</span></span></button><div class="im-terrain-copy">${head(SPORTMAP[act].label.toUpperCase(),a.title)}<ol>${a.points.map(([t,c],i)=>`<li><span>${i+1}</span><div><b>${t}</b><p>${c}</p></div></li>`).join('')}</ol><button class="im-link" data-im-prepare>Préparer cette sortie →</button></div></div>`;
  }
  function panel(){
    if(topic==='terrain')return terrain();
    if(topic==='vent'){const w=M.winds[wind];return `<div class="im-visual">${windDiagram()}<p class="im-caption">${explanation}</p>${choices(Object.entries(M.winds).map(([k,v])=>[k,v.label]),'wind',wind)}</div><div class="im-copy">${head('LA DIRECTION CHANGE TOUT',w.name)}<p>${w.copy}</p><p class="im-takeaway">${w.note}</p><p class="im-detail">Une direction « N » signifie que le vent vient du nord. L’orientation réelle du rivage reste à vérifier sur la carte et sur place.</p>${currentReading()}${source('Repères de sécurité · RNLI','https://rnli.org/water-safety/choose-your-activity/stand-up-paddle-boarding')}</div>`;}
    if(topic==='houle')return `<div class="im-visual">${waveDiagram()}<p class="im-caption">Schéma pédagogique · aucune hauteur locale n’est représentée.</p>${choices([['height','La hauteur'],['period','La période']],'wave',wave)}</div><div class="im-copy">${head('AU LARGE ≠ AU BORD',wave==='height'?'Une hauteur, plusieurs réalités.':'Le rythme des vagues.')}<p>${wave==='height'?'La hauteur relie le creux et la crête. La prévision du modèle est une hauteur significative : la moyenne du tiers des vagues les plus hautes. Certaines vagues peuvent être plus grandes.':'La période est le temps entre deux crêtes successives au même point. Elle se mesure en secondes ; elle ne dit pas, à elle seule, si une session convient à ton niveau.'}</p><p class="im-takeaway">Le fond, la profondeur et la forme de la côte transforment le déferlement. La valeur au large n’est pas la taille garantie de la vague surfée.</p>${currentReading()}${source('Définition des vagues · NOAA','https://forecast.weather.gov/glossary.php?word=wave+height')}</div>`;
    if(topic==='maree')return `<div class="im-visual"><div id="imTideDrawing">${tideDiagram()}</div><p class="im-caption">Simulation pédagogique · pas un horaire ni une profondeur locale.</p><label class="im-slider-label" for="imTideRange">Fais varier le niveau de l’eau <output id="imTideOutput">${tide<34?'Bas':tide>66?'Haut':'Intermédiaire'}</output></label><input id="imTideRange" type="range" min="0" max="100" step="1" value="${tide}" aria-valuetext="Niveau ${tide<34?'bas':tide>66?'haut':'intermédiaire'} dans l’exemple"><div class="im-range-ends"><span>Marée basse</span><span>Marée haute</span></div></div><div class="im-copy">${head('UN RIVAGE QUI CHANGE','L’eau monte. Le paysage aussi.')}<p>La marée fait varier le niveau de l’eau. Une portion du rivage découverte à marée basse peut être recouverte plus tard.</p><p class="im-takeaway">Marée et courant sont liés, mais différents : le courant déplace l’eau horizontalement. Une courbe de hauteur ne donne pas sa force locale.</p>${currentReading()}${source('Marée et courant · NOAA','https://oceanservice.noaa.gov/facts/tidescurrents.html')}<p class="im-detail">La courbe de l’application vient d’un modèle marin. Pour un passage ou un accès, consulte les horaires officiels et les consignes locales.</p></div>`;
    if(topic==='eau')return `<div class="im-visual im-water-visual"><img src="${PoulpyIcons.src(['plongee','snorkeling'].includes(act)?act:'baignade')}" alt="Poulpy dans l’eau" width="320" height="320"><span>EN SURFACE ≠ EN PROFONDEUR</span></div><div class="im-copy">${head('LE CONFORT SE PRÉPARE','Que dit la température ?')}<p>${isInland(spot)?'Le modèle marin ne fournit pas la température de ce plan d’eau intérieur dans l’application.':'La valeur affichée estime la température de surface du secteur. Elle ne mesure pas la température à toutes les profondeurs.'}</p><p class="im-takeaway">La durée, le vent, la profondeur et ta sensibilité au froid comptent aussi. Choisis la protection et le matériel avec un professionnel local.</p><p class="im-detail">La température ne renseigne ni la visibilité sous l’eau, ni la qualité sanitaire de l’eau.</p>${currentReading()}${source('Données marines · Open-Meteo','https://open-meteo.com/en/docs/marine-weather-api')}</div>`;
    const l=M.levels[level];
    return `<div class="im-visual im-level-visual"><img src="${PoulpyIcons.src(level)}" alt="Poulpy ${esc(lvlLabel[level].toLowerCase())}" width="300" height="300">${choices(Object.keys(M.levels).map(k=>[k,lvlLabel[k]]),'level',level)}</div><div class="im-copy">${head('DES REPÈRES, PAS DES DIPLÔMES',l.title)}<p>${l.copy}</p><div class="im-level-current">${levelIcon(spot.level)}<span><small>REPÈRE INDIQUÉ POUR CE SECTEUR</small><b>${esc(lvlLabel[spot.level]||'À évaluer')}</b></span></div><p class="im-takeaway">${spot.level==='variable'?'Le niveau de ce secteur n’est pas fixé dans le catalogue. Demande à un encadrant quel site correspond à ton expérience.':'Le niveau affiché est un repère général du catalogue. Le secteur exact, l’activité et les conditions du jour restent déterminants.'}</p>${act==='plongee'?'<p class="im-detail">En plongée, ce repère ne remplace pas une certification ni les prérogatives vérifiées par le centre.</p>':''}</div>`;
  }
  function draw(focusPanel=false){
    section.innerHTML=`<header class="im-heading"><div>${icon(act)}<span><span class="im-eyebrow">POULPY T’ACCOMPAGNE · ${esc(spot.name.split(' — ')[0])}</span><h3 id="immersionTitle">Prends tes repères.</h3></span></div><p>Comprendre le lieu.<br>Mieux préparer ta sortie.</p></header><div class="im-tabs" role="tablist" aria-label="Comprendre les caractéristiques du spot">${M.topicList(isInland(spot)).map(([id,label])=>`<button role="tab" id="imTab-${id}" type="button" data-im-topic="${id}" aria-selected="${id===topic}" aria-controls="imPanel" tabindex="${id===topic?'0':'-1'}">${label}</button>`).join('')}</div><div class="im-panel ${topic==='terrain'?'im-panel-terrain':''}" id="imPanel" role="tabpanel" tabindex="0" aria-labelledby="imTab-${topic}">${panel()}</div>`;
    if(focusPanel)$('#imTab-'+topic).focus({preventScroll:true});
  }
  function update(s,a){
    if(spot?.id!==s.id){topic='terrain';wind='offshore';wave='height';tide=50;level=M.levels[s.level]?s.level:'debutant';}
    spot=s;act=a;live=LIVE[s.id]||null;
    if(!M.topicList(isInland(s)).some(([k])=>k===topic))topic='terrain';
    const options=spotSports(s);
    context.innerHTML=`<div class="im-context-title">${icon(a)}<span><small>ICI, TU AS ENVIE DE…</small><b>${esc(SPORTMAP[a].label)}</b></span></div><div class="im-activity-choices" role="group" aria-label="Activité sur ce spot">${options.map(id=>`<button type="button" data-im-activity="${id}" aria-pressed="${id===a}">${sportIcon(id)}<span>${esc(SPORTMAP[id].label.replace(/\s*\(.*\)/,''))}</span></button>`).join('')}</div>`;
    draw();
    const weatherHelp=$('#imWeatherHelp');weatherHelp.innerHTML=`${icon(a)}<span><b>Ces chiffres, ça veut dire quoi ?</b><small>Poulpy t’explique le vent${isInland(s)?' et l’eau.':', les vagues et la marée.'}</small></span><span aria-hidden="true">→</span>`;
    document.querySelectorAll('#dTabs .dtab').forEach(b=>{
      const key={infos:'all',meteo:'expert',activites:a,faune:'snorkeling',preserver:'all'}[b.dataset.cat];
      let image=b.querySelector('.poulpy-mini');if(image)image.src=PoulpyIcons.src(key);else{b.querySelector('svg')?.remove();b.insertAdjacentHTML('afterbegin',icon(key));}
    });
  }
  function refreshConditions(s,data){
    if(spot?.id!==s.id)return;live=data;
    const reading=section.querySelector('.im-reading');if(reading)reading.outerHTML=currentReading();
  }
  function openTopic(next){
    if(!spot||!M.topicList(isInland(spot)).some(([id])=>id===next))return;
    topic=next;showDetailCat('infos',false);draw();
    const reduceMotion=document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({behavior:reduceMotion?'instant':'smooth',block:'start'});$('#imTab-'+topic).focus({preventScroll:true});
  }
  const help=document.createElement('button');help.id='imWeatherHelp';help.type='button';help.className='im-weather-help';help.onclick=()=>openTopic('vent');$('#dWeather').after(help);
  section.addEventListener('click',e=>{
    const t=e.target.closest('[data-im-topic]');if(t){topic=t.dataset.imTopic;draw(true);return;}
    const w=e.target.closest('[data-im-wind]'),v=e.target.closest('[data-im-wave]'),l=e.target.closest('[data-im-level]');
    if(w||v||l){if(w)wind=w.dataset.imWind;if(v)wave=v.dataset.imWave;if(l)level=l.dataset.imLevel;const selector=w?'[data-im-wind="'+wind+'"]':v?'[data-im-wave="'+wave+'"]':'[data-im-level="'+level+'"]';draw();section.querySelector(selector)?.focus({preventScroll:true});}
    if(e.target.closest('[data-im-gallery]'))OceanGallery.open(spot);
    if(e.target.closest('[data-im-prepare]'))showDetailCat('activites');
  });
  context.addEventListener('click',e=>{const b=e.target.closest('[data-im-activity]');if(b){const a=b.dataset.imActivity;setDetailSport(a);context.querySelector('[data-im-activity="'+a+'"]')?.focus({preventScroll:true});}});
  section.addEventListener('keydown',e=>{
    const t=e.target.closest('[role="tab"]');if(!t||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const ids=M.topicList(isInland(spot)).map(([id])=>id),i=ids.indexOf(topic);
    topic=ids[e.key==='Home'?0:e.key==='End'?ids.length-1:(i+(e.key==='ArrowRight'?1:-1)+ids.length)%ids.length];draw(true);
  });
  section.addEventListener('input',e=>{if(e.target.id!=='imTideRange')return;tide=+e.target.value;$('#imTideDrawing').innerHTML=tideDiagram();const label=tide<34?'Bas':tide>66?'Haut':'Intermédiaire';$('#imTideOutput').textContent=label;e.target.setAttribute('aria-valuetext','Niveau '+label.toLowerCase()+' dans l’exemple');});
  $('#fieldAtAGlance').addEventListener('click',e=>{const b=e.target.closest('[data-im-open]');if(b)openTopic(b.dataset.imOpen);});
  window.OceanImmersion={update,refreshConditions,openTopic};
  const current=SPOTS.find(s=>s.id===currentSpot);if(current)update(current,detailAct(current));
})();
