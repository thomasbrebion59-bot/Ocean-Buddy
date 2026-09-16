/* User-controlled local data and explicit permission for the optional AI service. */
(() => {
  'use strict';
  const KEY='oceanbuddy_ai_choice_v1';
  let mode=null,resolveChoice=null;
  try{const saved=localStorage.getItem(KEY);if(['ai','local'].includes(saved))mode=saved;}catch(_){}
  const panel=document.createElement('section');panel.className='ai-consent';panel.hidden=true;
  panel.setAttribute('aria-label','Choisir comment discuter avec Poulpy');
  panel.innerHTML='<h3>Comment veux-tu discuter avec Poulpy ?</h3><p>Avec l’IA, ta question, les derniers messages, l’activité, ton niveau et le spot consulté sont envoyés à <b>OpenAI via Netlify</b> pour te répondre. Tes voyages, tes notes et ta position ne sont pas envoyés.</p><p>Poulpy IA peut utiliser des informations récentes lorsque le service est configuré pour cela. Les réponses peuvent contenir des erreurs. Tu peux aussi utiliser le guide intégré, sans envoyer de message à ces services.</p><p><a href="privacy.html" target="_blank" rel="noopener">Lire la politique de confidentialité</a></p><div><button type="button" data-ai-choice="ai">Autoriser Poulpy IA</button><button type="button" data-ai-choice="local">Utiliser le guide intégré</button></div>';
  document.querySelector('#chatSheet .chat-input').before(panel);
  let choicePromise=null;
  function choose(){
    if(mode)return Promise.resolve(mode);
    if(!choicePromise)choicePromise=new Promise(resolve=>{resolveChoice=resolve;});
    panel.hidden=false;panel.querySelector('button').focus();return choicePromise;
  }
  panel.addEventListener('click',event=>{
    const button=event.target.closest('[data-ai-choice]');if(!button)return;
    mode=button.dataset.aiChoice;try{localStorage.setItem(KEY,mode);}catch(_){}
    panel.hidden=true;const done=resolveChoice;resolveChoice=null;choicePromise=null;done?.(mode);
    document.dispatchEvent(new CustomEvent('ocean-ai-choice',{detail:mode}));
  });
  const resetChoice=document.createElement('button');resetChoice.type='button';resetChoice.className='set-reset';resetChoice.textContent='Poulpy : choisir IA ou guide intégré';
  resetChoice.onclick=()=>{if(window.OceanAssistantBusy?.()){toast('Attends la fin de la réponse avant de changer ce choix.');return;}
    mode=null;try{localStorage.removeItem(KEY);}catch(_){}closeSettings();openChat();choose();};
  document.querySelector('.set-about').before(resetChoice);
  const erase=document.createElement('button');erase.type='button';erase.className='set-reset';erase.textContent='Effacer toutes mes données sur cet appareil';
  erase.onclick=async()=>{
    if(!confirm('Effacer définitivement ton profil, tes favoris, tes voyages (y compris la corbeille), tes notes, tes sessions et tes préférences sur cet appareil ? Exporte tes voyages avant de continuer.'))return;
    const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('oceanbuddy_'))keys.push(key);}keys.forEach(key=>localStorage.removeItem(key));
    try{await window.OceanMobile?.persist();location.reload();}catch(_){toast('La copie native n’a pas pu être effacée. Réessaie avant de fermer l’application.');}
  };
  document.querySelector('.set-about').before(erase);
  window.OceanPrivacy={choose,getMode:()=>mode};
})();
