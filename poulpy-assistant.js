/* A genuine model connection when configured; an explicitly named local guide otherwise. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s),cfg=window.POULPY_CONFIG||{},originalOpen=openChat;
  let busy=false,controller=null,status='local',healthSequence=0,choosing=false;
  window.OceanAssistantBusy=()=>busy||choosing;
  const endpoint=(()=>{try{if(!cfg.endpoint)return '';const u=new URL(cfg.endpoint);return u.protocol==='https:'?u.href:'';}catch(_){return '';}})();
  const statusLabels={local:'Poulpy · guide intégré prêt',checking:'Poulpy IA · connexion…',ready:'Poulpy IA · connecté',busy:'Poulpy IA · réfléchit…',offline:'Poulpy IA · connexion indisponible'};
  window.setChatStatus=()=>{const el=$('#chatStatus');if(el)el.textContent=statusLabels[status];};
  const input=$('#chatInput');input.maxLength=3000;input.placeholder='Une question, une envie de voyage…';
  const reset=document.createElement('button');reset.type='button';reset.className='poulpy-chat-reset';reset.setAttribute('aria-label','Commencer une nouvelle discussion');reset.title='Nouvelle discussion';reset.textContent='↺';$('#chatSheet .chat-close').before(reset);
  reset.addEventListener('pointerdown',e=>e.stopPropagation());
  const suggestions=window.PoulpyKnowledge?.suggestions||[['Mon voyage','Aide-moi à préparer mon prochain voyage. Quelles informations te faut-il ?'],['Deux spots','Aide-moi à choisir entre deux spots du catalogue.'],['Les marées','Explique-moi simplement comment fonctionnent les marées.']];
  $('#chatQuick').replaceChildren(...suggestions.map(([label,prompt])=>{const b=document.createElement('button');b.className='qchip';b.type='button';b.textContent=label;b.onclick=()=>chatSend(prompt);return b;}));
  $('#chatMsgs').setAttribute('role','log');$('#chatMsgs').setAttribute('aria-live','polite');
  const context=document.createElement('div');context.className='poulpy-chat-context';context.id='poulpyChatContext';$('#chatSheet .chat-head').after(context);
  const info=document.createElement('p');info.className='poulpy-chat-privacy';$('#chatSheet .chat-input').before(info);
  function refreshPrivacy(){info.textContent=window.OceanPrivacy?.getMode()==='ai'?'Avec ton accord : messages et contexte du spot envoyés à OpenAI via Netlify. Notes et voyages non transmis.':'Guide intégré disponible sans envoi de messages. Poulpy IA reste facultatif et demande ton accord.';}refreshPrivacy();
  async function health(){if(!endpoint||window.OceanPrivacy?.getMode()!=='ai')return;const sequence=++healthSequence;status='checking';setChatStatus();let next;try{const r=await fetch(endpoint,{signal:AbortSignal.timeout(7000)}),data=await r.json();next=r.ok&&data.enabled?'ready':'offline';}catch(_){next='offline';}if(sequence===healthSequence&&!busy){status=next;setChatStatus();}}
  document.addEventListener('ocean-ai-choice',event=>{healthSequence++;chatHistory=[];status=event.detail==='ai'?'checking':'local';setChatStatus();refreshPrivacy();if(event.detail==='ai')health();});
  function refreshContext(){const s=document.body.dataset.screen==='detail'?SPOTS.find(s=>s.id===currentSpot):null;context.textContent=s?'On parle de '+s.name+' · '+s.loc:'Spots, voyages, océan… parlons de ton prochain départ.';return s;}
  function enhanceSpotlight(){
    const spotlight=$('#poulpySpotlight');if(!spotlight)return;
    const art=$('#spotlightOcto');if(art&&!art.querySelector('image'))art.innerHTML='<image href="assets/poulpy/scenes/travel-v2.webp" x="0" y="0" width="140" height="140" preserveAspectRatio="xMidYMid slice"/>';
    const button=spotlight.querySelector('button');if(button)button.setAttribute('aria-label','Ouvrir Poulpy IA');
  }
  enhanceSpotlight();
  window.openChat=function(){
    const first=!chatSeeded;if(first)chatSeeded=true;originalOpen();refreshContext();
    if(first){addMsg('bot',endpoint?'Salut, moi c’est <b>Poulpy IA</b> 🐙 ! Je peux t’aider pour un spot, un voyage, la météo, la sécurité, le matériel, l’écologie… et plein d’autres sujets.':'Salut, moi c’est <b>Poulpy</b> 🐙 ! Mon <b>guide intégré</b> répond déjà à de nombreuses questions sur l’océan. Autorise Poulpy IA si tu veux des réponses plus ouvertes.');}
    if(!busy&&status!=='ready')health();
  };
  document.querySelectorAll('.sidebar-poulpy,.mobile-poulpy').forEach(button=>button.onclick=()=>openChat());
  reset.onclick=()=>{if(busy||choosing)return;chatHistory=[];$('#chatMsgs').replaceChildren();input.value='';addMsg('bot',endpoint?'On repart de zéro ! Quelle est ta question ?':'Nouvelle discussion avec le guide intégré. Quel spot ou quelle activité t’intéresse ?');refreshContext();input.focus();};
  function setBusy(value){busy=value;reset.disabled=value;$('#chatInput').disabled=value;$('#chatSheet .chat-input button').disabled=value;$('#chatMsgs').setAttribute('aria-busy',value);}
  function remember(question,reply){chatHistory.push({role:'user',content:question},{role:'assistant',content:reply});chatHistory=chatHistory.slice(-10).map(x=>({role:x.role,content:x.content.slice(0,900)}));}
  function localReply(question){const r=window.PoulpyKnowledge?.reply(question)||poulpyReply(question);addMsg('bot',r.html,r.btn);const el=document.createElement('div');el.innerHTML=r.html;remember(question,el.textContent||'');}
  function spotLinks(ids){const safe=[...new Set(ids||[])].map(id=>SPOTS.find(s=>s.id===id)).filter(Boolean).slice(0,6);if(!safe.length)return;const holder=document.createElement('div');holder.className='poulpy-answer-spots';for(const s of safe){const b=document.createElement('button');b.type='button';b.textContent=s.name+' ↗';b.onclick=()=>openSpotFromChat(s.id);holder.append(b);}$('#chatMsgs .msg:last-child .bubble2')?.append(holder);}
  function fallbackButton(question){const b=document.createElement('button');b.type='button';b.className='msg-btn';b.textContent='Consulter le guide intégré';b.onclick=()=>{if(busy)return;b.disabled=true;addMsg('bot','<b>Guide intégré</b> · réponse issue du contenu de l’application.');try{localReply(question);}catch(_){addMsg('bot','Ouvre une fiche de spot ou choisis une activité pour retrouver les repères du guide.');}};$('#chatMsgs .msg:last-child .bubble2')?.append(b);}
  window.chatSend=async function(question){
    question=String(question||'').trim();if(!question||busy||choosing)return;if(question.length>3000){toast('Raccourcis ta question à 3 000 caractères.');return;}
    let aiMode='local';if(endpoint){choosing=true;reset.disabled=true;try{aiMode=await window.OceanPrivacy.choose();}finally{choosing=false;reset.disabled=false;}}
    const s=refreshContext();addMsg('user',esc(question));setBusy(true);showTyping();
    if(!endpoint||aiMode!=='ai'){hideTyping();status='local';try{localReply(question);}finally{setBusy(false);setChatStatus();}return;}
    healthSequence++;status='busy';setChatStatus();controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Math.min(cfg.timeoutMs||30000,45000));
    try{
      const live=s&&typeof LIVE!=='undefined'&&LIVE?.[s.id]?LIVE[s.id]:null;
      const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,body:JSON.stringify({message:question,history:chatHistory.slice(-10),spotId:s?.id||null,activity:s?detailAct(s):activeSport,level:chosenLevel,conditions:live?{wave:live.wave,wind:live.wind,water:live.water}:null})});
      const data=await r.json();if(!r.ok||!data.reply)throw new Error(data.error||'unavailable');
      hideTyping();addMsg('bot',aiFormat(data.reply));spotLinks(Array.isArray(data.spots)?data.spots:[]);remember(question,data.reply);status='ready';
    }catch(e){hideTyping();status='offline';addMsg('bot',e.message==='rate_limited'||e.message==='provider_limit'?'Poulpy IA a atteint sa limite momentanée. Réessaie un peu plus tard.':'La connexion à Poulpy IA est indisponible pour le moment. Tu peux réessayer ou consulter le guide intégré.');fallbackButton(question);}
    finally{clearTimeout(timer);controller=null;setBusy(false);setChatStatus();if($('#chatSheet').classList.contains('open'))input.focus();}
  };
  window.chatSendInput=function(){if(busy||choosing)return;const value=input.value;if(!value.trim())return;input.value='';chatSend(value);};
  setChatStatus();
})();
