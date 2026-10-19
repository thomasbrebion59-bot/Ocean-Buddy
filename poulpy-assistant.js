/* Poulpy answers on the device, from Ocean Buddy's own content: no message ever leaves the app. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s),originalOpen=openChat;
  window.setChatStatus=()=>{const el=$('#chatStatus');if(el)el.textContent='Poulpy · guide intégré prêt';};
  const input=$('#chatInput');input.maxLength=1000;input.placeholder='Une question, une envie de voyage…';
  const reset=document.createElement('button');reset.type='button';reset.className='poulpy-chat-reset';reset.setAttribute('aria-label','Commencer une nouvelle discussion');reset.title='Nouvelle discussion';reset.textContent='↺';$('#chatSheet .chat-close').before(reset);
  reset.addEventListener('pointerdown',e=>e.stopPropagation());
  const suggestions=window.PoulpyKnowledge?.suggestions||[['Deux spots','Aide-moi à choisir entre deux spots du catalogue.'],['Les marées','Explique-moi simplement comment fonctionnent les marées.']];
  $('#chatQuick').replaceChildren(...suggestions.map(([label,prompt])=>{const b=document.createElement('button');b.className='qchip';b.type='button';b.textContent=label;b.onclick=()=>chatSend(prompt);return b;}));
  $('#chatMsgs').setAttribute('role','log');$('#chatMsgs').setAttribute('aria-live','polite');
  const context=document.createElement('div');context.className='poulpy-chat-context';context.id='poulpyChatContext';$('#chatSheet .chat-head').after(context);
  const info=document.createElement('p');info.className='poulpy-chat-privacy';info.textContent='Poulpy répond sur ton appareil, à partir des fiches d’Ocean Buddy. Tes messages ne sont envoyés nulle part.';$('#chatSheet .chat-input').before(info);
  function refreshContext(){const s=document.body.dataset.screen==='detail'?SPOTS.find(s=>s.id===currentSpot):null;context.textContent=s?'On parle de '+s.name+' · '+s.loc:'Spots, voyages, océan… parlons de ton prochain départ.';}
  const art=$('#spotlightOcto');if(art&&!art.querySelector('image'))art.innerHTML='<image href="assets/poulpy/scenes/travel-v2.webp" x="0" y="0" width="140" height="140" preserveAspectRatio="xMidYMid slice"/>';
  window.openChat=function(){
    const first=!chatSeeded;if(first)chatSeeded=true;originalOpen();refreshContext();
    if(first)addMsg('bot','Salut, moi c’est <b>Poulpy</b> 🐙 ! Je réponds à partir des fiches d’Ocean Buddy : spots, activités, météo et marées, sécurité, matériel, faune et voyage.');
  };
  document.querySelectorAll('.sidebar-poulpy,.mobile-poulpy').forEach(button=>button.onclick=()=>openChat());
  reset.onclick=()=>{$('#chatMsgs').replaceChildren();input.value='';addMsg('bot','Nouvelle discussion. Quel spot ou quelle activité t’intéresse ?');refreshContext();input.focus();};
  window.chatSend=function(question){
    question=String(question||'').trim();if(!question)return;if(question.length>1000){toast('Raccourcis ta question à 1 000 caractères.');return;}
    refreshContext();addMsg('user',esc(question));
    try{const r=window.PoulpyKnowledge?.reply(question)||poulpyReply(question);addMsg('bot',r.html,r.btn);}
    catch(_){addMsg('bot','Ouvre une fiche de spot ou choisis une activité pour retrouver les repères du guide.');}
  };
  window.chatSendInput=function(){const value=input.value;if(!value.trim())return;input.value='';chatSend(value);};
  setChatStatus();
})();
